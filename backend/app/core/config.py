"""
Application configuration.

Settings are loaded from environment variables (and an optional `.env` file
in the `backend/` directory). See `.env.example` for the full list of
supported variables.
"""

from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# `backend/` — resolved from this file (`backend/app/core/config.py`) so
# relative `DATA_DIR` paths stay correct even when the process cwd differs
# (e.g. cloud hosts starting uvicorn from a monorepo root).
_BACKEND_ROOT = Path(__file__).resolve().parents[2]


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

    @field_validator("questions_workbook_filename")
    @classmethod
    def _filename_must_be_basename_only(cls, value: str) -> str:
        """Store only a plain file name so the workbook can never escape `data_dir`."""
        cleaned = Path(value).name
        if not cleaned or cleaned in {".", ".."}:
            raise ValueError("QUESTIONS_WORKBOOK_FILENAME must be a plain file name.")
        return cleaned

    @property
    def cors_origins_list(self) -> List[str]:
        """Return CORS origins as a clean list of strings."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def data_dir_path(self) -> Path:
        """Absolute path to the data directory (cwd-independent)."""
        configured = Path(self.data_dir)
        if configured.is_absolute():
            return configured.resolve()
        return (_BACKEND_ROOT / configured).resolve()

    @property
    def questions_workbook_path(self) -> Path:
        """Absolute path to the questions workbook, confined under `data_dir`."""
        data_root = self.data_dir_path
        # Basename-only (enforced by the validator) — join cannot escape data_root.
        path = (data_root / self.questions_workbook_filename).resolve()
        if not path.is_relative_to(data_root):
            raise ValueError(
                f"Questions workbook path '{path}' escapes data directory '{data_root}'."
            )
        return path


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance (avoids re-parsing env on every call)."""
    return Settings()
