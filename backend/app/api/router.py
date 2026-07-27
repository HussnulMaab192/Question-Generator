"""Aggregates all versioned API routers into a single router."""

from fastapi import APIRouter

from app.api.routes import categories, health, questions

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(categories.router)
api_router.include_router(questions.router)
