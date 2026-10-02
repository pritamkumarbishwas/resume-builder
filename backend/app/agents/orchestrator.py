"""Multi-agent analysis pipeline.

Chains the specialised agents into one request:

    jd_analyzer  -> parse the job description once (LRU-cached)
    matcher      -> gap report vs. the parsed JD
    ats_scorer   -> keyword score vs. the raw JD text
    reviewer     -> grammar / tone / length checks + impact feedback

The matcher, scorer and reviewer run concurrently; every stage is isolated so
one failing agent degrades the response (see `PipelineResult.errors`) instead
of failing the whole request.
"""
import asyncio
import logging

from app.schemas.resume import Resume
from app.schemas.analysis import PipelineResult
from app.agents.jd_analyzer import analyze_jd
from app.agents.matcher import analyze_gaps
from app.agents.reviewer_agent import review_resume
from app.services.ats_scorer import score_resume

logger = logging.getLogger(__name__)


async def run_pipeline(resume: Resume, job_description: str) -> PipelineResult:
    result = PipelineResult()

    # Stage 1 — analyse the JD (cached, so repeat runs skip this LLM call)
    try:
        jd_analysis = await analyze_jd(job_description)
        result.jd_analysis = jd_analysis
    except Exception as e:
        logger.error(f"Pipeline: jd_analysis failed: {e}")
        result.errors.append(f"jd_analysis: {e}")
        jd_analysis = None

    # Stage 2 — matcher, scorer and reviewer in parallel
    tasks: dict = {}
    if jd_analysis is not None:
        tasks["gap_report"] = analyze_gaps(resume, jd_analysis)
    else:
        result.errors.append("gap_report: skipped (jd_analysis failed)")
    tasks["ats_score"] = score_resume(resume, job_description)
    tasks["review"] = review_resume(resume, job_description)

    outcomes = await asyncio.gather(*tasks.values(), return_exceptions=True)
    for (name, _coro), outcome in zip(tasks.items(), outcomes):
        if isinstance(outcome, BaseException):
            logger.error(f"Pipeline: {name} failed: {outcome}")
            result.errors.append(f"{name}: {outcome}")
        else:
            setattr(result, name, outcome)

    logger.info(
        f"Pipeline done: ats={result.ats_score is not None} "
        f"gap={result.gap_report is not None} review={result.review is not None} "
        f"errors={len(result.errors)}"
    )
    return result
