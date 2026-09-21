from pydantic import BaseModel
from typing import List, Optional

class JobDescription(BaseModel):
    title: str
    company: str
    description: str
    requirements: List[str] = []
    responsibilities: List[str] = []
