from job_watcher.collector import _fetch_oracle, _fetch_smartrecruiters, _fetch_workday
from job_watcher.config import SourceConfig


def test_workday_fetch_combines_pages(monkeypatch) -> None:
    responses = iter(
        [
            {"total": 3, "jobPostings": [{"title": "A"}, {"title": "B"}]},
            {"total": 0, "jobPostings": [{"title": "C"}]},
        ]
    )
    monkeypatch.setattr("job_watcher.collector._request_json", lambda *args, **kwargs: next(responses))
    source = SourceConfig("workday", "Example", "Workday", "https://example.test/jobs", "https://example.test", page_size=2)

    payload = _fetch_workday(source)

    assert payload["total"] == 3
    assert [item["title"] for item in payload["jobPostings"]] == ["A", "B", "C"]


def test_smartrecruiters_fetch_combines_pages(monkeypatch) -> None:
    responses = iter(
        [
            {"totalFound": 3, "content": [{"id": "A"}, {"id": "B"}]},
            {"totalFound": 3, "content": [{"id": "C"}]},
        ]
    )
    monkeypatch.setattr("job_watcher.collector._request_json", lambda *args, **kwargs: next(responses))
    source = SourceConfig("smart", "Example", "SmartRecruiters", "https://example.test/postings", "https://example.test", page_size=2)

    payload = _fetch_smartrecruiters(source)

    assert payload["totalFound"] == 3
    assert [item["id"] for item in payload["content"]] == ["A", "B", "C"]


def test_oracle_fetch_combines_requisition_pages(monkeypatch) -> None:
    responses = iter(
        [
            {"items": [{"SearchId": 1, "TotalJobsCount": 3, "requisitionList": [{"Id": "A"}, {"Id": "B"}]}]},
            {"items": [{"SearchId": 1, "TotalJobsCount": 3, "requisitionList": [{"Id": "C"}]}]},
        ]
    )
    monkeypatch.setattr("job_watcher.collector._request_json", lambda *args, **kwargs: next(responses))
    source = SourceConfig("oracle", "Example", "Oracle", "https://example.test/jobs", "https://example.test", page_size=2, site_number="CX")

    payload = _fetch_oracle(source)

    assert [item["Id"] for item in payload["items"][0]["requisitionList"]] == ["A", "B", "C"]
