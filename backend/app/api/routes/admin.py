"""
Workbook administration routes.

Lets an examiner inspect and replace the questions workbook from the
frontend's Admin page, without ever touching the server's filesystem
directly or restarting the backend. All validation/reload logic lives in
`ExcelService` (reused, not duplicated) - this module only handles the
HTTP-level concerns: extension/size checks on the upload, and mapping a
bad upload to a `400` (a client input problem) rather than the `500` a
background reload failure would otherwise produce.
"""

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.models.admin import UploadWorkbookResponse
from app.models.workbook import WorkbookInfo
from app.services.excel_service import ExcelService, get_excel_service
from app.services.exceptions import (
    ExcelWorkbookInUseError,
    ExcelWorkbookInvalidError,
    ExcelWorkbookNotFoundError,
)
from app.services.question_history import get_question_history

router = APIRouter(prefix="/admin", tags=["admin"])

ALLOWED_EXTENSION = ".xlsx"
MAX_UPLOAD_SIZE_BYTES = 20 * 1024 * 1024  # 20 MB


@router.get(
    "/workbook",
    response_model=WorkbookInfo,
    summary="Get metadata about the currently loaded questions workbook",
)
def get_workbook_info(excel_service: ExcelService = Depends(get_excel_service)) -> WorkbookInfo:
    try:
        return excel_service.get_workbook_info()
    except ExcelWorkbookNotFoundError:
        # Return a structured "missing" snapshot (HTTP 200) so the Admin
        # page can show a clear Workbook Missing status + re-upload guidance
        # instead of treating absence as an unexpected server error.
        return excel_service.get_missing_workbook_info()


@router.post(
    "/upload-workbook",
    response_model=UploadWorkbookResponse,
    summary="Replace the questions workbook and reload it",
    description=(
        "Uploads a new .xlsx file (max 20 MB), validates it, atomically replaces the "
        "current workbook on disk, and reloads it into memory - no server restart required."
    ),
)
async def upload_workbook(
    file: UploadFile = File(..., description="The replacement .xlsx workbook."),
    excel_service: ExcelService = Depends(get_excel_service),
) -> UploadWorkbookResponse:
    filename = file.filename or ""
    if not filename.lower().endswith(ALLOWED_EXTENSION):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only {ALLOWED_EXTENSION} files are accepted (got '{filename}').",
        )

    content = await file.read()

    if len(content) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty.")

    if len(content) > MAX_UPLOAD_SIZE_BYTES:
        size_mb = len(content) / (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File is too large ({size_mb:.1f} MB). The maximum allowed size is 20 MB.",
        )

    try:
        workbook_info = excel_service.replace_workbook_file(content)
        # A brand-new workbook starts a fresh recently-used cycle.
        get_question_history().clear_all()
    except (ExcelWorkbookNotFoundError, ExcelWorkbookInvalidError) as exc:
        # A bad upload is a client-input problem (400), not a server
        # malfunction (500) - the original workbook on disk is untouched.
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except ExcelWorkbookInUseError as exc:
        # Destination still locked after retries (Excel/antivirus/etc.) —
        # never a 500; the examiner can close the other app and retry.
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc

    return UploadWorkbookResponse(
        success=True,
        message=(
            f"Workbook uploaded and reloaded successfully. "
            f"{workbook_info.category_count} categories found."
        ),
        workbook=workbook_info,
    )
