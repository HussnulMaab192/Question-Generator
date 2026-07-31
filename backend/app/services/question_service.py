"""
Question generation service.

Owns the *selection* logic (random sampling and availability checks) for
turning a `GenerateQuestionsRequest` into a list of `Question` objects.
Recently-used history is delegated entirely to `QuestionHistoryCache` —
the single place that tracks and resets per-category usage. All workbook
access goes through `ExcelService`.
"""

import random
from functools import lru_cache
from typing import Dict, List, Optional

from app.models.question import CategorySelection, Question
from app.services.excel_service import ExcelService, get_excel_service
from app.services.exceptions import InsufficientQuestionsError
from app.services.question_history import QuestionHistoryCache, get_question_history


class QuestionService:
    """Generates competition questions from source data via `ExcelService`."""

    def __init__(
        self,
        excel_service: Optional[ExcelService] = None,
        history: Optional[QuestionHistoryCache] = None,
    ) -> None:
        self.excel_service = excel_service or get_excel_service()
        # Default: process-wide shared cache so every client sees the same history.
        self.history = history or get_question_history()

    def generate_questions(self, selections: List[CategorySelection]) -> List[Question]:
        """Generate questions for every requested category.

        For each selection: look up its available questions (propagating
        `CategoryNotFoundError` from `ExcelService` unchanged if the id is
        unknown), then draw `count` unique questions. Selection prefers
        unused questions in that category; history for a category resets
        automatically only after every available question has been used.
        Raises `InsufficientQuestionsError` if `count` exceeds the sheet size.
        """
        questions: List[Question] = []
        for selection in selections:
            questions.extend(self._select_from_category(selection))
        return questions

    def _select_from_category(self, selection: CategorySelection) -> List[Question]:
        available = self.excel_service.get_questions(selection.id)
        pool_size = len(available)

        if selection.count > pool_size:
            raise InsufficientQuestionsError(
                f"Category '{selection.id}' only has {pool_size} question(s) "
                f"available, but {selection.count} were requested."
            )

        selected = self._sample_without_premature_repeat(
            selection.id,
            available,
            selection.count,
        )
        pool_numbers = {q.question_number for q in available}
        self.history.record_selection(
            selection.id,
            {q.question_number for q in selected},
            pool_numbers,
        )
        return selected

    def _sample_without_premature_repeat(
        self,
        category_id: str,
        available: List[Question],
        count: int,
    ) -> List[Question]:
        """Draw `count` unique questions, never repeating while unused remain.

        Pool size is taken dynamically from `available` (workbook sheet size).

        1. Select only from unused questions in this category.
        2. If `count` exceeds the unused remainder:
           - take every remaining unused question first,
           - clear history for this category only,
           - fill the rest at random from the refreshed pool (excluding
             questions already chosen in this same draw).
        3. If the unused pool is already empty, clear and sample from the
           full pool (new cycle).
        """
        by_number: Dict[int, Question] = {q.question_number: q for q in available}
        pool_numbers = set(by_number.keys())

        unused_numbers = self.history.unused_numbers(category_id, pool_numbers)

        if not unused_numbers:
            # Entire category already exhausted on a prior request — new cycle.
            self.history.clear_category(category_id)
            chosen_numbers = random.sample(list(pool_numbers), count)
            return [by_number[n] for n in chosen_numbers]

        if len(unused_numbers) >= count:
            chosen_numbers = random.sample(list(unused_numbers), count)
            return [by_number[n] for n in chosen_numbers]

        # Exhaust unused first, then wrap into a fresh cycle for the remainder.
        chosen_numbers = random.sample(list(unused_numbers), len(unused_numbers))
        remaining_needed = count - len(chosen_numbers)
        self.history.clear_category(category_id)
        refill_pool = list(pool_numbers - set(chosen_numbers))
        chosen_numbers.extend(random.sample(refill_pool, remaining_needed))
        return [by_number[n] for n in chosen_numbers]


@lru_cache
def get_question_service() -> QuestionService:
    """Return the process-wide `QuestionService` singleton for DI."""
    return QuestionService()
