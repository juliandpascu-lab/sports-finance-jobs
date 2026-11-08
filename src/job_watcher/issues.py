"""Publish the daily change report as a GitHub Issue when credentials exist."""

from __future__ import annotations

import json
import os
from datetime import date, timedelta
from typing import Any
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from .config import SOURCE_BY_NAME


def _posting_lines(rows: list[dict[str, Any]], field: str, run_date: str) -> list[str]:
    selected = [
        row
        for row in rows
        if row.get(field) == run_date
        and not (field == "first_seen" and str(row.get("first_run", "")).lower() == "true")
    ]
    selected.sort(key=lambda row: (row.get("employer", ""), row.get("title", "")))
    return [
        f"- [{row.get('title', 'Untitled')} — {row.get('employer', '')}]({row.get('url', '')})"
        f" — {row.get('location') or 'Location not provided'}"
        for row in selected
    ]


def issue_body(
    rows: list[dict[str, Any]],
    run_date: str,
    status: dict[str, Any],
    source_errors: dict[str, str] | None = None,
) -> str:
    new_lines = _posting_lines(rows, "first_seen", run_date)
    removed_lines = _posting_lines(rows, "removed_date", run_date)
    failures = [
        f"- {SOURCE_BY_NAME.get(name).employer if name in SOURCE_BY_NAME else name}: {error}"
        for name, error in (source_errors or {}).items()
        if error
    ]
    return "\n".join(
        [
            f"## Daily snapshot — {run_date}",
            "",
            f"Open postings: **{status.get('open', 0)}**  ",
            f"New today: **{status.get('new_today', 0)}**  ",
            f"Removed today: **{status.get('removed_today', 0)}**",
            "",
            "### New postings",
            *(new_lines or ["No new non-first-run postings today."]),
            "",
            "### Removed postings",
            *(removed_lines or ["No postings were removed today."]),
            "",
            "### Sources with errors",
            *(failures or ["None."]),
        ]
    )


def _github_request(url: str, token: str, method: str = "GET", body: Any = None) -> Any:
    headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {token}",
        "User-Agent": "FDA-Job-Watcher/0.1",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    data = json.dumps(body).encode() if body is not None else None
    if data is not None:
        headers["Content-Type"] = "application/json"
    request = Request(url, data=data, headers=headers, method=method)
    with urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def sync_issue(
    *,
    run_date: str,
    rows: list[dict[str, Any]],
    status: dict[str, Any],
    source_errors: dict[str, str] | None = None,
) -> str:
    token = os.environ.get("GH_TOKEN") or os.environ.get("GITHUB_TOKEN")
    repository = os.environ.get("GITHUB_REPOSITORY")
    if not token or not repository:
        return "skipped (GH_TOKEN/GITHUB_TOKEN or GITHUB_REPOSITORY not set)"

    base = f"https://api.github.com/repos/{repository}/issues"
    title = f"Sports Finance Job Watcher — {run_date}"
    open_issues = _github_request(f"{base}?state=open&per_page=100", token)
    current = next(
        (
            issue
            for issue in open_issues
            if not issue.get("pull_request") and issue.get("title") == title
        ),
        None,
    )
    body = issue_body(rows, run_date, status, source_errors)
    if current:
        _github_request(f"{base}/{current['number']}", token, "PATCH", {"body": body})
    else:
        _github_request(f"{base}", token, "POST", {"title": title, "body": body})

    previous_date = (date.fromisoformat(run_date) - timedelta(days=1)).isoformat()
    previous_title = f"Sports Finance Job Watcher — {previous_date}"
    previous = next(
        (
            issue
            for issue in open_issues
            if not issue.get("pull_request") and issue.get("title") == previous_title
        ),
        None,
    )
    if previous:
        _github_request(f"{base}/{previous['number']}", token, "PATCH", {"state": "closed"})
    return "updated"
