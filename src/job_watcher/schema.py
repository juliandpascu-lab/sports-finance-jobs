"""Fixed paths and column contracts shared by the pipeline and site."""

from __future__ import annotations

from pathlib import Path

HISTORY_COLUMNS: tuple[str, ...] = (
    "posting_id",
    "source",
    "source_id",
    "employer",
    "title",
    "location",
    "department",
    "posted_date",
    "url",
    "in_role",
    "first_run",
    "first_seen",
    "last_seen",
    "status",
    "removed_date",
)

STATUS_KEYS: tuple[str, ...] = (
    "run_time",
    "first_run_date",
    "days_with_success",
    "open",
    "new_today",
    "removed_today",
    "sources",
)

DATA_ROOT = Path("data")
RAW_ROOT = DATA_ROOT / "raw"
HISTORY_PATH = DATA_ROOT / "history.csv"
STATUS_PATH = DATA_ROOT / "status.json"


def raw_path(run_date: str, source: str) -> Path:
    """Return the required path for one compressed source response."""

    return RAW_ROOT / run_date / f"{source}.json.gz"
