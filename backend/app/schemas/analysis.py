from pydantic import BaseModel
from typing import List, Optional
from app.schemas.resume import Resume

class BulletRewriteRequest(BaseModel):
    original_bullets: List[str]
    job_description: str
    
class SummaryRewriteRequest(BaseModel):
    resume_text: str
    job_description: str

class ATSScoreRequest(BaseModel):
    resume: Resume
    job_description: str

class ATSScoreResponse(BaseModel):
    score: int
    matching_keywords: List[str]
    missing_keywords: List[str]
    recommendations: List[str]

class CoverLetterRequest(BaseModel):
    resume: Resume
    job_description: str
