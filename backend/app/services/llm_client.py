from openai import AsyncOpenAI
from app.config import settings
import asyncio
import json
import re
import logging
import random

logger = logging.getLogger(__name__)

class LLMClient:
    def __init__(self):
        self.provider = settings.llm_provider.lower()
        if self.provider == "groq":
            self.client = AsyncOpenAI(
                api_key=settings.groq_api_key,
                base_url="https://api.groq.com/openai/v1",
                max_retries=0
            )
            self.model = settings.groq_model
        else:
            self.client = AsyncOpenAI(
                api_key=settings.openai_api_key,
                max_retries=0
            )
            self.model = settings.openai_model
        self._supports_reasoning_effort = "gpt-oss" in self.model or "o3" in self.model or "o4" in self.model

    def _request_kwargs(self, temperature: float) -> dict:
        kwargs = {"temperature": temperature}
        if self._supports_reasoning_effort:
            kwargs["reasoning_effort"] = "low"
            kwargs["max_completion_tokens"] = 4096
        return kwargs

    @staticmethod
    def _is_rate_limit(e: Exception) -> bool:
        status = getattr(e, "status_code", None)
        if status == 429:
            return True
        code = getattr(e, "code", None)
        if code == "rate_limit_exceeded":
            return True
        return "rate_limit" in str(e).lower() or "429" in str(e)

    @staticmethod
    def _rate_limit_wait(e: Exception, attempt: int) -> float:
        match = re.search(r"try again in ([\d.]+)\s*s", str(e), re.IGNORECASE)
        if match:
            wait = float(match.group(1)) + random.uniform(0.5, 1.5)
        else:
            wait = min(2 ** attempt, 30) + random.uniform(0.25, 1.0)
        return wait

    async def _backoff(self, e: Exception, attempt: int) -> None:
        if self._is_rate_limit(e):
            wait = self._rate_limit_wait(e, attempt)
            logger.warning("Rate limited (attempt %s). Sleeping %.1fs...", attempt + 1, wait)
            await asyncio.sleep(wait)
        else:
            await asyncio.sleep(1.5 * (attempt + 1))

    async def generate_json(self, system_prompt: str, user_prompt: str, max_retries: int = 6) -> dict:
        """Call LLM requiring JSON output with retry + self-repair logic"""
        strict_json_prompt = system_prompt + "\n\nCRITICAL: Return ONLY a raw JSON object. Do not include markdown formatting, backticks, or any conversational text."

        last_error: Exception | None = None
        last_content: str | None = None
        last_finish: str | None = None

        for attempt in range(max_retries):
            messages: list[dict] = [
                {"role": "system", "content": strict_json_prompt},
                {"role": "user", "content": user_prompt},
            ]
            # Tell the model exactly how its previous reply failed so the
            # retry doesn't reproduce the same malformed JSON.
            if last_content is not None:
                messages.append(
                    {"role": "user", "content": self._repair_feedback(last_content, last_finish, last_error)}
                )

            try:
                response = await self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    **self._request_kwargs(0.3)
                )
            except Exception as e:
                last_error = e
                last_content = None
                last_finish = None
                logger.warning("Attempt %s/%s failed. Retrying... Error: %s", attempt + 1, max_retries, e)
                if attempt + 1 < max_retries:
                    await self._backoff(e, attempt)
                continue

            choice = response.choices[0]
            last_finish = choice.finish_reason
            last_content = (choice.message.content or "").strip()
            last_error = None

            if not last_content:
                details = getattr(response.usage, "completion_tokens_details", None)
                reasoning_tokens = getattr(details, "reasoning_tokens", None) if details else None
                logger.warning(
                    "Empty LLM content (attempt %s/%s): finish_reason=%s, completion_tokens=%s, reasoning_tokens=%s, model=%s",
                    attempt + 1, max_retries, choice.finish_reason,
                    response.usage.completion_tokens if response.usage else None,
                    reasoning_tokens, self.model,
                )
                last_error = ValueError("LLM returned an empty string.")
                if attempt + 1 < max_retries:
                    await asyncio.sleep(min(1.5 * (attempt + 1), 8))
                continue

            # Manually extract JSON to bypass strict/buggy json_object validation
            content = self._extract_json_text(last_content)
            # Tolerate a trailing comma before a closing brace/bracket
            content = re.sub(r",\s*([}\]])", r"\1", content).strip()

            try:
                return json.loads(content)
            except Exception as e:
                last_error = e
                logger.warning(
                    "Attempt %s/%s returned invalid JSON (finish_reason=%s). Retrying with repair prompt... Error: %s",
                    attempt + 1, max_retries, last_finish, e,
                )
                if attempt + 1 < max_retries:
                    await asyncio.sleep(min(1.5 * (attempt + 1), 8))
                continue

        logger.error("Failed to get valid JSON after %s attempts. Last error: %s", max_retries, last_error)
        raise ValueError(f"LLM returned invalid JSON. Error: {last_error}") from last_error

    @staticmethod
    def _extract_json_text(content: str) -> str:
        """Pull the JSON payload out of a raw model reply."""
        if "```" in content:
            match = re.search(r'```(?:json)?\s*(.*?)\s*```', content, re.DOTALL)
            if match:
                return match.group(1).strip()

        start_obj = content.find("{")
        end_obj = content.rfind("}")
        start_arr = content.find("[")
        end_arr = content.rfind("]")

        if start_obj != -1 and end_obj != -1 and start_obj < end_obj and (start_arr == -1 or start_obj < start_arr):
            return content[start_obj:end_obj + 1]
        if start_arr != -1 and end_arr != -1 and start_arr < end_arr:
            return content[start_arr:end_arr + 1]
        return content

    @staticmethod
    def _repair_feedback(content: str, finish_reason: str | None, error: Exception | None) -> str:
        """Explain the previous failure so the model corrects it instead of repeating it."""
        lines: list[str] = []

        if not content:
            lines.append("Your previous reply was completely empty.")
        elif isinstance(error, json.JSONDecodeError):
            doc = error.doc or content
            pos = error.pos or 0
            window = doc[max(0, pos - 120): min(len(doc), pos + 120)]
            lines.append(
                f"Your previous reply was not valid JSON: {error.msg} at character {pos} of {len(doc)}."
            )
            lines.append(f"Failing region: >>>{window}<<<")
        else:
            lines.append(f"Your previous reply could not be used as JSON: {str(error)[:300]}")

        if finish_reason == "length":
            lines.append(
                "The reply was also cut off by the token limit — shorten long strings and lists so the JSON closes properly."
            )

        lines.append(
            "Reply again with ONLY the complete corrected JSON object for the original request. "
            "Escape double quotes inside strings, use no trailing commas, and include no markdown or commentary."
        )
        return "\n".join(lines)

    async def generate_text(self, system_prompt: str, user_prompt: str, max_retries: int = 6) -> str:
        """Call LLM returning raw text"""
        last_error = None
        for attempt in range(max_retries):
            try:
                response = await self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    **self._request_kwargs(0.7)
                )
                content = response.choices[0].message.content
                if content and content.strip():
                    return content
                raise ValueError("LLM returned an empty string.")
            except Exception as e:
                last_error = e
                logger.warning("generate_text attempt %s/%s failed. Error: %s", attempt + 1, max_retries, e)
                if attempt + 1 < max_retries:
                    await self._backoff(e, attempt)
        raise ValueError(f"LLM call failed after {max_retries} attempts: {last_error}") from last_error

llm = LLMClient()
