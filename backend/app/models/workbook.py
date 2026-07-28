"""Schemas describing the questions workbook itself (not its contents)."""

from datetime import datetime

from app.models.common import CamelModel


class WorkbookInfo(CamelModel):
    """Snapshot of the currently loaded questions workbook, for the Admin page."""

    filename: str
    last_modified: datetime
    category_count: int
    total_questions: int
