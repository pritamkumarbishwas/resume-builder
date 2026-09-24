import logging
from app.services.llm_client import llm
from app.schemas.resume import Resume
from app.schemas.analysis import ReviewReport

logger = logging.getLogger(__name__)

_REVIEW_SYSTEM_PROMPT = """
You are an expert resume reviewer and copywriter.
Review the provided Resume against the Job Description. 
Focus on quality, impact, action verbs, metrics, redundancy, and tone.
Output MUST be a valid JSON object with the following exact structure:
{
  "overall_quality_score": 85,
  "summary_feedback": "Strong summary, but could use more metrics.",
  "bullet_feedback": [
    {"original": "Did some coding", "issue": "Too vague", "suggestion": "Developed scalable microservices", "severity": "high"}
  ],
  "general_tips": ["Use more action verbs"]
}
"""

async def review_resume(resume: Resume, job_description: str) -> ReviewReport:
    """Perform a quality check pass on the resume."""
    user_prompt = f"RESUME:\n{resume.model_dump_json(exclude_none=True)}\n\nJOB DESCRIPTION:\n{job_description}"
    
    logger.info("Reviewing resume with LLM...")
    try:
        data = await llm.generate_json(_REVIEW_SYSTEM_PROMPT, user_prompt)
        return ReviewReport(**data)
    except Exception as e:
        logger.error(f"Failed to review resume: {e}")
        raise ValueError(f"Could not perform resume review: {str(e)}") from e
