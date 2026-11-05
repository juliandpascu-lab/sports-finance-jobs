# FDA Job Watcher

An automated job-market watcher for the Financial Data Analytics project.

The finished project will collect open jobs from at least 15 employers through
their unauthenticated applicant-tracking-system JSON endpoints, maintain a
reproducible posting history, publish daily changes through GitHub Issues, and
serve a three-page installable site through GitHub Pages.

## Current status

The repository has been initialized with the project structure, fixed data
schemas, and the push-based test workflow. Employer sources, the final role,
the title rule, the daily pipeline, and the site are the next implementation
milestones.

## Repository layout

| Path | Purpose |
| --- | --- |
| `.github/workflows/tests.yml` | Runs the pytest suite on every push. |
| `data/history.csv` | Fixed-path normalized posting history. |
| `data/raw/` | Fixed root for dated, compressed source responses. |
| `data/status.json` | Fixed-path summary of the latest pipeline run. |
| `src/job_watcher/schema.py` | Shared history/status schemas and path constants. |
| `tests/test_schema.py` | Initial schema contract tests. |
| `pyproject.toml` | Python package and test configuration. |
| `site/` | Reserved for the GitHub Pages application. |

## Fixed data paths

Raw responses will be stored as:

```text
data/raw/<UTC-date>/<source>.json.gz
```

The history builder will read only the raw files and write:

```text
data/history.csv
```

The latest-run summary will be written to:

```text
data/status.json
```

## Planned commands

Run the tests locally with:

```bash
python -m pytest
```

The history-build command will be documented here once the pipeline module is
implemented. It must rebuild `data/history.csv` from `data/raw/` alone.

## Sources and title rule

The source table will list every employer, the ATS hosting its board, the JSON
endpoint used, and any search term required to keep a board below 5,000
postings. The role and exact title-matching rule will be finalized before the
source adapters are implemented and will be recorded here.
