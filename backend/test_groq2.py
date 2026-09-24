import asyncio
from app.services.llm_client import llm
from app.schemas.resume import Resume

async def main():
    system_prompt = """
Output MUST be a valid JSON object with the following structure exactly:
{
    "score": 85,
    "matching_keywords": ["Python", "React"],
    "missing_keywords": ["Docker"],
    "recommendations": ["Add Docker experience"]
}
"""
    resume_json = '{"name": "John", "experiences": [{"title": "Dev", "company": "Tech", "description": ["Python"]}]}'
    user_prompt = f"RESUME:\n{resume_json}\n\nJOB DESCRIPTION:\nNeed Python and Docker"
    try:
        response = await llm.client.chat.completions.create(
            model=llm.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.3
        )
        print("RAW CONTENT:", repr(response.choices[0].message.content))
    except Exception as e:
        print("ERROR:", str(e))

if __name__ == "__main__":
    asyncio.run(main())
