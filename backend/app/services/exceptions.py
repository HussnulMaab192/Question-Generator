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


class ExcelWorkbookNotLoadedError(ServiceError):
    """Raised when data is requested before/without a successful `load()`."""
