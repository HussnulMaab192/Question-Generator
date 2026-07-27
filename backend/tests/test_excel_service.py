"""
Unit tests for `ExcelService`.

These tests build small throwaway workbooks under pytest's `tmp_path`
fixture purely to exercise the service's parsing logic. They never touch
`backend/data/competition_questions.xlsx` - that file is provided by the
user and must never be created, modified, or assumed to exist by the app
or its tests.
"""

from pathlib import Path

import pytest
from openpyxl import Workbook

from app.services.excel_service import ExcelService
from app.services.exceptions import (
    ExcelWorkbookInvalidError,
    ExcelWorkbookNotFoundError,
    ExcelWorkbookNotLoadedError,
)


def _write_workbook(path: Path, sheets: dict[str, list[list[object]]]) -> None:
    """Write a workbook with arbitrary sheet names/rows for test purposes."""
    workbook = Workbook()
    workbook.remove(workbook.active)
    for sheet_name, rows in sheets.items():
        sheet = workbook.create_sheet(title=sheet_name)
        for row in rows:
            sheet.append(row)
    path.parent.mkdir(parents=True, exist_ok=True)
    workbook.save(path)


def test_get_categories_before_load_raises_not_loaded(tmp_path: Path) -> None:
    service = ExcelService(tmp_path / "does-not-matter.xlsx")

    with pytest.raises(ExcelWorkbookNotLoadedError):
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
            "30": [["Question", "Answer"], ["Q1", "A1"], ["Q2", "A2"]],
            "Juz Amma Part 1": [["Question", "Answer"], ["Q1", "A1"]],
            "Surah Baqarah": [
                ["Question", "Answer"],
                ["Q1", "A1"],
                ["Q2", "A2"],
                ["Q3", "A3"],
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

    _write_workbook(workbook_path, {"29": [["Question"], ["Q1"], ["Q2"]]})
    service.load()

    categories = service.get_categories()
    assert len(categories) == 1
    assert categories[0].id == "29"
    assert categories[0].question_count == 2
