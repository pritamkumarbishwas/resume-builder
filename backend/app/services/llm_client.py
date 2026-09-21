from openai import AsyncOpenAI
from app.config import settings
import json

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
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.3
        )
        content = response.choices[0].message.content
        return json.loads(content)

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
