from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from app.schemas.resume import Resume
from app.services.template_registry import get_template, list_templates
from jinja2 import Environment, FileSystemLoader
from xhtml2pdf import pisa
from docx import Document
from docx.enum.text import WD_TAB_ALIGNMENT
from docx.oxml import OxmlElement
from docx.shared import Pt, Inches, RGBColor
import io
import os
from app.utils.http_errors import internal_error

router = APIRouter()

template_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'templates')
env = Environment(loader=FileSystemLoader(template_dir))

def sanitize_text(data):
    if isinstance(data, dict):
        return {k: sanitize_text(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [sanitize_text(i) for i in data]
    elif isinstance(data, str):
        # Replace common unicode characters that xhtml2pdf's default fonts can't render
        return (data.replace('â€“', '-')
                    .replace('â€”', '-')
                    .replace('â€¢', '')
                    .replace('â€™', "'")
                    .replace('â€˜', "'")
                    .replace('â€œ', '"')
                    .replace('â€', '"')
                    .replace('\u200b', '')
                    .replace('â€¦', '...'))
    return data

@router.get("/templates")
async def get_export_templates():
    """List available resume templates (layout + AI writing style metadata)."""
    return list_templates()


@router.post("/pdf")
async def export_pdf(resume: Resume, template: str = "classic"):
    try:
        tpl = get_template(template)
        try:
            html_template = env.get_template(tpl.html_file)
        except Exception:
            html_template = env.get_template(get_template(None).html_file)

        sanitized_data = sanitize_text(resume.model_dump())
        html_out = html_template.render(resume=sanitized_data)

        result_file = io.BytesIO()
        pisa_status = pisa.CreatePDF(html_out, dest=result_file, encoding='utf-8')

        if pisa_status.err:
            raise Exception("PDF generation failed")

        return Response(content=result_file.getvalue(), media_type="application/pdf")
    except Exception as e:
        raise internal_error(e)


def _section_heading(doc, title: str, style):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(4)
    text = title.upper() if style.heading_uppercase else title
    run = p.add_run(text)
    run.bold = True
    run.font.size = Pt(12)
    run.font.name = style.heading_font
    run.font.color.rgb = RGBColor.from_string(style.accent_hex)
    return p


def _date_range(start, end):
    """Same date logic as the HTML templates: empty only when both are empty."""
    start = (start or "").strip()
    end = (end or "").strip()
    if start and end:
        return f"{start} - {end}"
    if start:
        return f"{start} - Present"
    if end:
        return end
    return ""


def _entry_header(doc, title_text, meta_parts, right_text, style):
    """One header line: bold title + italic meta on the left, date/link right-aligned.

    Uses a right tab stop (not a table) so the layout mirrors the HTML row
    while staying ATS-safe single-column text.
    """
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(0)
    usable = doc.sections[0].page_width - doc.sections[0].left_margin - doc.sections[0].right_margin
    p.paragraph_format.tab_stops.add_tab_stop(usable, WD_TAB_ALIGNMENT.RIGHT)

    title_run = p.add_run(title_text or "")
    title_run.bold = True
    title_run.font.size = Pt(11)

    for text in meta_parts:
        if not text:
            continue
        r = p.add_run(text)
        r.italic = True
        r.font.size = Pt(9.5)

    if right_text:
        tab = p.add_run()
        tab._r.append(OxmlElement("w:tab"))
        tab.font.size = Pt(9.5)
        r = p.add_run(right_text)
        r.font.size = Pt(9.5)
    return p


def _bullets(doc, items):
    for item in items or []:
        if not item.strip():
            continue
        bp = doc.add_paragraph(item, style="List Bullet")
        bp.paragraph_format.space_after = Pt(0)
        bp.paragraph_format.left_indent = Inches(0.25)


@router.post("/docx")
async def export_docx(resume: Resume, template: str = "classic"):
    """ATS-friendly single-column DOCX export (no tables, no columns)."""
    try:
        style = get_template(template).docx
        # Same sanitisation as PDF so both files contain identical characters
        data = sanitize_text(resume.model_dump())
        doc = Document()

        normal = doc.styles["Normal"]
        normal.font.name = style.body_font
        normal.font.size = Pt(10.5)

        for section in doc.sections:
            section.top_margin = Inches(0.6)
            section.bottom_margin = Inches(0.6)
            section.left_margin = Inches(0.75)
            section.right_margin = Inches(0.75)

        name_p = doc.add_paragraph()
        name_run = name_p.add_run(data.get("name") or "")
        name_run.bold = True
        name_run.font.size = Pt(22)
        name_run.font.name = style.heading_font
        name_run.font.color.rgb = RGBColor.from_string(style.accent_hex)
        name_p.paragraph_format.space_after = Pt(2)

        if data.get("title"):
            title_p = doc.add_paragraph()
            title_run = title_p.add_run(data["title"])
            title_run.font.size = Pt(11)
            title_run.font.color.rgb = RGBColor.from_string("5B6472")
            title_p.paragraph_format.space_after = Pt(2)

        contact = [
            data.get("email"),
            data.get("phone"),
            data.get("location"),
            data.get("linkedin"),
            data.get("portfolio"),
        ]
        contact_text = style.contact_sep.join(str(c) for c in contact if c)
        if contact_text:
            cp = doc.add_paragraph()
            cr = cp.add_run(contact_text)
            cr.font.size = Pt(9.5)
            cp.paragraph_format.space_after = Pt(4)

        if data.get("summary"):
            _section_heading(doc, style.summary_heading, style)
            p = doc.add_paragraph(data["summary"])
            p.paragraph_format.space_after = Pt(4)

        if data.get("experiences"):
            _section_heading(doc, "Experience", style)
            for exp in data["experiences"]:
                meta = []
                if exp.get("company"):
                    meta.append(style.exp_connector + exp["company"])
                if exp.get("location"):
                    meta.append(", " + exp["location"])
                _entry_header(
                    doc,
                    exp.get("title") or "",
                    meta,
                    _date_range(exp.get("start_date"), exp.get("end_date")),
                    style,
                )
                _bullets(doc, exp.get("description"))

        if data.get("projects"):
            _section_heading(doc, "Projects", style)
            for project in data["projects"]:
                if not (project.get("name") or project.get("description")):
                    continue
                techs = ", ".join(t for t in (project.get("technologies") or []) if t)
                meta = [(style.tech_connector + techs)] if techs else []
                _entry_header(doc, project.get("name") or "", meta, project.get("link") or "", style)
                _bullets(doc, project.get("description"))

        if data.get("education"):
            _section_heading(doc, "Education", style)
            for edu in data["education"]:
                meta = []
                if edu.get("institution"):
                    meta.append(style.edu_connector + edu["institution"])
                if edu.get("location"):
                    meta.append(", " + edu["location"])
                _entry_header(doc, edu.get("degree") or "", meta, edu.get("graduation_date") or "", style)
                if edu.get("gpa"):
                    gp = doc.add_paragraph()
                    gp.paragraph_format.space_after = Pt(2)
                    gr = gp.add_run(f"GPA: {edu['gpa']}")
                    gr.font.size = Pt(9.5)
                    gr.font.color.rgb = RGBColor.from_string("5B6472")

        if data.get("skills"):
            _section_heading(doc, style.skills_heading, style)
            for group in data["skills"]:
                skills = [s for s in (group.get("skills") or []) if s]
                if not skills and not group.get("category"):
                    continue
                gp = doc.add_paragraph()
                gp.paragraph_format.space_after = Pt(2)
                cat_run = gp.add_run(f"{group.get('category') or 'Skills'}: ")
                cat_run.bold = True
                gp.add_run(", ".join(skills))

        buffer = io.BytesIO()
        doc.save(buffer)
        return Response(
            content=buffer.getvalue(),
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": 'attachment; filename="Tailored_Resume.docx"'},
        )
    except Exception as e:
        raise internal_error(e)
