"""Rebuild posting history deterministically from dated raw responses."""

from __future__ import annotations

import csv
import re
from pathlib import Path
from typing import Any, Iterable

from .collector import read_raw_payload
from .config import SOURCE_BY_NAME, SOURCES
from .normalize import normalize_source_payload
from .schema import HISTORY_COLUMNS, HISTORY_PATH, RAW_ROOT

DATE_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}$")
BASE_COLUMNS = (
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
)


def _day_directories(raw_root: Path) -> list[Path]:
    if not raw_root.exists():
        return []
    return sorted(
        (path for path in raw_root.iterdir() if path.is_dir() and DATE_PATTERN.fullmatch(path.name)),
        key=lambda path: path.name,
    )


def _source_from_file(path: Path) -> str:
    return path.name[: -len(".json.gz")]


def _raw_files_for_day(day_root: Path) -> Iterable[Path]:
    return sorted(day_root.glob("*.json.gz"), key=lambda path: path.name)


def _empty_history_row(posting: dict[str, Any], day: str, first_run: bool) -> dict[str, Any]:
    row = {column: posting.get(column, "") for column in BASE_COLUMNS}
    row.update(
        {
            "first_run": first_run,
            "first_seen": day,
            "last_seen": day,
            "status": "open",
            "removed_date": "",
        }
    )
    return row


def build_history(
    *,
    raw_root: Path = RAW_ROOT,
    history_path: Path = HISTORY_PATH,
) -> list[dict[str, Any]]:
    """Return and write history using only the raw files under ``raw_root``."""

    day_roots = _day_directories(raw_root)
    first_raw_date: dict[str, str] = {}
    for day_root in day_roots:
        for path in _raw_files_for_day(day_root):
            source_name = _source_from_file(path)
            first_raw_date.setdefault(source_name, day_root.name)

    history: dict[str, dict[str, Any]] = {}
    for day_root in day_roots:
        day = day_root.name
        for path in _raw_files_for_day(day_root):
            source_name = _source_from_file(path)
            source = SOURCE_BY_NAME.get(source_name)
            if source is None:
                continue
            payload = read_raw_payload(path)
            postings = normalize_source_payload(source, payload, as_of_date=day)
            seen_ids = set()
            for posting in postings:
                posting_id = posting["posting_id"]
                seen_ids.add(posting_id)
                existing = history.get(posting_id)
                if existing is None:
                    history[posting_id] = _empty_history_row(
                        posting, day, day == first_raw_date[source_name]
                    )
                    continue
                for column in BASE_COLUMNS:
                    existing[column] = posting.get(column, "")
                existing["last_seen"] = day
                existing["status"] = "open"
                existing["removed_date"] = ""

            for existing in history.values():
                if (
                    existing["source"] == source_name
                    and existing["status"] == "open"
                    and existing["posting_id"] not in seen_ids
                ):
                    existing["status"] = "removed"
                    existing["removed_date"] = day

    rows = [history[key] for key in sorted(history)]
    write_history(rows, history_path)
    return rows


def write_history(rows: list[dict[str, Any]], history_path: Path = HISTORY_PATH) -> None:
    history_path.parent.mkdir(parents=True, exist_ok=True)
    with history_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=HISTORY_COLUMNS, lineterminator="\n")
        writer.writeheader()
        for row in rows:
            output = dict(row)
            output["in_role"] = str(bool(row["in_role"])).lower()
            output["first_run"] = str(bool(row["first_run"])).lower()
            writer.writerow(output)


def read_history(history_path: Path = HISTORY_PATH) -> list[dict[str, str]]:
    if not history_path.exists():
        return []
    with history_path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))
