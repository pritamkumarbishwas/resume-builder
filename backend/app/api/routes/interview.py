from fastapi import APIRouter, HTTPException
from app.schemas.analysis import InterviewRequest, InterviewPlan
from app.agents.interviewer import generate_interview_questions

router = APIRouter()

@router.post("/questions", response_model=InterviewPlan)
async def create_interview_questions(req: InterviewRequest):
    """Mock interview questions built from the resume + job description."""
    try:
        return await generate_interview_questions(req.resume, req.job_description, req.count or 10)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
