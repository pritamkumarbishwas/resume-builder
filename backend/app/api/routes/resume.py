from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.file_parser import extract_text
from app.agents.parser_agent import parse_resume_text
from app.schemas.resume import Resume
from app.db.database import get_db
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/upload", response_model=Resume)
async def upload_resume(file: UploadFile = File(...)):
    if not file.filename.endswith(('.pdf', '.docx')):
        raise HTTPException(status_code=400, detail="Only PDF or DOCX allowed")
    
    logger.info(f"Uploading and parsing file: {file.filename}")
    try:
        content = await file.read()
        raw_text = extract_text(content, file.filename)
        resume_obj = await parse_resume_text(raw_text)
        
        db = await get_db()
        await db.resumes.insert_one(resume_obj.model_dump())
        
        return resume_obj
    except Exception as e:
        logger.error(f"Error processing resume upload: {e}")
        raise HTTPException(status_code=500, detail=str(e))
