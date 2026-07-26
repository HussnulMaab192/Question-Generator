"""
Question routes.

Architectural placeholder only - endpoints are wired up so the frontend
has a stable contract to integrate against, but no business logic is
implemented yet. Each handler raises HTTP 501 until the corresponding
service logic is built out.
"""

from fastapi import APIRouter, HTTPException, status

from app.models.question import GenerateQuestionsRequest, GenerateQuestionsResponse

router = APIRouter(prefix="/questions", tags=["questions"])


@router.post(
    "/generate",
    response_model=GenerateQuestionsResponse,
    status_code=status.HTTP_501_NOT_IMPLEMENTED,
)
def generate_questions(payload: GenerateQuestionsRequest) -> GenerateQuestionsResponse:
    """TODO: Generate competition questions from uploaded source data."""
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Question generation is not implemented yet.",
    )
