"""
Category routes.

Categories are derived entirely from whatever sheets exist in the questions
workbook - nothing here hardcodes sheet/category names. If the workbook
can't be read, the `ExcelService` exceptions propagate up and are converted
into HTTP responses by the exception handlers registered in `app.main`.
"""

from typing import List

from fastapi import APIRouter, Depends

from app.models.category import Category
from app.services.excel_service import ExcelService, get_excel_service

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get(
    "",
    response_model=List[Category],
    summary="List selectable question categories",
    description=(
        "Returns one category per sheet detected in the questions workbook, "
        "each with the number of available questions in that sheet."
    ),
)
def list_categories(excel_service: ExcelService = Depends(get_excel_service)) -> List[Category]:
    return excel_service.get_categories()
