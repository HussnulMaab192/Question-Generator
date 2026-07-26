"""
Question generation service.

This is the intended home for the core business logic that generates
Quran competition questions. Left unimplemented on purpose - only the
interface is defined so the API layer has something stable to call.
"""

from typing import Any

from app.services.excel_service import ExcelService


class QuestionService:
    """Generates competition questions from source data."""

    def __init__(self, excel_service: ExcelService | None = None) -> None:
        self.excel_service = excel_service or ExcelService()

    def generate_questions(self, *args: Any, **kwargs: Any) -> Any:
        """TODO: Implement question-generation business logic."""
        raise NotImplementedError("Question generation logic is not implemented yet.")
