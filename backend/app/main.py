from fastapi import FastAPI
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from app.api.routes import resume, job, tailor, export, analyze, interview
from app.config import settings
from app.db.database import db_instance

MAX_BODY_BYTES = 20 * 1024 * 1024  # reject oversized request bodies early

@asynccontextmanager
async def lifespan(app: FastAPI):
    db_instance.connect_db()
    yield
    db_instance.close_db()

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Resume Builder AI Agent",
    description="API for parsing, analyzing, and tailoring resumes with an AI agent.",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def body_size_limit(request, call_next):
    length = request.headers.get("content-length")
    if length and length.isdigit() and int(length) > MAX_BODY_BYTES:
        return JSONResponse(status_code=413, content={"detail": "Request too large."})
    return await call_next(request)

app.include_router(resume.router, prefix="/api/resume", tags=["resume"])
app.include_router(job.router, prefix="/api/job", tags=["job"])
app.include_router(tailor.router, prefix="/api/tailor", tags=["tailor"])
app.include_router(export.router, prefix="/api/export", tags=["export"])
app.include_router(analyze.router, prefix="/api/analyze", tags=["analyze"])
app.include_router(interview.router, prefix="/api/interview", tags=["interview"])

@app.get("/")
def health_check():
    return {"status": "ok", "message": "Resume Builder API is running"}
