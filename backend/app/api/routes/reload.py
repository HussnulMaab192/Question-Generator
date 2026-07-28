"""
Workbook reload route.

Lets an examiner force the questions workbook to be re-read from disk
right after editing it (adding/removing/renaming sheets) - no server
restart required. `ExcelService` also auto-detects file changes on every
read via a modification-time check, so this endpoint mainly gives the
frontend an explicit, immediate "refresh now" action with clear feedback
(see `ExcelService.reload`), rather than only relying on the next
incidental read.
"""

from fastapi import APIRouter, Depends

from app.models.reload import ReloadResponse
from app.services.excel_service import ExcelService, get_excel_service

router = APIRouter(tags=["reload"])


@router.post(
    "/reload",
    response_model=ReloadResponse,
    summary="Force the questions workbook to reload from disk",
    description=(
        "Re-reads the questions workbook right now, picking up any "
        "sheets that were added, removed, or renamed since the last load. "
        "Propagates the same errors as other endpoints if the workbook is "
        "missing or invalid."
    ),
)
def reload_workbook(excel_service: ExcelService = Depends(get_excel_service)) -> ReloadResponse:
    category_count = excel_service.reload()
    return ReloadResponse(success=True, categories=category_count)
