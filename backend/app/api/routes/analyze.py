from fastapi import APIRouter, HTTPException
from app.schemas.analysis import ATSScoreRequest, ATSScoreResponse, JDAnalyzeRequest, GapReportRequest, ReviewRequest
from app.services.ats_scorer import score_resume
from app.agents.jd_analyzer import analyze_jd
from app.agents.matcher import analyze_gaps
from app.agents.reviewer_agent import review_resume

router = APIRouter()

@router.post("/ats-score", response_model=ATSScoreResponse)
async def get_ats_score(req: ATSScoreRequest):
    try:
        score_data = await score_resume(req.resume, req.job_description)
        return score_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/jd")
async def extract_jd(req: JDAnalyzeRequest):
    try:
        return await analyze_jd(req.job_description)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/gap-report")
async def generate_gap_report(req: GapReportRequest):
    try:
        jd_data = await analyze_jd(req.job_description)
        gaps = await analyze_gaps(req.resume, jd_data)
        return gaps
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/review")
async def generate_review(req: ReviewRequest):
    try:
        return await review_resume(req.resume, req.job_description)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
