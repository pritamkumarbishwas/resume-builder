import logging
from app.services.llm_client import llm
from app.schemas.analysis import JDAnalysis

logger = logging.getLogger(__name__)

_JD_ANALYZER_SYSTEM_PROMPT = """
You are an expert technical recruiter. Extract structured information from the job description below.
Output MUST be a valid JSON object with the following exact structure:
{
  "role_title": "Software Engineer",
  "company": "Google",
  "required_skills": ["Python", "React"],
  "preferred_skills": ["AWS"],
  "key_responsibilities": ["Develop features", "Review code"],
  "seniority_level": "mid",
  "culture_keywords": ["fast-paced"],
  "industry": "technology"
}

Guidelines:
- required_skills: hard skills/technologies that are explicitly stated as required
- preferred_skills: nice-to-have skills or those listed under "preferred" / "bonus"
- key_responsibilities: 3-6 concise bullet points of what the candidate will do
- seniority_level: one of "junior", "mid", "senior", "lead", "executive"
- culture_keywords: soft-skill or culture signals (e.g. "fast-paced", "collaborative")
- industry: the domain/industry (e.g. "fintech", "healthcare", "e-commerce")
"""

async def analyze_jd(job_description: str) -> JDAnalysis:
    """Parse a raw job description into a structured JDAnalysis object."""
    user_prompt = f"JOB DESCRIPTION:\n{job_description}"

    logger.info("Analyzing job description with LLM...")
    try:
        data = await llm.generate_json(_JD_ANALYZER_SYSTEM_PROMPT, user_prompt)
        return JDAnalysis(**data)
    except Exception as e:
        logger.error(f"Failed to analyze JD: {e}")
        raise ValueError(f"Could not parse job description: {str(e)}") from e
