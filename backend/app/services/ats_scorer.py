from app.services.llm_client import llm
from app.schemas.resume import Resume
from app.schemas.analysis import ATSScoreResponse
import logging
import json

logger = logging.getLogger(__name__)

async def score_resume(resume: Resume, job_description: str) -> ATSScoreResponse:
    system_prompt = """
    You are an expert ATS (Applicant Tracking System) and technical recruiter.
    Analyze the provided Resume against the provided Job Description.
    
    1. Determine a match score from 0 to 100 based on how well the resume fits the job requirements.
    2. Extract the exact keywords/skills that are explicitly mentioned in the Job Description and also exist in the Resume (matching_keywords).
    3. Extract the exact keywords/skills that are in the Job Description but are MISSING from the Resume (missing_keywords).
    4. Provide 2-3 concise, actionable recommendations on how to improve the resume to increase the ATS score.
    
    Output MUST be valid JSON matching the provided Schema.
    """
    
    schema = ATSScoreResponse.model_json_schema()
    system_prompt += f"\n\nJSON Schema:\n{json.dumps(schema)}"

    user_prompt = f"RESUME:\n{resume.model_dump_json()}\n\nJOB DESCRIPTION:\n{job_description}"

    logger.info("Scoring resume via LLM...")
    try:
        json_response = await llm.generate_json(system_prompt, user_prompt)
        return ATSScoreResponse(**json_response)
    except Exception as e:
        logger.error(f"Failed to score resume: {e}")
        raise ValueError(f"Could not generate ATS score: {str(e)}")
