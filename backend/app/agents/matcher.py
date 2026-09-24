import logging
from app.services.llm_client import llm
from app.schemas.resume import Resume
from app.schemas.analysis import JDAnalysis, GapReport

logger = logging.getLogger(__name__)

_MATCHER_SYSTEM_PROMPT = """
You are an expert career coach and technical recruiter. 
Compare the candidate's Resume with the parsed Job Description analysis.
Identify matching skills, missing skills (both required and preferred), relevant experiences, and provide actionable recommendations.
Output MUST be a valid JSON object with the following exact structure:
{
  "overall_match_percent": 80,
  "matched_skills": [{"skill": "Python", "present": true, "evidence": "Used Python for backend"}],
  "missing_required": ["Docker"],
  "missing_preferred": ["Kubernetes"],
  "relevant_experiences": ["Software Engineer at TechCorp"],
  "recommendations": ["Add Docker to your skills section"]
}
"""

async def analyze_gaps(resume: Resume, jd_analysis: JDAnalysis) -> GapReport:
    """Compare the candidate's Resume with the parsed Job Description to find gaps."""
    user_prompt = f"RESUME:\n{resume.model_dump_json(exclude_none=True)}\n\nJOB ANALYSIS:\n{jd_analysis.model_dump_json()}"
    
    logger.info("Performing gap analysis with LLM...")
    try:
        data = await llm.generate_json(_MATCHER_SYSTEM_PROMPT, user_prompt)
        return GapReport(**data)
    except Exception as e:
        logger.error(f"Failed to analyze gaps: {e}")
        raise ValueError(f"Could not perform gap analysis: {str(e)}") from e
