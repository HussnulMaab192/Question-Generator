"""Shared exception types for the service layer.

Keeping these separate from the services themselves lets route/handler code
(and `app.main`'s exception handlers) import them without pulling in
heavier dependencies like pandas/openpyxl.
"""


class ServiceError(Exception):
    """Base class for all service-layer errors."""


class ExcelWorkbookNotFoundError(ServiceError):
    """Raised when the configured Excel workbook does not exist on disk."""


class ExcelWorkbookInvalidError(ServiceError):
    """Raised when the workbook exists but cannot be parsed (corrupt, empty, etc.)."""


class ExcelWorkbookInUseError(ServiceError):
    """Raised when the workbook cannot be replaced because another process holds it open."""


class ExcelWorkbookNotLoadedError(ServiceError):
    """Raised when data is requested before/without a successful `load()`."""


class CategoryNotFoundError(ServiceError):
    """Raised when a requested category id does not exist in the workbook."""


class InsufficientQuestionsError(ServiceError):
    """Raised when more questions are requested from a category than exist."""
