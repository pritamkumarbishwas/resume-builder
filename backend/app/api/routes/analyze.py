from fastapi import APIRouter, HTTPException
from app.schemas.analysis import ATSScoreRequest, ATSScoreResponse
from app.services.ats_scorer import score_resume

router = APIRouter()

@router.post("/ats-score", response_model=ATSScoreResponse)
async def get_ats_score(req: ATSScoreRequest):
    try:
        score_data = await score_resume(req.resume, req.job_description)
        return score_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
