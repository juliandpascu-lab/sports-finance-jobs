# Sports Finance Job Watcher

[![Tests](https://github.com/juliandpascu-lab/sports-finance-jobs/actions/workflows/tests.yml/badge.svg)](https://github.com/juliandpascu-lab/sports-finance-jobs/actions/workflows/tests.yml)

An automated job-market watcher for the Financial Data Analytics project.

The project collects open jobs from sports-connected employers and public
investment-banking/M&A firms through their public applicant-tracking-system JSON endpoints, maintains a reproducible
posting history, publishes daily changes through GitHub Issues, and serves a
three-page installable site through GitHub Pages.

## Current status

The first live collection is complete. The daily workflow runs at 12:17 UTC,
updates the raw snapshots and normalized history, opens or updates that day's
GitHub Issue, pushes the generated data commit, and deploys the refreshed site.

- Repository: <https://github.com/juliandpascu-lab/sports-finance-jobs>
- Live site: <https://juliandpascu-lab.github.io/sports-finance-jobs/>
- Daily report: <https://github.com/juliandpascu-lab/sports-finance-jobs/issues>

## Repository layout

| Path | Purpose |
| --- | --- |
| `.github/workflows/tests.yml` | Runs the pytest suite on every push. |
| `.github/workflows/pipeline.yml` | Fetches public ATS feeds, updates history, creates the daily Issue, and deploys refreshed Pages. |
| `.github/workflows/pages.yml` | Deploys the `site/` directory to GitHub Pages. |
| `data/history.csv` | Fixed-path normalized posting history. |
| `data/raw/` | Fixed root for dated, compressed source responses. |
| `data/status.json` | Fixed-path summary of the latest pipeline run. |
| `site/` | Today, Browse, Market, PWA manifest, service worker, and generated data mirror. |
| `src/job_watcher/config.py` | Sports and investment-banking employer watchlist and role description. |
| `src/job_watcher/collector.py` | Public JSON fetching and compressed raw-file persistence. |
| `src/job_watcher/history.py` | Rebuilds history exclusively from raw files. |
| `src/job_watcher/issues.py` | Creates or updates the dated GitHub Issue and closes the previous one. |
| `src/job_watcher/normalize.py` | Converts Greenhouse, Lever, and Ashby responses to common columns. |
| `src/job_watcher/role.py` | Title-only entry-level finance/FP&A/analytics/IB/M&A rule plus preferred-market matching. |
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

## Commands

Run the tests locally with:

```bash
python -m pytest
```

The history-build command rebuilds `data/history.csv` from `data/raw/` alone.

## Sources and title rule

The watchlist is deliberately broad enough for a new graduate: professional
teams, sports technology, sports media, ticketing, sports commerce, sports
betting/prediction markets, and public investment-banking/M&A firms. All feeds
are public JSON endpoints and currently return fewer than 5,000 postings, so no
search term is required.

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
| Campus Apps / Financial Technology Partners | Greenhouse | `campusapps` |
| Ducera Partners | Greenhouse | `ducerapartnerscampus` |
| Financial Technology Partners | Greenhouse | `financialtechnologypartners` |
| GLC Advisors | Greenhouse | `glcadvisors` |
| Solomon Partners | Greenhouse | `solomonpartnersprofessionals` |
| SAX Advisory Group | Greenhouse | `saxllp` |
| OffDeal | Ashby | `offdeal` |
| Four Hands | Greenhouse | `fourhands` |
| Capital Farm Credit | Greenhouse | `capitalfarmcredit` |
| Success Academy Charter Schools | Greenhouse | `successacademycharterschool` |
| Take-Two Interactive Software | Greenhouse | `taketwo` |

The default role rule is: **include titles containing analyst, analytics,
finance, FP&A, financial, strategy, planning, revenue, pricing, operations,
accounting, treasury, business intelligence, investment banking, investment
banker, IBD, M&A, merger, acquisition, corporate development, transaction, or
deals; exclude obvious seniority titles such as senior, lead, manager, director,
VP, head, principal, staff, chief, and executive.** This is intentionally
title-based so it catches analyst, internship, fellow, and 1–2-year FP&A paths
without inventing experience requirements that an ATS feed does not provide.

The default website view limits jobs to Dallas–Fort Worth, Kansas City, Austin,
Fayetteville/Northwest Arkansas, and New York. New York is restricted to
entry-level investment-banking or M&A titles; the other markets use the broader
finance, FP&A, business, and analytics rule. The history still retains every
posting returned by every source, as required by the project brief.

Browse defaults to postings whose employer-provided `posted_date` is within the
last seven days and can be changed to 24 hours, 3 days, 14 days, 30 days, or
any date. A new source does not make an old posting look new: the interface
uses `posted_date` for freshness and `first_seen` only for watcher history.

The Browse page also provides live, one-click Indeed and LinkedIn searches for
each target market and finance query. The pipeline does not scrape or log into
those sites: Indeed's documented APIs are partner/job-sync integrations, and
LinkedIn requires approved partner access and prohibits unauthorized automated
scraping. The live shortcuts therefore open the current search pages directly,
while the daily data pipeline uses public employer ATS feeds.

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
