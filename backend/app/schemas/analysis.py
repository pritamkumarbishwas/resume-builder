from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Literal
from app.schemas.resume import Resume
import uuid


# ── Existing schemas ────────────────────────────────────────────────────────

class BulletRewriteRequest(BaseModel):
    original_bullets: List[str]
    job_description: str
    template: Optional[str] = None        # template id from the template registry

class SummaryRewriteRequest(BaseModel):
    resume_text: str
    job_description: str
    template: Optional[str] = None

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
    template: Optional[str] = None


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
    template: Optional[str] = None

class ChatEditResponse(BaseModel):
    assistant_message: str
    updated_resume: Resume                # may or may not change


# ── Phase 2: Reviewer ────────────────────────────────────────────────────────

class BulletFeedback(BaseModel):
    original: str
    issue: str
    suggestion: str
    severity: Literal["high", "medium", "low"]

class QualityCheck(BaseModel):
    """One grammar / tone / length verdict for a piece of resume text."""
    category: Literal["grammar", "tone", "length"]
    target: str                                   # e.g. "Summary", "Experience 1, bullet 2"
    status: Literal["pass", "warn", "fail"]
    detail: str                                   # what is wrong (or why it is fine) + how to fix it

class ReviewReport(BaseModel):
    overall_quality_score: int
    summary_feedback: str
    bullet_feedback: List[BulletFeedback] = Field(default_factory=list)
    general_tips: List[str] = Field(default_factory=list)
    checks: List[QualityCheck] = Field(default_factory=list)

class ReviewRequest(BaseModel):
    resume: Resume
    job_description: str


# ── Phase 3: Multi-agent pipeline ───────────────────────────────────────────

class PipelineRequest(BaseModel):
    resume: Resume
    job_description: str

class PipelineResult(BaseModel):
    """Combined output of the analyzer / matcher / reviewer agents.

    Each stage is independent: a failing agent lands in `errors` instead of
    taking down the whole response, so the UI always gets what succeeded.
    """
    ats_score: Optional[ATSScoreResponse] = None
    jd_analysis: Optional[JDAnalysis] = None
    gap_report: Optional[GapReport] = None
    review: Optional[ReviewReport] = None
    errors: List[str] = Field(default_factory=list)


# ── Phase 3: Mock interview ─────────────────────────────────────────────────

class InterviewQuestion(BaseModel):
    question: str
    category: Literal["behavioral", "technical", "role_specific", "gap_close"]
    difficulty: Literal["easy", "medium", "hard"] = "medium"
    why_asked: str = ""                           # what the interviewer is probing
    answer_hint: str = ""                         # which resume/JD evidence to draw on

class InterviewPlan(BaseModel):
    questions: List[InterviewQuestion] = Field(default_factory=list)
    strategy_tips: List[str] = Field(default_factory=list)

class InterviewRequest(BaseModel):
    resume: Resume
    job_description: str
    count: Optional[int] = 10                     # 5-15 questions


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
    # If the client does not supply a session_id the server mints a fresh UUID,
    # preventing state pollution from empty/null ids while keeping the API
    # backward-compatible for clients that already manage their own session token.
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    label: str
    resume: Resume
    job_description: Optional[str] = None
    ats_score: Optional[int] = None

    @field_validator("label")
    @classmethod
    def label_length(cls, v: str) -> str:
        if len(v) > 120:
            raise ValueError("label must be 120 characters or fewer")
        return v


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
