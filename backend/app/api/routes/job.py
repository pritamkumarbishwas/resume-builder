from fastapi import APIRouter, HTTPException
from app.schemas.job import JobDescription
from app.db.database import get_db
import logging
from app.utils.http_errors import internal_error

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/submit")
async def submit_job_description(jd: JobDescription):
    """Save a job description and return it together with its database-assigned id."""
    try:
        db = await get_db()
        doc = jd.model_dump()
        result = await db.jobs.insert_one(doc)  # insert_one mutates doc with _id
        return {**jd.model_dump(), "id": str(result.inserted_id)}
    except Exception as e:
        logger.error(f"Error saving job description: {e}")
        raise internal_error(e)
