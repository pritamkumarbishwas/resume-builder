from openai import AsyncOpenAI
from app.config import settings
import json
import re
import logging

class LLMClient:
    def __init__(self):
        self.provider = settings.llm_provider.lower()
        if self.provider == "groq":
            self.client = AsyncOpenAI(
                api_key=settings.groq_api_key,
                base_url="https://api.groq.com/openai/v1"
            )
            self.model = settings.groq_model
        else:
            self.client = AsyncOpenAI(
                api_key=settings.openai_api_key
            )
            self.model = settings.openai_model

    async def generate_json(self, system_prompt: str, user_prompt: str) -> dict:
        """Call LLM requiring JSON output"""
        strict_json_prompt = system_prompt + "\n\nCRITICAL: Output ONLY a raw, valid JSON object. Do NOT wrap it in ```json code blocks. Do NOT output any preamble or conversational text."
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": strict_json_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.3
        )
        original_content = response.choices[0].message.content
        content = original_content.strip()
        
        # Manually extract JSON to bypass Groq's strict/buggy json_object validation
        if "```" in content:
            # Try to extract content between backticks
            match = re.search(r'```(?:json)?\s*(.*?)\s*```', content, re.DOTALL)
            if match:
                content = match.group(1)
        else:
            # Fallback: extract everything between the first { and last }
            # (or first [ and last ])
            start_obj = content.find("{")
            end_obj = content.rfind("}")
            
            start_arr = content.find("[")
            end_arr = content.rfind("]")
            
            # Use whichever comes first, object or array
            if start_obj != -1 and end_obj != -1 and start_obj < end_obj and (start_arr == -1 or start_obj < start_arr):
                content = content[start_obj:end_obj + 1]
            elif start_arr != -1 and end_arr != -1 and start_arr < end_arr:
                content = content[start_arr:end_arr + 1]
        
        try:
            return json.loads(content.strip())
        except json.JSONDecodeError as e:
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to parse JSON. Raw LLM output: {repr(original_content)}")
            raise ValueError(f"LLM returned invalid JSON. Raw output: {repr(original_content)}") from e

    async def generate_text(self, system_prompt: str, user_prompt: str) -> str:
        """Call LLM returning raw text"""
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7
        )
        return response.choices[0].message.content

llm = LLMClient()
