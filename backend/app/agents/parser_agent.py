from app.services.llm_client import llm
from app.schemas.resume import Resume
import logging
import json

logger = logging.getLogger(__name__)

async def parse_resume_text(raw_text: str) -> Resume:
    system_prompt = """
    You are an expert resume parser. Extract the information from the provided resume text into a structured JSON format matching the provided Resume schema.
    If some fields like 'portfolio' or 'linkedin' are missing, set them to null.
    Structure the experience, education, and skills clearly.
    Output MUST be a valid JSON object with the following exact structure:
    {
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
    """

    logger.info("Extracting resume data using LLM...")
    try:
        json_response = await llm.generate_json(system_prompt, raw_text)
        return Resume(**json_response)
    except Exception as e:
        logger.error(f"Failed to parse resume with LLM: {e}")
        raise ValueError(f"Could not parse resume text into standard format: {str(e)}")
