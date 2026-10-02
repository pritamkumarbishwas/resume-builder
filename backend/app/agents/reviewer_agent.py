import logging
from app.services.llm_client import llm
from app.schemas.resume import Resume
from app.schemas.analysis import ReviewReport

logger = logging.getLogger(__name__)

_REVIEW_SYSTEM_PROMPT = """You are an expert resume reviewer and copy editor. Review the resume against the job description in three passes, then score it.

PASS 1 - GRAMMAR, TONE, LENGTH CHECKS
Produce at least one check for each category below, covering the summary and the most important experience bullets (max ~8 checks total):
- grammar: spelling, subject-verb agreement, tense consistency (past tense for old roles, present for current), punctuation, stray pronouns.
- tone: confident but not arrogant, action-verb led, no filler ("hard-working team player"), no first person, no contractions in formal lines.
- length: summary 45-75 words; bullets 12-22 words; no bullet over 30 words; no section that is empty of substance.
Each check gets: category, target (e.g. "Summary", "Experience 1, bullet 2"), status ("pass" | "warn" | "fail"), and a detail that states the problem AND the fix (or why it passed).

PASS 2 - IMPACT FEEDBACK
For weak bullets give concrete rewrite feedback: vague wording, missing metrics, weak verbs, redundancy with the job description.

PASS 3 - SCORE AND TIPS
- overall_quality_score: 0-100 for this job description (grammar 25, impact/metrics 30, keyword match 25, clarity/structure 20).
- summary_feedback: 1-2 sentences on the summary.
- general_tips: 3-5 short, actionable improvements.

Output ONLY a JSON object with this exact structure:
{
  "overall_quality_score": 85,
  "summary_feedback": "Strong summary, but could use more metrics.",
  "bullet_feedback": [
    {"original": "Did some coding", "issue": "Too vague", "suggestion": "Developed scalable microservices", "severity": "high"}
  ],
  "general_tips": ["Use more action verbs", "Add metrics to 2 experience bullets"],
  "checks": [
    {"category": "grammar", "target": "Experience 1, bullet 2", "status": "fail", "detail": "Mixed tenses: 'develop' should be 'developed'. Change to past tense."},
    {"category": "tone", "target": "Summary", "status": "pass", "detail": "Confident, action-led, no filler words."},
    {"category": "length", "target": "Summary", "status": "warn", "detail": "92 words - trim to 75 by cutting the final sentence."}
  ]
}
Never invent content that is not in the resume; judge only what is there."""


async def review_resume(resume: Resume, job_description: str) -> ReviewReport:
    """Grammar / tone / length checks plus impact feedback and an overall score."""
    user_prompt = f"RESUME:\n{resume.model_dump_json(exclude_none=True)}\n\nJOB DESCRIPTION:\n{job_description}"

    logger.info("Reviewing resume with LLM...")
    try:
        data = await llm.generate_json(_REVIEW_SYSTEM_PROMPT, user_prompt)
        # Be tolerant of older/partial responses: fill missing collections
        data.setdefault("bullet_feedback", [])
        data.setdefault("general_tips", [])
        data.setdefault("checks", [])
        return ReviewReport(**data)
    except Exception as e:
        logger.error(f"Failed to review resume: {e}")
        raise ValueError(f"Could not perform resume review: {str(e)}") from e
