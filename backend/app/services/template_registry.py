"""Resume template registry.

Every export template is described in one place:
  - html_file : the Jinja2 layout used for PDF export
  - docx      : fonts/colour rules used for DOCX export
  - writing   : the voice/style directive injected into the AI writer prompts

The frontend fetches `GET /api/export/templates` and sends the chosen id back
with export and AI-generation requests (``?template=<id>`` / ``template`` body).
"""
from dataclasses import dataclass, field
from typing import Dict, List, Optional


@dataclass(frozen=True)
class DocxStyle:
    """DOCX rules that mirror the HTML/PDF layout so both exports match."""

    accent_hex: str = "111111"
    body_font: str = "Calibri"
    heading_font: str = "Calibri"
    heading_uppercase: bool = True
    contact_sep: str = " | "
    exp_connector: str = ", "
    edu_connector: str = ", "
    tech_connector: str = " | "
    summary_heading: str = "Professional Summary"
    skills_heading: str = "Skills"


@dataclass(frozen=True)
class ResumeTemplate:
    id: str
    name: str
    description: str
    html_file: str
    docx: DocxStyle
    writing_style: str
    preview: Dict[str, str] = field(default_factory=dict)


CLASSIC_WRITING_STYLE = """\
- Formal, conventional resume voice: "Managed", "Developed", "Delivered", "Oversaw".
- Full, professional phrasing; avoid slang, exclamation marks and hype adjectives.
- Prefer complete sentences over fragments; results stated factually (numbers, scope, scale).
- Conservative with keywords: use the job description's exact terms, but no creative rewrites."""

MODERN_WRITING_STYLE = """\
- Energetic, contemporary voice: "Led", "Launched", "Scaled", "Shipped", "Drove", "Automated".
- Punchy fragments are fine: start with the verb, kill filler like "responsible for".
- Lead with the outcome, then the how; put the number as early in the line as possible.
- Mirror the job description's modern terminology (e.g. "CI/CD", "design systems") where truthful."""

MINIMAL_WRITING_STYLE = """\
- Terse and keyword-dense: every word must earn its place, target 10-16 words per bullet.
- Plain verb-first fragments, no adjectives, no marketing language, no repetition of the same verb.
- Front-load the skills and tools the job description asks for so ATS parsers see them early.
- Facts only: no pronouns, no "passionate", no second-person, no rhetorical flourish."""


TEMPLATES: Dict[str, ResumeTemplate] = {
    "classic": ResumeTemplate(
        id="classic",
        name="Classic",
        description="Traditional centered layout with ruled section headings — safe for any industry.",
        html_file="classic.html",
        docx=DocxStyle(
            accent_hex="1F3A5F",
            body_font="Georgia",
            heading_font="Georgia",
            heading_uppercase=True,
            contact_sep=" | ",
            exp_connector=", ",
            edu_connector=", ",
            tech_connector=" | ",
            summary_heading="Professional Summary",
            skills_heading="Skills",
        ),
        writing_style=CLASSIC_WRITING_STYLE,
        preview={"accent": "1F3A5F", "font": "Georgia", "layout": "Centered header, ruled sections"},
    ),
    "modern": ResumeTemplate(
        id="modern",
        name="Modern",
        description="Left-aligned header with a colour accent bar — stands out for tech and design roles.",
        html_file="modern.html",
        docx=DocxStyle(
            accent_hex="1E2A4A",
            body_font="Arial",
            heading_font="Arial",
            heading_uppercase=False,
            contact_sep=" • ",
            exp_connector=" at ",
            edu_connector=", ",
            tech_connector=" - ",
            summary_heading="Professional Summary",
            skills_heading="Technical Skills",
        ),
        writing_style=MODERN_WRITING_STYLE,
        preview={"accent": "4F6BED", "font": "Open Sans", "layout": "Colour bar header, accent headings"},
    ),
    "minimal": ResumeTemplate(
        id="minimal",
        name="Minimal",
        description="Plain single-column, no colour or ornament — maximum ATS parsability.",
        html_file="minimal.html",
        docx=DocxStyle(
            accent_hex="000000",
            body_font="Arial",
            heading_font="Arial",
            heading_uppercase=True,
            contact_sep=" / ",
            exp_connector=" - ",
            edu_connector=" - ",
            tech_connector=" - ",
            summary_heading="Summary",
            skills_heading="Skills",
        ),
        writing_style=MINIMAL_WRITING_STYLE,
        preview={"accent": "000000", "font": "Arial", "layout": "Plain single column, no ornament"},
    ),
}

DEFAULT_TEMPLATE_ID = "classic"


def get_template(template_id: Optional[str]) -> ResumeTemplate:
    """Resolve a template id, falling back to the default for unknown/missing ids."""
    if template_id:
        tpl = TEMPLATES.get(template_id.strip().lower())
        if tpl:
            return tpl
    return TEMPLATES[DEFAULT_TEMPLATE_ID]


def list_templates() -> List[Dict]:
    """Template metadata for the frontend picker."""
    return [
        {
            "id": t.id,
            "name": t.name,
            "description": t.description,
            "preview": t.preview,
            "is_default": t.id == DEFAULT_TEMPLATE_ID,
        }
        for t in TEMPLATES.values()
    ]
