from fastapi import APIRouter, HTTPException
from app.schemas.analysis import BulletRewriteRequest, SummaryRewriteRequest
from app.agents.writer_agent import rewrite_bullets, generate_summary

router = APIRouter()

@router.post("/rewrite-bullets")
async def rewrite_resume_bullets(req: BulletRewriteRequest):
    try:
        new_bullets = await rewrite_bullets(req.original_bullets, req.job_description)
        return {"rewritten_bullets": new_bullets}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-summary")
async def generate_resume_summary(req: SummaryRewriteRequest):
    try:
        summary = await generate_summary(req.resume_text, req.job_description)
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
