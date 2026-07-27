"""
Excel I/O service.

Reads the competition questions workbook and exposes its sheets as
dynamically-detected categories. No sheet name is ever hardcoded or
assumed to follow a particular format (numbers, "Juz ..." names, custom
titles - anything goes). Adding, renaming, or removing a sheet in the
workbook requires no code changes.

The workbook is loaded exactly once (during application startup, via
`ExcelService.load()`), then cached in memory for the lifetime of the
process. See `app.main`'s lifespan handler for where `load()` is called
and `app.api.deps.get_excel_service` for how the singleton is obtained.
"""

import logging
from functools import lru_cache
from pathlib import Path
from typing import Dict, List, Optional

import pandas as pd

from app.core.config import get_settings
from app.models.category import Category
from app.services.exceptions import (
    ExcelWorkbookInvalidError,
    ExcelWorkbookNotFoundError,
    ExcelWorkbookNotLoadedError,
)

logger = logging.getLogger(__name__)


class ExcelService:
    """Loads the questions workbook and derives category metadata from it."""

    def __init__(self, workbook_path: Path) -> None:
        self._workbook_path = workbook_path
        self._sheets: Optional[Dict[str, pd.DataFrame]] = None
        self._load_error: Optional[Exception] = None

    @property
    def workbook_path(self) -> Path:
        return self._workbook_path

    @property
    def is_loaded(self) -> bool:
        """Whether the workbook has been successfully loaded into memory."""
        return self._sheets is not None

    def load(self) -> None:
        """Read the workbook from disk and cache every sheet in memory.

        Intended to be called once, during application startup. Raises
        `ExcelWorkbookNotFoundError` / `ExcelWorkbookInvalidError` on failure
        (the error is also cached so later requests get a clear, consistent
        message without re-reading the file).
        """
        try:
            self._sheets = self._read_workbook()
            self._load_error = None
            logger.info(
                "Loaded questions workbook '%s' with %d sheet(s): %s",
                self._workbook_path,
                len(self._sheets),
                ", ".join(self._sheets.keys()),
            )
        except (ExcelWorkbookNotFoundError, ExcelWorkbookInvalidError) as exc:
            self._sheets = None
            self._load_error = exc
            logger.error("Failed to load questions workbook '%s': %s", self._workbook_path, exc)
            raise

    def get_categories(self) -> List[Category]:
        """Return one `Category` per detected sheet, in workbook order."""
        sheets = self._require_loaded_sheets()
        return [
            Category(id=sheet_name, name=sheet_name, question_count=self._count_questions(df))
            for sheet_name, df in sheets.items()
        ]

    # -- internal helpers -------------------------------------------------

    def _read_workbook(self) -> Dict[str, pd.DataFrame]:
        if not self._workbook_path.is_file():
            raise ExcelWorkbookNotFoundError(
                f"Questions workbook not found at '{self._workbook_path}'. "
                "Add the .xlsx file at that location (or update the "
                "DATA_DIR / QUESTIONS_WORKBOOK_FILENAME settings) and restart the server."
            )

        try:
            excel_file = pd.ExcelFile(self._workbook_path, engine="openpyxl")
        except Exception as exc:  # noqa: BLE001 - any parse failure means "invalid file"
            raise ExcelWorkbookInvalidError(
                f"Could not open '{self._workbook_path}' as an Excel workbook: {exc}"
            ) from exc

        if not excel_file.sheet_names:
            raise ExcelWorkbookInvalidError(
                f"Workbook '{self._workbook_path}' does not contain any sheets."
            )

        sheets: Dict[str, pd.DataFrame] = {}
        for sheet_name in excel_file.sheet_names:
            try:
                sheets[sheet_name] = excel_file.parse(sheet_name=sheet_name, header=0)
            except Exception as exc:  # noqa: BLE001
                raise ExcelWorkbookInvalidError(
                    f"Could not read sheet '{sheet_name}' in workbook "
                    f"'{self._workbook_path}': {exc}"
                ) from exc

        return sheets

    def _require_loaded_sheets(self) -> Dict[str, pd.DataFrame]:
        if self._sheets is not None:
            return self._sheets
        if self._load_error is not None:
            # Re-raise the original, more specific error (not found / invalid).
            raise self._load_error
        raise ExcelWorkbookNotLoadedError(
            "The questions workbook has not been loaded yet. "
            "This should happen automatically on application startup."
        )

    @staticmethod
    def _count_questions(sheet: pd.DataFrame) -> int:
        """Count non-empty data rows in a sheet.

        The exact question schema isn't defined yet, so "a question" is
        treated generically as any data row (below the header) that isn't
        entirely blank.
        """
        return int(sheet.dropna(how="all").shape[0])


@lru_cache
def get_excel_service() -> ExcelService:
    """Return the process-wide `ExcelService` singleton.

    Cached so every request/dependency injection reuses the same instance
    (and therefore the same in-memory workbook data) once `load()` has been
    called during startup.
    """
    settings = get_settings()
    return ExcelService(settings.questions_workbook_path)
