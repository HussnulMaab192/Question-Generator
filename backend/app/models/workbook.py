"""Schemas describing the questions workbook itself (not its contents)."""

from datetime import datetime
from typing import Literal, Optional

from app.models.common import CamelModel


class WorkbookInfo(CamelModel):
    """Snapshot of the currently loaded questions workbook, for the Admin page."""

    filename: str
    last_modified: datetime
    category_count: int
    total_questions: int
    # Set when the Admin upload endpoint last replaced the workbook.
    uploaded_at: Optional[datetime] = None
    status: Literal["loaded", "missing"] = "loaded"
