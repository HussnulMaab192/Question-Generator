"""
Excel I/O service.

Responsible for reading source Excel workbooks (e.g. Quran text/metadata)
with pandas/openpyxl and writing generated question sets back out to
Excel. Business logic is intentionally NOT implemented yet - this class
only defines the intended interface so routes/services can be wired up
ahead of time.
"""

from pathlib import Path
from typing import Any

import pandas as pd  # noqa: F401  (kept to declare intended dependency)
from openpyxl import Workbook  # noqa: F401  (kept to declare intended dependency)


class ExcelService:
    """Handles reading/writing Excel workbooks for the question generator."""

    def __init__(self, data_dir: str = "data") -> None:
        self.data_dir = Path(data_dir)

    def read_workbook(self, file_path: str) -> Any:
        """TODO: Load an Excel workbook into a pandas DataFrame."""
        raise NotImplementedError("Excel reading logic is not implemented yet.")

    def write_workbook(self, data: Any, file_path: str) -> None:
        """TODO: Write generated data to an Excel workbook."""
        raise NotImplementedError("Excel writing logic is not implemented yet.")
