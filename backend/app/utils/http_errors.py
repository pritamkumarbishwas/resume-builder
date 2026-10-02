"""Safe HTTP errors: log the real exception, return a generic client message."""
import logging
from fastapi import HTTPException
from app.services.llm_client import LLMClient

logger = logging.getLogger(__name__)

PUBLIC_500 = "Something went wrong. Please try again."


def internal_error(exc: Exception) -> HTTPException:
    """Log the full traceback server-side and return a non-leaky 500.

    Rate limits are not a server fault and the friendly rate-limit message is
    safe for clients, so they surface as an honest 429 with that detail."""
    if isinstance(exc, HTTPException):
        return exc
    if LLMClient.is_rate_limit_error(exc):
        msg = str(exc)
        logger.warning("Rate-limited request: %s", msg)
        return HTTPException(status_code=429, detail=msg)
    logger.error("Request failed: %s", exc, exc_info=True)
    return HTTPException(status_code=500, detail=PUBLIC_500)
