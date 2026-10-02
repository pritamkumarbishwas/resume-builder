from fastapi import APIRouter, HTTPException
from app.schemas.analysis import InterviewRequest, InterviewPlan
from app.agents.interviewer import generate_interview_questions
from app.utils.http_errors import internal_error

router = APIRouter()

@router.post("/questions", response_model=InterviewPlan)
async def create_interview_questions(req: InterviewRequest):
    """Mock interview questions built from the resume + job description."""
    try:
        return await generate_interview_questions(req.resume, req.job_description, req.count or 10)
    except Exception as e:
        raise internal_error(e)
