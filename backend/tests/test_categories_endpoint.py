"""
Integration tests for `GET /api/v1/categories`.

Covers both the happy path (workbook present, categories derived
dynamically) and the error path (workbook missing), asserting the API
responds with a clear, actionable error instead of crashing or fabricating
data.
"""

from pathlib import Path

from fastapi.testclient import TestClient
from openpyxl import Workbook

from app.api.routes.categories import router as categories_router
from app.main import app
from app.services.excel_service import ExcelService, get_excel_service

client = TestClient(app)


def test_categories_endpoint_returns_503_when_workbook_missing(tmp_path: Path) -> None:
    missing_service = ExcelService(tmp_path / "missing.xlsx")
    app.dependency_overrides[get_excel_service] = lambda: missing_service

    try:
        # Simulate the startup lifespan's best-effort load attempt failing.
        try:
            missing_service.load()
        except Exception:
            pass

        response = client.get("/api/v1/categories")

        assert response.status_code == 503
        assert "not found" in response.json()["detail"].lower()
    finally:
        app.dependency_overrides.pop(get_excel_service, None)


def test_categories_endpoint_returns_dynamic_categories(tmp_path: Path) -> None:
    workbook_path = tmp_path / "workbook.xlsx"
    workbook = Workbook()
    workbook.remove(workbook.active)

    sheet = workbook.create_sheet(title="Juz Amma Part 2")
    sheet.append(["Question", "Answer"])
    sheet.append(["Q1", "A1"])
    sheet.append(["Q2", "A2"])
    sheet.append(["Q3", "A3"])
    workbook.save(workbook_path)

    service = ExcelService(workbook_path)
    service.load()
    app.dependency_overrides[get_excel_service] = lambda: service

    try:
        response = client.get("/api/v1/categories")

        assert response.status_code == 200
        body = response.json()
        assert body == [
            {"id": "Juz Amma Part 2", "name": "Juz Amma Part 2", "questionCount": 3}
        ]
    finally:
        app.dependency_overrides.pop(get_excel_service, None)


def test_categories_router_uses_dependency_injection() -> None:
    """Sanity check that the route is wired through `get_excel_service`."""
    dependant_call = categories_router.routes[0].dependant.dependencies[0].call
    assert dependant_call is get_excel_service
