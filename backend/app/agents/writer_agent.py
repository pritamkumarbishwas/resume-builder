from app.services.llm_client import llm
import json
import logging

logger = logging.getLogger(__name__)

async def rewrite_bullets(original_bullets: list[str], job_description: str) -> list[str]:
    system_prompt = """
    You are an expert resume writer. The user wants to rewrite their resume bullet points to better match a specific job description.
    Make the bullets impactful, using strong action verbs and highlighting measurable results where possible.
    Tailor the language to align with the keywords and responsibilities in the job description.
    Return a JSON object with a single key 'rewritten_bullets' containing a list of the new strings.
    """
    user_prompt = f"""
    Job Description:
    {job_description}
    
    Original Bullets:
    {json.dumps(original_bullets)}
    """
    
    logger.info("Rewriting bullets using LLM...")
    response = await llm.generate_json(system_prompt, user_prompt)
    return response.get("rewritten_bullets", original_bullets)

async def generate_summary(resume_text: str, job_description: str) -> str:
    system_prompt = """
    You are an expert resume writer. Write a compelling 3-4 sentence professional summary based on the provided resume content.
    Tailor the summary to perfectly match the provided job description, highlighting the most relevant skills and experiences.
    Return ONLY the raw text of the summary.
    """
    user_prompt = f"""
    Job Description:
    {job_description}
    
    Resume Context:
    {resume_text}
    """
    
    logger.info("Generating summary using LLM...")
    return await llm.generate_text(system_prompt, user_prompt)

async def generate_cover_letter(resume_text: str, job_description: str) -> str:
    system_prompt = """
    You are an expert career coach and resume writer. Write a compelling, highly professional cover letter based on the provided resume content.
    Tailor the cover letter perfectly to the provided job description.
    Ensure it is well-structured with an opening hook, 1-2 body paragraphs highlighting specific achievements matching the JD, and a strong closing.
    Do NOT include placeholder names like [Your Name] or [Date] at the top—just output the body of the cover letter.
    Return ONLY the raw text of the cover letter.
    """
    user_prompt = f"""
    Job Description:
    {job_description}
    
    Resume Context:
    {resume_text}
    """
    
    logger.info("Generating cover letter using LLM...")
    return await llm.generate_text(system_prompt, user_prompt)
