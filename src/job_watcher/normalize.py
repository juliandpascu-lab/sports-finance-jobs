"""Normalize public ATS job feeds into the common history columns."""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
import re
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
        match = re.match(r"^(\d{4}-\d{2}-\d{2})", text)
        return match.group(1) if match else ""


def _workday_date(value: Any, as_of_date: str) -> str:
    parsed = _date(value)
    if parsed or not as_of_date:
        return parsed
    text = str(value or "").casefold()
    try:
        current = date.fromisoformat(as_of_date)
    except ValueError:
        return ""
    if "today" in text:
        return current.isoformat()
    if "yesterday" in text:
        return (current - timedelta(days=1)).isoformat()
    match = re.search(r"(\d+)\s+days?\s+ago", text)
    if match:
        return (current - timedelta(days=int(match.group(1)))).isoformat()
    return ""


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


def _workday_jobs(payload: dict[str, Any]) -> list[dict[str, Any]]:
    return payload.get("jobPostings", [])


def _smartrecruiters_jobs(payload: dict[str, Any]) -> list[dict[str, Any]]:
    return payload.get("content", [])


def _oracle_jobs(payload: dict[str, Any]) -> list[dict[str, Any]]:
    items = payload.get("items", [])
    if not items or not isinstance(items[0], dict):
        return []
    rows = items[0].get("requisitionList", [])
    return rows if isinstance(rows, list) else []


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


def _workday_posting(source: SourceConfig, item: dict[str, Any], as_of_date: str) -> dict[str, Any]:
    bullet_fields = item.get("bulletFields") or []
    if not isinstance(bullet_fields, list):
        bullet_fields = []
    external_path = str(item.get("externalPath") or "").strip()
    source_id = str(item.get("id") or (bullet_fields[0] if bullet_fields else "") or external_path)
    url = f"{source.board_url.rstrip('/')}/{external_path.lstrip('/')}" if external_path else source.board_url
    department = str(
        item.get("jobFamily")
        or item.get("jobCategory")
        or (bullet_fields[1] if len(bullet_fields) > 1 else "")
        or ""
    ).strip()
    return _posting(
        source=source,
        source_id=source_id,
        title=str(item.get("title", "")).strip(),
        location=str(item.get("locationsText") or item.get("location") or "").strip(),
        department=department,
        posted_date=_workday_date(item.get("postedDate") or item.get("postedOn"), as_of_date),
        url=url,
    )


def _smartrecruiters_posting(source: SourceConfig, item: dict[str, Any]) -> dict[str, Any]:
    location = item.get("location") or {}
    if isinstance(location, dict):
        location_name = str(location.get("fullLocation") or "").strip()
        if not location_name:
            location_name = _join(
                [location.get("city", ""), location.get("region", ""), location.get("country", "")]
            )
    else:
        location_name = str(location).strip()
    department = item.get("department") or item.get("function") or {}
    if isinstance(department, dict):
        department = department.get("label") or department.get("name") or ""
    source_id = str(item.get("id") or item.get("uuid") or "")
    url = f"{source.board_url.rstrip('/')}/{source_id}" if source_id else source.board_url
    return _posting(
        source=source,
        source_id=source_id,
        title=str(item.get("name") or item.get("title") or "").strip(),
        location=location_name,
        department=str(department).strip(),
        posted_date=_date(item.get("releasedDate") or item.get("postedDate")),
        url=url,
    )


def _oracle_posting(source: SourceConfig, item: dict[str, Any]) -> dict[str, Any]:
    secondary = item.get("secondaryLocations") or []
    locations = [item.get("PrimaryLocation") or item.get("PrimaryLocationCountry") or ""]
    for entry in secondary:
        if isinstance(entry, dict):
            locations.append(entry.get("LocationName") or entry.get("Name") or entry.get("location") or "")
        else:
            locations.append(entry)
    source_id = str(item.get("Id") or item.get("RequisitionId") or "")
    url = f"{source.board_url.rstrip('/')}/job/{source_id}" if source_id else source.board_url
    return _posting(
        source=source,
        source_id=source_id,
        title=str(item.get("Title") or "").strip(),
        location=_join(locations),
        department=str(
            item.get("Department") or item.get("Category") or item.get("JobFunction") or ""
        ).strip(),
        posted_date=_date(item.get("PostedDate") or item.get("ExternalPostedStartDate")),
        url=url,
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


def normalize_source_payload(
    source: SourceConfig, payload: Any, *, as_of_date: str = ""
) -> list[dict[str, Any]]:
    """Convert one ATS response into the common posting columns."""

    if source.ats == "Greenhouse":
        return [_greenhouse_posting(source, item) for item in _greenhouse_jobs(payload)]
    if source.ats == "Ashby":
        return [_ashby_posting(source, item) for item in _ashby_jobs(payload)]
    if source.ats == "Lever":
        return [_lever_posting(source, item) for item in _lever_jobs(payload)]
    if source.ats == "Workday":
        return [_workday_posting(source, item, as_of_date) for item in _workday_jobs(payload)]
    if source.ats == "SmartRecruiters":
        return [_smartrecruiters_posting(source, item) for item in _smartrecruiters_jobs(payload)]
    if source.ats == "Oracle":
        return [_oracle_posting(source, item) for item in _oracle_jobs(payload)]
    raise ValueError(f"Unsupported ATS: {source.ats}")
