"""
Question generation service.

This is the intended home for the core business logic that generates
Quran competition questions. Left unimplemented on purpose - only the
interface is defined so the API layer has something stable to call.
"""

from typing import Any, Optional

from app.services.excel_service import ExcelService, get_excel_service


class QuestionService:
    """Generates competition questions from source data."""

    def __init__(self, excel_service: Optional[ExcelService] = None) -> None:
        self.excel_service = excel_service or get_excel_service()

    def generate_questions(self, *args: Any, **kwargs: Any) -> Any:
        """TODO: Implement question-generation business logic."""
        raise NotImplementedError("Question generation logic is not implemented yet.")
