import gzip
import json

from job_watcher.config import SOURCE_BY_NAME
from job_watcher.history import build_history


SOURCE = SOURCE_BY_NAME["baltimoreorioles"]


def write_raw(raw_root, day, jobs):
    target_dir = raw_root / day
    target_dir.mkdir(parents=True, exist_ok=True)
    payload = {
        "jobs": [
            {
                "id": job_id,
                "title": title,
                "location": {"name": "Baltimore, MD"},
                "departments": [{"name": "Finance"}],
                "first_published": "2026-11-01T12:00:00Z",
                "absolute_url": f"https://example.test/{job_id}",
            }
            for job_id, title in jobs
        ]
    }
    with gzip.open(target_dir / f"{SOURCE.name}.json.gz", "wb") as handle:
        handle.write(json.dumps(payload).encode())


def test_first_seen_removed_and_reopened_logic(tmp_path) -> None:
    raw_root = tmp_path / "raw"
    history_path = tmp_path / "history.csv"
    write_raw(raw_root, "2026-11-01", [("one", "Finance Analyst"), ("two", "Revenue Analyst")])
    write_raw(raw_root, "2026-11-02", [("two", "Revenue Analyst")])
    write_raw(raw_root, "2026-11-03", [("one", "Finance Analyst")])

    rows = build_history(raw_root=raw_root, history_path=history_path)
    by_id = {row["source_id"]: row for row in rows}

    assert by_id["one"]["first_seen"] == "2026-11-01"
    assert by_id["one"]["last_seen"] == "2026-11-03"
    assert by_id["one"]["first_run"] is True
    assert by_id["one"]["status"] == "open"
    assert by_id["one"]["removed_date"] == ""

    assert by_id["two"]["first_seen"] == "2026-11-01"
    assert by_id["two"]["last_seen"] == "2026-11-02"
    assert by_id["two"]["status"] == "removed"
    assert by_id["two"]["removed_date"] == "2026-11-03"


def test_missing_source_file_does_not_remove_open_postings(tmp_path) -> None:
    raw_root = tmp_path / "raw"
    history_path = tmp_path / "history.csv"
    write_raw(raw_root, "2026-11-01", [("one", "Finance Analyst")])

    rows = build_history(raw_root=raw_root, history_path=history_path)
    assert rows[0]["status"] == "open"
    assert rows[0]["removed_date"] == ""
