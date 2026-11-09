from job_watcher.issues import issue_body


def test_issue_lists_each_posting_with_details_and_application_link() -> None:
    rows = [
        {
            "title": "Finance Analyst",
            "employer": "Example Bank",
            "location": "Austin, TX",
            "department": "Finance",
            "posted_date": "2026-11-09",
            "source": "example",
            "url": "https://example.test/apply/123",
            "first_seen": "2026-11-09",
            "first_run": False,
            "removed_date": "",
        }
    ]

    body = issue_body(rows, "2026-11-09", {"open": 1, "new_today": 1, "removed_today": 0})

    assert "**Finance Analyst**" in body
    assert "Employer: Example Bank" in body
    assert "Location: Austin, TX" in body
    assert "Department: Finance" in body
    assert "Posted: 2026-11-09" in body
    assert "Source: example" in body
    assert "[Open application](https://example.test/apply/123)" in body
