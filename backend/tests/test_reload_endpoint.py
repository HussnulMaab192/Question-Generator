"""
Integration tests for `POST /api/v1/reload`.

Covers the happy path (workbook re-read, category count reported) and the
error path (workbook missing) reusing the same exception handling as every
other endpoint - reload doesn't introduce any new error-handling code.
"""

from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app
from app.services.excel_service import ExcelService
from tests.helpers import override_excel_service, write_workbook

client = TestClient(app)


def test_reload_endpoint_returns_success_and_category_count(tmp_path: Path) -> None:
    workbook_path = tmp_path / "workbook.xlsx"
    write_workbook(workbook_path, {"30": [["Question 1", "Text"]], "29": [["Question 1", "Text"]]})

    service = ExcelService(workbook_path)
    service.load()

    with override_excel_service(service):
        # Add a sheet on disk, then reload - the response should reflect
        # the new count immediately, no restart involved.
        write_workbook(
            workbook_path,
            {"30": [["Question 1", "Text"]], "29": [["Question 1", "Text"]], "28": [["Question 1", "Text"]]},
        )

        response = client.post("/api/v1/reload")

        assert response.status_code == 200
        assert response.json() == {"success": True, "categories": 3}

        # And the categories endpoint reflects the reload without a
        # separate manual reload call.
        categories_response = client.get("/api/v1/categories")
        assert {c["id"] for c in categories_response.json()} == {"30", "29", "28"}


def test_reload_endpoint_returns_503_when_workbook_missing(tmp_path: Path) -> None:
    missing_service = ExcelService(tmp_path / "missing.xlsx")

    with override_excel_service(missing_service):
        response = client.post("/api/v1/reload")

        assert response.status_code == 503
        assert "not found" in response.json()["detail"].lower()
