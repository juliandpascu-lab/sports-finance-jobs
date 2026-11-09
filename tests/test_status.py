import json

from job_watcher.status import make_status


def test_days_with_success_counts_dates_with_raw_files_only(tmp_path) -> None:
    raw_root = tmp_path / "raw"
    (raw_root / "2026-11-01").mkdir(parents=True)
    (raw_root / "2026-11-02").mkdir(parents=True)
    (raw_root / "2026-11-02" / "source.json.gz").write_bytes(b"not-read")

    status = make_status([], run_date="2026-11-02", raw_root=raw_root)

    assert status["first_run_date"] == "2026-11-02"
    assert status["days_with_success"] == 1
