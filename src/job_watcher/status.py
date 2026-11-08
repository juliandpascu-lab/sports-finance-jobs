"""Generate the fixed-path latest-run status file."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .collector import SourceResult
from .config import SOURCES
from .schema import STATUS_PATH


def _available_dates(raw_root: Path) -> list[str]:
    if not raw_root.exists():
        return []
    return sorted(path.name for path in raw_root.iterdir() if path.is_dir())


def make_status(
    rows: list[dict[str, Any]],
    *,
    run_date: str,
    run_time: str | None = None,
    source_results: list[SourceResult] | None = None,
    raw_root: Path,
) -> dict[str, Any]:
    dates = _available_dates(raw_root)
    result_by_source = {result.name: result for result in source_results or []}
    latest_rows = [row for row in rows if row.get("first_seen") == run_date]
    status = {
        "run_time": run_time or datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "first_run_date": dates[0] if dates else None,
        "days_with_success": len(dates),
        "open": sum(1 for row in rows if row.get("status") == "open"),
        "new_today": sum(
            1 for row in latest_rows if str(row.get("first_run", "")).lower() != "true"
        ),
        "removed_today": sum(1 for row in rows if row.get("removed_date") == run_date),
        "sources": [],
    }
    for source in SOURCES:
        result = result_by_source.get(source.name)
        status["sources"].append(
            {
                "name": source.name,
                "ok": bool(result.ok) if result else False,
                "count": int(result.count) if result else 0,
            }
        )
    return status


def write_status(status: dict[str, Any], status_path: Path = STATUS_PATH) -> None:
    status_path.parent.mkdir(parents=True, exist_ok=True)
    status_path.write_text(json.dumps(status, indent=2) + "\n", encoding="utf-8")
