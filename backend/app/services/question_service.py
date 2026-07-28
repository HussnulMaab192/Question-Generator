"""
Question generation service.

Owns the *selection* logic (random sampling, availability checks) for
turning a `GenerateQuestionsRequest` into a list of `Question` objects.
All workbook access goes through `ExcelService` - this service never reads
the spreadsheet directly, so random-selection logic lives in exactly one
place regardless of how many categories are requested.
"""

import random
from functools import lru_cache
from typing import List, Optional

from app.models.question import CategorySelection, Question
from app.services.excel_service import ExcelService, get_excel_service
from app.services.exceptions import InsufficientQuestionsError


class QuestionService:
    """Generates competition questions from source data via `ExcelService`."""

    def __init__(self, excel_service: Optional[ExcelService] = None) -> None:
        self.excel_service = excel_service or get_excel_service()

    def generate_questions(self, selections: List[CategorySelection]) -> List[Question]:
        """Generate questions for every requested category.

        For each selection: look up its available questions (propagating
        `CategoryNotFoundError` from `ExcelService` unchanged if the id is
        unknown), then draw `count` of them at random with no repeats. If a
        category doesn't have enough questions, raises
        `InsufficientQuestionsError` with a message naming the category and
        the available/requested counts.
        """
        questions: List[Question] = []
        for selection in selections:
            questions.extend(self._select_from_category(selection))
        return questions

    def _select_from_category(self, selection: CategorySelection) -> List[Question]:
        available = self.excel_service.get_questions(selection.id)

        if selection.count > len(available):
            raise InsufficientQuestionsError(
                f"Category '{selection.id}' only has {len(available)} question(s) "
                f"available, but {selection.count} were requested."
            )

        # `random.sample` draws `count` unique items without replacement -
        # this is the single place "no duplicates, never exceed available"
        # is enforced, reused for every category in every request.
        return random.sample(available, selection.count)


@lru_cache
def get_question_service() -> QuestionService:
    """Return the process-wide `QuestionService` singleton for DI."""
    return QuestionService()
