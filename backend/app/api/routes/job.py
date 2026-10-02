from fastapi import APIRouter, HTTPException
from app.schemas.job import JobDescription
from app.db.database import get_db
import logging
from app.utils.http_errors import internal_error

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/submit", response_model=JobDescription)
async def submit_job_description(jd: JobDescription):
    try:
        db = await get_db()
        await db.jobs.insert_one(jd.model_dump())
        return jd
    except Exception as e:
        logger.error(f"Error saving job description: {e}")
        raise internal_error(e)
