import pytest

from job_watcher.config import SOURCES
from job_watcher.normalize import normalize_source_payload
from job_watcher.role import (
    is_investment_banking_or_ma,
    is_in_role,
    is_preferred_posting,
    matched_markets,
)


@pytest.mark.parametrize("source", SOURCES, ids=lambda source: source.name)
def test_every_source_normalizes_to_common_columns(source) -> None:
    if source.ats == "Greenhouse":
        payload = {
            "jobs": [
                {
                    "id": 123,
                    "title": "Finance Analyst",
                    "location": {"name": "Remote"},
                    "departments": [{"name": "Finance"}],
                    "first_published": "2026-11-01T12:00:00Z",
                    "absolute_url": "https://example.test/123",
                }
            ]
        }
    elif source.ats == "Ashby":
        payload = {
            "jobs": [
                {
                    "id": "abc-123",
                    "title": "Finance Analyst",
                    "location": "Remote",
                    "department": "Finance",
                    "publishedAt": "2026-11-01T12:00:00Z",
                    "jobUrl": "https://example.test/abc-123",
                    "applyUrl": "https://example.test/abc-123/application",
                }
            ]
        }
    elif source.ats == "Workday":
        payload = {
            "jobPostings": [
                {
                    "title": "Finance Analyst",
                    "externalPath": "/job/Finance-Analyst_R_123",
                    "locationsText": "Remote",
                    "jobCategory": "Finance",
                    "postedDate": "2026-11-01T12:00:00Z",
                }
            ]
        }
    elif source.ats == "SmartRecruiters":
        payload = {
            "content": [
                {
                    "id": "smart-123",
                    "name": "Finance Analyst",
                    "location": {"fullLocation": "Remote"},
                    "function": {"label": "Finance"},
                    "releasedDate": "2026-11-01T12:00:00Z",
                }
            ]
        }
    elif source.ats == "Oracle":
        payload = {
            "items": [
                {
                    "TotalJobsCount": 1,
                    "requisitionList": [
                        {
                            "Id": "oracle-123",
                            "Title": "Finance Analyst",
                            "PrimaryLocation": "Remote",
                            "Category": "Finance",
                            "PostedDate": "2026-11-01",
                        }
                    ],
                }
            ]
        }
    else:
        payload = [
            {
                "id": "lever-123",
                "text": "Finance Analyst",
                "categories": {"location": "Remote", "team": "Finance"},
                "createdAt": get_timestamp(),
                "urls": {"show": "https://example.test/lever-123", "apply": "https://example.test/lever-123/apply"},
            }
        ]

    rows = normalize_source_payload(source, payload)
    assert len(rows) == 1
    row = rows[0]
    assert row["posting_id"].startswith(f"{source.name}:")
    assert row["source"] == source.name
    assert row["employer"] == source.employer
    assert row["title"] == "Finance Analyst"
    assert row["location"] == "Remote"
    assert row["department"] == "Finance"
    assert row["posted_date"]
    assert row["url"]
    assert row["in_role"] is True


def get_timestamp() -> int:
    # 2026-11-01T12:00:00Z in milliseconds; kept local to avoid a date library dependency.
    return 1793534400000


def test_title_rule_prioritizes_early_career_matches() -> None:
    assert is_in_role("Finance Analyst") is True
    assert is_in_role("Financial Analyst I") is True
    assert is_in_role("FP&A Analyst") is True
    assert is_in_role("Corporate Finance Analyst") is True
    assert is_in_role("Revenue Finance Analyst") is True
    assert is_in_role("Strategic Finance Analyst") is True
    assert is_in_role("Treasury Analyst") is True
    assert is_in_role("Credit Analyst") is True
    assert is_in_role("Commercial Banking Analyst") is True
    assert is_in_role("Corporate Banking Analyst") is True
    assert is_in_role("Valuation Analyst") is True
    assert is_in_role("Equity Research Associate") is True
    assert is_in_role("Investment Analyst") is True
    assert is_in_role("Investment Banking Analyst") is True
    assert is_in_role("M&A Analyst") is True
    assert is_in_role("Transaction Advisory Analyst") is True
    assert is_in_role("Portfolio Analyst") is True
    assert is_in_role("Financial Risk Analyst") is True
    assert is_in_role("Asset Management Analyst") is True
    assert is_in_role("Private Credit Analyst") is True
    assert is_in_role("Analyst, Corporate Development") is True
    assert is_in_role("Senior Financial Analyst") is False
    assert is_in_role("Revenue Operations Associate") is False
    assert is_in_role("Business Intelligence Analyst") is False
    assert is_in_role("Director of Strategy") is False
    assert is_in_role("Software Engineer") is False


def test_workday_relative_posted_date_uses_raw_snapshot_date() -> None:
    source = next(source for source in SOURCES if source.ats == "Workday")
    rows = normalize_source_payload(
        source,
        {
            "jobPostings": [
                {
                    "title": "Finance Analyst",
                    "externalPath": "/job/Finance-Analyst_R_123",
                    "locationsText": "Remote",
                    "postedOn": "Posted 18 Days Ago",
                }
            ]
        },
        as_of_date="2026-11-09",
    )
    assert rows[0]["posted_date"] == "2026-10-22"


def test_title_rule_includes_entry_level_ib_and_ma_but_not_senior_roles() -> None:
    assert is_in_role("Investment Banker I") is False
    assert is_in_role("M&A Advisory Analyst") is True
    assert is_investment_banking_or_ma("Investment Banking Analyst") is True
    assert is_investment_banking_or_ma("M&A Advisory Analyst") is True
    assert is_investment_banking_or_ma("Senior Investment Banking Associate") is False
    assert is_investment_banking_or_ma("Marketing Acquisition Associate") is False


def test_preferred_markets_and_new_york_narrowing() -> None:
    assert "Austin" in matched_markets("Austin, TX")
    assert "Kansas City" in matched_markets("Kansas City, KS; Kansas City, MO")
    assert "Fayetteville / Northwest Arkansas" in matched_markets("Bentonville, AR")
    assert is_preferred_posting("FP&A Analyst", "Dallas, TX") is True
    assert is_preferred_posting("People Analyst", "New York, NY") is False
    assert is_preferred_posting("Investment Banking Analyst", "New York") is True
