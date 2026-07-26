"""
Domain schemas for Quran competition questions.

NOTE: This is an architectural placeholder only. Fields and validation
rules will be fleshed out once the question-generation business logic
is implemented.
"""

from typing import Optional

from pydantic import BaseModel


class QuestionBase(BaseModel):
    """Placeholder base schema for a single competition question.

    TODO: Define real fields once requirements are finalized, e.g.:
    - surah (str | int)
    - ayah_from / ayah_to (int)
    - question_type (enum)
    - difficulty (enum)
    """

    id: Optional[str] = None


class GenerateQuestionsRequest(BaseModel):
    """Placeholder request schema for triggering question generation.

    TODO: Add real parameters, e.g. source file reference, number of
    questions, surah range, difficulty distribution, etc.
    """

    pass


class GenerateQuestionsResponse(BaseModel):
    """Placeholder response schema for generated questions.

    TODO: Return the generated question set once logic is implemented.
    """

    pass
