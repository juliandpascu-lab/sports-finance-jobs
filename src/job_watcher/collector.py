"""Fetch public ATS JSON feeds and persist compressed raw responses."""

from __future__ import annotations

import gzip
import json
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit
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


def _request_json(
    url: str,
    *,
    method: str = "GET",
    body: dict[str, Any] | None = None,
    timeout: int = 45,
) -> Any:
    data = json.dumps(body).encode("utf-8") if body is not None else None
    headers = {
        "Accept": "application/json",
        "User-Agent": "FDA-Job-Watcher/0.1 (+public-course-project)",
    }
    if data is not None:
        headers["Content-Type"] = "application/json"
    request = Request(url, data=data, method=method, headers=headers)
    with urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8-sig"))


def _with_query(url: str, values: dict[str, Any]) -> str:
    parts = urlsplit(url)
    query = dict(parse_qsl(parts.query))
    query.update({key: str(value) for key, value in values.items()})
    return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))


def _fetch_workday_query(source: SourceConfig, search_term: str) -> dict[str, Any]:
    postings: list[dict[str, Any]] = []
    seen: set[str] = set()
    offset = 0
    total = 0
    while True:
        payload = _request_json(
            source.endpoint,
            method="POST",
            body={
                "appliedFacets": {},
                "limit": source.page_size,
                "offset": offset,
                "searchText": search_term,
            },
        )
        page = payload.get("jobPostings", []) if isinstance(payload, dict) else []
        if not isinstance(page, list):
            raise ValueError("Workday response did not contain a jobPostings list")
        for item in page:
            key = str(item.get("id") or item.get("externalPath") or item)
            if key not in seen:
                seen.add(key)
                postings.append(item)
        reported_total = int(payload.get("total", 0)) if isinstance(payload, dict) else 0
        if reported_total:
            total = reported_total
        elif not total:
            total = len(postings)
        if not page or len(postings) >= total or len(page) < source.page_size:
            break
        next_offset = offset + len(page)
        if next_offset <= offset:
            break
        offset = next_offset
    return {"jobPostings": postings, "total": total}


def _fetch_workday(source: SourceConfig) -> dict[str, Any]:
    payload = _fetch_workday_query(source, source.search_term)
    if payload["total"] > 5000 and not source.search_term:
        return _fetch_workday_query(source, "finance")
    return payload


def _fetch_smartrecruiters_query(source: SourceConfig, search_term: str) -> dict[str, Any]:
    postings: list[dict[str, Any]] = []
    seen: set[str] = set()
    offset = 0
    total = 0
    while True:
        url = _with_query(
            source.endpoint,
            {
                "limit": source.page_size,
                "offset": offset,
                **({"q": search_term} if search_term else {}),
            },
        )
        payload = _request_json(url)
        page = payload.get("content", []) if isinstance(payload, dict) else []
        if not isinstance(page, list):
            raise ValueError("SmartRecruiters response did not contain a content list")
        for item in page:
            key = str(item.get("id") or item.get("uuid") or item)
            if key not in seen:
                seen.add(key)
                postings.append(item)
        total = int(payload.get("totalFound", len(postings))) if isinstance(payload, dict) else len(postings)
        if not page or len(postings) >= total or len(page) < source.page_size:
            break
        next_offset = offset + len(page)
        if next_offset <= offset:
            break
        offset = next_offset
    return {"content": postings, "totalFound": total}


def _fetch_smartrecruiters(source: SourceConfig) -> dict[str, Any]:
    payload = _fetch_smartrecruiters_query(source, source.search_term)
    if payload["totalFound"] > 5000 and not source.search_term:
        return _fetch_smartrecruiters_query(source, "finance")
    return payload


def _fetch_oracle_query(source: SourceConfig, search_term: str) -> dict[str, Any]:
    postings: list[dict[str, Any]] = []
    seen: set[str] = set()
    offset = 0
    total = 0
    search_id = 1
    while True:
        finder_parts = [f"siteNumber={source.site_number}"]
        if search_term:
            finder_parts.append(f'keyword="{search_term.replace(chr(34), "")}"')
        finder_parts.extend(
            [f"limit={source.page_size}", f"offset={offset}", "sortBy=POSTING_DATES_DESC"]
        )
        finder = "findReqs;" + ",".join(finder_parts)
        url = _with_query(
            source.endpoint,
            {
                "onlyData": "true",
                "expand": "requisitionList.secondaryLocations",
                "finder": finder,
            },
        )
        payload = _request_json(url)
        items = payload.get("items", []) if isinstance(payload, dict) else []
        search = items[0] if items and isinstance(items[0], dict) else {}
        page = search.get("requisitionList", [])
        if not isinstance(page, list):
            raise ValueError("Oracle response did not contain a requisitionList")
        for item in page:
            key = str(item.get("Id") or item.get("RequisitionId") or item)
            if key not in seen:
                seen.add(key)
                postings.append(item)
        search_id = search.get("SearchId", search_id)
        total = int(search.get("TotalJobsCount", len(postings)))
        if not page or len(postings) >= total or len(page) < source.page_size:
            break
        next_offset = offset + len(page)
        if next_offset <= offset:
            break
        offset = next_offset
    return {
        "items": [{"SearchId": search_id, "TotalJobsCount": total, "requisitionList": postings}]
    }


def _fetch_oracle(source: SourceConfig) -> dict[str, Any]:
    payload = _fetch_oracle_query(source, source.search_term)
    if payload["items"][0]["TotalJobsCount"] > 5000 and not source.search_term:
        return _fetch_oracle_query(source, "finance")
    return payload


def fetch_source_payload(source: SourceConfig) -> Any:
    """Fetch one configured board, including pagination where its ATS requires it."""

    if source.ats == "Workday":
        return _fetch_workday(source)
    if source.ats == "SmartRecruiters":
        return _fetch_smartrecruiters(source)
    if source.ats == "Oracle":
        return _fetch_oracle(source)
    return json.loads(fetch_bytes(source.endpoint).decode("utf-8-sig"))


def _payload_bytes(payload: Any) -> bytes:
    return json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")


def _raw_file(raw_root: Path, run_date: str, source_name: str) -> Path:
    return raw_root / run_date / f"{source_name}.json.gz"


def read_raw_payload(path: Path) -> Any:
    with gzip.open(path, "rb") as handle:
        return json.loads(handle.read().decode("utf-8-sig"))


def _collect_one_source(source: SourceConfig, run_date: str, raw_root: Path) -> SourceResult:
    target = _raw_file(raw_root, run_date, source.name)
    if target.exists():
        target.unlink()
    try:
        payload = fetch_source_payload(source)
        count = len(normalize_source_payload(source, payload, as_of_date=run_date))
        with gzip.open(target, "wb") as handle:
            handle.write(_payload_bytes(payload))
        return SourceResult(source.name, True, count)
    except Exception as exc:  # one unavailable board cannot stop the collection
        if target.exists():
            target.unlink()
        return SourceResult(source.name, False, 0, f"{type(exc).__name__}: {exc}")


def collect_sources(
    run_date: str,
    *,
    raw_root: Path = RAW_ROOT,
    sources: tuple[SourceConfig, ...] = SOURCES,
) -> list[SourceResult]:
    """Fetch every source; one source failure never aborts the collection."""

    day_root = raw_root / run_date
    day_root.mkdir(parents=True, exist_ok=True)
    worker_count = min(6, len(sources)) or 1
    with ThreadPoolExecutor(max_workers=worker_count) as executor:
        # executor.map preserves the configured source order for status output.
        return list(
            executor.map(
                lambda source: _collect_one_source(source, run_date, raw_root), sources
            )
        )


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
            count = len(normalize_source_payload(source, payload, as_of_date=run_date))
            results.append(SourceResult(source.name, True, count))
        except Exception as exc:
            results.append(SourceResult(source.name, False, 0, f"{type(exc).__name__}: {exc}"))
    return results


def source_config(name: str) -> SourceConfig:
    return SOURCE_BY_NAME[name]
