from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.api.routes import resume, job, tailor, export, analyze
from app.db.database import db_instance

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
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(resume.router, prefix="/api/resume", tags=["resume"])
app.include_router(job.router, prefix="/api/job", tags=["job"])
app.include_router(tailor.router, prefix="/api/tailor", tags=["tailor"])
app.include_router(export.router, prefix="/api/export", tags=["export"])
app.include_router(analyze.router, prefix="/api/analyze", tags=["analyze"])

@app.get("/")
def health_check():
    return {"status": "ok", "message": "Resume Builder API is running"}
