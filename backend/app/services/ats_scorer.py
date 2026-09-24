import logging
from app.services.llm_client import llm
from app.schemas.resume import Resume
from app.schemas.analysis import ATSScoreResponse

logger = logging.getLogger(__name__)

_ATS_SYSTEM_PROMPT = """
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

async def score_resume(resume: Resume, job_description: str) -> ATSScoreResponse:
    user_prompt = f"RESUME:\n{resume.model_dump_json(exclude_none=True)}\n\nJOB DESCRIPTION:\n{job_description}"

    logger.info("Scoring resume via LLM...")
    try:
        json_response = await llm.generate_json(_ATS_SYSTEM_PROMPT, user_prompt)
        return ATSScoreResponse(**json_response)
    except Exception as e:
        logger.error(f"Failed to score resume: {e}")
        raise ValueError(f"Could not generate ATS score: {str(e)}") from e
