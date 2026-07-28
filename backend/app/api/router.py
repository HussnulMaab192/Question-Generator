"""Aggregates all versioned API routers into a single router."""

from fastapi import APIRouter

from app.api.routes import admin, categories, generate, health, reload

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(categories.router)
api_router.include_router(generate.router)
api_router.include_router(reload.router)
api_router.include_router(admin.router)
