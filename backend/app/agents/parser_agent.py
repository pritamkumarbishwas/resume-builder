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
    Output ONLY valid JSON.
    """
    
    schema = Resume.model_json_schema()
    system_prompt += f"\n\nJSON Schema:\n{json.dumps(schema)}"

    logger.info("Extracting resume data using LLM...")
    try:
        json_response = await llm.generate_json(system_prompt, raw_text)
        return Resume(**json_response)
    except Exception as e:
        logger.error(f"Failed to parse resume with LLM: {e}")
        raise ValueError(f"Could not parse resume text into standard format: {str(e)}")
