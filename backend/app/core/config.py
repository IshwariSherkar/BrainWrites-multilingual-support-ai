from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import Field, validator
import json
from pathlib import Path

class Settings(BaseSettings):
    APP_NAME: str = "Major Project"
    ENV: str = "development"
    DEBUG: bool = True
    API_PREFIX: str = "/api/v1"

    # MongoDB
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "Major_Project"

    # JWT
    SECRET_KEY: str = "your-super-secret-key"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"

    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:5173"]

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"
    LOG_FILE_PATH: Optional[Path] = None
    ENABLE_FILE_LOGGING: bool = False
    ENABLE_CONSOLE_LOGGING: bool = True

    # Groq AI Agent
    GROQ_API_KEY: str = ""

    # Gmail
    GMAIL_ADDRESS: str = ""
    GMAIL_APP_PASSWORD: str = ""

    # Clerk Auth
    CLERK_SECRET_KEY: str = ""

    # Digest Scheduler
    DIGEST_TIME: str = "09:00"

    @validator("ALLOWED_ORIGINS", pre=True)
    def parse_allowed_origins(cls, v):
        if isinstance(v, str):
            return json.loads(v)
        return v

    @validator("LOG_FILE_PATH", pre=True)
    def validate_log_path(cls, v, values):
        if values.get("ENABLE_FILE_LOGGING", False):
            if not v:
                raise ValueError(
                    "LOG_FILE_PATH must be set when ENABLE_FILE_LOGGING is True"
                )
            path = Path(v)
            path.parent.mkdir(parents=True, exist_ok=True)
            return path
        return v

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()