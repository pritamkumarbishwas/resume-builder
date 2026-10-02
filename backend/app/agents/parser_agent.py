from app.services.llm_client import llm
from app.schemas.resume import Resume
from pydantic import ValidationError
import logging

logger = logging.getLogger(__name__)

async def parse_resume_text(raw_text: str) -> Resume:
    system_prompt = """
    You are an expert resume parser. Extract the information from the provided resume text into a structured JSON format matching the provided Resume schema.
    If some fields like 'portfolio', 'linkedin' or 'location' are missing, set them to null.
    'title' is the professional headline shown under the name (e.g. "Senior Software Engineer"); set it to null when the resume has none.
    'location' is the candidate's home city/area (not per-job locations); set it to null when absent.
    Structure the experience, education, projects, and skills clearly.
    Extract any personal, academic, or open-source projects into 'projects'. If the resume has no projects, output an empty list.
    STRICT FACTUAL RULES - hallucinated data is the worst possible failure:
    - Extract ONLY information literally present in the document. Never infer, guess, or complete missing data.
    - Never invent employers, dates, degrees, skills, metrics, links or contact details - not even plausible ones.
    - If a field is absent, illegible or ambiguous, set it to null (or [] for lists). An empty result is always better than a guess.
    - When unsure between two readings of messy text, prefer the literal characters on the page, or leave the field null.
    Output MUST be a valid JSON object with the following exact structure:
    {
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
      "projects": [
        {
          "name": "Resume Builder",
          "description": ["Built an AI resume tailoring app", "Shipped to 500 users"],
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
    """

    logger.info("Extracting resume data using LLM...")
    try:
        json_response = await llm.generate_json(system_prompt, raw_text)
    except Exception as e:
        logger.error(f"Failed to parse resume with LLM: {e}")
        raise ValueError(f"Could not parse resume text into standard format: {str(e)}")

    # Attempt 1: use Pydantic's model_validate which handles minor type coercions
    # (e.g. a string where a list is expected) without silently dropping fields.
    try:
        return Resume.model_validate(json_response)
    except ValidationError as validation_err:
        # Attempt 2: send the precise Pydantic validation error back to the LLM
        # so it can self-correct any field — not just 'projects'.
        logger.warning(
            "Resume schema validation failed on first attempt; requesting LLM repair. "
            "Errors: %s",
            validation_err.error_count(),
        )
        repair_hint = (
            f"The JSON you returned did not match the required schema.\n"
            f"Pydantic reported {validation_err.error_count()} error(s):\n"
            f"{validation_err}\n\n"
            "Please return a corrected JSON object that fixes every listed error. "
            "Do not drop fields — fix their values or set them to null/[] instead."
        )
        try:
            repaired = await llm.generate_json(system_prompt, repair_hint)
            return Resume.model_validate(repaired)
        except Exception as e2:
            logger.error("LLM repair attempt also failed: %s", e2)
            raise ValueError(
                f"Could not parse resume text into standard format: {str(e2)}"
            ) from e2
