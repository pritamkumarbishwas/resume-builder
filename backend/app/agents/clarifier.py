import logging
from app.services.llm_client import llm
from app.schemas.resume import Resume
from app.schemas.analysis import ChatMessage, ChatEditResponse

logger = logging.getLogger(__name__)

_CLARIFIER_SYSTEM_PROMPT = """
You are an expert AI Resume Builder assistant. 
The user is asking you to modify their resume. 
Review their request and return a JSON object with two keys:
1. 'assistant_message': A friendly response explaining what you changed.
2. 'updated_resume': The full updated resume object matching the exact structure below.

Output MUST be a valid JSON object with the following exact structure:
{
  "assistant_message": "I have updated your summary and emphasized your Python skills.",
  "updated_resume": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "123-456-7890",
    "linkedin": "linkedin.com/in/johndoe",
    "portfolio": null,
    "summary": "Experienced engineer...",
    "experiences": [
      {
        "title": "Software Engineer",
        "company": "Tech Corp",
        "start_date": "2020",
        "end_date": "Present",
        "description": ["Developed features", "Fixed bugs"]
      }
    ],
    "education": [
      {
        "degree": "B.S. Computer Science",
        "institution": "University",
        "graduation_date": "2020"
      }
    ],
    "skills": [
      {
        "category": "Languages",
        "skills": ["Python", "JavaScript"]
      }
    ]
  }
}
"""

async def process_chat_edit(resume: Resume, job_description: str, messages: list[ChatMessage], user_message: str) -> ChatEditResponse:
    """
    Handle free-text chat requests to edit the resume.
    Returns the updated resume and an assistant response.
    """
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
    logger.info("Processing chat edit with LLM...")
    try:
        data = await llm.generate_json(_CLARIFIER_SYSTEM_PROMPT, user_prompt)
        assistant_message = data.get("assistant_message", "I have updated your resume as requested.")
        updated_resume = Resume(**data.get("updated_resume", resume.model_dump()))
        return ChatEditResponse(assistant_message=assistant_message, updated_resume=updated_resume)
    except Exception as e:
        logger.error(f"Failed to process chat edit: {e}")
        raise ValueError(f"Could not process chat edit: {str(e)}") from e
