"""Response schema for `POST /api/v1/reload`."""

from app.models.common import CamelModel


class ReloadResponse(CamelModel):
    """Result of forcing the questions workbook to reload from disk."""

    success: bool
    categories: int
    """Number of categories (sheets) detected after reloading."""
