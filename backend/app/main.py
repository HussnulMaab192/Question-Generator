"""
FastAPI application entrypoint.

Run with:
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
(from the `backend/` directory, with the virtual environment activated)
"""

import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.router import api_router
from app.core.config import get_settings
from app.services.exceptions import (
    CategoryNotFoundError,
    ExcelWorkbookInUseError,
    ExcelWorkbookInvalidError,
    ExcelWorkbookNotFoundError,
    ExcelWorkbookNotLoadedError,
    InsufficientQuestionsError,
)
from app.services.excel_service import get_excel_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    """Load the questions workbook once when the app starts.

    A missing/invalid workbook does not prevent the server from starting -
    endpoints that depend on it return a clear error until the workbook is
    fixed via Admin upload, `POST /api/v1/reload`, or placing the file on disk
    (auto-reload picks up the change — no process restart required).
    """
    excel_service = get_excel_service()
    try:
        excel_service.load()
    except (ExcelWorkbookNotFoundError, ExcelWorkbookInvalidError) as exc:
        logger.warning("Questions workbook could not be loaded at startup: %s", exc)

    yield


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="API for generating Quran competition questions from source Excel data.",
    lifespan=lifespan,
)

# CORS - allows the React frontend (Vite dev server / deployed app) to call this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(ExcelWorkbookNotFoundError)
async def handle_workbook_not_found(_request: Request, exc: ExcelWorkbookNotFoundError) -> JSONResponse:
    return JSONResponse(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, content={"detail": str(exc)})


@app.exception_handler(ExcelWorkbookNotLoadedError)
async def handle_workbook_not_loaded(_request: Request, exc: ExcelWorkbookNotLoadedError) -> JSONResponse:
    return JSONResponse(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, content={"detail": str(exc)})


@app.exception_handler(ExcelWorkbookInvalidError)
async def handle_workbook_invalid(_request: Request, exc: ExcelWorkbookInvalidError) -> JSONResponse:
    return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content={"detail": str(exc)})


@app.exception_handler(ExcelWorkbookInUseError)
async def handle_workbook_in_use(_request: Request, exc: ExcelWorkbookInUseError) -> JSONResponse:
    return JSONResponse(status_code=status.HTTP_409_CONFLICT, content={"detail": str(exc)})


@app.exception_handler(CategoryNotFoundError)
async def handle_category_not_found(_request: Request, exc: CategoryNotFoundError) -> JSONResponse:
    return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"detail": str(exc)})


@app.exception_handler(InsufficientQuestionsError)
async def handle_insufficient_questions(_request: Request, exc: InsufficientQuestionsError) -> JSONResponse:
    return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"detail": str(exc)})


@app.exception_handler(Exception)
async def handle_unexpected_error(_request: Request, exc: Exception) -> JSONResponse:
    """Catch-all: log the full exception server-side, never send a stack trace to clients."""
    if isinstance(exc, HTTPException):
        # Should be handled by FastAPI's built-in handler; keep as a safety net.
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
    logger.exception("Unhandled server error: %s", exc)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected server error occurred. Please try again."},
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
