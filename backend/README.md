# Resume Builder AI Agent

A FastAPI-based backend for an AI-powered resume builder.

## Architecture

- **FastAPI**: Main web framework
- **Pydantic**: Data validation and models
- **Anthropic Claude API**: LLM provider for the agent steps
- **Streamlit**: Frontend UI

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

4. Run the API:
   ```bash
   uvicorn app.main:app --reload
   ```
