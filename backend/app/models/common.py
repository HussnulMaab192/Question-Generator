"""Generic, reusable response schemas used across multiple endpoints."""

from typing import Generic, Optional, TypeVar

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


def to_camel_case(field_name: str) -> str:
    """Convert a snake_case field name to camelCase for JSON serialization."""
    first, *rest = field_name.split("_")
    return first + "".join(word.capitalize() for word in rest)


class CamelModel(BaseModel):
    """Base model that (de)serializes snake_case attributes as camelCase JSON.

    Use this for any schema exposed to the frontend so Python code can stay
    idiomatic (snake_case) while the API contract stays camelCase.
    """

    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel_case)


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
