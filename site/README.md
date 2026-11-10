# Site

This directory contains the GitHub Pages application:

- `index.html` for the Today page;
- `browse.html` for open-posting search and shortlisting;
- `market.html` for browser-calculated market reports;
- `resume.html` for a private, browser-only DOCX viewer;
- shared styles, scripts, manifest, and service worker files.

The pages fetch `data/status.json` and `data/history.csv` in the browser,
calculate their views client-side, and cache the app shell plus the last loaded
data through the service worker for offline use. Today includes source-health
filtering, duplicate-board grouping, and browser-calculated match intelligence.
It also includes a dependency-free interactive market map with city-level pins,
Fresh/Active/Aging health filters, focus-role versus all-target-market scopes,
and direct links to the exact listings behind each market count. The state
geometry is bundled in `us-states.json`, so the map remains available offline.
Browse includes relevance sorting, saved searches, optional browser alerts while
the page is open, and live external-search shortcuts. Shortlists and saved
searches are stored locally in the visitor's browser.

The Resume Vault never contains the resume file. It asks the visitor to select a
DOCX from their own computer, checks its fingerprint, and extracts a temporary
text preview in browser memory. Its role finder loads the already-published
open-job history beside the preview and calculates title-and-skill tailoring
notes in the browser. The file is not uploaded, written to the repository, or
saved in browser storage.

The visual system uses an original Wolf Desk trading-floor direction: dark
terminal navigation, brass accents, green market signals, ticker-strip context,
high-pressure brokerage copy, and newspaper-style headings. It does not include
movie logos, screenshots, dialogue, or other copyrighted film assets.
