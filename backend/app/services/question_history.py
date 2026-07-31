"""
In-memory history of previously generated questions, keyed by category.

Shared by every request against the same backend process (no database).
Within each category, every available question is used once before any
repetition is allowed; the category history then clears automatically and
a new cycle begins. Pool size is never assumed — callers pass the live
set of question numbers discovered from the workbook.
"""

from __future__ import annotations

from typing import Dict, Set


class QuestionHistoryCache:
    """Tracks used question numbers per category id (sheet name)."""

    def __init__(self) -> None:
        self._used_by_category: Dict[str, Set[int]] = {}

    def used_numbers(self, category_id: str) -> Set[int]:
        """Defensive copy of the used set for `category_id`."""
        return set(self._used_by_category.get(category_id, set()))

    def unused_numbers(self, category_id: str, pool_numbers: Set[int]) -> Set[int]:
        """Return members of `pool_numbers` that are not yet in history."""
        used = self._used_by_category.get(category_id, set())
        return set(pool_numbers) - used

    def clear_category(self, category_id: str) -> None:
        """Reset history for one category only (start a new cycle)."""
        self._used_by_category.pop(category_id, None)

    def record_selection(
        self,
        category_id: str,
        selected_numbers: Set[int],
        pool_numbers: Set[int],
    ) -> None:
        """Record a draw and auto-clear when the category pool is exhausted.

        `pool_numbers` is the full set of question numbers currently available
        in the workbook for this category (dynamic — never hardcoded).
        """
        used = self._used_by_category.setdefault(category_id, set())
        used.update(selected_numbers)
        if pool_numbers and pool_numbers.issubset(used):
            # Every available question has been used at least once — reset
            # this category only so the next generate starts a fresh cycle.
            used.clear()

    def clear_all(self) -> None:
        self._used_by_category.clear()


# Process-wide singleton — shared by all users/devices hitting this backend.
_shared_history = QuestionHistoryCache()


def get_question_history() -> QuestionHistoryCache:
    return _shared_history
