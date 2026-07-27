"""Schemas describing selectable question categories.

A "category" maps 1:1 to a sheet in the questions workbook. Sheet names are
never known ahead of time (no Juz numbers or names are hardcoded anywhere)
- they are discovered dynamically by `ExcelService`.
"""

from app.models.common import CamelModel


class Category(CamelModel):
    """A single selectable category, derived from one workbook sheet."""

    id: str
    """Stable identifier for the category. Currently the raw sheet name."""

    name: str
    """Human-readable display name (currently identical to the sheet name)."""

    question_count: int
    """Number of question rows detected in the sheet."""
