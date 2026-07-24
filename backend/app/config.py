import os
from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    groq_api_key: str = os.getenv("GROQ_API_KEY", "")
    groq_primary_model: str = "openai/gpt-oss-20b"
    groq_context_model: str = "openai/gpt-oss-120b"
    groq_base_url: str = "https://api.groq.com/openai/v1"

    database_url: str = os.getenv(
        "DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/aivoa_qms"
    )

    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()