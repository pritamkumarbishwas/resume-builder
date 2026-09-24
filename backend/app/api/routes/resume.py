from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.file_parser import extract_text
from app.agents.parser_agent import parse_resume_text
from app.schemas.resume import Resume
from app.schemas.analysis import SaveVersionRequest
from app.services.storage import save_version, get_versions, get_version
from app.db.database import get_db
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/upload", response_model=Resume)
async def upload_resume(file: UploadFile = File(...)):
    filename = file.filename or ""
    if not filename.lower().endswith(('.pdf', '.docx')):
        raise HTTPException(status_code=400, detail="Only PDF or DOCX allowed")

    logger.info(f"Uploading and parsing file: {filename}")
    try:
        content = await file.read()
        raw_text = extract_text(content, filename)
        resume_obj = await parse_resume_text(raw_text)
        
        db = await get_db()
        await db.resumes.insert_one(resume_obj.model_dump())
        
        return resume_obj
    except Exception as e:
        logger.error(f"Error processing resume upload: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/versions/save")
async def save_resume_version(req: SaveVersionRequest):
    try:
        return await save_version(req.session_id, req.label, req.resume.model_dump(), req.job_description, req.ats_score)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/versions/{session_id}")
async def list_resume_versions(session_id: str):
    try:
        return await get_versions(session_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/versions/load/{version_id}")
async def load_resume_version(version_id: str):
    try:
        return await get_version(version_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
