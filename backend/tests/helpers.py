"""
Shared test utilities for building throwaway workbooks and wiring them
into the FastAPI app for integration tests.

Not a `conftest.py` module (these aren't fixtures) - just plain helpers,
imported directly by whichever test module needs them.
"""

import os
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

from openpyxl import Workbook

from app.main import app
from app.services.excel_service import ExcelService, get_excel_service


def write_workbook(path: Path, sheets: dict[str, list[list[object]]]) -> None:
    """Write a workbook with arbitrary sheet names/rows for test purposes.

    NOTE: the real workbook has NO header row - every row is data, with
    the question number/label in the first column and the question text
    in the next non-empty column. Sheets passed here should mirror that
    shape.
    """
    workbook = Workbook()
    workbook.remove(workbook.active)
    for sheet_name, rows in sheets.items():
        sheet = workbook.create_sheet(title=sheet_name)
        for row in rows:
            sheet.append(row)
    path.parent.mkdir(parents=True, exist_ok=True)
    workbook.save(path)


def bump_mtime(path: Path) -> None:
    """Force a strictly later modification time, deterministically.

    Some filesystems have coarse mtime resolution, so relying on two
    back-to-back writes landing on different timestamps would be flaky -
    explicitly set one instead.
    """
    current = path.stat().st_mtime
    new_time = current + 5
    os.utime(path, (new_time, new_time))


@contextmanager
def override_excel_service(service: ExcelService) -> Iterator[ExcelService]:
    """Point the FastAPI app's `ExcelService` dependency at `service` for
    the duration of the `with` block, then restore the real dependency."""
    app.dependency_overrides[get_excel_service] = lambda: service
    try:
        yield service
    finally:
        app.dependency_overrides.pop(get_excel_service, None)
