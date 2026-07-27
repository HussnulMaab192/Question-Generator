"""
Application configuration.

Settings are loaded from environment variables (and an optional `.env` file
in the `backend/` directory). See `.env.example` for the full list of
supported variables.
"""

from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Strongly-typed application settings."""

    # General
    app_name: str = "Quran Competition Question Generator API"
    app_env: str = "development"
    api_v1_prefix: str = "/api/v1"

    # Server (used by run scripts; not enforced by FastAPI itself)
    host: str = "0.0.0.0"
    port: int = 8000

    # CORS - comma-separated origins in the environment variable
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    # Storage
    data_dir: str = "data"

    # Name of the Excel workbook (inside `data_dir`) containing the
    # competition questions. Each sheet in this workbook is treated as a
    # selectable category - no sheet names are ever hardcoded.
    questions_workbook_filename: str = "competition_questions.xlsx"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def cors_origins_list(self) -> List[str]:
        """Return CORS origins as a clean list of strings."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def questions_workbook_path(self) -> Path:
        """Absolute-or-relative path to the questions workbook on disk."""
        return Path(self.data_dir) / self.questions_workbook_filename


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance (avoids re-parsing env on every call)."""
    return Settings()
