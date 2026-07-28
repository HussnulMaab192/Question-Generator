"""Security / path-confinement checks for Settings."""

import pytest
from pydantic import ValidationError

from app.core.config import Settings, _BACKEND_ROOT


def test_workbook_filename_strips_directory_components() -> None:
    settings = Settings(questions_workbook_filename="../escape.xlsx")
    assert settings.questions_workbook_filename == "escape.xlsx"
    assert settings.questions_workbook_path == settings.data_dir_path / "escape.xlsx"
    assert settings.questions_workbook_path.is_relative_to(settings.data_dir_path)


def test_workbook_filename_rejects_empty_basename() -> None:
    with pytest.raises(ValidationError):
        Settings(questions_workbook_filename="..")


def test_data_dir_resolves_relative_to_backend_root() -> None:
    settings = Settings(data_dir="data")
    assert settings.data_dir_path == (_BACKEND_ROOT / "data").resolve()
