"""ATS-structure tests: single-column layout, standard headings, no images or
complex tables — enforced against the raw template HTML and the generated DOCX."""
import sys
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient
from app.main import app
from app.api.routes.export import env, sanitize_text
from app.services.template_registry import get_template

failures = []

RESUME = {
    "name": "Alex Johnson",
    "title": "Senior Software Engineer",
    "email": "alex@example.com",
    "phone": "+1 555 0100",
    "location": "Berlin, Germany",
    "summary": "Engineer with 8 years building web platforms.",
    "experiences": [
        {
            "title": "Senior Software Engineer",
            "company": "Acme Corp",
            "start_date": "2020",
            "end_date": "2024",
            "description": ["Shipped billing platform serving 2M users"],
        },
    ],
    "education": [
        {"degree": "B.Sc. Computer Science", "institution": "TU Munich", "graduation_date": "2016"},
    ],
    "projects": [
        {"name": "OpenMetrics", "description": ["Prometheus dashboard"], "technologies": ["React"]},
    ],
    "skills": [
        {"category": "Languages", "skills": ["TypeScript", "Python"]},
    ],
}

# Standard ATS-recognisable section headings per template (same as parity test)
HEADINGS = {
    "classic": ["PROFESSIONAL SUMMARY", "EXPERIENCE", "PROJECTS", "EDUCATION", "SKILLS"],
    "modern": ["PROFESSIONAL SUMMARY", "EXPERIENCE", "PROJECTS", "EDUCATION", "TECHNICAL SKILLS"],
    "minimal": ["SUMMARY", "EXPERIENCE", "PROJECTS", "EDUCATION", "SKILLS"],
}

BANNED_HTML = [
    ("<img", "image tag"),
    ("background-image", "CSS background image"),
    ("<iframe", "iframe"),
    ("colspan", "merged table cells"),
    ("column-count", "multi-column CSS"),
    ("list-style-image", "list image"),
]

for tpl_id, headings in HEADINGS.items():
    tpl = get_template(tpl_id)
    html = env.get_template(tpl.html_file).render(resume=sanitize_text(RESUME))
    low = html.lower()

    for needle, label in BANNED_HTML:
        if needle in low:
            failures.append(f"[{tpl_id}] HTML contains {label} ({needle!r}) — not ATS friendly")

    for heading in headings:
        if heading.upper() not in html.upper():
            failures.append(f"[{tpl_id}] HTML missing standard heading {heading!r}")

    # No nested tables (a simple 2-column header row is acceptable)
    if html.lower().count("<table") > html.lower().count("</table>"):
        failures.append(f"[{tpl_id}] HTML has unbalanced/nested tables")

    print(f"{tpl_id}: HTML {len(html)} chars checked")

# ---------------------------------------------------------------- DOCX side

c = TestClient(app)
for tpl_id in HEADINGS:
    r = c.post(f"/api/export/docx?template={tpl_id}", json=RESUME)
    assert r.status_code == 200, f"{tpl_id} DOCX HTTP {r.status_code}: {r.text[:200]}"

    zf = zipfile.ZipFile(__import__("io").BytesIO(r.content))
    names = zf.namelist()
    media = [n for n in names if n.startswith("word/media/")]
    if media:
        failures.append(f"[{tpl_id}] DOCX embeds images: {media}")
    document_xml = zf.read("word/document.xml").decode("utf-8", errors="replace")
    if "<w:drawing" in document_xml or "<w:pict" in document_xml:
        failures.append(f"[{tpl_id}] DOCX contains drawing/picture XML")
    if "w:vMerge" in document_xml or "w:gridSpan" in document_xml:
        failures.append(f"[{tpl_id}] DOCX uses merged cells (complex table)")

    up = document_xml.upper()
    for heading in HEADINGS[tpl_id]:
        if heading.upper() not in up:
            failures.append(f"[{tpl_id}] DOCX missing standard heading {heading!r}")
    print(f"{tpl_id}: DOCX {len(r.content)} bytes checked")

if failures:
    print("\nFAILURES:")
    for f in failures:
        print(" -", f)
    sys.exit(1)
print("\nALL ATS/RENDERER CHECKS PASSED")
