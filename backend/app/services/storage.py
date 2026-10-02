from app.db.database import get_db
from app.schemas.analysis import ResumeVersion
import uuid
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

async def save_version(session_id: str, label: str, resume: dict, job_description: str = None, ats_score: int = None) -> ResumeVersion:
    db = await get_db()
    version_id = str(uuid.uuid4())
    version_doc = {
        "version_id": version_id,
        "session_id": session_id,
        "label": label,
        "created_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "resume": resume,
        "job_description": job_description,
        "ats_score": ats_score
    }
    await db.resume_versions.insert_one(version_doc.copy())
    # Remove _id before returning model
    if "_id" in version_doc:
        del version_doc["_id"]
    return ResumeVersion(**version_doc)

async def get_versions(session_id: str, limit: int = 50) -> list[ResumeVersion]:
    db = await get_db()
    limit = min(max(1, limit), 50)  # enforce server-side cap regardless of caller
    cursor = db.resume_versions.find({"session_id": session_id}).sort("created_at", -1)
    versions = await cursor.to_list(length=limit)
    for v in versions:
        if "_id" in v:
            del v["_id"]
    return [ResumeVersion(**v) for v in versions]
    
async def get_version(version_id: str) -> ResumeVersion:
    db = await get_db()
    version = await db.resume_versions.find_one({"version_id": version_id})
    if not version:
        raise ValueError("Version not found")
    if "_id" in version:
        del version["_id"]
    return ResumeVersion(**version)
