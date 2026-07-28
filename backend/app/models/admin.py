"""Response schema for `POST /api/v1/admin/upload-workbook`."""

from app.models.common import CamelModel
from app.models.workbook import WorkbookInfo


class UploadWorkbookResponse(CamelModel):
    """Result of uploading a replacement questions workbook."""

    success: bool
    message: str
    workbook: WorkbookInfo
