"""
Unit tests for `ExcelService`.

These tests build small throwaway workbooks under pytest's `tmp_path`
fixture purely to exercise the service's parsing logic. They never touch
`backend/data/competition_questions.xlsx` - that file is provided by the
user and must never be created, modified, or assumed to exist by the app
or its tests.

NOTE: the real workbook has NO header row - every row is data, with the
question number/label in the first column and the question text in the
next non-empty column. Fixtures below mirror that shape.
"""

import os
from pathlib import Path

import pytest

from app.services.exceptions import (
    CategoryNotFoundError,
    ExcelWorkbookInvalidError,
    ExcelWorkbookNotFoundError,
)
from app.services.excel_service import ExcelService
from tests.helpers import bump_mtime as _bump_mtime
from tests.helpers import write_workbook as _write_workbook


def test_get_categories_before_explicit_load_auto_loads_on_first_access(tmp_path: Path) -> None:
    """
    Reads no longer require an explicit startup `load()` first - the
    auto-reload check makes a load attempt on first access too, so a
    missing workbook is reported with the specific
    `ExcelWorkbookNotFoundError` rather than a generic "not loaded" error.
    """
    service = ExcelService(tmp_path / "does-not-matter.xlsx")

    with pytest.raises(ExcelWorkbookNotFoundError):
        service.get_categories()


def test_load_missing_file_raises_not_found(tmp_path: Path) -> None:
    service = ExcelService(tmp_path / "missing.xlsx")

    with pytest.raises(ExcelWorkbookNotFoundError):
        service.load()

    assert service.is_loaded is False


def test_load_invalid_file_raises_invalid_error(tmp_path: Path) -> None:
    bad_file = tmp_path / "not-really-excel.xlsx"
    bad_file.write_text("this is not a zip/xlsx file")

    service = ExcelService(bad_file)

    with pytest.raises(ExcelWorkbookInvalidError):
        service.load()

    assert service.is_loaded is False


def test_categories_are_derived_from_arbitrary_sheet_names(tmp_path: Path) -> None:
    """
    No sheet name is hardcoded anywhere - numbers, multi-word titles, and
    arbitrary labels must all be discovered automatically, with an accurate
    per-sheet question count.
    """
    workbook_path = tmp_path / "workbook.xlsx"
    _write_workbook(
        workbook_path,
        {
            "30": [["Question 1", "Q1"], ["Question 2", "Q2"]],
            "Juz Amma Part 1": [["Question 1", "Q1"]],
            "Surah Baqarah": [
                ["Question 1", "Q1"],
                ["Question 2", "Q2"],
                ["Question 3", "Q3"],
                [None, None],  # blank row should not be counted as a question
            ],
        },
    )

    service = ExcelService(workbook_path)
    service.load()

    categories = {category.id: category for category in service.get_categories()}

    assert set(categories.keys()) == {"30", "Juz Amma Part 1", "Surah Baqarah"}
    assert categories["30"].question_count == 2
    assert categories["Juz Amma Part 1"].question_count == 1
    assert categories["Surah Baqarah"].question_count == 3

    # Response should serialize the count as camelCase `questionCount`.
    assert categories["30"].model_dump(by_alias=True)["questionCount"] == 2


def test_reload_picks_up_changes_after_file_appears(tmp_path: Path) -> None:
    """Simulates the workbook being added after a first failed load attempt."""
    workbook_path = tmp_path / "workbook.xlsx"
    service = ExcelService(workbook_path)

    with pytest.raises(ExcelWorkbookNotFoundError):
        service.load()

    _write_workbook(workbook_path, {"29": [["Question 1", "Q1"], ["Question 2", "Q2"]]})
    service.load()

    categories = service.get_categories()
    assert len(categories) == 1
    assert categories[0].id == "29"
    assert categories[0].question_count == 2


def test_get_questions_detects_number_and_text_without_fixed_columns(tmp_path: Path) -> None:
    """
    The question number may be a plain integer or a "Question N" label, and
    the text may live in any column as long as it's the first non-empty one
    after the number - no column name/position beyond that is assumed.
    """
    workbook_path = tmp_path / "workbook.xlsx"
    _write_workbook(
        workbook_path,
        {
            "30": [
                ["Question 1", "Arabic text one"],
                [2, "Arabic text two"],
                # An extra (e.g. translation) column after the text still
                # works - the FIRST non-empty one after the number wins.
                ["Question 3", "Arabic text three", "English translation three"],
            ],
        },
    )

    service = ExcelService(workbook_path)
    service.load()

    questions = service.get_questions("30")
    assert [q.question_number for q in questions] == [1, 2, 3]
    assert [q.text for q in questions] == [
        "Arabic text one",
        "Arabic text two",
        "Arabic text three",
    ]
    assert all(q.text == q.full_text for q in questions)
    assert all(q.category == "30" for q in questions)


def test_get_questions_falls_back_to_row_position_when_number_unparsable(
    tmp_path: Path,
) -> None:
    workbook_path = tmp_path / "workbook.xlsx"
    _write_workbook(workbook_path, {"28": [["N/A", "Only text, no parsable number"]]})

    service = ExcelService(workbook_path)
    service.load()

    questions = service.get_questions("28")
    assert len(questions) == 1
    assert questions[0].question_number == 1  # fallback: 1st parsed row


def test_get_questions_skips_rows_without_any_text(tmp_path: Path) -> None:
    workbook_path = tmp_path / "workbook.xlsx"
    _write_workbook(
        workbook_path,
        {"27": [["Question 1", "Text"], ["Question 2", None], [None, None]]},
    )

    service = ExcelService(workbook_path)
    service.load()

    questions = service.get_questions("27")
    assert len(questions) == 1
    assert questions[0].question_number == 1


def test_get_questions_unknown_category_raises(tmp_path: Path) -> None:
    workbook_path = tmp_path / "workbook.xlsx"
    _write_workbook(workbook_path, {"30": [["Question 1", "Text"]]})

    service = ExcelService(workbook_path)
    service.load()

    with pytest.raises(CategoryNotFoundError):
        service.get_questions("does-not-exist")


def test_get_categories_auto_reloads_when_file_changes_on_disk(tmp_path: Path) -> None:
    """
    The workbook may be edited (sheets added/removed/renamed) while the
    server keeps running - the next read should pick that up on its own,
    with no explicit reload call and no restart.
    """
    workbook_path = tmp_path / "workbook.xlsx"
    _write_workbook(workbook_path, {"30": [["Question 1", "Text"]]})

    service = ExcelService(workbook_path)
    service.load()
    assert {c.id for c in service.get_categories()} == {"30"}

    # Rewrite with a renamed/added sheet and bump the mtime so the change
    # is detected deterministically.
    _write_workbook(workbook_path, {"29": [["Question 1", "Text"]], "28": [["Question 1", "Text"]]})
    _bump_mtime(workbook_path)

    categories = service.get_categories()
    assert {c.id for c in categories} == {"29", "28"}


def test_get_categories_does_not_reread_when_file_is_unchanged(tmp_path: Path, monkeypatch) -> None:
    """Change detection should be cheap: no re-parse when the mtime hasn't moved."""
    workbook_path = tmp_path / "workbook.xlsx"
    _write_workbook(workbook_path, {"30": [["Question 1", "Text"]]})

    service = ExcelService(workbook_path)
    service.load()

    calls = {"count": 0}
    original_read = service._read_workbook

    def _tracking_read():
        calls["count"] += 1
        return original_read()

    monkeypatch.setattr(service, "_read_workbook", _tracking_read)

    service.get_categories()
    service.get_categories()

    assert calls["count"] == 0  # unchanged mtime -> no re-read triggered


def test_get_categories_auto_recovers_after_workbook_appears(tmp_path: Path) -> None:
    """A missing-then-added workbook should start working without a restart."""
    workbook_path = tmp_path / "workbook.xlsx"
    service = ExcelService(workbook_path)

    with pytest.raises(ExcelWorkbookNotFoundError):
        service.get_categories()

    _write_workbook(workbook_path, {"27": [["Question 1", "Text"]]})

    categories = service.get_categories()
    assert [c.id for c in categories] == ["27"]


def test_reload_forces_a_fresh_read_and_returns_category_count(tmp_path: Path) -> None:
    workbook_path = tmp_path / "workbook.xlsx"
    _write_workbook(workbook_path, {"30": [["Question 1", "Text"]], "29": [["Question 1", "Text"]]})

    service = ExcelService(workbook_path)
    service.load()

    _write_workbook(
        workbook_path,
        {"30": [["Question 1", "Text"]], "29": [["Question 1", "Text"]], "28": [["Question 1", "Text"]]},
    )
    _bump_mtime(workbook_path)

    category_count = service.reload()

    assert category_count == 3
    assert {c.id for c in service.get_categories()} == {"30", "29", "28"}


def test_reload_propagates_error_when_workbook_missing(tmp_path: Path) -> None:
    service = ExcelService(tmp_path / "missing.xlsx")

    with pytest.raises(ExcelWorkbookNotFoundError):
        service.reload()


def test_load_never_leaves_the_workbook_file_locked(tmp_path: Path) -> None:
    """
    Regression test for a real production bug: Excel reported a "Sharing
    violation" and refused to save the workbook while the backend was
    running, because a file handle opened by `pd.ExcelFile`/openpyxl was
    never explicitly closed and stayed open for as long as the process
    (and its in-memory cache) lived.

    This reproduces exactly what Excel's own save does on Windows -
    writing a new version to a temp file, then replacing the original in
    place via `os.replace` - which raises `PermissionError` (WinError 32,
    "The process cannot access the file because it is being used by
    another process") if anything still holds the original file open
    without delete-sharing. If `ExcelService` leaves any handle open after
    `load()`, this replace fails; if it correctly closes the file, it
    succeeds immediately, with no server restart involved.
    """
    workbook_path = tmp_path / "workbook.xlsx"
    _write_workbook(workbook_path, {"30": [["Question 1", "Text"]]})

    service = ExcelService(workbook_path)
    service.load()
    assert [c.id for c in service.get_categories()] == ["30"]  # sanity: data was actually parsed

    # Simulate "the user edits the workbook in Excel and presses Ctrl+S":
    # write the new content to a temp file, then atomically replace the
    # original - this is the exact operation that failed in production.
    replacement_path = tmp_path / "workbook.xlsx.tmp"
    _write_workbook(
        replacement_path,
        {"30": [["Question 1", "Text"]], "29": [["Question 1", "Text"]]},
    )
    os.replace(replacement_path, workbook_path)  # raises PermissionError if still locked
    _bump_mtime(workbook_path)  # deterministically trigger the change-detection reload below

    # And the backend should transparently pick up the new sheet - no
    # restart, no separate reload call required (see `_reload_if_workbook_changed`).
    assert {c.id for c in service.get_categories()} == {"30", "29"}


def test_load_never_leaves_the_workbook_file_locked_even_on_parse_error(tmp_path: Path, monkeypatch) -> None:
    """
    Same guarantee, but on the error path: the `finally: excel_file.close()`
    in `_read_workbook` must run (and release the OS file handle) even when
    parsing blows up partway through, not just on the happy path.
    """
    workbook_path = tmp_path / "workbook.xlsx"
    _write_workbook(workbook_path, {"30": [["Question 1", "Text"]]})

    def _boom(*_args: object, **_kwargs: object) -> None:
        raise ValueError("simulated parse failure")

    monkeypatch.setattr(ExcelService, "_parse_sheet", staticmethod(_boom))

    service = ExcelService(workbook_path)
    with pytest.raises(ValueError):
        service.load()

    # Even though loading failed, the file handle must already be
    # released - simulate Excel's save (write elsewhere, then replace).
    replacement_path = tmp_path / "workbook.xlsx.tmp"
    _write_workbook(replacement_path, {"29": [["Question 1", "Text"]]})
    os.replace(replacement_path, workbook_path)  # raises PermissionError if still locked
    _bump_mtime(workbook_path)  # deterministically trigger the change-detection reload below

    monkeypatch.undo()
    assert {c.id for c in service.get_categories()} == {"29"}
