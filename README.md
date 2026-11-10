# Finance + Sports Job Watcher

[![Tests](https://github.com/juliandpascu-lab/sports-finance-jobs/actions/workflows/tests.yml/badge.svg)](https://github.com/juliandpascu-lab/sports-finance-jobs/actions/workflows/tests.yml)

An automated job-market watcher for the Financial Data Analytics project and
an early-career finance job search.

The project collects open jobs from sports-connected employers, banks, fintechs,
startups, credit employers, and general finance employers through public
applicant-tracking-system JSON endpoints. It maintains a reproducible posting
history, publishes daily changes through GitHub Issues, and serves an
installable site through GitHub Pages. The public site also includes a
browser-only Resume Vault with a side-by-side role finder and local tailoring
notes; the resume file itself is never committed or uploaded.

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
| `.openai/hosting.json` | Declares the static Sites deployment output. |
| `.gitignore` | Ignores local caches and generated development files. |
| `.github/workflows/tests.yml` | Runs the pytest suite on every push. |
| `.github/workflows/pipeline.yml` | Fetches public ATS feeds, updates history, creates the daily Issue, and deploys refreshed Pages. |
| `.github/workflows/pages.yml` | Deploys the `site/` directory to GitHub Pages. |
| `data/history.csv` | Fixed-path normalized posting history. |
| `data/raw/` | Fixed root for dated, compressed source responses. |
| `data/status.json` | Fixed-path summary of the latest pipeline run. |
| `site/` | Today, Browse, Market, private browser-only Resume Vault, PWA manifest, service worker, and generated data mirror. |
| `src/job_watcher/config.py` | Sports, banking, fintech, startup, and general-finance watchlist and role description. |
| `src/job_watcher/collector.py` | Public JSON fetching and compressed raw-file persistence. |
| `src/job_watcher/history.py` | Rebuilds history exclusively from raw files. |
| `src/job_watcher/issues.py` | Creates or updates the dated GitHub Issue and closes the previous one. |
| `src/job_watcher/normalize.py` | Converts Greenhouse, Lever, Ashby, Workday, SmartRecruiters, and Oracle responses to common columns. |
| `src/job_watcher/role.py` | Title-only rule for the twenty approved analyst job families plus preferred-market matching. |
| `src/job_watcher/schema.py` | Shared history/status schemas and path constants. |
| `src/job_watcher/status.py` | Writes the latest-run status summary. |
| `src/job_watcher/cli.py` | `run` and `build-history` commands. |
| `src/job_watcher/__init__.py` | Package marker for the watcher modules. |
| `tests/test_collector.py` | Tests paginated Workday, SmartRecruiters, and Oracle collection. |
| `tests/test_history.py` | First-seen, last-seen, removal, and reopening tests. |
| `tests/test_issues.py` | Tests detailed daily Issue listing output and role filtering. |
| `tests/test_normalize.py` | Conversion contract for every configured source and title-rule tests. |
| `tests/test_schema.py` | Schema contract tests. |
| `tests/test_status.py` | Tests successful-date counting in the status file. |
| `pyproject.toml` | Python package and test configuration. |
| `site/` | Source site bundle: Today, Browse, Market, Resume Vault, shared scripts/styles, PWA files, and deployment marker files. |
| `dist/` | Generated static deployment mirror of the site bundle. |

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

The watchlist now has 47 employer sources and is deliberately broad enough for
a new graduate or someone with one to two years of FP&A experience: professional
teams, sports technology, sports media, ticketing, sports commerce, sports
betting/prediction markets, investment banking, credit, fintech, startups,
higher education, and general finance. Every configured source is an anonymous
JSON request to the employer's ATS; the collector never reads a job-board HTML
page.

The configured requests return fewer than 5,000 postings per source. The
paginated adapters still enforce the brief's large-board rule: if a Workday,
SmartRecruiters, or Oracle response reports more than 5,000 postings and no
source-specific term is configured, the collector repeats the request with the
search term `finance`. JPMorgan Chase's unfiltered Oracle board currently
reports more than 5,000 postings, so its configured request explicitly uses
`finance`; Capital One and JLL use the same term to keep their broad boards
focused on this finance watchlist. These source-specific terms are documented
in the table below.

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
| University of Texas at Austin | Workday | `utaustin` |
| Nutrabolt | Workday | `nutrabolt` |
| Fidelity Investments | Workday | `fidelity` |
| Southwest Airlines | Workday | `southwest` |
| Tyson Foods | Workday | `tysonfoods` |
| J.B. Hunt Transport Services | Workday | `jbhunt` |
| University of Arkansas System | Workday | `uasys` |
| Q2 Holdings | Workday | `q2` |
| UMB Financial | Workday | `umb` |
| Capital One | Workday (`finance` search term) | `capitalone` |
| BlackRock | Workday | `blackrock` |
| Barclays | Workday | `barclays` |
| Guggenheim Securities | Workday | `guggenheim` |
| Morningstar | Workday | `morningstar` |
| KeyBank | Workday | `keybank` |
| JLL | Workday (`finance` search term) | `jll` |
| Intuitive | SmartRecruiters | `intuitive` |
| RR Donnelley | SmartRecruiters | `rrdonnelley` |
| Experian | SmartRecruiters | `experian` |
| Oracle | Oracle Recruiting Cloud | `oraclecareers` |
| JPMorgan Chase | Oracle Recruiting Cloud (`finance` search term) | `jpmorgan` |

The default role rule now includes only these requested job families:
**Financial Analyst I/II, FP&A Analyst, Corporate Finance Analyst, Revenue
Finance Analyst, Strategic Finance Analyst, Treasury Analyst, Credit Analyst,
Commercial Banking Analyst, Corporate Banking Analyst, Valuation Analyst,
Equity Research Associate, Investment Analyst, Investment Banking Analyst, M&A
Analyst, Transaction Advisory Analyst, Portfolio Analyst, Financial Risk
Analyst, Asset Management Analyst, Private Credit Analyst, and Corporate
Development Analyst.** It excludes obvious seniority titles such as senior,
lead, manager, director, VP, head, principal, staff, chief, and executive.
Matching is title-only and also accepts common title punctuation/order variants
such as `Analyst, Corporate Development`.

The default website view limits jobs to Dallas–Fort Worth, Kansas City, Austin,
Fayetteville/Northwest Arkansas, and New York. New York is restricted to
entry-level investment-banking or M&A titles; the other markets use only the
twenty approved job families. The history still retains every
posting returned by every source, as required by the project brief.

Browse defaults to postings whose employer-provided `posted_date` is within the
last seven days and can be changed to 24 hours, 3 days, 14 days, 30 days, or
any date. A new source does not make an old posting look new: the interface
uses `posted_date` for freshness and `first_seen` only for watcher history.

The Browse page also provides live, one-click searches for each target market
and finance query on Indeed, LinkedIn, Google Jobs, Jooble, ZipRecruiter,
Monster, CareerBuilder, SimplyHired, and Adzuna. Where supported, the link
requests approximately the last 24 hours. The pipeline does not scrape or log
into those sites: Indeed's documented APIs are partner/job-sync integrations,
and LinkedIn prohibits unauthorized automated scraping. The live shortcuts
therefore open current search pages directly, while the daily data pipeline
uses public employer ATS feeds.

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
