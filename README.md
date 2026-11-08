# FDA Job Watcher

An automated job-market watcher for the Financial Data Analytics project.

The finished project will collect open jobs from at least 15 employers through
their unauthenticated applicant-tracking-system JSON endpoints, maintain a
reproducible posting history, publish daily changes through GitHub Issues, and
serve a three-page installable site through GitHub Pages.

## Current status

The repository now contains the source registry, daily collection pipeline,
deterministic history builder, initial tests, and the three-page offline-capable
site. The first live collection is the next milestone.

## Repository layout

| Path | Purpose |
| --- | --- |
| `.github/workflows/tests.yml` | Runs the pytest suite on every push. |
| `.github/workflows/pipeline.yml` | Fetches public ATS feeds, updates history, and creates the daily Issue. |
| `.github/workflows/pages.yml` | Deploys the `site/` directory to GitHub Pages. |
| `data/history.csv` | Fixed-path normalized posting history. |
| `data/raw/` | Fixed root for dated, compressed source responses. |
| `data/status.json` | Fixed-path summary of the latest pipeline run. |
| `site/` | Today, Browse, Market, PWA manifest, service worker, and generated data mirror. |
| `src/job_watcher/config.py` | Sports employer watchlist and role description. |
| `src/job_watcher/collector.py` | Public JSON fetching and compressed raw-file persistence. |
| `src/job_watcher/history.py` | Rebuilds history exclusively from raw files. |
| `src/job_watcher/issues.py` | Creates or updates the dated GitHub Issue and closes the previous one. |
| `src/job_watcher/normalize.py` | Converts Greenhouse, Lever, and Ashby responses to common columns. |
| `src/job_watcher/role.py` | Title-only early-career finance/business/analytics rule. |
| `src/job_watcher/schema.py` | Shared history/status schemas and path constants. |
| `src/job_watcher/status.py` | Writes the latest-run status summary. |
| `src/job_watcher/cli.py` | `run` and `build-history` commands. |
| `tests/test_history.py` | First-seen, last-seen, removal, and reopening tests. |
| `tests/test_normalize.py` | Conversion contract for every configured source and title-rule tests. |
| `tests/test_schema.py` | Schema contract tests. |
| `pyproject.toml` | Python package and test configuration. |

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

The initial watchlist is deliberately sports-connected and broad enough for a
new graduate: professional teams, sports technology, sports media, ticketing,
sports commerce, and sports betting/prediction markets. All feeds are public
JSON endpoints and currently return fewer than 5,000 postings, so no search
term is required.

| Employer | ATS | Source key |
| --- | --- | --- |
| Baltimore Orioles | Greenhouse | `baltimoreorioles` |
| NFL | Greenhouse | `nflcareers` |
| Detroit Lions | Greenhouse | `lions` |
| FC Cincinnati | Greenhouse | `fccincinnati` |
| Hudl | Greenhouse | `hudl` |
| Genius Sports | Greenhouse | `geniussports` |
| SeatGeek | Greenhouse | `seatgeek` |
| SB Nation | Greenhouse | `sbnation` |
| Fanatics Betting & Gaming | Greenhouse | `fanaticsfbg` |
| The Athletic | Lever | `theathletic` |
| Legend | Lever | `legend` |
| FloSports | Ashby | `flosports` |
| Novig | Ashby | `novig` |
| Onyx Games | Ashby | `onyx` |
| Brodie Rec League | Ashby | `brodie_rec_league` |

The default role rule is: **include titles containing analyst, analytics,
finance, FP&A, financial, strategy, planning, revenue, pricing, operations,
accounting, treasury, or business intelligence; exclude obvious seniority
titles such as senior, lead, manager, director, VP, head, principal, staff,
chief, and executive.** This keeps the default view focused on early-career
finance and adjacent analytical work while Browse can still show every posting.

## Commands

Run the complete daily process locally with:

```bash
python -m job_watcher.cli run --skip-issues --skip-commit
```

Rebuild the history and status only from existing raw files with:

```bash
python -m job_watcher.cli build-history
```

The deployment copy at `site/data/` is generated from the fixed files under
`data/` so GitHub Pages can serve the static application.
