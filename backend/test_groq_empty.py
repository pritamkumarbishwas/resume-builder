import asyncio
from app.services.llm_client import llm
from app.schemas.resume import Resume

async def main():
    system_prompt = """
You are an expert ATS (Applicant Tracking System) and technical recruiter.
Analyze the provided Resume against the provided Job Description.

1. Determine a match score from 0 to 100 based on how well the resume fits the job requirements.
2. Extract the exact keywords/skills that are explicitly mentioned in the Job Description and also exist in the Resume (matching_keywords).
3. Extract the exact keywords/skills that are in the Job Description but are MISSING from the Resume (missing_keywords).
4. Provide 2-3 concise, actionable recommendations on how to improve the resume to increase the ATS score.

Output MUST be a valid JSON object with the following structure exactly:
{
    "score": 85,
    "matching_keywords": ["Python", "React"],
    "missing_keywords": ["Docker"],
    "recommendations": ["Add Docker experience"]
}
"""
    resume = Resume(name="Test", summary="test", experiences=[], education=[], skills=[])
    user_prompt = f"RESUME:\n{resume.model_dump_json(exclude_none=True)}\n\nJOB DESCRIPTION:\n"
    print("USER PROMPT:")
    print(user_prompt)
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
