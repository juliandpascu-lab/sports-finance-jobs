# Site

This directory contains the GitHub Pages application:

- `index.html` for the Today page;
- `browse.html` for open-posting search and shortlisting;
- `market.html` for browser-calculated market reports;
- shared styles, scripts, manifest, and service worker files.

The pages fetch `data/status.json` and `data/history.csv` in the browser,
calculate their views client-side, and cache the app shell plus the last loaded
data through the service worker for offline use. Today includes source-health
filtering, duplicate-board grouping, and browser-calculated match intelligence.
It also includes a dependency-free interactive market map with city-level pins,
Fresh/Active/Aging health filters, focus-role versus all-target-market scopes,
and direct links to the exact listings behind each market count.
Browse includes relevance sorting, saved searches, optional browser alerts while
the page is open, and live external-search shortcuts. Shortlists and saved
searches are stored locally in the visitor's browser.
