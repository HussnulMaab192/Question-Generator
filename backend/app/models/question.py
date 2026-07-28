"""
Domain schemas for question generation.

`Question` mirrors exactly what `ExcelService` parses out of a workbook
sheet - no fixed column names are assumed anywhere in this layer either;
this module only describes the *shape* of a parsed question, not how it
was extracted.
"""

from typing import List

from pydantic import BaseModel, Field

from app.models.common import CamelModel


class Question(CamelModel):
    """A single generated question, sourced from one row of a category sheet."""

    category: str
    """The category id (sheet name) this question was drawn from."""

    question_number: int
    """The question's number as detected in the sheet (or its row position)."""

    text: str
    """The question's display text (first non-empty text column found)."""

    full_text: str
    """
    The full block for this question. Identical to `text` for now - kept
    as a separate field so a richer "full passage" can be added later
    without changing the response shape.
    """


class CategorySelection(BaseModel):
    """One requested category + how many questions to draw from it."""

    id: str = Field(min_length=1, description="Category id (sheet name) to draw questions from.")
    count: int = Field(gt=0, description="Number of questions to draw from this category.")


class GenerateQuestionsRequest(BaseModel):
    """Request body for `POST /api/v1/generate`."""

    categories: List[CategorySelection] = Field(min_length=1)
