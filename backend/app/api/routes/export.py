from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from app.schemas.resume import Resume
from jinja2 import Environment, FileSystemLoader
from xhtml2pdf import pisa
import io
import os

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
        return (data.replace('–', '-')
                    .replace('—', '-')
                    .replace('•', '')
                    .replace('’', "'")
                    .replace('‘', "'")
                    .replace('“', '"')
                    .replace('”', '"')
                    .replace('\u200b', '')
                    .replace('…', '...'))
    return data

@router.post("/pdf")
async def export_pdf(resume: Resume):
    try:
        template = env.get_template('classic.html')
        sanitized_data = sanitize_text(resume.model_dump())
        html_out = template.render(resume=sanitized_data)
        
        result_file = io.BytesIO()
        pisa_status = pisa.CreatePDF(html_out, dest=result_file, encoding='utf-8')
        
        if pisa_status.err:
            raise Exception("PDF generation failed")
            
        return Response(content=result_file.getvalue(), media_type="application/pdf")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
