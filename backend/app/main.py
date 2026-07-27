"""
FastAPI application entrypoint.

Run with:
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
(from the `backend/` directory, with the virtual environment activated)
"""

import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.router import api_router
from app.core.config import get_settings
from app.services.exceptions import (
    ExcelWorkbookInvalidError,
    ExcelWorkbookNotFoundError,
    ExcelWorkbookNotLoadedError,
)
from app.services.excel_service import get_excel_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    """Load the questions workbook exactly once when the app starts.

    A missing/invalid workbook does not prevent the server from starting -
    it only means endpoints that depend on it (e.g. `/categories`) will
    respond with a clear error until the workbook is fixed and the server
    is restarted.
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


app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.get("/", tags=["root"])
def read_root() -> dict:
    """Basic root endpoint confirming the API is running."""
    return {
        "name": settings.app_name,
        "status": "running",
        "docs": "/docs",
    }
