# Resume Builder AI Agent

FastAPI backend for an AI-powered resume builder. The React frontend lives in `../frontend`.

## Architecture

- **FastAPI + Pydantic**: API and the Resume JSON schema (the source of truth)
- **Groq / OpenAI LLM**: agent steps — parse, write, match, score, review, interview
- **MongoDB (Motor)**: user-saved version history only (parsed uploads are returned, never persisted)
- **Jinja2 + xhtml2pdf**: PDF export (classic / modern / minimal templates)
- **python-docx**: ATS-friendly single-column DOCX export (format-matched to the PDFs)
- **Frontend**: React 19 + Vite + Redux Toolkit + Tailwind (`../frontend`)

## Design principles

- **No invented experience.** Prompts forbid inferring facts (parser, writer, clarifier, matcher), and
  `app/services/fact_guard.py` rejects generated text whose numbers do not appear in the user's own data —
  bullet rewrites fall back to the original; summary/cover letter retry once with explicit feedback.
- **Data and design stay separate.** The LLM only edits the Resume JSON; Jinja templates and python-docx
  own the layout. Changing a template never touches the agents, and vice versa.
- **ATS-friendly output.** Single-column layout, standard headings, no images or complex tables in PDF/DOCX
  (enforced by `tests/test_renderer.py`).
- **Privacy by default.** No resume content in logs (filenames aren't logged either), parsed uploads are
  not stored, only user-initiated versions are saved, and errors go back to clients as generic messages.
- **Test against messy input.** `tests/test_parser.py` builds multi-column/table/unicode PDFs and DOCX
  fixtures (drop your own real resumes into `tests/sample_resumes/` — they are picked up automatically).

## Getting Started

1. Navigate to the backend directory, create a virtual environment, and activate it:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```

2. Install requirements:
   ```bash
   pip install -r requirements.txt
   ```

3. Setup environment variables:
   Copy `.env.example` to `.env` and fill in your keys.
   ```bash
   cp .env.example .env
   ```
   Required: `GROQ_API_KEY`. Optional: `MONGO_URI` (defaults to local
   `mongodb://localhost:27017`), `CORS_ORIGINS` (JSON array), `LLM_PROVIDER`,
   `OPENAI_API_KEY` / `OPENAI_MODEL`.

4. Run the API:
   ```bash
   uvicorn app.main:app --reload
   ```

5. Run the frontend (separate terminal):
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

## API overview

| Group | Endpoints |
|-------|-----------|
| `/api/resume` | `POST /upload` (max 10 MB), `POST /versions/save`, `GET /versions/{session_id}`, `GET /versions/load/{version_id}` |
| `/api/tailor` | `POST /rewrite-bullets`, `/generate-summary`, `/cover-letter`, `/chat-edit` |
| `/api/analyze` | `POST /pipeline` (JD → matcher → ATS → gap → review), `/ats-score`, `/jd`, `/gap-report`, `/review` |
| `/api/interview` | `POST /questions` |
| `/api/export` | `GET /templates`, `POST /pdf`, `POST /docx` |
| `/api/job` | `POST /submit` |

## Tests

```bash
cd backend
python tests/test_template_parity.py        # PDF/DOCX content parity, all templates
python tests/test_chat_edit_preserve.py     # chat-edit must not drop contact fields
python tests/test_parser.py                 # text extraction from messy PDF/DOCX layouts
python tests/test_fact_guard.py             # hallucinated numbers are rejected/retried
python tests/test_renderer.py               # ATS structure: no images, standard headings
```

## Security notes

- Server errors return a generic message; details are logged server-side only
- Uploads are capped at 10 MB, request bodies at 20 MB (413)
- MongoDB host and CORS origins come from environment variables, never code
