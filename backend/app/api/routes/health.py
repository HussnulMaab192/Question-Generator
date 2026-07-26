"""Health-check route - useful for uptime checks and frontend connectivity tests."""

from fastapi import APIRouter, Depends

from app.core.config import Settings, get_settings
from app.models.common import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def get_health(settings: Settings = Depends(get_settings)) -> HealthResponse:
    """Return basic service health/status information."""
    return HealthResponse(status="ok", app_env=settings.app_env)
