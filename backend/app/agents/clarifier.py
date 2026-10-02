import logging
from app.services.llm_client import llm
from app.services.template_registry import get_template
from app.schemas.resume import Resume
from app.schemas.analysis import ChatMessage, ChatEditResponse

logger = logging.getLogger(__name__)

_CLARIFIER_SYSTEM_PROMPT = """You are an expert AI resume editor. The user asks you to change their resume in free text ("make my summary shorter", "emphasize my Python projects").

How to respond:
1. Apply exactly what the user asked for - nothing more, nothing less.
2. Return the COMPLETE updated resume, not a diff: every field you were not asked to change must be copied through unchanged (name, contact details, dates, other sections).
3. Never invent employers, titles, dates, metrics or skills. You may only rephrase or reorganize content that is already in the current resume.
4. If the request is impossible or unclear, still return the resume unchanged and explain why in 'assistant_message'.
5. If you are unsure whether a change is supported by the current resume or clearly wanted, say so plainly in 'assistant_message' instead of guessing - the user must be able to tell what you actually did.

Return ONLY a JSON object with exactly two keys:
- "assistant_message": one or two friendly sentences describing what you changed.
- "updated_resume": the full resume object with the exact structure shown below.

JSON structure (all fields required unless noted optional):
{
  "assistant_message": "I have shortened your summary and moved your Python work to the top.",
  "updated_resume": {
    "name": "John Doe",
    "title": "Senior Software Engineer",
    "email": "john@example.com",
    "phone": "123-456-7890",
    "location": "Berlin, Germany",
    "linkedin": "linkedin.com/in/johndoe",
    "portfolio": null,
    "summary": "Experienced engineer...",
    "experiences": [
      {
        "title": "Software Engineer",
        "company": "Tech Corp",
        "start_date": "2020",
        "end_date": "Present",
        "location": "Remote",
        "description": ["Developed features", "Fixed bugs"]
      }
    ],
    "education": [
      {
        "degree": "B.S. Computer Science",
        "institution": "University",
        "graduation_date": "2020",
        "location": "Boston, MA",
        "gpa": "3.8"
      }
    ],
    "projects": [
      {
        "name": "Resume Builder",
        "description": ["Built an AI resume tailoring app"],
        "technologies": ["React", "Python"],
        "link": "github.com/johndoe/resume-builder"
      }
    ],
    "skills": [
      {
        "category": "Languages",
        "skills": ["Python", "JavaScript"]
      }
    ]
  }
}"""


async def process_chat_edit(
    resume: Resume,
    job_description: str,
    messages: list[ChatMessage],
    user_message: str,
    template: str | None = None,
) -> ChatEditResponse:
    """
    Handle free-text chat requests to edit the resume.
    Returns the updated resume and an assistant response.
    """
    tpl = get_template(template)
    system_prompt = (
        _CLARIFIER_SYSTEM_PROMPT
        + f'\n\nWRITING STYLE — "{tpl.name}" (apply this voice to any text you rewrite):\n{tpl.writing_style}'
    )

    chat_history = "\n".join([f"{m.role.upper()}: {m.content}" for m in messages])

    user_prompt = f"""
JOB DESCRIPTION:
{job_description}

CURRENT RESUME:
{resume.model_dump_json(exclude_none=True)}

CHAT HISTORY:
{chat_history}

USER REQUEST:
{user_message}
"""
    logger.info(f"Processing chat edit with LLM (template={tpl.id})...")
    try:
        data = await llm.generate_json(system_prompt, user_prompt)
        assistant_message = data.get("assistant_message", "I have updated your resume as requested.")
        updated_data = data.get("updated_resume") or resume.model_dump()
        if isinstance(updated_data, dict):
            # The model sometimes omits optional fields it wasn't asked to touch —
            # restore the originals instead of silently blanking them.
            for key in ("title", "email", "phone", "location", "linkedin", "portfolio"):
                updated_data.setdefault(key, getattr(resume, key))
            if "projects" not in updated_data:
                updated_data["projects"] = [p.model_dump() for p in resume.projects]
        updated_resume = Resume(**updated_data)
        return ChatEditResponse(assistant_message=assistant_message, updated_resume=updated_resume)
    except Exception as e:
        logger.error(f"Failed to process chat edit: {e}")
        raise ValueError(f"Could not process chat edit: {str(e)}") from e
