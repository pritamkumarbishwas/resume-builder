from pydantic import BaseModel
from typing import List, Optional

class BulletRewriteRequest(BaseModel):
    original_bullets: List[str]
    job_description: str
    
class SummaryRewriteRequest(BaseModel):
    resume_text: str
    job_description: str
