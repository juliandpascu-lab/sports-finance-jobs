"""Normalize Greenhouse, Lever, and Ashby public job feeds."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from .config import SourceConfig
from .role import is_in_role


def _date(value: Any) -> str:
    if value in (None, ""):
        return ""
    if isinstance(value, (int, float)):
        return datetime.fromtimestamp(value / 1000, tz=timezone.utc).date().isoformat()
    text = str(value)
    try:
        return datetime.fromisoformat(text.replace("Z", "+00:00")).date().isoformat()
    except ValueError:
        return text[:10] if len(text) >= 10 else ""


def _join(values: list[Any]) -> str:
    clean = []
    for value in values:
        text = str(value).strip() if value is not None else ""
        if text and text not in clean:
            clean.append(text)
    return "; ".join(clean)


def _greenhouse_jobs(payload: dict[str, Any]) -> list[dict[str, Any]]:
    return payload.get("jobs", [])


def _lever_jobs(payload: Any) -> list[dict[str, Any]]:
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict):
        return payload.get("data", [])
    return []


def _ashby_jobs(payload: dict[str, Any]) -> list[dict[str, Any]]:
    return payload.get("jobs", [])


def _greenhouse_posting(source: SourceConfig, item: dict[str, Any]) -> dict[str, Any]:
    location = item.get("location") or {}
    location_name = location.get("name", "") if isinstance(location, dict) else str(location)
    offices = item.get("offices") or []
    if not location_name:
        location_name = _join(
            [
                office.get("location") or office.get("name", "")
                for office in offices
                if isinstance(office, dict)
            ]
        )
    departments = item.get("departments") or []
    department = _join(
        [department.get("name", "") for department in departments if isinstance(department, dict)]
    )
    source_id = str(item.get("id") or item.get("internal_job_id") or item.get("absolute_url"))
    title = str(item.get("title", "")).strip()
    return _posting(
        source=source,
        source_id=source_id,
        title=title,
        location=location_name,
        department=department,
        posted_date=_date(item.get("first_published") or item.get("updated_at")),
        url=str(item.get("absolute_url", "")),
    )


def _ashby_posting(source: SourceConfig, item: dict[str, Any]) -> dict[str, Any]:
    secondary = item.get("secondaryLocations") or []
    locations = [item.get("location", "")]
    locations.extend(
        entry.get("location", "") for entry in secondary if isinstance(entry, dict)
    )
    source_id = str(item.get("id") or item.get("jobUrl") or item.get("applyUrl"))
    return _posting(
        source=source,
        source_id=source_id,
        title=str(item.get("title", "")).strip(),
        location=_join(locations),
        department=str(item.get("department") or item.get("team") or "").strip(),
        posted_date=_date(item.get("publishedAt")),
        url=str(item.get("applyUrl") or item.get("jobUrl") or ""),
    )


def _lever_posting(source: SourceConfig, item: dict[str, Any]) -> dict[str, Any]:
    categories = item.get("categories") or {}
    if not isinstance(categories, dict):
        categories = {}
    urls = item.get("urls") or {}
    if not isinstance(urls, dict):
        urls = {}
    source_id = str(item.get("id") or item.get("hostedUrl") or item.get("applyUrl"))
    return _posting(
        source=source,
        source_id=source_id,
        title=str(item.get("text") or item.get("name") or "").strip(),
        location=str(categories.get("location") or item.get("location") or "").strip(),
        department=str(
            categories.get("department")
            or categories.get("team")
            or item.get("team")
            or ""
        ).strip(),
        posted_date=_date(item.get("createdAt") or item.get("updatedAt")),
        url=str(
            item.get("applyUrl")
            or urls.get("apply")
            or item.get("hostedUrl")
            or urls.get("show")
            or ""
        ),
    )


def _posting(
    *,
    source: SourceConfig,
    source_id: str,
    title: str,
    location: str,
    department: str,
    posted_date: str,
    url: str,
) -> dict[str, Any]:
    return {
        "posting_id": f"{source.name}:{source_id}",
        "source": source.name,
        "source_id": source_id,
        "employer": source.employer,
        "title": title,
        "location": location,
        "department": department,
        "posted_date": posted_date,
        "url": url,
        "in_role": is_in_role(title),
    }


def normalize_source_payload(source: SourceConfig, payload: Any) -> list[dict[str, Any]]:
    """Convert one ATS response into the common posting columns."""

    if source.ats == "Greenhouse":
        return [_greenhouse_posting(source, item) for item in _greenhouse_jobs(payload)]
    if source.ats == "Ashby":
        return [_ashby_posting(source, item) for item in _ashby_jobs(payload)]
    if source.ats == "Lever":
        return [_lever_posting(source, item) for item in _lever_jobs(payload)]
    raise ValueError(f"Unsupported ATS: {source.ats}")
