"""
Unit tests for `QuestionService` - the random-selection business logic
that sits between the API layer and `ExcelService`.
"""

from pathlib import Path

import pytest
from openpyxl import Workbook

from app.models.question import CategorySelection
from app.services.exceptions import CategoryNotFoundError, InsufficientQuestionsError
from app.services.excel_service import ExcelService
from app.services.question_history import QuestionHistoryCache
from app.services.question_service import QuestionService


def _write_workbook(path: Path, sheets: dict[str, list[list[object]]]) -> None:
    workbook = Workbook()
    workbook.remove(workbook.active)
    for sheet_name, rows in sheets.items():
        sheet = workbook.create_sheet(title=sheet_name)
        for row in rows:
            sheet.append(row)
    path.parent.mkdir(parents=True, exist_ok=True)
    workbook.save(path)


def _make_service(tmp_path: Path, sheets: dict[str, list[list[object]]]) -> QuestionService:
    workbook_path = tmp_path / "workbook.xlsx"
    _write_workbook(workbook_path, sheets)
    excel_service = ExcelService(workbook_path)
    excel_service.load()
    # Fresh history per test so the process-wide singleton cannot leak state.
    return QuestionService(excel_service, history=QuestionHistoryCache())


def test_generate_questions_success(tmp_path: Path) -> None:
    service = _make_service(
        tmp_path,
        {
            "30": [[f"Question {i}", f"Text {i}"] for i in range(1, 6)],
            "28": [[f"Question {i}", f"Text {i}"] for i in range(1, 4)],
        },
    )

    result = service.generate_questions(
        [CategorySelection(id="30", count=2), CategorySelection(id="28", count=1)]
    )

    assert len(result) == 3
    assert sum(1 for q in result if q.category == "30") == 2
    assert sum(1 for q in result if q.category == "28") == 1
    assert all(q.text == q.full_text for q in result)


def test_generate_questions_never_returns_duplicates_within_a_category(tmp_path: Path) -> None:
    total_available = 8
    service = _make_service(
        tmp_path,
        {"30": [[f"Question {i}", f"Text {i}"] for i in range(1, total_available + 1)]},
    )

    # Run several times to reduce the chance a flaky/incorrect
    # implementation happens to look correct once.
    for _ in range(20):
        result = service.generate_questions([CategorySelection(id="30", count=total_available - 1)])
        numbers = [q.question_number for q in result]
        assert len(numbers) == len(set(numbers)), "duplicate question returned"
        assert len(result) == total_available - 1


def test_generate_questions_requesting_all_available_returns_every_question_once(
    tmp_path: Path,
) -> None:
    service = _make_service(
        tmp_path, {"30": [[f"Question {i}", f"Text {i}"] for i in range(1, 6)]}
    )

    result = service.generate_questions([CategorySelection(id="30", count=5)])

    assert {q.question_number for q in result} == {1, 2, 3, 4, 5}


def test_generate_questions_exceeding_available_raises_insufficient(tmp_path: Path) -> None:
    service = _make_service(tmp_path, {"30": [[f"Question {i}", f"Text {i}"] for i in range(1, 4)]})

    with pytest.raises(InsufficientQuestionsError) as exc_info:
        service.generate_questions([CategorySelection(id="30", count=10)])

    message = str(exc_info.value)
    assert "30" in message
    assert "3" in message
    assert "10" in message


def test_generate_questions_unknown_category_raises_not_found(tmp_path: Path) -> None:
    service = _make_service(tmp_path, {"30": [["Question 1", "Text 1"]]})

    with pytest.raises(CategoryNotFoundError):
        service.generate_questions([CategorySelection(id="does-not-exist", count=1)])
