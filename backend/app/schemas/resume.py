from pydantic import BaseModel, Field
from typing import List, Optional

class Experience(BaseModel):
    title: str
    company: str
    start_date: str
    end_date: Optional[str] = "Present"
    location: Optional[str] = None
    description: List[str] = Field(default_factory=list, description="Bullet points of achievements")

class Education(BaseModel):
    degree: str
    institution: str
    graduation_date: str
    location: Optional[str] = None
    gpa: Optional[str] = None

class Skill(BaseModel):
    category: str
    skills: List[str]

class Resume(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    linkedin: Optional[str] = None
    portfolio: Optional[str] = None
    summary: str
    experiences: List[Experience] = Field(default_factory=list)
    education: List[Education] = Field(default_factory=list)
    skills: List[Skill] = Field(default_factory=list)
