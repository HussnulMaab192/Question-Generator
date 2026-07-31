"""
Integration tests for the workbook administration endpoints used by the
frontend's Admin page: `GET /api/v1/admin/workbook` and
`POST /api/v1/admin/upload-workbook`.
"""

import os
from pathlib import Path
from typing import Callable
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app
from app.services import excel_service as excel_service_module
from app.services.excel_service import ExcelService
from tests.helpers import override_excel_service, write_workbook

client = TestClient(app)

_WORKBOOK_IN_USE_SNIPPET = "currently in use by another application"


def _workbook_bytes(tmp_path: Path, sheets: dict[str, list[list[object]]], name: str = "upload.xlsx") -> bytes:
    """Build a throwaway workbook and return its raw bytes, as if it had
    just been picked from a file input."""
    scratch_path = tmp_path / name
    write_workbook(scratch_path, sheets)
    return scratch_path.read_bytes()


def _post_upload(upload_bytes: bytes, filename: str = "new_workbook.xlsx"):
    return client.post(
        "/api/v1/admin/upload-workbook",
        files={
            "file": (
                filename,
                upload_bytes,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
        },
    )


def test_get_workbook_info_returns_current_stats(tmp_path: Path) -> None:
    workbook_path = tmp_path / "workbook.xlsx"
    write_workbook(
        workbook_path,
        {"30": [["Question 1", "Text"], ["Question 2", "Text"]], "29": [["Question 1", "Text"]]},
    )
    service = ExcelService(workbook_path)
    service.load()

    with override_excel_service(service):
        response = client.get("/api/v1/admin/workbook")

        assert response.status_code == 200
        body = response.json()
        assert body["filename"] == "workbook.xlsx"
        assert body["categoryCount"] == 2
        assert body["totalQuestions"] == 3
        assert body["status"] == "loaded"
        assert "lastModified" in body and body["lastModified"]


def test_get_workbook_info_returns_missing_status_when_workbook_absent(tmp_path: Path) -> None:
    missing_service = ExcelService(tmp_path / "missing.xlsx")

    with override_excel_service(missing_service):
        response = client.get("/api/v1/admin/workbook")

        assert response.status_code == 200
        body = response.json()
        assert body["status"] == "missing"
        assert body["filename"] == "missing.xlsx"
        assert body["categoryCount"] == 0
        assert body["totalQuestions"] == 0


def test_upload_workbook_replaces_and_reloads(tmp_path: Path) -> None:
    workbook_path = tmp_path / "workbook.xlsx"
    write_workbook(workbook_path, {"30": [["Question 1", "Text"]]})
    service = ExcelService(workbook_path)
    service.load()

    with override_excel_service(service):
        upload_bytes = _workbook_bytes(
            tmp_path,
            {"30": [["Question 1", "Text"]], "29": [["Question 1", "Text"]], "28": [["Question 1", "Text"]]},
        )

        response = _post_upload(upload_bytes)

        assert response.status_code == 200
        body = response.json()
        assert body["success"] is True
        assert "successfully" in body["message"].lower()
        assert body["workbook"]["categoryCount"] == 3
        assert body["workbook"]["filename"] == "workbook.xlsx"  # keeps the original filename on disk
        assert body["workbook"]["status"] == "loaded"
        assert body["workbook"]["uploadedAt"] is not None

        # And GET /categories reflects it immediately - no restart, no
        # separate reload call needed.
        categories_response = client.get("/api/v1/categories")
        assert {c["id"] for c in categories_response.json()} == {"30", "29", "28"}


def test_upload_workbook_rejects_wrong_extension(tmp_path: Path) -> None:
    workbook_path = tmp_path / "workbook.xlsx"
    write_workbook(workbook_path, {"30": [["Question 1", "Text"]]})
    service = ExcelService(workbook_path)
    service.load()

    with override_excel_service(service):
        response = client.post(
            "/api/v1/admin/upload-workbook",
            files={"file": ("not-a-workbook.csv", b"some,data\n1,2", "text/csv")},
        )

        assert response.status_code == 400
        assert ".xlsx" in response.json()["detail"]

        # The original workbook must be completely untouched.
        assert {c.id for c in service.get_categories()} == {"30"}


def test_upload_workbook_rejects_empty_file(tmp_path: Path) -> None:
    workbook_path = tmp_path / "workbook.xlsx"
    write_workbook(workbook_path, {"30": [["Question 1", "Text"]]})
    service = ExcelService(workbook_path)
    service.load()

    with override_excel_service(service):
        response = client.post(
            "/api/v1/admin/upload-workbook",
            files={"file": ("empty.xlsx", b"", "application/octet-stream")},
        )

        assert response.status_code == 400
        assert "empty" in response.json()["detail"].lower()


def test_upload_workbook_rejects_oversized_file(tmp_path: Path) -> None:
    workbook_path = tmp_path / "workbook.xlsx"
    write_workbook(workbook_path, {"30": [["Question 1", "Text"]]})
    service = ExcelService(workbook_path)
    service.load()

    with override_excel_service(service):
        oversized_content = b"0" * (20 * 1024 * 1024 + 1)

        response = client.post(
            "/api/v1/admin/upload-workbook",
            files={"file": ("too_big.xlsx", oversized_content, "application/octet-stream")},
        )

        assert response.status_code == 400
        assert "too large" in response.json()["detail"].lower()

        # Rejected upload must never touch the original workbook.
        assert {c.id for c in service.get_categories()} == {"30"}


def test_upload_workbook_rejects_invalid_content_without_touching_original(tmp_path: Path) -> None:
    workbook_path = tmp_path / "workbook.xlsx"
    write_workbook(workbook_path, {"30": [["Question 1", "Text"]]})
    service = ExcelService(workbook_path)
    service.load()

    with override_excel_service(service):
        response = client.post(
            "/api/v1/admin/upload-workbook",
            files={"file": ("corrupt.xlsx", b"this is not a real xlsx file", "application/octet-stream")},
        )

        assert response.status_code == 400

        # Original workbook must survive a rejected upload untouched, and
        # no leftover temp file should remain on disk.
        assert {c.id for c in service.get_categories()} == {"30"}
        assert not Path(str(workbook_path) + ".upload-tmp").exists()


def test_upload_workbook_does_not_leave_the_new_file_locked(tmp_path: Path) -> None:
    """
    The Admin upload flow must uphold the same no-lingering-file-handle
    guarantee as every other load/reload path (see the Windows sharing
    violation regression tests in `test_excel_service.py`) - Excel must be
    able to open/save the workbook again immediately after an upload.
    """
    workbook_path = tmp_path / "workbook.xlsx"
    write_workbook(workbook_path, {"30": [["Question 1", "Text"]]})
    service = ExcelService(workbook_path)
    service.load()

    with override_excel_service(service):
        upload_bytes = _workbook_bytes(tmp_path, {"29": [["Question 1", "Text"]]})
        response = _post_upload(upload_bytes, filename="new.xlsx")
        assert response.status_code == 200

        # Simulate Excel immediately saving again right after the upload.
        replacement_path = tmp_path / "workbook.xlsx.tmp"
        write_workbook(replacement_path, {"27": [["Question 1", "Text"]]})
        os.replace(replacement_path, workbook_path)  # raises PermissionError if still locked


def test_upload_locked_workbook_returns_409(tmp_path: Path) -> None:
    """Destination locked for every replace attempt → HTTP 409, never 500."""
    workbook_path = tmp_path / "workbook.xlsx"
    write_workbook(workbook_path, {"30": [["Question 1", "Text"]]})
    service = ExcelService(workbook_path)
    service.load()

    def always_locked(_self: Path, _target: Path) -> None:
        raise PermissionError(5, "Access is denied")

    with override_excel_service(service):
        upload_bytes = _workbook_bytes(tmp_path, {"29": [["Question 1", "Text"]]})
        with (
            patch.object(Path, "replace", always_locked),
            patch.object(excel_service_module.time, "sleep") as sleep_mock,
        ):
            response = _post_upload(upload_bytes)

        assert response.status_code == 409
        assert _WORKBOOK_IN_USE_SNIPPET in response.json()["detail"]
        # 5 attempts → 4 sleeps of 250 ms between them.
        assert sleep_mock.call_count == 4
        sleep_mock.assert_called_with(0.25)
        # Original workbook must survive; temp upload file cleaned up.
        assert {c.id for c in service.get_categories()} == {"30"}
        assert not Path(str(workbook_path) + ".upload-tmp").exists()


def test_upload_retry_succeeds_after_transient_lock(tmp_path: Path) -> None:
    """Replace fails twice then succeeds — upload completes without 409."""
    workbook_path = tmp_path / "workbook.xlsx"
    write_workbook(workbook_path, {"30": [["Question 1", "Text"]]})
    service = ExcelService(workbook_path)
    service.load()

    real_replace: Callable[[Path, Path], Path] = Path.replace
    attempts = {"count": 0}

    def flaky_replace(self: Path, target: Path) -> Path:
        attempts["count"] += 1
        if attempts["count"] <= 2:
            raise PermissionError(5, "Access is denied")
        return real_replace(self, target)

    with override_excel_service(service):
        upload_bytes = _workbook_bytes(
            tmp_path,
            {"30": [["Question 1", "Text"]], "29": [["Question 1", "Text"]]},
        )
        with (
            patch.object(Path, "replace", flaky_replace),
            patch.object(excel_service_module.time, "sleep") as sleep_mock,
        ):
            response = _post_upload(upload_bytes)

        assert response.status_code == 200
        assert response.json()["workbook"]["categoryCount"] == 2
        assert attempts["count"] == 3
        assert sleep_mock.call_count == 2
        assert {c["id"] for c in client.get("/api/v1/categories").json()} == {"30", "29"}


def test_upload_retry_exhausted_returns_409(tmp_path: Path) -> None:
    """All 5 replace attempts fail → HTTP 409 with the examiner-facing message."""
    workbook_path = tmp_path / "workbook.xlsx"
    write_workbook(workbook_path, {"30": [["Question 1", "Text"]]})
    service = ExcelService(workbook_path)
    service.load()

    attempts = {"count": 0}

    def always_sharing_violation(_self: Path, _target: Path) -> None:
        attempts["count"] += 1
        error = OSError(32, "The process cannot access the file")
        error.winerror = 32  # type: ignore[attr-defined]
        raise error

    with override_excel_service(service):
        upload_bytes = _workbook_bytes(tmp_path, {"28": [["Question 1", "Text"]]})
        with (
            patch.object(Path, "replace", always_sharing_violation),
            patch.object(excel_service_module.time, "sleep") as sleep_mock,
        ):
            response = _post_upload(upload_bytes)

        assert response.status_code == 409
        assert response.status_code != 500
        assert response.json()["detail"] == (
            "The workbook is currently in use by another application. "
            "Close Microsoft Excel (or any program using the file) and try again."
        )
        assert attempts["count"] == 5
        assert sleep_mock.call_count == 4
