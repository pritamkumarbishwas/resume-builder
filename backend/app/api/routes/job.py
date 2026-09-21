from fastapi import APIRouter, HTTPException
from app.schemas.job import JobDescription
from app.db.database import get_db
import logging

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
        raise HTTPException(status_code=500, detail=str(e))
