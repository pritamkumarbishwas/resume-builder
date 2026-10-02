"""Chat-edit must preserve optional contact fields the LLM omits from its response."""
import sys

sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient
from app.main import app
from app.services.llm_client import llm

RESUME = {
    "name": "Alex Johnson",
    "title": "Senior Software Engineer",
    "email": "alex@example.com",
    "phone": "+1 555 0100",
    "location": "Berlin, Germany",
    "linkedin": "linkedin.com/in/alexj",
    "portfolio": "alexjohnson.dev",
    "summary": "Original summary text.",
    "experiences": [
        {"title": "Engineer", "company": "Acme", "start_date": "2020", "end_date": "2024",
         "location": "Berlin", "description": ["Did things"]}
    ],
    "education": [
        {"degree": "B.Sc.", "institution": "TU Munich", "graduation_date": "2016",
         "location": "Munich", "gpa": "3.8"}
    ],
    "projects": [{"name": "OpenMetrics", "technologies": ["React"], "link": None,
                  "description": ["Dashboard"]}],
    "skills": [{"category": "Languages", "skills": ["TypeScript"]}],
}

# LLM drops title/email/phone/location/linkedin/portfolio from updated_resume
async def fake_generate_json(system, user):
    return {
        "assistant_message": "Shortened your summary.",
        "updated_resume": {
            "name": "Alex Johnson",
            "summary": "Much shorter summary.",
            "experiences": RESUME["experiences"],
            "education": RESUME["education"],
            "projects": RESUME["projects"],
            "skills": RESUME["skills"],
        },
    }

orig = llm.generate_json
llm.generate_json = fake_generate_json
try:
    c = TestClient(app)
    r = c.post("/api/tailor/chat-edit", json={
        "resume": RESUME,
        "job_description": "Some JD",
        "messages": [],
        "user_message": "Make my summary shorter",
        "template": "classic",
    })
finally:
    llm.generate_json = orig

assert r.status_code == 200, f"HTTP {r.status_code}: {r.text[:300]}"
out = r.json()["updated_resume"]
failures = []
for field in ("title", "email", "phone", "location", "linkedin", "portfolio"):
    if out.get(field) != RESUME[field]:
        failures.append(f"{field}: expected {RESUME[field]!r}, got {out.get(field)!r}")
if out.get("summary") != "Much shorter summary.":
    failures.append(f"summary not applied: {out.get('summary')!r}")

if failures:
    print("FAILURES:")
    for f in failures:
        print(" -", f)
    sys.exit(1)
print("CHAT-EDIT FIELD PRESERVATION PASSED (title/email/phone/location/linkedin/portfolio kept)")
