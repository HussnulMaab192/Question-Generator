"""
Integration tests for `POST /api/v1/generate`.

Covers the full HTTP contract: successful generation, the 400 error paths
for an unknown category and for requesting more questions than exist, and
request-body validation (empty category list / non-positive count).
"""

from pathlib import Path

from fastapi.testclient import TestClient
from openpyxl import Workbook

from app.main import app
from app.services.excel_service import ExcelService
from app.services.question_service import QuestionService, get_question_service

client = TestClient(app)


def _write_workbook(path: Path, sheets: dict[str, list[list[object]]]) -> None:
    workbook = Workbook()
    workbook.remove(workbook.active)
    for sheet_name, rows in sheets.items():
        sheet = workbook.create_sheet(title=sheet_name)
        for row in rows:
            sheet.append(row)
    path.parent.mkdir(parents=True, exist_ok=True)
    workbook.save(path)


def _override_with(tmp_path: Path, sheets: dict[str, list[list[object]]]) -> None:
    workbook_path = tmp_path / "workbook.xlsx"
    _write_workbook(workbook_path, sheets)
    excel_service = ExcelService(workbook_path)
    excel_service.load()
    app.dependency_overrides[get_question_service] = lambda: QuestionService(excel_service)


def test_generate_endpoint_success(tmp_path: Path) -> None:
    _override_with(
        tmp_path,
        {
            "30": [[f"Question {i}", f"Text {i}"] for i in range(1, 6)],
            "28": [[f"Question {i}", f"Text {i}"] for i in range(1, 4)],
        },
    )

    try:
        response = client.post(
            "/api/v1/generate",
            json={"categories": [{"id": "30", "count": 2}, {"id": "28", "count": 1}]},
        )

        assert response.status_code == 200
        body = response.json()
        assert len(body) == 3

        category_30 = [q for q in body if q["category"] == "30"]
        category_28 = [q for q in body if q["category"] == "28"]
        assert len(category_30) == 2
        assert len(category_28) == 1

        # Response uses camelCase and includes text/fullText per question.
        for question in body:
            assert set(question.keys()) == {"category", "questionNumber", "text", "fullText"}
            assert question["text"] == question["fullText"]

        # No duplicate question numbers within the same category.
        numbers_30 = [q["questionNumber"] for q in category_30]
        assert len(numbers_30) == len(set(numbers_30))
    finally:
        app.dependency_overrides.pop(get_question_service, None)


def test_generate_endpoint_returns_400_when_exceeding_available(tmp_path: Path) -> None:
    _override_with(tmp_path, {"30": [[f"Question {i}", f"Text {i}"] for i in range(1, 4)]})

    try:
        response = client.post("/api/v1/generate", json={"categories": [{"id": "30", "count": 10}]})

        assert response.status_code == 400
        detail = response.json()["detail"].lower()
        assert "30" in detail
        assert "available" in detail
    finally:
        app.dependency_overrides.pop(get_question_service, None)


def test_generate_endpoint_returns_400_for_unknown_category(tmp_path: Path) -> None:
    _override_with(tmp_path, {"30": [["Question 1", "Text 1"]]})

    try:
        response = client.post("/api/v1/generate", json={"categories": [{"id": "99", "count": 1}]})

        assert response.status_code == 400
        assert "99" in response.json()["detail"]
    finally:
        app.dependency_overrides.pop(get_question_service, None)


def test_generate_endpoint_rejects_empty_category_list() -> None:
    response = client.post("/api/v1/generate", json={"categories": []})
    assert response.status_code == 422


def test_generate_endpoint_rejects_non_positive_count() -> None:
    response = client.post("/api/v1/generate", json={"categories": [{"id": "30", "count": 0}]})
    assert response.status_code == 422
