from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    llm_provider: str = "groq"
    groq_api_key: str = ""
    groq_model: str = "llama3-8b-8192"
    openai_api_key: str = ""
    openai_model: str = "gpt-4o"
    mongo_uri: str = "mongodb+srv://learn-ai-cluster.cysix8c.mongodb.net/?appName=learn-ai-cluster"
    
    model_config = {
        "env_file": ".env",
        "extra": "ignore"
    }

settings = Settings()
