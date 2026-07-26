"""
FastAPI application entrypoint.

Run with:
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
(from the `backend/` directory, with the virtual environment activated)
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="API for generating Quran competition questions from source Excel data.",
)

# CORS - allows the React frontend (Vite dev server / deployed app) to call this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.get("/", tags=["root"])
def read_root() -> dict:
    """Basic root endpoint confirming the API is running."""
    return {
        "name": settings.app_name,
        "status": "running",
        "docs": "/docs",
    }
