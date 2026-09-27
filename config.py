import os
from typing import Optional, Literal
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    # App Configuration
    APP_NAME: str = "Code Review Agent"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    PORT: int = int(os.getenv("PORT", 8000))
    HOST: str = os.getenv("HOST", "0.0.0.0")

    # Assistant Mode
    ASSISTANT_MODE: Literal["mock", "openai", "azure", "anthropic"] = os.getenv(
        "ASSISTANT_MODE", "openai"
    )

    # OpenAI Configuration
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    OPENAI_TEMPERATURE: float = float(os.getenv("OPENAI_TEMPERATURE", 0.1))
    OPENAI_MAX_TOKENS: int = int(os.getenv("OPENAI_MAX_TOKENS", 2000))

    # URL Scanner Settings
    ENABLE_ADVANCED_SCAN: bool = os.getenv("ENABLE_ADVANCED_SCAN", "False").lower() == "true"
    SCAN_TIMEOUT: int = int(os.getenv("SCAN_TIMEOUT", 30))

    # Default Language
    DEFAULT_LANGUAGE: str = os.getenv("DEFAULT_LANGUAGE", "python")

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()