from app.services.llm_client import llm
from app.services.template_registry import get_template
from app.services.fact_guard import generate_text_guarded, unsupported_numbers
import json
import logging

logger = logging.getLogger(__name__)


def _style_block(template_id: str | None) -> str:
    tpl = get_template(template_id)
    return f"TEMPLATE STYLE — \"{tpl.name}\" (write everything in this voice):\n{tpl.writing_style}"


async def rewrite_bullets(
    original_bullets: list[str],
    job_description: str,
    template: str | None = None,
) -> list[str]:
    system_prompt = f"""You are an expert resume writer. You will be given a list of bullet points from ONE resume section and the job description they must be tailored to.

Rewrite every bullet so it:
1. Starts with a strong action verb (Led, Built, Launched, Reduced, Migrated...). Never start with "Responsible for" or "Worked on".
2. States the action, the method/scope, and a measurable result whenever the original bullet supports one (%, $, headcount, latency, volume, time saved). NEVER invent numbers, tools, employers or titles that are not in the original bullet.
3. Uses keywords and phrasing from the job description, but only where the original bullet genuinely supports them.
4. Reads as one line of roughly 12-22 words: no first-person pronouns, no bullet symbols ("-"), no trailing period, no restating the job title.
5. FACTS COME ONLY FROM THE ORIGINAL BULLET. If you cannot improve a bullet without inventing a fact, return that bullet unchanged. If you are unsure whether a detail is supported, keep the original wording.

{_style_block(template)}

Return ONLY a JSON object of the form {{"rewritten_bullets": ["...", "..."]}}.
The output list must contain exactly the same number of bullets, in the same order, as the input list."""
    user_prompt = f"""JOB DESCRIPTION:
{job_description}

ORIGINAL BULLETS:
{json.dumps(original_bullets)}"""

    logger.info(f"Rewriting {len(original_bullets)} bullets using LLM (template={get_template(template).id})...")
    response = await llm.generate_json(system_prompt, user_prompt)
    rewritten = response.get("rewritten_bullets")
    if not isinstance(rewritten, list) or not rewritten:
        return original_bullets
    # Keep the contract: one rewritten bullet per input bullet
    if len(rewritten) != len(original_bullets):
        logger.warning(f"Bullet count mismatch ({len(rewritten)} vs {len(original_bullets)}); falling back to input")
        return original_bullets

    # Hallucination guard: a rewrite may not introduce numbers absent from the original bullet
    guarded = []
    for original, new in zip(original_bullets, rewritten):
        invented = unsupported_numbers(str(new), original)
        if invented:
            logger.warning("Bullet rewrite introduced unsupported numbers %s; keeping original bullet", invented)
            guarded.append(original)
        else:
            guarded.append(str(new))
    return guarded


async def generate_summary(
    resume_text: str,
    job_description: str,
    template: str | None = None,
) -> str:
    system_prompt = f"""You are an expert resume writer. Write the "Professional Summary" section for a resume.

Requirements:
- Exactly 3-4 sentences, 45-75 words total, as one plain paragraph.
- Sentence 1: the target role from the job description plus years/level of expertise.
- Sentence 2-3: 2-3 hard skills that (a) the job description asks for and (b) are actually supported by the resume context.
- Sentence 4 (optional): one differentiator with a concrete result or scale.
- Tailor every claim to the job description; only use skills and experience found in the resume context - do not invent.
- Every number (%, $, headcount, years) must appear in the resume context or the job description. Never fabricate metrics.
- If you are unsure whether a claim is supported by the resume, leave it out.
- No headers, no bullet points, no pronouns ("I", "my"), no cliches ("passionate go-getter"), no placeholder text.

{_style_block(template)}

Return ONLY the summary text, with no preamble, quotes or labels."""
    user_prompt = f"""JOB DESCRIPTION:
{job_description}

RESUME CONTEXT:
{resume_text}"""

    logger.info(f"Generating summary using LLM (template={get_template(template).id})...")
    return await generate_text_guarded(system_prompt, user_prompt, resume_text, job_description)


async def generate_cover_letter(
    resume_text: str,
    job_description: str,
    template: str | None = None,
) -> str:
    system_prompt = f"""You are an expert career coach. Write a cover letter for a job application, based on the resume and job description provided.

Requirements:
- 250-350 words in 4 short paragraphs:
  1. Opening hook: name the role, and one line on why this candidate is a strong fit.
  2. Body 1: pick the 1-2 most relevant achievements from the resume and connect them to the top requirement in the job description.
  3. Body 2: a second achievement plus one skill the job description emphasizes.
  4. Closing: confident call to action - availability and enthusiasm, no begging.
- Use first name only if the resume gives it; never add placeholders like [Your Name], [Date] or [Company] beyond the employer named in the job description.
- Concrete evidence from the resume only - no invented metrics, titles or employers.
- Every number must appear in the resume context or the job description; never fabricate figures, dates or scale.
- If unsure whether an achievement is supported by the resume, do not include it.
- Output only the letter text: no headings, no address/date block, no signature. A single greeting line ("Dear Hiring Manager,") is fine; never use bracketed placeholders.

{_style_block(template)}

Return ONLY the cover letter text, with no preamble or notes."""
    user_prompt = f"""JOB DESCRIPTION:
{job_description}

RESUME CONTEXT:
{resume_text}"""

    logger.info(f"Generating cover letter using LLM (template={get_template(template).id})...")
    return await generate_text_guarded(system_prompt, user_prompt, resume_text, job_description)
