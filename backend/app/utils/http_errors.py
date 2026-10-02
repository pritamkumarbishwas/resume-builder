"""Safe HTTP errors: log the real exception, return a generic client message."""
import logging
from fastapi import HTTPException

logger = logging.getLogger(__name__)

PUBLIC_500 = "Something went wrong. Please try again."


def internal_error(exc: Exception) -> HTTPException:
    """Log the full traceback server-side and return a non-leaky 500."""
    logger.error("Request failed: %s", exc, exc_info=True)
    return HTTPException(status_code=500, detail=PUBLIC_500)
