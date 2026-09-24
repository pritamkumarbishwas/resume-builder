import asyncio
from app.services.llm_client import llm

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
    user_prompt = "RESUME:\n{...}\n\nJOB DESCRIPTION:\n{...}"
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
