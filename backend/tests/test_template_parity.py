"""Template parity test: PDF vs DOCX must contain identical content per template."""
import io
import os
import sys

sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parents[1]))

import fitz  # PyMuPDF
from docx import Document
from fastapi.testclient import TestClient
from app.main import app

RESUME = {
    "name": "Alex Johnson",
    "title": "Senior Software Engineer",
    "email": "alex@example.com",
    "phone": "+1 555 0100",
    "location": "Berlin, Germany",
    "linkedin": "linkedin.com/in/alexj",
    "portfolio": "alexjohnson.dev",
    "summary": "Engineer with 8 years building web platforms.",
    "experiences": [
        {
            "title": "Senior Software Engineer",
            "company": "Acme Corp",
            "start_date": "2020",
            "end_date": "2024",
            "location": "Berlin",
            "description": ["Shipped billing platform serving 2M users", "Led migration to Kubernetes"],
        },
        {
            "title": "Freelance Developer",
            "company": "",
            "start_date": "",
            "end_date": "",
            "location": "",
            "description": ["Built internal tools"],
        },
    ],
    "education": [
        {
            "degree": "B.Sc. Computer Science",
            "institution": "TU Munich",
            "graduation_date": "2016",
            "location": "Munich",
            "gpa": "3.8",
        },
    ],
    "projects": [
        {
            "name": "OpenMetrics",
            "technologies": ["React", "Node.js"],
            "link": "github.com/alex/openmetrics",
            "description": ["Prometheus dashboard"],
        },
    ],
    "skills": [
        {"category": "Languages", "skills": ["TypeScript", "Python"]},
        {"category": "Tools", "skills": ["Docker", "Kubernetes"]},
    ],
}

COMMON = [
    "Alex Johnson", "Senior Software Engineer", "alex@example.com", "+1 555 0100",
    "Berlin, Germany",
    "linkedin.com/in/alexj", "alexjohnson.dev", "Engineer with 8 years building web platforms.",
    "Acme Corp", "2020 - 2024", "Shipped billing platform serving 2M users",
    "Freelance Developer", "Built internal tools",
    "TU Munich", "2016", "GPA: 3.8",
    "OpenMetrics", "React, Node.js", "github.com/alex/openmetrics",
    "TypeScript, Python", "Docker, Kubernetes",
]

HEADINGS = {
    "classic": ["PROFESSIONAL SUMMARY", "EXPERIENCE", "PROJECTS", "EDUCATION", "SKILLS"],
    "modern": ["PROFESSIONAL SUMMARY", "EXPERIENCE", "PROJECTS", "EDUCATION", "TECHNICAL SKILLS"],
    "minimal": ["SUMMARY", "EXPERIENCE", "PROJECTS", "EDUCATION", "SKILLS"],
}

c = TestClient(app)
failures = []

for tpl in ("classic", "modern", "minimal"):
    # --- PDF ---
    r = c.post(f"/api/export/pdf?template={tpl}", json=RESUME)
    assert r.status_code == 200, f"{tpl} PDF HTTP {r.status_code}: {r.text[:200]}"
    pdf_doc = fitz.open(stream=r.content, filetype="pdf")
    pdf_text = "\n".join(page.get_text() for page in pdf_doc)
    pdf_doc.close()

    # --- DOCX ---
    r = c.post(f"/api/export/docx?template={tpl}", json=RESUME)
    assert r.status_code == 200, f"{tpl} DOCX HTTP {r.status_code}: {r.text[:200]}"
    doc = Document(io.BytesIO(r.content))
    docx_text = "\n".join(p.text for p in doc.paragraphs)

    up_pdf, up_docx = pdf_text.upper(), docx_text.upper()

    for needle in COMMON + HEADINGS[tpl]:
        n = needle.upper()
        if n not in up_pdf:
            failures.append(f"[{tpl}] PDF missing: {needle!r}")
        if n not in up_docx:
            failures.append(f"[{tpl}] DOCX missing: {needle!r}")

    # Stray 'None' from Jinja rendering of missing values
    for label, text in (("PDF", pdf_text), ("DOCX", docx_text)):
        if any(w.strip(".,()") == "None" for w in text.split()):
            failures.append(f"[{tpl}] {label} contains literal 'None'")

    # Empty-dates entry must NOT produce '- Present' (nothing here should be Present)
    if "PRESENT" in up_pdf:
        failures.append(f"[{tpl}] PDF has stray 'Present' for empty-date entry")
    if "PRESENT" in up_docx:
        failures.append(f"[{tpl}] DOCX has stray 'Present' for empty-date entry")

    # Contact separators per template
    seps = {"classic": " | ", "modern": " • ", "minimal": " / "}
    if seps[tpl].upper() not in up_pdf:
        failures.append(f"[{tpl}] PDF contact separator {seps[tpl]!r} missing")
    if seps[tpl].upper() not in up_docx:
        failures.append(f"[{tpl}] DOCX contact separator {seps[tpl]!r} missing")

    # Headline (resume.title) must render under the name AND as the experience title -> >= 2 hits
    if up_pdf.count("SENIOR SOFTWARE ENGINEER") < 2:
        failures.append(f"[{tpl}] PDF missing headline under name")
    if up_docx.count("SENIOR SOFTWARE ENGINEER") < 2:
        failures.append(f"[{tpl}] DOCX missing headline under name")

    # Experience connector parity: 'at Acme' (modern), '- Acme' (minimal), ', Acme' (classic)
    if tpl == "modern" and "AT ACME CORP" not in up_pdf:
        failures.append("[modern] PDF missing 'at Acme Corp'")
    if tpl == "modern" and "AT ACME CORP" not in up_docx:
        failures.append("[modern] DOCX missing 'at Acme Corp'")

    print(f"{tpl}: PDF {len(pdf_text)} chars, DOCX {len(docx_text)} chars")

if failures:
    print("\nFAILURES:")
    for f in failures:
        print(" -", f)
    sys.exit(1)
print("\nALL TEMPLATE PARITY CHECKS PASSED")
