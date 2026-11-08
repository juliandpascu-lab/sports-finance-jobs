"""Fetch public ATS JSON feeds and persist compressed raw responses."""

from __future__ import annotations

import gzip
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib.request import Request, urlopen

from .config import SOURCE_BY_NAME, SOURCES, SourceConfig
from .normalize import normalize_source_payload
from .schema import RAW_ROOT


@dataclass(frozen=True)
class SourceResult:
    name: str
    ok: bool
    count: int
    error: str = ""


def fetch_bytes(url: str, timeout: int = 45) -> bytes:
    request = Request(
        url,
        headers={
            "Accept": "application/json",
            "User-Agent": "FDA-Job-Watcher/0.1 (+public-course-project)",
        },
    )
    with urlopen(request, timeout=timeout) as response:
        return response.read()


def _raw_file(raw_root: Path, run_date: str, source_name: str) -> Path:
    return raw_root / run_date / f"{source_name}.json.gz"


def read_raw_payload(path: Path) -> Any:
    with gzip.open(path, "rb") as handle:
        return json.loads(handle.read().decode("utf-8-sig"))


def collect_sources(
    run_date: str,
    *,
    raw_root: Path = RAW_ROOT,
    sources: tuple[SourceConfig, ...] = SOURCES,
) -> list[SourceResult]:
    """Fetch every source; one source failure never aborts the collection."""

    day_root = raw_root / run_date
    day_root.mkdir(parents=True, exist_ok=True)
    results: list[SourceResult] = []
    for source in sources:
        target = _raw_file(raw_root, run_date, source.name)
        if target.exists():
            target.unlink()
        try:
            raw = fetch_bytes(source.endpoint)
            payload = json.loads(raw.decode("utf-8-sig"))
            count = len(normalize_source_payload(source, payload))
            with gzip.open(target, "wb") as handle:
                handle.write(raw)
            results.append(SourceResult(source.name, True, count))
        except Exception as exc:  # one unavailable board cannot stop the run
            if target.exists():
                target.unlink()
            results.append(SourceResult(source.name, False, 0, f"{type(exc).__name__}: {exc}"))
    return results


def source_results_from_raw(
    run_date: str,
    *,
    raw_root: Path = RAW_ROOT,
    sources: tuple[SourceConfig, ...] = SOURCES,
) -> list[SourceResult]:
    results = []
    for source in sources:
        path = _raw_file(raw_root, run_date, source.name)
        if not path.exists():
            results.append(SourceResult(source.name, False, 0, "No raw file"))
            continue
        try:
            payload = read_raw_payload(path)
            count = len(normalize_source_payload(source, payload))
            results.append(SourceResult(source.name, True, count))
        except Exception as exc:
            results.append(SourceResult(source.name, False, 0, f"{type(exc).__name__}: {exc}"))
    return results


def source_config(name: str) -> SourceConfig:
    return SOURCE_BY_NAME[name]
