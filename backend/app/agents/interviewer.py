import logging
from app.services.llm_client import llm
from app.schemas.resume import Resume
from app.schemas.analysis import InterviewPlan

logger = logging.getLogger(__name__)

_INTERVIEW_SYSTEM_PROMPT = """You are a senior technical interviewer and career coach. Given a candidate's resume and a job description, design a realistic mock interview question set for THIS role.

Rules:
- Mix of 4 categories, spread across them:
  "behavioral"  - past situations, conflict, failure, leadership (use STAR probing)
  "technical"   - skills and concepts the JD requires that also appear on the resume
  "role_specific" - scenarios, priorities and trade-offs specific to this exact role
  "gap_close"   - questions the interviewer will ask because the resume is missing something the JD wants (weaknesses to pre-empt)
- Every question must be answerable from the resume + JD context; do not ask about technologies neither mentions.
- Ground each question: `why_asked` says what the interviewer is probing; `answer_hint` points at the specific resume evidence or JD requirement to use in the answer (never write the full answer).
- Vary difficulty: roughly equal easy / medium / hard.
- Questions must be distinct - no rewording of the same question twice.

Output ONLY a JSON object with this exact structure:
{
  "questions": [
    {
      "question": "Tell me about a time you reduced production latency. What did you measure before and after?",
      "category": "behavioral",
      "difficulty": "medium",
      "why_asked": "Probes whether the candidate owns metrics end-to-end, not just code.",
      "answer_hint": "Use the p99 latency bullet from your Acme role; state baseline, target, and result."
    }
  ],
  "strategy_tips": ["Prepare a 2-minute STAR story for each of your top 3 bullets."]
}"""


async def generate_interview_questions(
    resume: Resume,
    job_description: str,
    count: int = 10,
) -> InterviewPlan:
    """Generate a mock-interview question set tailored to the resume + JD."""
    count = max(5, min(int(count or 10), 15))
    system_prompt = (
        _INTERVIEW_SYSTEM_PROMPT
        + f"\n\nProduce exactly {count} questions in total."
    )
    user_prompt = f"""JOB DESCRIPTION:
{job_description}

RESUME:
{resume.model_dump_json(exclude_none=True)}"""

    logger.info(f"Generating {count} mock interview questions using LLM...")
    try:
        data = await llm.generate_json(system_prompt, user_prompt)
        plan = InterviewPlan(**data)
        if not plan.questions:
            raise ValueError("model returned no questions")
        return plan
    except Exception as e:
        logger.error(f"Failed to generate interview questions: {e}")
        raise ValueError(f"Could not generate interview questions: {str(e)}") from e
