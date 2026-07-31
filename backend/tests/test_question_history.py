"""
Tests for per-category question history and unused-first selection.

Pool sizes are always driven by the workbook contents — never hardcoded
constants like 20/30 — so the same logic works for any sheet size.
"""

from pathlib import Path

import pytest

from app.models.question import CategorySelection
from app.services.excel_service import ExcelService
from app.services.question_history import QuestionHistoryCache
from app.services.question_service import QuestionService
from tests.helpers import write_workbook


def _make_service(
    tmp_path: Path,
    sheets: dict[str, int],
) -> tuple[QuestionService, QuestionHistoryCache]:
    """Build a service whose sheets have `name -> question_count` rows."""
    workbook_path = tmp_path / "workbook.xlsx"
    write_workbook(
        workbook_path,
        {
            name: [[f"Question {i}", f"Text {i}"] for i in range(1, count + 1)]
            for name, count in sheets.items()
        },
    )
    excel = ExcelService(workbook_path)
    excel.load()
    history = QuestionHistoryCache()
    return QuestionService(excel, history=history), history


@pytest.mark.parametrize("pool_size", [3, 5, 7, 11])
def test_no_repetition_before_pool_is_exhausted(tmp_path: Path, pool_size: int) -> None:
    """Every question appears once before any number is seen again."""
    service, history = _make_service(tmp_path, {"30": pool_size})
    seen: set[int] = set()

    # Draw one-at-a-time until the pool is exhausted.
    for _ in range(pool_size):
        batch = service.generate_questions([CategorySelection(id="30", count=1)])
        assert len(batch) == 1
        number = batch[0].question_number
        assert number not in seen, f"repeated {number} before pool of {pool_size} was exhausted"
        seen.add(number)

    assert seen == set(range(1, pool_size + 1))
    # Auto-reset after exhaustion.
    assert history.used_numbers("30") == set()


@pytest.mark.parametrize("pool_size,batch_size", [(6, 2), (9, 3), (4, 4)])
def test_automatic_reset_after_exhaustion(tmp_path: Path, pool_size: int, batch_size: int) -> None:
    service, history = _make_service(tmp_path, {"Alpha": pool_size})

    rounds = pool_size // batch_size
    assert pool_size % batch_size == 0

    used_all: set[int] = set()
    for _ in range(rounds):
        batch = service.generate_questions([CategorySelection(id="Alpha", count=batch_size)])
        numbers = {q.question_number for q in batch}
        assert len(numbers) == batch_size
        assert used_all.isdisjoint(numbers)
        used_all.update(numbers)

    assert used_all == set(range(1, pool_size + 1))
    assert history.used_numbers("Alpha") == set()

    # New cycle may reuse any question.
    again = service.generate_questions([CategorySelection(id="Alpha", count=min(2, pool_size))])
    again_numbers = {q.question_number for q in again}
    assert len(again_numbers) == min(2, pool_size)
    # Selecting the entire pool in one draw would also auto-clear; a partial
    # draw leaves those numbers recorded for the new cycle.
    if len(again_numbers) < pool_size:
        assert history.used_numbers("Alpha") == again_numbers
    else:
        assert history.used_numbers("Alpha") == set()


def test_request_exceeding_unused_uses_remainder_then_wraps(tmp_path: Path) -> None:
    """
    Remaining unused are taken first; history for that category is cleared;
    then the rest of the request is filled from the refreshed pool.
    """
    service, history = _make_service(tmp_path, {"30": 5})

    service.generate_questions([CategorySelection(id="30", count=3)])
    remaining_unused = {1, 2, 3, 4, 5} - history.used_numbers("30")
    assert len(remaining_unused) == 2

    batch = service.generate_questions([CategorySelection(id="30", count=3)])
    numbers = {q.question_number for q in batch}
    assert len(numbers) == 3
    # Both leftover unused questions must appear in this draw.
    assert remaining_unused.issubset(numbers)


def test_categories_have_independent_histories(tmp_path: Path) -> None:
    service, history = _make_service(tmp_path, {"30": 4, "29": 6})

    first_30 = {q.question_number for q in service.generate_questions([CategorySelection(id="30", count=2)])}
    first_29 = {q.question_number for q in service.generate_questions([CategorySelection(id="29", count=2)])}

    assert history.used_numbers("30") == first_30
    assert history.used_numbers("29") == first_29

    second_30 = {q.question_number for q in service.generate_questions([CategorySelection(id="30", count=2)])}
    second_29 = {q.question_number for q in service.generate_questions([CategorySelection(id="29", count=2)])}

    # No cross-category interference; each avoids its own prior picks.
    assert first_30.isdisjoint(second_30)
    assert first_29.isdisjoint(second_29)
    # Category 30 is now exhausted and auto-reset; 29 still has history.
    assert history.used_numbers("30") == set()
    assert history.used_numbers("29") == first_29.union(second_29)


def test_dynamic_pool_size_follows_workbook_not_a_constant(tmp_path: Path) -> None:
    """Sheet with 13 questions must exhaust all 13 before any repeat."""
    pool_size = 13
    service, _history = _make_service(tmp_path, {"Juz Amma Part 1": pool_size})

    seen: list[int] = []
    for _ in range(pool_size):
        batch = service.generate_questions([CategorySelection(id="Juz Amma Part 1", count=1)])
        seen.append(batch[0].question_number)

    assert len(seen) == len(set(seen)) == pool_size
    assert set(seen) == set(range(1, pool_size + 1))

    # 14th draw is the first allowed repeat (new cycle).
    nxt = service.generate_questions([CategorySelection(id="Juz Amma Part 1", count=1)])[0]
    assert nxt.question_number in set(range(1, pool_size + 1))


def test_shared_history_singleton_is_process_wide() -> None:
    """All default QuestionService instances share one history cache."""
    from app.services.question_history import get_question_history
    from app.services.question_service import get_question_service

    get_question_service.cache_clear()
    try:
        a = get_question_service()
        b = get_question_service()
        assert a.history is b.history is get_question_history()
    finally:
        get_question_service.cache_clear()
