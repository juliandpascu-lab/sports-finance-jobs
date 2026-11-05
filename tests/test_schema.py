from pathlib import Path

from job_watcher.schema import (
    HISTORY_COLUMNS,
    HISTORY_PATH,
    RAW_ROOT,
    STATUS_KEYS,
    STATUS_PATH,
    raw_path,
)


def test_history_schema_matches_assignment_contract() -> None:
    assert HISTORY_COLUMNS == (
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


def test_status_schema_matches_assignment_contract() -> None:
    assert STATUS_KEYS == (
        "run_time",
        "first_run_date",
        "days_with_success",
        "open",
        "new_today",
        "removed_today",
        "sources",
    )


def test_fixed_data_paths_are_relative_to_repository() -> None:
    assert RAW_ROOT == Path("data/raw")
    assert HISTORY_PATH == Path("data/history.csv")
    assert STATUS_PATH == Path("data/status.json")
    assert raw_path("2026-11-05", "example") == Path(
        "data/raw/2026-11-05/example.json.gz"
    )
