"""Guards against LLM hallucination of factual details (numbers, metrics, dates).

The writer agents may only rephrase facts that already exist in the user's data.
Before accepting generated text we verify that every number in it also appears in
the source material; anything unsupported is rejected (bullets) or regenerated
once with explicit feedback (summary / cover letter).
"""
import re
import logging
from app.services.llm_client import llm

logger = logging.getLogger(__name__)

_NUM_RE = re.compile(r"\d+(?:[.,]\d+)*%?")


def numbers_in(text: str) -> set[str]:
    """Normalised numeric tokens in a text ("2,000 users" -> {"2000"})."""
    return {m.group(0).replace(",", "").rstrip("%") for m in _NUM_RE.finditer(text or "")}


def unsupported_numbers(new_text: str, *sources: str) -> list[str]:
    """Numbers present in `new_text` that appear in none of the `sources`."""
    allowed: set[str] = set()
    for src in sources:
        allowed |= numbers_in(src)
    return sorted(numbers_in(new_text) - allowed)


async def generate_text_guarded(system_prompt: str, user_prompt: str, *fact_sources: str) -> str:
    """Like llm.generate_text, but retries once if the output uses unsupported numbers."""
    text = await llm.generate_text(system_prompt, user_prompt)
    extra = unsupported_numbers(text, *fact_sources)
    if not extra:
        return text

    logger.warning("LLM output used numbers absent from source material: %s — retrying once", extra)
    correction = (
        f"\n\nIMPORTANT CORRECTION: your previous answer used these numbers, which appear "
        f"NOWHERE in the resume or job description provided: {', '.join(extra)}. "
        f"Regenerate the text without them — describe results qualitatively or omit them."
    )
    retry_text = await llm.generate_text(system_prompt, user_prompt + correction)
    still_bad = unsupported_numbers(retry_text, *fact_sources)
    if still_bad:
        logger.warning("Retry still contains unsupported numbers: %s", still_bad)
    return retry_text
