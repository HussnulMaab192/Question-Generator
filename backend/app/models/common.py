"""Generic, reusable response schemas used across multiple endpoints."""

from typing import Generic, Optional, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class HealthResponse(BaseModel):
    """Response payload for the health-check endpoint."""

    status: str = "ok"
    app_env: str
    version: str = "0.1.0"


class MessageResponse(BaseModel):
    """Generic single-message response, useful for simple ack endpoints."""

    message: str


class APIResponse(BaseModel, Generic[T]):
    """Generic envelope for successful API responses."""

    success: bool = True
    data: Optional[T] = None
    message: Optional[str] = None
