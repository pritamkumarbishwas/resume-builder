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
    # Read the actual bytes — do NOT trust Content-Length (it can be omitted or forged).
    body = b""
    async for chunk in request.stream():
        body += chunk
        if len(body) > MAX_BODY_BYTES:
            return JSONResponse(status_code=413, content={"detail": "Request too large."})

    # Replay the buffered body via the ASGI receive callable.
    # python-multipart (used by FastAPI's UploadFile) reads from _receive, not _body,
    # so patching only _body would silently break all file uploads.
    _replayed = False

    async def _receive():
        nonlocal _replayed
        if not _replayed:
            _replayed = True
            return {"type": "http.request", "body": body, "more_body": False}
        return {"type": "http.disconnect"}

    request._receive = _receive
    # Also set _body so await request.body() (used by JSON routes) is a free cache hit.
    request._body = body
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
