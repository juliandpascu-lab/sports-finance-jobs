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

The first live collection is complete. The daily workflow runs at 23:00 UTC,
which is 5:00 PM Central during the current CST season,
updates the raw snapshots and normalized history, opens or updates that day's
GitHub Issue, pushes the generated data commit, and deploys the refreshed site.

- Repository: <https://github.com/juliandpascu-lab/sports-finance-jobs>
- Live site: <https://juliandpascu-lab.github.io/sports-finance-jobs/>
- Daily report: <https://github.com/juliandpascu-lab/sports-finance-jobs/issues>

## Repository layout and complete file inventory

The table below documents every non-snapshot file tracked by the repository.
Daily compressed responses are generated from the documented raw-file pattern
because their contents and count change every run.

| Path | Purpose |
| --- | --- |
| `README.md` | Project instructions, rubric-facing documentation, source table, commands, and deployment links. |
| `.gitignore` | Ignores local caches, virtual environments, and generated development files. |
| `.openai/hosting.json` | Declares the static Sites deployment output. |
| `.github/workflows/tests.yml` | Installs the project and runs pytest on every push. |
| `.github/workflows/pipeline.yml` | Runs the daily collection, history build, status write, Issue sync, data commit, and Pages deployment. |
| `.github/workflows/pages.yml` | Deploys the tracked `site/` directory to GitHub Pages after site changes. |
| `pyproject.toml` | Python package metadata, optional pytest dependency, package discovery, and pytest configuration. |
| `data/history.csv` | Fixed-path normalized posting history with one row per posting. |
| `data/status.json` | Fixed-path summary of the latest run and every source result. |
| `data/raw/.gitkeep` | Keeps the raw-data root in the repository before the first snapshot. |
| `data/raw/<UTC-date>/<source>.json.gz` | Compressed anonymous ATS response; one generated file per source and collection date. The source keys are listed in the Sources table below. |
| `src/job_watcher/__init__.py` | Package marker for the watcher modules. |
| `src/job_watcher/config.py` | Employer watchlist, ATS endpoints, source-specific search terms, role name, and title-rule summary. |
| `src/job_watcher/collector.py` | Fetches public JSON, paginates supported ATS boards, isolates source failures, and writes compressed raw responses. |
| `src/job_watcher/history.py` | Rebuilds the history exclusively from dated raw files and applies first-seen, last-seen, removed, and reopened logic. |
| `src/job_watcher/issues.py` | Creates or updates the dated GitHub Issue, lists changes with application links, and closes the previous day’s Issue. |
| `src/job_watcher/normalize.py` | Converts Greenhouse, Lever, Ashby, Workday, SmartRecruiters, and Oracle responses to common columns. |
| `src/job_watcher/role.py` | Applies the twenty approved title families, seniority exclusions, school-program exclusions, and preferred-market matching. |
| `src/job_watcher/schema.py` | Defines fixed paths, history columns, status keys, and raw-file paths. |
| `src/job_watcher/status.py` | Calculates and writes the latest-run status summary. |
| `src/job_watcher/cli.py` | Provides the `run` and `build-history` command-line entry points. |
| `tests/test_collector.py` | Tests paginated Workday, SmartRecruiters, and Oracle collection. |
| `tests/test_history.py` | Tests first-seen, last-seen, removal, reopening, and missing-source behavior. |
| `tests/test_issues.py` | Tests detailed daily Issue listing output and role filtering. |
| `tests/test_normalize.py` | Tests conversion to common columns for every configured source and the title/market rules. |
| `tests/test_schema.py` | Tests the assignment’s fixed data paths, history columns, and status keys. |
| `tests/test_status.py` | Tests successful-date counting from raw files. |
| `site/.gitkeep` | Keeps the source site directory present in the repository. |
| `site/.nojekyll` | Prevents GitHub Pages from applying Jekyll processing to the static site. |
| `site/README.md` | Documents the site pages, browser-only Resume Vault, data loading, offline behavior, and visual system. |
| `site/index.html` | Today page: latest run, source health, counts, changes, market map, and current matches. |
| `site/browse.html` | Browse page: role/all-posting switch, filters, search, sorting, apply links, and shortlist stars. |
| `site/market.html` | Market page shell containing the six rubric-required findings and chart containers. |
| `site/resume.html` | Browser-only Resume Vault page with the local resume viewer and side-by-side job finder. |
| `site/app.js` | Shared Today/Browse data loading, role filtering, maps, job cards, searches, shortlist, and saved-search behavior. |
| `site/market.js` | Browser-side Market calculations for new, removed, open, days-open, seven-day, and location metrics. |
| `site/resume.js` | Browser-only DOCX reading, resume matching, and local tailoring-note behavior. |
| `site/styles.css` | Shared Wolf Desk typography, colors, responsive layout, cards, charts, controls, and accessibility styling. |
| `site/service-worker.js` | Caches the app shell and last loaded data for offline use. |
| `site/manifest.webmanifest` | PWA name, start URL, display mode, theme colors, and icon declaration. |
| `site/icon.svg` | App favicon and manifest icon. |
| `site/wolf-desk.svg` | Original trading-floor/wolf visual used on the Today page. |
| `site/us-states.json` | Bundled United States geometry used by the interactive market map. |
| `site/data/history.csv` | Generated Pages mirror of `data/history.csv`. |
| `site/data/status.json` | Generated Pages mirror of `data/status.json`. |
| `dist/.gitkeep` | Keeps the generated deployment mirror directory present. |
| `dist/.nojekyll` | Prevents Jekyll processing if the deployment mirror is served directly. |
| `dist/README.md` | Deployment-mirror documentation. |
| `dist/index.html` | Generated Today page mirror. |
| `dist/browse.html` | Generated Browse page mirror. |
| `dist/market.html` | Generated Market page mirror. |
| `dist/app.js` | Generated shared site JavaScript mirror. |
| `dist/market.js` | Generated Market JavaScript mirror. |
| `dist/styles.css` | Generated shared stylesheet mirror. |
| `dist/service-worker.js` | Generated service-worker mirror. |
| `dist/manifest.webmanifest` | Generated PWA manifest mirror. |
| `dist/icon.svg` | Generated app-icon mirror. |
| `dist/data/history.csv` | Generated deployment mirror of the normalized history. |
| `dist/data/status.json` | Generated deployment mirror of the latest status. |

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

The watchlist now has 49 employer sources and is deliberately broad enough for
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
| Commerce Bank | Workday | `commercebank` |
| Federal Reserve System | Workday | `federalreserve` |

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
such as `Analyst, Corporate Development`. Financial Analyst, FP&A, Corporate
Finance, Treasury, Credit, Commercial Banking, Corporate Banking, and Financial
Risk roles are prioritized in the site’s default ordering. Campus, summer,
student, internship, and school-tagged IBD recruiting programs are excluded
from `in_role`, while the raw postings remain in history as required by the
brief.

The default website view limits jobs to Dallas–Fort Worth, Kansas City, Austin,
Fayetteville/Northwest Arkansas, and New York. All five markets use the
approved finance, credit, banking, risk, valuation, investment, and M&A title
families; school-specific IBD programs are excluded. The history still retains
every posting returned by every source, as required by the project brief.

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
