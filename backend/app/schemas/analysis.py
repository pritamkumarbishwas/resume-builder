from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from app.schemas.resume import Resume


# ── Existing schemas ────────────────────────────────────────────────────────

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


# ── Phase 2: JD Analyzer ────────────────────────────────────────────────────

class JDAnalysis(BaseModel):
    role_title: str
    company: Optional[str] = None
    required_skills: List[str] = Field(default_factory=list)
    preferred_skills: List[str] = Field(default_factory=list)
    key_responsibilities: List[str] = Field(default_factory=list)
    seniority_level: str = "mid"          # junior | mid | senior | lead
    culture_keywords: List[str] = Field(default_factory=list)
    industry: Optional[str] = None

class JDAnalyzeRequest(BaseModel):
    job_description: str


# ── Phase 2: Gap Analysis (Matcher) ─────────────────────────────────────────

class SkillMatch(BaseModel):
    skill: str
    present: bool
    evidence: Optional[str] = None        # resume excerpt proving the skill

class GapReport(BaseModel):
    overall_match_percent: int
    matched_skills: List[SkillMatch] = Field(default_factory=list)
    missing_required: List[str] = Field(default_factory=list)
    missing_preferred: List[str] = Field(default_factory=list)
    relevant_experiences: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)

class GapReportRequest(BaseModel):
    resume: Resume
    job_description: str


# ── Phase 2: Chat / Clarifier ───────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str

class ChatEditRequest(BaseModel):
    resume: Resume
    job_description: str
    messages: List[ChatMessage]           # full conversation history
    user_message: str                     # latest message

class ChatEditResponse(BaseModel):
    assistant_message: str
    updated_resume: Resume                # may or may not change


# ── Phase 2: Reviewer ────────────────────────────────────────────────────────

class BulletFeedback(BaseModel):
    original: str
    issue: str
    suggestion: str
    severity: Literal["high", "medium", "low"]

class ReviewReport(BaseModel):
    overall_quality_score: int
    summary_feedback: str
    bullet_feedback: List[BulletFeedback] = Field(default_factory=list)
    general_tips: List[str] = Field(default_factory=list)

class ReviewRequest(BaseModel):
    resume: Resume
    job_description: str


# ── Phase 2: Version History ─────────────────────────────────────────────────

class ResumeVersion(BaseModel):
    version_id: str
    session_id: str
    label: str
    created_at: str
    resume: Resume
    job_description: Optional[str] = None
    ats_score: Optional[int] = None

class SaveVersionRequest(BaseModel):
    session_id: str
    label: str
    resume: Resume
    job_description: Optional[str] = None
    ats_score: Optional[int] = None


# ── Phase 2: Orchestrator Pipeline ───────────────────────────────────────────

class TailorPipelineRequest(BaseModel):
    resume: Resume
    job_description: str
    mode: Literal["auto"] = "auto"

class TailorPipelineResult(BaseModel):
    tailored_resume: Resume
    jd_analysis: JDAnalysis
    gap_report: GapReport
    review_report: ReviewReport
    ats_score: ATSScoreResponse
