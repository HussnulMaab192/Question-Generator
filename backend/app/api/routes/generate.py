"""
Question generation route.

This route only handles the HTTP boundary (request/response models). All
selection logic lives in `QuestionService`; workbook access lives in
`ExcelService`. Domain errors (unknown category, not enough questions,
workbook not loaded) are translated to HTTP responses by the exception
handlers registered in `app.main`.
"""

from typing import List

from fastapi import APIRouter, Depends

from app.models.question import GenerateQuestionsRequest, Question
from app.services.question_service import QuestionService, get_question_service

router = APIRouter(tags=["generate"])


@router.post(
    "/generate",
    response_model=List[Question],
    summary="Generate a random set of questions for the selected categories",
    description=(
        "For every requested category, randomly selects the requested number "
        "of questions with no duplicates within the response. Prefers questions "
        "that have not been used since the category's in-memory history was "
        "last cleared; once every question in a category has been used, the "
        "history resets and a new cycle begins. Fails with 400 if a category "
        "is unknown or doesn't have enough questions available."
    ),
)
def generate_questions(
    payload: GenerateQuestionsRequest,
    question_service: QuestionService = Depends(get_question_service),
) -> List[Question]:
    return question_service.generate_questions(payload.categories)
