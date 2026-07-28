"""
Excel I/O service.

Reads the competition questions workbook and exposes its sheets as
dynamically-detected categories, plus the parsed questions within each
sheet. No sheet name, column name, or column position is ever hardcoded -
adding, renaming, or removing a sheet (or adding extra columns) requires
no code changes.

Workbook shape (as provided): each sheet has NO header row - every row is
data. The first column holds the question's number/label (e.g.
"Question 1", or a plain "1"); the next non-empty cell after it is the
question's text. See `_extract_question_number` / `_extract_question_text`
for the generic, column-name-agnostic detection logic.

The workbook is first loaded during application startup (via
`ExcelService.load()`), then cached in memory - but that cache is never
permanent: every read checks the file's modification timestamp and
transparently reloads if it has changed, so sheets added/removed/renamed
in Excel (or the file appearing/disappearing) are picked up automatically,
without restarting the server. `POST /api/v1/reload` (see
`app.api.routes.reload`) additionally lets the frontend force an immediate
reload and report how many categories were found. See `app.main`'s
lifespan handler for where the initial `load()` happens and
`get_excel_service` for how the singleton is obtained.

IMPORTANT (Windows file locking): the workbook file itself is NEVER kept
open. `_read_workbook` opens it only long enough to copy bytes into memory,
closes that OS handle immediately, then parses from a `BytesIO` buffer and
closes the in-memory `ExcelFile` in a `finally` block — only plain
`Question` objects are cached, never an openpyxl/`pandas` file handle.
Admin uploads write to a temp file, close it, validate from memory, then
`Path.replace` the live workbook (with retries) so Excel/antivirus locks
surface as a clear HTTP 409 instead of a 500.
"""

import errno
import logging
import os
import re
import time
from datetime import datetime, timezone
from functools import lru_cache
from io import BytesIO
from pathlib import Path
from typing import Dict, List, Optional, Sequence

import pandas as pd

from app.core.config import get_settings
from app.models.category import Category
from app.models.question import Question
from app.models.workbook import WorkbookInfo
from app.services.exceptions import (
    CategoryNotFoundError,
    ExcelWorkbookInUseError,
    ExcelWorkbookInvalidError,
    ExcelWorkbookNotFoundError,
    ExcelWorkbookNotLoadedError,
)

logger = logging.getLogger(__name__)

_QUESTION_NUMBER_PATTERN = re.compile(r"(\d+)")

# Sentinel distinct from any real mtime (a float) or "file missing" (None),
# so the very first change-detection check always triggers a load attempt.
_NEVER_ATTEMPTED = object()

# Windows-safe replace: another process (Excel, antivirus, Explorer preview)
# may briefly hold the destination. Retry before surfacing a clear 409.
_REPLACE_MAX_ATTEMPTS = 5
_REPLACE_RETRY_DELAY_SECONDS = 0.25
_WORKBOOK_IN_USE_MESSAGE = (
    "The workbook is currently in use by another application. "
    "Close Microsoft Excel (or any program using the file) and try again."
)


class ExcelService:
    """Loads the questions workbook and derives categories/questions from it."""

    def __init__(self, workbook_path: Path) -> None:
        self._workbook_path = workbook_path
        self._questions_by_category: Optional[Dict[str, List[Question]]] = None
        self._load_error: Optional[Exception] = None
        # mtime observed at the last load *attempt* (success or failure) -
        # compared against the file's current mtime to detect changes.
        self._observed_mtime: object = _NEVER_ATTEMPTED

    @property
    def workbook_path(self) -> Path:
        return self._workbook_path

    @property
    def is_loaded(self) -> bool:
        """Whether the workbook has been successfully loaded into memory."""
        return self._questions_by_category is not None

    def load(self) -> None:
        """Read the workbook from disk and parse every sheet into memory.

        Called during application startup, and again automatically
        whenever `_reload_if_workbook_changed` detects the file's
        modification timestamp has changed. Raises
        `ExcelWorkbookNotFoundError` / `ExcelWorkbookInvalidError` on failure
        (the error is also cached so later requests get a clear, consistent
        message without re-reading the file).
        """
        self._observed_mtime = self._current_mtime()
        try:
            self._questions_by_category = self._read_workbook()
            self._load_error = None
            logger.info(
                "Loaded questions workbook '%s' with %d sheet(s): %s",
                self._workbook_path,
                len(self._questions_by_category),
                ", ".join(self._questions_by_category.keys()),
            )
        except (ExcelWorkbookNotFoundError, ExcelWorkbookInvalidError) as exc:
            self._questions_by_category = None
            self._load_error = exc
            logger.error("Failed to load questions workbook '%s': %s", self._workbook_path, exc)
            raise

    def reload(self) -> int:
        """Force a fresh read of the workbook from disk right now.

        Used by `POST /api/v1/reload` so an examiner can pick up
        added/removed/renamed sheets immediately after editing the file,
        without waiting for the next incidental request or restarting the
        server. Returns the number of categories found. Raises the same
        errors as `load()` if the file is missing/invalid.
        """
        self.load()
        return len(self._questions_by_category or {})

    def get_categories(self) -> List[Category]:
        """Return one `Category` per detected sheet, in workbook order."""
        self._reload_if_workbook_changed()
        questions_by_category = self._require_loaded()
        return [
            Category(id=category_id, name=category_id, question_count=len(questions))
            for category_id, questions in questions_by_category.items()
        ]

    def get_questions(self, category_id: str) -> List[Question]:
        """Return every parsed question for one category (sheet), in order.

        Raises `CategoryNotFoundError` if `category_id` doesn't exist.
        """
        self._reload_if_workbook_changed()
        questions_by_category = self._require_loaded()
        try:
            questions = questions_by_category[category_id]
        except KeyError as exc:
            raise CategoryNotFoundError(
                f"Category '{category_id}' was not found in the workbook."
            ) from exc
        return list(questions)  # defensive copy - callers must not mutate our cache

    def get_workbook_info(self) -> WorkbookInfo:
        """Snapshot of the currently loaded workbook, for the Admin page."""
        self._reload_if_workbook_changed()
        questions_by_category = self._require_loaded()

        mtime = self._current_mtime()
        last_modified = (
            datetime.fromtimestamp(mtime, tz=timezone.utc) if mtime is not None else datetime.now(timezone.utc)
        )

        return WorkbookInfo(
            filename=self._workbook_path.name,
            last_modified=last_modified,
            category_count=len(questions_by_category),
            total_questions=sum(len(questions) for questions in questions_by_category.values()),
        )

    def replace_workbook_file(self, content: bytes) -> WorkbookInfo:
        """Atomically replace the workbook on disk with `content`, then reload it.

        Used by `POST /api/v1/admin/upload-workbook`. Flow (Windows-safe):

        1. Write uploaded bytes to a sibling temp file and fully close it.
        2. Validate by parsing that temp file into memory (no handle left open).
        3. Only then replace the real workbook via `Path.replace`, retrying if
           another process still holds the destination (Excel, antivirus, …).
        4. Reload this service's in-memory cache from the new file.

        A bad upload never touches the live workbook. If the destination stays
        locked after all retries, raises `ExcelWorkbookInUseError` (mapped to
        HTTP 409 by the admin route) without returning a 500.
        """
        self._workbook_path.parent.mkdir(parents=True, exist_ok=True)
        temp_path = self._workbook_path.with_name(self._workbook_path.name + ".upload-tmp")

        # Explicit open → write → flush → close so no temp handle remains
        # before we validate or attempt the replace.
        with open(temp_path, "wb") as temp_file:
            temp_file.write(content)
            temp_file.flush()
            os.fsync(temp_file.fileno())

        try:
            # Validate on a throwaway instance - reuses `_read_workbook`
            # (bytes-into-memory, then close), without touching this service's
            # own cached state until we know the upload is actually good.
            ExcelService(temp_path)._read_workbook()  # noqa: SLF001 - same class, intentional reuse
        except Exception:
            temp_path.unlink(missing_ok=True)
            raise

        try:
            self._replace_with_retries(temp_path, self._workbook_path)
        except ExcelWorkbookInUseError:
            temp_path.unlink(missing_ok=True)
            raise

        self.load()
        return self.get_workbook_info()

    # -- internal helpers -------------------------------------------------

    def _replace_with_retries(self, source: Path, destination: Path) -> None:
        """Replace `destination` with `source`, retrying transient Windows locks.

        Uses `pathlib.Path.replace` (backed by `os.replace`). If another
        application still holds the destination open, Windows returns
        WinError 5 / 32 — retry a few times, then raise
        `ExcelWorkbookInUseError` so the API can return HTTP 409.
        """
        last_error: Optional[OSError] = None
        for attempt in range(1, _REPLACE_MAX_ATTEMPTS + 1):
            try:
                source.replace(destination)
                return
            except OSError as exc:
                if not self._is_file_in_use_error(exc):
                    raise
                last_error = exc
                logger.warning(
                    "Workbook replace attempt %d/%d failed (%s); retrying in %.0f ms",
                    attempt,
                    _REPLACE_MAX_ATTEMPTS,
                    exc,
                    _REPLACE_RETRY_DELAY_SECONDS * 1000,
                )
                if attempt < _REPLACE_MAX_ATTEMPTS:
                    time.sleep(_REPLACE_RETRY_DELAY_SECONDS)

        raise ExcelWorkbookInUseError(_WORKBOOK_IN_USE_MESSAGE) from last_error

    @staticmethod
    def _is_file_in_use_error(exc: OSError) -> bool:
        """Whether `exc` looks like a locked/in-use file on Windows or POSIX."""
        if isinstance(exc, PermissionError):
            return True
        winerror = getattr(exc, "winerror", None)
        if winerror in (5, 32):  # ERROR_ACCESS_DENIED, ERROR_SHARING_VIOLATION
            return True
        return getattr(exc, "errno", None) in {errno.EACCES, errno.EPERM, errno.EBUSY}

    def _read_workbook(self) -> Dict[str, List[Question]]:
        """Read the workbook, parse every sheet, then hand back plain
        `Question` objects - and nothing else.

        Critical Windows behavior: never leave an OS file handle open on the
        `.xlsx` path. We open the file only long enough to copy its bytes into
        memory, close that handle immediately, then parse from a `BytesIO`
        buffer. `pd.ExcelFile` / openpyxl therefore never hold a lock on the
        real path — which is what previously caused Excel "Sharing violation"
        / `os.replace` WinError 5 when the destination was still locked by us
        or by another app. The `try`/`finally` around `excel_file.close()`
        still runs so any temporary openpyxl resources are released; only
        plain Python objects are cached afterward.
        """
        if not self._workbook_path.is_file():
            raise ExcelWorkbookNotFoundError(
                f"Questions workbook not found at '{self._workbook_path}'. "
                "Add the .xlsx file at that location (or update the "
                "DATA_DIR / QUESTIONS_WORKBOOK_FILENAME settings) and restart the server."
            )

        try:
            with open(self._workbook_path, "rb") as file_handle:
                raw_bytes = file_handle.read()
        except OSError as exc:
            raise ExcelWorkbookInvalidError(
                f"Could not read '{self._workbook_path}' as an Excel workbook: {exc}"
            ) from exc

        # Path handle is fully closed here — parse purely from memory.
        try:
            excel_file = pd.ExcelFile(BytesIO(raw_bytes), engine="openpyxl")
        except Exception as exc:  # noqa: BLE001 - any parse failure means "invalid file"
            raise ExcelWorkbookInvalidError(
                f"Could not open '{self._workbook_path}' as an Excel workbook: {exc}"
            ) from exc

        try:
            if not excel_file.sheet_names:
                raise ExcelWorkbookInvalidError(
                    f"Workbook '{self._workbook_path}' does not contain any sheets."
                )

            questions_by_category: Dict[str, List[Question]] = {}
            for sheet_name in excel_file.sheet_names:
                try:
                    # No header row in this workbook - every row is data, so we
                    # parse with header=None and never rely on column names.
                    sheet = excel_file.parse(sheet_name=sheet_name, header=None)
                except Exception as exc:  # noqa: BLE001
                    raise ExcelWorkbookInvalidError(
                        f"Could not read sheet '{sheet_name}' in workbook "
                        f"'{self._workbook_path}': {exc}"
                    ) from exc

                questions_by_category[sheet_name] = self._parse_sheet(sheet_name, sheet)
        finally:
            # Always release openpyxl/pandas resources tied to the in-memory
            # buffer. By this point we've either converted everything into
            # plain `Question` objects or we're propagating an error; either
            # way, nothing further should read from `excel_file`.
            excel_file.close()

        return questions_by_category

    @classmethod
    def _parse_sheet(cls, category_id: str, sheet: pd.DataFrame) -> List[Question]:
        """Turn one sheet's raw rows into a list of `Question` objects.

        A row becomes a question only if some text can be found after its
        first cell (the question number/label). Fully blank rows, or rows
        with a number but no text, are silently skipped rather than
        crashing - this keeps the app usable even with minor spreadsheet
        formatting quirks.
        """
        questions: List[Question] = []
        for row_position, row in enumerate(sheet.itertuples(index=False, name=None), start=1):
            if not row:
                continue

            text = cls._extract_question_text(row[1:])
            if text is None:
                continue

            question_number = cls._extract_question_number(row[0], fallback=row_position)
            questions.append(
                Question(
                    category=category_id,
                    question_number=question_number,
                    text=text,
                    full_text=text,
                )
            )

        return questions

    @staticmethod
    def _extract_question_number(value: object, fallback: int) -> int:
        """Pull a question number out of the first cell.

        Handles plain numbers (`1`), labels (`"Question 1"`), or anything
        else containing digits. Falls back to the row's position among
        parsed questions if no digits can be found, so a question is never
        dropped just because its number is unparsable.
        """
        if not pd.isna(value):
            match = _QUESTION_NUMBER_PATTERN.search(str(value))
            if match:
                return int(match.group(1))
        return fallback

    @staticmethod
    def _extract_question_text(remaining_cells: Sequence[object]) -> Optional[str]:
        """Return the first non-empty text cell after the question number.

        No column name or fixed position is assumed beyond "comes after
        the number column" - if more columns are appended to the sheet
        later (e.g. a translation or reference column), this keeps working
        unchanged as long as the question text remains the first non-empty
        one among them.
        """
        for value in remaining_cells:
            if pd.isna(value):
                continue
            text = str(value).strip()
            if text:
                return text
        return None

    def _current_mtime(self) -> Optional[float]:
        """The workbook file's current modification time, or `None` if it
        doesn't exist right now."""
        try:
            return self._workbook_path.stat().st_mtime
        except OSError:
            return None

    def _reload_if_workbook_changed(self) -> None:
        """Auto-reload when the workbook file has changed since our last
        load attempt.

        Compares modification timestamps rather than re-parsing on every
        request, so this stays cheap: it's just an `os.stat()` call unless
        something actually changed. Covers every case a client cares
        about - the file being edited (sheets added/removed/renamed), newly
        created after having been missing, or deleted after having been
        loaded - so nothing here is ever cached forever.
        """
        current_mtime = self._current_mtime()
        if current_mtime != self._observed_mtime:
            self.load()

    def _require_loaded(self) -> Dict[str, List[Question]]:
        if self._questions_by_category is not None:
            return self._questions_by_category
        if self._load_error is not None:
            # Re-raise the original, more specific error (not found / invalid).
            raise self._load_error
        raise ExcelWorkbookNotLoadedError(
            "The questions workbook has not been loaded yet. "
            "This should happen automatically on application startup."
        )


@lru_cache
def get_excel_service() -> ExcelService:
    """Return the process-wide `ExcelService` singleton.

    Cached so every request/dependency injection reuses the same instance
    (and therefore the same in-memory workbook data) once `load()` has been
    called during startup.
    """
    settings = get_settings()
    return ExcelService(settings.questions_workbook_path)
