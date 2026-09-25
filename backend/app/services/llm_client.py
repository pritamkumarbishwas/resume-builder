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
        """Call LLM requiring JSON output with retry logic"""
        strict_json_prompt = system_prompt + "\n\nCRITICAL: Return ONLY a raw JSON object. Do not include markdown formatting, backticks, or any conversational text."
        
        last_error = None
        for attempt in range(max_retries):
            try:
                response = await self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": strict_json_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    **self._request_kwargs(0.3)
                )
                choice = response.choices[0]
                original_content = choice.message.content or ""
                content = original_content.strip()
                
                if not content:
                    details = getattr(response.usage, "completion_tokens_details", None)
                    reasoning_tokens = getattr(details, "reasoning_tokens", None) if details else None
                    logger.warning(
                        "Empty LLM content (attempt %s/%s): finish_reason=%s, completion_tokens=%s, reasoning_tokens=%s, model=%s",
                        attempt + 1, max_retries, choice.finish_reason,
                        response.usage.completion_tokens if response.usage else None,
                        reasoning_tokens, self.model,
                    )
                    raise ValueError("LLM returned an empty string.")
                
                # Manually extract JSON to bypass strict/buggy json_object validation
                if "```" in content:
                    match = re.search(r'```(?:json)?\s*(.*?)\s*```', content, re.DOTALL)
                    if match:
                        content = match.group(1)
                else:
                    start_obj = content.find("{")
                    end_obj = content.rfind("}")
                    start_arr = content.find("[")
                    end_arr = content.rfind("]")
                    
                    if start_obj != -1 and end_obj != -1 and start_obj < end_obj and (start_arr == -1 or start_obj < start_arr):
                        content = content[start_obj:end_obj + 1]
                    elif start_arr != -1 and end_arr != -1 and start_arr < end_arr:
                        content = content[start_arr:end_arr + 1]
                
                return json.loads(content.strip())
            
            except Exception as e:
                last_error = e
                logger.warning("Attempt %s/%s failed. Retrying... Error: %s", attempt + 1, max_retries, e)
                if attempt + 1 < max_retries:
                    await self._backoff(e, attempt)

        logger.error("Failed to get valid JSON after %s attempts. Last error: %s", max_retries, last_error)
        raise ValueError(f"LLM returned invalid JSON. Error: {last_error}") from last_error

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
