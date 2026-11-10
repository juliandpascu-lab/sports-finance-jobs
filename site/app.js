const SOURCE_LABELS = {
  baltimoreorioles: "Baltimore Orioles", nflcareers: "NFL", lions: "Detroit Lions", fccincinnati: "FC Cincinnati",
  hudl: "Hudl", geniussports: "Genius Sports", seatgeek: "SeatGeek", sbnation: "SB Nation",
  fanaticsfbg: "Fanatics Betting & Gaming", theathletic: "The Athletic", legend: "Legend", flosports: "FloSports",
  novig: "Novig", onyx: "Onyx Games", brodie_rec_league: "Brodie Rec League",
  campusapps: "Campus Apps / FT Partners", ducerapartnerscampus: "Ducera Partners",
  financialtechnologypartners: "Financial Technology Partners", glcadvisors: "GLC Advisors",
  solomonpartnersprofessionals: "Solomon Partners", saxllp: "SAX Advisory Group", offdeal: "OffDeal",
  fourhands: "Four Hands", capitalfarmcredit: "Capital Farm Credit",
  successacademycharterschool: "Success Academy", taketwo: "Take-Two Interactive",
  utaustin: "University of Texas at Austin", nutrabolt: "Nutrabolt", fidelity: "Fidelity Investments",
  southwest: "Southwest Airlines", tysonfoods: "Tyson Foods", jbhunt: "J.B. Hunt Transport Services",
  uasys: "University of Arkansas System", q2: "Q2 Holdings", umb: "UMB Financial",
  capitalone: "Capital One", blackrock: "BlackRock", barclays: "Barclays",
  guggenheim: "Guggenheim Securities", morningstar: "Morningstar", keybank: "KeyBank", jll: "JLL",
  jpmorgan: "JPMorgan Chase",
  intuitive: "Intuitive", rrdonnelley: "RR Donnelley", experian: "Experian", oraclecareers: "Oracle"
};

const TARGET_MARKETS = ["Dallas-Fort Worth", "Kansas City", "Austin", "Fayetteville / Northwest Arkansas", "New York"];
const MARKET_SEARCH_LOCATIONS = {
  "Dallas-Fort Worth": "Dallas-Fort Worth, TX",
  "Kansas City": "Kansas City, MO",
  "Austin": "Austin, TX",
  "Fayetteville / Northwest Arkansas": "Fayetteville, AR",
  "New York": "New York, NY"
};
const MARKET_MARKERS = {
  "Dallas-Fort Worth": ["dallas-fort worth", "dfw", "dallas, tx", "dallas tx", "dallas texas", "dallas, texas", "fort worth, tx", "fort worth tx", "fort worth texas", "fort worth, texas", "arlington, tx", "arlington tx", "arlington texas", "frisco, tx", "frisco tx", "frisco texas", "frisco, texas", "irving, tx", "irving tx", "irving texas", "irving, texas", "mckinney, tx", "mckinney tx", "mckinney texas", "mckinney, texas", "plano, tx", "plano tx", "plano texas", "plano, texas", "richardson, tx", "richardson tx", "richardson texas", "richardson, texas"],
  "Kansas City": ["kansas city", "lee's summit", "lenexa", "olathe", "overland park", "shawnee"],
  "Austin": ["austin, tx", "austin tx", "austin texas", "austin, texas", "cedar park, tx", "cedar park tx", "cedar park texas", "cedar park, texas", "georgetown, tx", "georgetown tx", "georgetown texas", "georgetown, texas", "pflugerville, tx", "pflugerville tx", "pflugerville texas", "pflugerville, texas", "round rock, tx", "round rock tx", "round rock texas", "round rock, texas"],
  "Fayetteville / Northwest Arkansas": ["northwest arkansas", "nwa", "fayetteville, ar", "fayetteville ar", "fayetteville, arkansas", "fayetteville arkansas", "bentonville, ar", "bentonville ar", "bentonville, arkansas", "bentonville arkansas", "bella vista, ar", "bella vista ar", "bella vista, arkansas", "bella vista arkansas", "rogers, ar", "rogers ar", "rogers, arkansas", "rogers arkansas", "springdale, ar", "springdale ar", "springdale, arkansas", "springdale arkansas", "lowell, ar", "lowell ar", "lowell, arkansas", "lowell arkansas", "johnson, ar", "johnson ar", "johnson, arkansas", "johnson arkansas", "tontitown, ar", "tontitown ar", "tontitown, arkansas", "tontitown arkansas", "siloam springs, ar", "siloam springs ar", "siloam springs, arkansas", "siloam springs arkansas"],
  "New York": ["new york", "new york city", "nyc", "brooklyn", "bronx", "jersey city", "manhattan", "nassau county", "queens", "staten island", "suffolk county", "white plains"]
};
const MAP_COORDINATES = {
  "Dallas-Fort Worth": { x: 358, y: 218, label: "DFW" },
  "Kansas City": { x: 380, y: 150, label: "KC" },
  "Austin": { x: 351, y: 245, label: "Austin" },
  "Fayetteville / Northwest Arkansas": { x: 384, y: 184, label: "NWA" },
  "New York": { x: 575, y: 132, label: "NY" }
};
const INVESTMENT_BANKING_TERMS = ["investment banking", "investment banker", "ibd", "m&a", "merger", "corporate development", "transaction", "deals"];
const APPROVED_ROLE_SEARCHES = [
  "Financial Analyst", "FP&A Analyst", "Corporate Finance Analyst", "Revenue Finance Analyst",
  "Strategic Finance Analyst", "Treasury Analyst", "Credit Analyst", "Commercial Banking Analyst",
  "Corporate Banking Analyst", "Valuation Analyst", "Equity Research Associate", "Investment Analyst",
  "Investment Banking Analyst", "M&A Analyst", "Transaction Advisory Analyst", "Portfolio Analyst",
  "Financial Risk Analyst", "Asset Management Analyst", "Private Credit Analyst", "Corporate Development Analyst"
];
const NEW_YORK_ROLE_SEARCHES = [
  "Investment Banking Analyst", "M&A Analyst", "Transaction Advisory Analyst", "Valuation Analyst",
  "Equity Research Associate", "Investment Analyst", "Corporate Development Analyst"
];

function readStoredJSON(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    return value == null ? fallback : value;
  } catch (error) {
    return fallback;
  }
}

const storedShortlist = readStoredJSON("sportsFinanceShortlist", []);
const state = {
  data: null,
  mapGeometry: null,
  shortlist: new Set(Array.isArray(storedShortlist) ? storedShortlist : []),
  savedSearches: readStoredJSON("sportsFinanceSavedSearches", []),
  mapMarket: "all",
  mapScope: "focus"
};
if (!Array.isArray(state.savedSearches)) state.savedSearches = [];

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[char]));
}

function parseCSV(text) {
  const rows = [];
  let row = [], value = "", quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i], next = text[i + 1];
    if (char === '"' && quoted && next === '"') { value += '"'; i += 1; continue; }
    if (char === '"') { quoted = !quoted; continue; }
    if (char === ',' && !quoted) { row.push(value); value = ""; continue; }
    if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(value); value = "";
      if (row.some((cell) => cell !== "")) rows.push(row);
      row = []; continue;
    }
    value += char;
  }
  if (value || row.length) { row.push(value); rows.push(row); }
  const headers = rows.shift() || [];
  return rows.map((cells) => Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""])));
}

function asBool(value) { return String(value).toLowerCase() === "true"; }
function asDate(value) { return value ? new Date(`${value}T00:00:00Z`) : null; }
function dateDiff(start, end) {
  const first = asDate(start), last = asDate(end);
  return first && last ? Math.max(0, Math.round((last - first) / 86400000)) : 0;
}
function postingDate(row) { return row.posted_date || row.first_seen; }
function postedAge(row) { return dateDiff(postingDate(row), latestDate(state.data)); }
function latestDate(data) { return data.status.run_time?.slice(0, 10) || data.history.reduce((latest, row) => row.last_seen > latest ? row.last_seen : latest, ""); }
function formatDate(value) { return value ? new Date(`${value}T00:00:00Z`).toLocaleDateString(undefined, {month:"short", day:"numeric", year:"numeric", timeZone:"UTC"}) : "—"; }
function formatDateTime(value) { return value ? new Date(value).toLocaleString(undefined, {month:"short", day:"numeric", hour:"numeric", minute:"2-digit", timeZoneName:"short"}) : "No completed run yet"; }
function saveShortlist() { localStorage.setItem("sportsFinanceShortlist", JSON.stringify([...state.shortlist])); }
function saveSavedSearches() { localStorage.setItem("sportsFinanceSavedSearches", JSON.stringify(state.savedSearches)); }
function normalizedText(value) { return String(value || "").toLowerCase().replace(/\s+/g, " ").trim(); }
function matchedMarkets(row) {
  const location = normalizedText(row.location);
  return TARGET_MARKETS.filter((market) => MARKET_MARKERS[market].some((marker) => location.includes(marker)));
}
function isInvestmentBankingOrMA(row) {
  const title = normalizedText(row.title);
  return INVESTMENT_BANKING_TERMS.some((term) => title.includes(term)) || (title.includes("acquisition") && ["investment", "corporate", "merger", "m&a", "transaction", "deal"].some((term) => title.includes(term)));
}
function isTargetMarketRow(row) { return matchedMarkets(row).length > 0; }
function isPreferredRow(row) {
  const markets = matchedMarkets(row);
  return asBool(row.in_role) && markets.length > 0 && (markets.some((market) => market !== "New York") || isInvestmentBankingOrMA(row));
}
function marketLabel(row) { return matchedMarkets(row).join(" · "); }
function roleFamily(row) {
  const title = normalizedText(row.title);
  if (title.includes("fp&a")) return "FP&A Analyst";
  if (title.includes("financial analyst")) return "Financial Analyst";
  if (title.includes("credit analyst")) return "Credit Analyst";
  if (title.includes("investment banking") || title.includes("m&a") || title.includes("merger")) return "Investment Banking / M&A";
  if (title.includes("valuation")) return "Valuation Analyst";
  if (title.includes("treasury")) return "Treasury Analyst";
  if (title.includes("corporate development")) return "Corporate Development Analyst";
  if (title.includes("portfolio")) return "Portfolio Analyst";
  if (title.includes("risk")) return "Financial Risk Analyst";
  return "Other approved role";
}
function relevanceScore(row) {
  const title = normalizedText(row.title);
  let score = 40;
  if (APPROVED_ROLE_SEARCHES.some((role) => title.includes(normalizedText(role)))) score += 25;
  else if (title.includes("analyst") || title.includes("associate")) score += 15;
  if (asBool(row.in_role)) score += 15;
  if (isTargetMarketRow(row)) score += 10;
  const age = postedAge(row);
  if (age === 0) score += 10;
  else if (age <= 1) score += 7;
  else if (age <= 7) score += 3;
  return Math.min(99, score);
}
function duplicateKey(row) { return [row.employer, row.title, row.location].map(normalizedText).join("|"); }
function groupedRows(rows) {
  const byKey = new Map();
  rows.forEach((row) => {
    const key = duplicateKey(row);
    const candidates = byKey.get(key) || [];
    let group = candidates.find((candidate) => !candidate.sources.has(row.source));
    if (!group) {
      group = { primary: row, rows: [row], sources: new Set([row.source]) };
      candidates.push(group);
      byKey.set(key, candidates);
    } else {
      group.rows.push(row);
      group.sources.add(row.source);
    }
  });
  return [...byKey.values()].flat().map((group) => ({ ...group.primary, _duplicates: group.rows }));
}
function externalJobSearchURL(site, query, location) {
  if (site === "Indeed") return `https://www.indeed.com/jobs?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}&fromage=1`;
  if (site === "LinkedIn") return `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&f_TPR=r86400`;
  if (site === "Google Jobs") return `https://www.google.com/search?q=${encodeURIComponent(`${query} jobs in ${location}`)}`;
  if (site === "Jooble") return `https://jooble.org/SearchResult?ukw=${encodeURIComponent(query)}&loc=${encodeURIComponent(location)}`;
  if (site === "ZipRecruiter") return `https://www.ziprecruiter.com/jobs-search?search=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&days=1`;
  if (site === "Monster") return `https://www.monster.com/jobs/search/?q=${encodeURIComponent(query)}&where=${encodeURIComponent(location)}&tm=1`;
  if (site === "CareerBuilder") return `https://www.careerbuilder.com/jobs?keywords=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&posted=1`;
  if (site === "SimplyHired") return `https://www.simplyhired.com/search?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}&fdb=1`;
  if (site === "Adzuna") return `https://www.adzuna.com/search?q=${encodeURIComponent(query)}&loc=${encodeURIComponent(location)}`;
  return `https://www.google.com/search?q=${encodeURIComponent(`${query} jobs in ${location}`)}`;
}
function renderExternalSearches() {
  const element = document.getElementById("external-searches");
  if (!element) return;
  const queries = ["Financial Analyst I / II", "FP&A Analyst", "Corporate Finance Analyst", "Credit Analyst"];
  const bankingQueries = ["Investment Banking Analyst", "M&A Analyst", "Transaction Advisory Analyst", "Valuation Analyst"];
  const liveSites = ["Indeed", "LinkedIn", "Google Jobs", "Jooble", "ZipRecruiter", "Monster", "CareerBuilder", "SimplyHired", "Adzuna"];
  element.innerHTML = TARGET_MARKETS.map((market) => {
    const searchQueries = market === "New York" ? bankingQueries : queries;
    const approvedSearches = market === "New York" ? NEW_YORK_ROLE_SEARCHES : APPROVED_ROLE_SEARCHES;
    const approvedQuery = approvedSearches.map((query) => `"${query}"`).join(" OR ");
    const location = MARKET_SEARCH_LOCATIONS[market];
    const roleLabel = market === "New York" ? "Eligible IB/M&A role families" : "All 20 approved role families";
    const linkSet = (query) => `<div class="external-search-links">${liveSites.map((site) => `<a href="${externalJobSearchURL(site, query, location)}" target="_blank" rel="noopener">${site === "Google Jobs" ? "Google" : escapeHTML(site)} ↗</a>`).join("")}</div>`;
    const allRolesLink = `<div class="external-search-item"><span>${roleLabel}</span>${linkSet(approvedQuery)}</div>`;
    const links = searchQueries.map((query) => `<div class="external-search-item"><span>${escapeHTML(query)}</span>${linkSet(query)}</div>`).join("");
    return `<div class="external-market"><strong>${escapeHTML(market)}</strong>${allRolesLink}${links}</div>`;
  }).join("");
}

function jobCard(row, options = {}) {
  const days = dateDiff(row.first_seen, latestDate(state.data));
  const postedDays = postedAge(row);
  const star = state.shortlist.has(row.posting_id);
  const duplicates = row._duplicates || [row];
  const sources = [...new Set(duplicates.map((item) => SOURCE_LABELS[item.source] || item.source || "Employer board"))];
  const score = isPreferredRow(row) ? `<span class="match-score">${relevanceScore(row)}% match</span>` : "";
  const duplicateNote = duplicates.length > 1 ? `<div class="job-duplicate"><strong>${duplicates.length} board listings</strong><span>${escapeHTML(sources.join(" · "))}</span><div class="job-duplicate-links">${duplicates.map((item) => `<a href="${escapeHTML(item.url)}" target="_blank" rel="noopener">${escapeHTML(SOURCE_LABELS[item.source] || item.source || "Source")} ↗</a>`).join("")}</div></div>` : "";
  return `<article class="job-card ${options.compact ? "job-card-compact" : ""}">
    <div class="job-card-main"><p class="job-employer">${escapeHTML(row.employer)} <span>·</span> ${escapeHTML(row.department || "Business function")}</p>
    <h3><a href="${escapeHTML(row.url)}" target="_blank" rel="noopener">${escapeHTML(row.title)}</a></h3>
    <div class="job-signals">${score}${duplicates.length > 1 ? `<span class="duplicate-badge">${duplicates.length} sources</span>` : ""}</div>
    <p class="job-meta"><strong>Location:</strong> ${escapeHTML(row.location || "Location not provided")} · ${escapeHTML(marketLabel(row) || "Outside target markets")}</p>
    <p class="job-meta"><strong>Posted:</strong> ${escapeHTML(formatDate(postingDate(row)))} · <strong>Source:</strong> ${escapeHTML(SOURCE_LABELS[row.source] || row.source || "Employer board")}${options.open ? ` · ${postedDays} days since posted · ${days} days observed` : ""}</p>${duplicateNote}</div>
    <div class="job-card-actions"><button class="star-button ${star ? "saved" : ""}" data-star="${escapeHTML(row.posting_id)}" aria-label="${star ? "Remove from" : "Save to"} shortlist">${star ? "★" : "☆"}</button><a class="apply-button" href="${escapeHTML(row.url)}" target="_blank" rel="noopener">Apply ↗</a></div>
  </article>`;
}

function renderJobList(element, rows, options = {}) {
  const displayRows = options.groupDuplicates === false ? rows : groupedRows(rows);
  element.innerHTML = displayRows.length ? displayRows.map((row) => jobCard(row, options)).join("") : `<div class="empty-state"><span>◎</span><p>${escapeHTML(options.empty || "Nothing new in this snapshot.")}</p></div>`;
}

function bindStars() {
  document.querySelectorAll("[data-star]").forEach((button) => button.addEventListener("click", () => {
    const id = button.dataset.star;
    if (state.shortlist.has(id)) state.shortlist.delete(id); else state.shortlist.add(id);
    saveShortlist();
    if (document.body.dataset.page === "browse") renderBrowse(); else button.classList.toggle("saved");
  }));
}

function renderTopbar(status) {
  const element = document.querySelector("[data-topbar-text]");
  if (!element) return;
  const sources = status.sources || [];
  const healthy = sources.filter((source) => source.ok).length;
  element.textContent = `${healthy}/${sources.length} feeds checked · last sync ${formatDateTime(status.run_time)}`;
}

function renderSourceHealth(status) {
  const sources = status.sources || [];
  const good = sources.filter((source) => source.ok).length;
  const health = document.getElementById("source-health");
  const detail = document.getElementById("source-health-detail");
  const list = document.getElementById("source-list");
  const errors = document.getElementById("source-errors");
  const filter = document.getElementById("source-filter");
  if (!health || !detail || !list || !errors) return;
  health.textContent = `${good}/${sources.length} healthy`;
  detail.textContent = `${sources.length} public boards · ${good} healthy · ${formatDateTime(status.run_time)}`;
  const renderRows = () => {
    const query = normalizedText(filter?.value);
    const visible = sources.filter((source) => normalizedText(SOURCE_LABELS[source.name] || source.name).includes(query));
    list.innerHTML = visible.map((source) => `<div class="source-row"><span class="source-state ${source.ok ? "ok" : "bad"}"></span><span>${escapeHTML(SOURCE_LABELS[source.name] || source.name)}</span><strong>${source.count}</strong></div>`).join("") || `<div class="empty-state"><p>No matching source.</p></div>`;
  };
  if (filter && !filter.dataset.bound) {
    filter.addEventListener("input", renderRows);
    filter.dataset.bound = "true";
  }
  renderRows();
  const failed = sources.filter((source) => !source.ok);
  errors.innerHTML = failed.length ? `<p><strong>${failed.length} source${failed.length === 1 ? "" : "s"} failed.</strong> The run still completed; failed feeds will be retried on the next daily refresh.</p>` : `<p class="source-ok-note">All watched feeds returned successfully for this run.</p>`;
}

function renderMatchInsights(rows) {
  const marketElement = document.getElementById("insight-top-market");
  if (!marketElement) return;
  const markets = Object.fromEntries(TARGET_MARKETS.map((market) => [market, 0]));
  const employers = {};
  rows.forEach((row) => {
    matchedMarkets(row).forEach((market) => { markets[market] += 1; });
    employers[row.employer] = (employers[row.employer] || 0) + 1;
  });
  const marketEntries = Object.entries(markets).sort((a, b) => b[1] - a[1]);
  const employerEntries = Object.entries(employers).sort((a, b) => b[1] - a[1]);
  const topMarket = marketEntries[0];
  const topEmployer = employerEntries[0];
  document.getElementById("insight-top-market").textContent = topMarket && topMarket[1] ? topMarket[0] : "Waiting";
  document.getElementById("insight-top-market-note").textContent = topMarket && topMarket[1] ? `${topMarket[1]} open approved matches` : "No current target-market matches";
  document.getElementById("insight-top-employer").textContent = topEmployer && topEmployer[1] ? topEmployer[0] : "Waiting";
  document.getElementById("insight-top-employer-note").textContent = topEmployer && topEmployer[1] ? `${topEmployer[1]} open match${topEmployer[1] === 1 ? "" : "es"}` : "No current employer matches";
  document.getElementById("insight-fresh-count").textContent = rows.filter((row) => postedAge(row) <= 1).length;
  const max = Math.max(...marketEntries.map((entry) => entry[1]), 1);
  document.getElementById("insight-market-list").innerHTML = marketEntries.map(([label, value]) => `<div class="insight-bar-row"><span>${escapeHTML(label)}</span><span class="bar-track"><span class="bar-fill" style="width:${Math.max(value ? 4 : 0, value / max * 100)}%"></span></span><strong>${value}</strong></div>`).join("");
}

function mapProjectPoint(point, stateName) {
  const longitude = Number(point[0]), latitude = Number(point[1]);
  if (stateName === "Alaska") {
    return [28 + ((longitude + 188) / 58) * 142, 350 + ((65 - latitude) / 17) * 52];
  }
  if (stateName === "Hawaii") return [187 + ((longitude + 161) / 8) * 68, 369 + ((23 - latitude) / 7) * 31];
  return [94 + ((longitude + 125) / 65) * 612, 42 + ((49 - latitude) / 27) * 292];
}
function mapRingPath(ring, stateName) {
  return ring.map((point, index) => {
    const [x, y] = mapProjectPoint(point, stateName);
    return `${index ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(" ") + " Z";
}
function mapFeaturePath(feature) {
  const name = feature.properties?.name || "";
  if (!feature.geometry || name === "Puerto Rico") return "";
  const polygons = feature.geometry.type === "Polygon" ? [feature.geometry.coordinates] : feature.geometry.coordinates;
  return polygons.map((polygon) => polygon.map((ring) => mapRingPath(ring, name)).join(" ")).join(" ");
}
function renderMapGeometry() {
  const layer = document.getElementById("map-state-layer");
  if (!layer || layer.dataset.rendered) return;
  if (!state.mapGeometry?.features?.length) {
    layer.innerHTML = `<text class="map-unavailable" x="400" y="205" text-anchor="middle">Map geometry unavailable offline</text>`;
    return;
  }
  layer.innerHTML = state.mapGeometry.features.map((feature) => {
    const name = feature.properties?.name || "State";
    const path = mapFeaturePath(feature);
    return path ? `<path class="map-state" d="${path}" data-state="${escapeHTML(name)}"><title>${escapeHTML(name)}</title></path>` : "";
  }).join("");
  layer.dataset.rendered = "true";
}

function mapHealth(row) {
  const age = postedAge(row);
  return age <= 1 ? "fresh" : age <= 7 ? "active" : "aging";
}
function mapHealthLabel(value) { return value === "fresh" ? "Fresh" : value === "active" ? "Active" : "Aging"; }
function mapHealthRows(rows, filter) { return filter === "all" ? rows : rows.filter((row) => mapHealth(row) === filter); }
function mapMarketRows(market, scope) {
  let rows = state.data.history.filter((row) => row.status === "open");
  if (scope === "focus") rows = rows.filter(isPreferredRow);
  else rows = rows.filter(isTargetMarketRow);
  return market === "all" ? rows : rows.filter((row) => matchedMarkets(row).includes(market));
}
function mapHealthCounts(rows) {
  return { fresh: rows.filter((row) => mapHealth(row) === "fresh").length, active: rows.filter((row) => mapHealth(row) === "active").length, aging: rows.filter((row) => mapHealth(row) === "aging").length };
}
function mapDominantHealth(counts) {
  return ["fresh", "active", "aging"].sort((a, b) => counts[b] - counts[a])[0];
}
function mapJobRow(row) {
  const health = mapHealth(row);
  return `<a class="map-job-row" href="${escapeHTML(row.url)}" target="_blank" rel="noopener"><span class="job-health-dot ${health}"></span><span class="map-job-copy"><strong>${escapeHTML(row.title)}</strong><span>${escapeHTML(row.employer)} · ${escapeHTML(row.location || "Location not provided")}</span><small>${mapHealthLabel(health)} · posted ${escapeHTML(formatDate(postingDate(row)))}</small></span><span class="map-job-arrow">↗</span></a>`;
}
function renderMap() {
  const pins = document.getElementById("map-pins");
  const pills = document.getElementById("map-market-pills");
  const list = document.getElementById("map-job-list");
  if (!pins || !pills || !list) return;
  renderMapGeometry();
  const healthFilter = document.getElementById("map-health-filter")?.value || "all";
  const allRows = mapMarketRows("all", state.mapScope);
  const selectedBaseRows = mapMarketRows(state.mapMarket, state.mapScope);
  const selectedRows = mapHealthRows(selectedBaseRows, healthFilter).sort((a, b) => postedAge(a) - postedAge(b) || a.title.localeCompare(b.title));
  const mapPin = (market) => {
    const coordinate = MAP_COORDINATES[market];
    const baseRows = mapMarketRows(market, state.mapScope);
    const visibleRows = mapHealthRows(baseRows, healthFilter);
    const counts = mapHealthCounts(baseRows);
    const radius = 8 + Math.min(16, Math.sqrt(visibleRows.length) * 2.4);
    const selected = state.mapMarket === market ? " selected" : "";
    return `<g class="map-pin-group${selected}" data-market-pin="${escapeHTML(market)}" tabindex="0" role="button" aria-label="${escapeHTML(market)}: ${visibleRows.length} open jobs"><circle class="map-pin-halo ${mapDominantHealth(counts)}" cx="${coordinate.x}" cy="${coordinate.y}" r="${radius + 7}"></circle><circle class="map-pin ${mapDominantHealth(counts)}" cx="${coordinate.x}" cy="${coordinate.y}" r="${radius}"></circle><text class="map-pin-count" x="${coordinate.x}" y="${coordinate.y + 4}">${visibleRows.length}</text><text class="map-pin-label" x="${coordinate.x}" y="${coordinate.y + radius + 19}">${escapeHTML(coordinate.label)}</text></g>`;
  };
  pins.innerHTML = TARGET_MARKETS.map(mapPin).join("");
  const marketButtons = [{ value: "all", label: "All markets", count: mapHealthRows(allRows, healthFilter).length }, ...TARGET_MARKETS.map((market) => ({ value: market, label: market, count: mapHealthRows(mapMarketRows(market, state.mapScope), healthFilter).length }))];
  pills.innerHTML = marketButtons.map((market) => `<button class="map-market-pill ${state.mapMarket === market.value ? "selected" : ""}" data-market-select="${escapeHTML(market.value)}" type="button"><span>${escapeHTML(market.label)}</span><strong>${market.count}</strong></button>`).join("");
  const selectedCounts = mapHealthCounts(selectedBaseRows);
  document.getElementById("map-selection-title").textContent = state.mapMarket === "all" ? "All target markets" : state.mapMarket;
  document.getElementById("map-selection-count").textContent = selectedRows.length;
  document.getElementById("map-selection-summary").textContent = `${selectedRows.length} ${state.mapScope === "focus" ? "approved-title" : "target-market"} posting${selectedRows.length === 1 ? "" : "s"} match this health filter · ${selectedBaseRows.length} open total in this view`;
  document.getElementById("map-health-stats").innerHTML = ["fresh", "active", "aging"].map((health) => `<span class="map-health-stat ${health}"><i class="job-health-dot ${health}"></i><strong>${selectedCounts[health]}</strong> ${mapHealthLabel(health)}</span>`).join("");
  list.innerHTML = selectedRows.length ? selectedRows.slice(0, 8).map(mapJobRow).join("") : `<div class="empty-state"><span>◎</span><p>No open jobs match this market and health filter.</p></div>`;
  pills.querySelectorAll("[data-market-select]").forEach((button) => button.addEventListener("click", () => { state.mapMarket = button.dataset.marketSelect; renderMap(); }));
  pins.querySelectorAll("[data-market-pin]").forEach((pin) => {
    const select = () => { state.mapMarket = pin.dataset.marketPin; renderMap(); };
    pin.addEventListener("click", select);
    pin.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); select(); } });
  });
}
function setupMap() {
  const filter = document.getElementById("map-health-filter");
  if (!filter) return;
  if (!filter.dataset.bound) {
    filter.addEventListener("change", renderMap);
    document.querySelectorAll("[data-map-scope]").forEach((button) => button.addEventListener("click", () => {
      state.mapScope = button.dataset.mapScope;
      document.querySelectorAll("[data-map-scope]").forEach((item) => item.classList.toggle("active", item === button));
      renderMap();
    }));
    filter.dataset.bound = "true";
  }
  renderMap();
}

function savedSearchMatches(search, row) {
  if (row.status !== "open") return false;
  if (search.market && !matchedMarkets(row).includes(search.market)) return false;
  const query = normalizedText(search.query);
  return !query || normalizedText(row.title).includes(query);
}

function renderSavedSearches() {
  const element = document.getElementById("saved-search-list");
  if (!element) return;
  const runDate = latestDate(state.data);
  if (!state.savedSearches.length) {
    element.innerHTML = `<div class="saved-search-empty">No saved searches yet. Add one above to keep a specific role and market one click away.</div>`;
    return;
  }
  element.innerHTML = state.savedSearches.map((search) => {
    const matches = state.data.history.filter((row) => savedSearchMatches(search, row));
    const fresh = matches.filter((row) => row.first_seen === runDate && !asBool(row.first_run)).length;
    const filterText = [search.query || "All titles", search.market || "All markets"].join(" · ");
    return `<div class="saved-search-row"><div><strong>${escapeHTML(search.name)}</strong><span>${escapeHTML(filterText)}</span></div><div class="saved-search-row-actions"><span class="pill">${fresh} new today</span><button class="text-button remove-search" type="button" data-remove-search="${escapeHTML(search.id)}">Remove</button></div></div>`;
  }).join("");
  element.querySelectorAll("[data-remove-search]").forEach((button) => button.addEventListener("click", () => {
    state.savedSearches = state.savedSearches.filter((search) => search.id !== button.dataset.removeSearch);
    saveSavedSearches();
    renderSavedSearches();
  }));
}

function checkSavedSearchAlerts() {
  if (!("Notification" in window) || Notification.permission !== "granted" || !state.savedSearches.length) return;
  const runKey = state.data.status.run_time || latestDate(state.data);
  const storageKey = `sportsFinanceAlertRun:${runKey}`;
  if (localStorage.getItem(storageKey)) return;
  const runDate = latestDate(state.data);
  const alerts = state.savedSearches.map((search) => {
    const count = state.data.history.filter((row) => row.first_seen === runDate && !asBool(row.first_run) && savedSearchMatches(search, row)).length;
    return count ? `${search.name}: ${count} new` : "";
  }).filter(Boolean);
  if (alerts.length) new Notification("Finance + Sports Jobs", { body: alerts.join(" · ") });
  localStorage.setItem(storageKey, "1");
}

function setupSavedSearches() {
  const form = document.getElementById("saved-search-form");
  if (!form) return;
  const name = document.getElementById("saved-search-name");
  const query = document.getElementById("saved-search-query");
  const market = document.getElementById("saved-search-market");
  const alerts = document.getElementById("enable-alerts");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const searchQuery = query.value.trim();
    const searchMarket = market.value;
    if (!searchQuery && !searchMarket) {
      query.focus();
      return;
    }
    state.savedSearches.unshift({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name: name.value.trim() || searchQuery || searchMarket, query: searchQuery, market: searchMarket });
    saveSavedSearches();
    form.reset();
    renderSavedSearches();
  });
  if (!("Notification" in window)) {
    alerts.textContent = "Alerts unavailable in this browser";
    alerts.disabled = true;
  } else if (Notification.permission === "granted") {
    alerts.textContent = "Browser alerts enabled";
  }
  alerts.addEventListener("click", async () => {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    alerts.textContent = permission === "granted" ? "Browser alerts enabled" : "Alerts not enabled";
    if (permission === "granted") checkSavedSearchAlerts();
  });
  renderSavedSearches();
  checkSavedSearchAlerts();
}

function renderToday() {
  const { status, history } = state.data, runDate = latestDate(state.data);
  document.getElementById("run-status").textContent = `Last refresh ${formatDateTime(status.run_time)} · data through ${formatDate(runDate)}`;
  document.getElementById("metric-days").textContent = status.days_with_success ?? 0;
  document.getElementById("metric-open").textContent = status.open ?? 0;
  document.getElementById("metric-new").textContent = status.new_today ?? 0;
  document.getElementById("metric-removed").textContent = status.removed_today ?? 0;
  const currentRows = history.filter((row) => row.status === "open" && isPreferredRow(row)).sort((a, b) => postingDate(b).localeCompare(postingDate(a)) || a.title.localeCompare(b.title));
  const preferredOpen = currentRows.filter((row) => postedAge(row) <= 7);
  document.getElementById("metric-target").textContent = currentRows.length;
  document.getElementById("metric-fresh").textContent = currentRows.filter((row) => postedAge(row) <= 1).length;
  document.getElementById("position-open-count")?.replaceChildren(String(currentRows.length));
  document.getElementById("position-fresh-count")?.replaceChildren(String(currentRows.filter((row) => postedAge(row) <= 1).length));
  renderSourceHealth(status);
  document.getElementById("preference-summary").textContent = `${currentRows.length} current approved-title matches across Dallas–Fort Worth, Kansas City, Austin, Fayetteville/NWA, and New York IB/M&A · ${preferredOpen.length} posted in the last 7 days`;
  document.getElementById("current-count").textContent = currentRows.length;
  document.getElementById("current-summary").textContent = currentRows.length ? `These are the ${currentRows.length} open postings currently matching your exact role and location focus. ${groupedRows(currentRows).length} grouped cards reduce duplicate board listings; every source link remains available inside the card.` : "No open posting currently matches both the approved role list and target locations.";
  renderJobList(document.getElementById("current-list"), currentRows, { open: true, empty: "No current approved-title matches." });
  const newRows = history.filter((row) => row.first_seen === runDate && !asBool(row.first_run) && isPreferredRow(row));
  const removedRows = history.filter((row) => row.removed_date === runDate && isPreferredRow(row));
  document.getElementById("new-count").textContent = newRows.length;
  document.getElementById("removed-count").textContent = removedRows.length;
  document.getElementById("position-new-count")?.replaceChildren(String(newRows.length));
  document.getElementById("position-removed-count")?.replaceChildren(String(removedRows.length));
  renderJobList(document.getElementById("new-list"), newRows, { compact: true, empty: "No new non-first-run postings today." });
  renderJobList(document.getElementById("removed-list"), removedRows, { compact: true, empty: "No postings were removed today." });
  renderMatchInsights(currentRows);
  setupMap();
  bindStars();
}

function renderBrowse() {
  const controls = { role: document.getElementById("role-toggle"), market: document.getElementById("market-toggle"), all: document.getElementById("all-toggle"), search: document.getElementById("title-search"), employer: document.getElementById("employer-filter"), location: document.getElementById("market-filter"), freshness: document.getElementById("freshness-filter"), days: document.getElementById("days-filter"), sort: document.getElementById("sort-filter") };
  const roleOnly = controls.role.classList.contains("active");
  const marketOnly = controls.market.classList.contains("active");
  let rows = state.data.history.filter((row) => row.status === "open");
  if (roleOnly) rows = rows.filter(isPreferredRow);
  else if (marketOnly) rows = rows.filter(isTargetMarketRow);
  const search = controls.search.value.trim().toLowerCase();
  if (search) rows = rows.filter((row) => row.title.toLowerCase().includes(search));
  if (controls.employer.value) rows = rows.filter((row) => row.employer === controls.employer.value);
  if (controls.location.value) rows = rows.filter((row) => matchedMarkets(row).includes(controls.location.value));
  const maximumPostedAge = Number(controls.freshness.value || 0);
  if (maximumPostedAge) rows = rows.filter((row) => postedAge(row) <= maximumPostedAge);
  const minimumDays = Number(controls.days.value || 0);
  if (minimumDays) rows = rows.filter((row) => dateDiff(row.first_seen, latestDate(state.data)) >= minimumDays);
  if (controls.sort.value === "relevance") rows.sort((a, b) => relevanceScore(b) - relevanceScore(a) || postingDate(b).localeCompare(postingDate(a)) || a.title.localeCompare(b.title));
  else if (controls.sort.value === "first_seen") rows.sort((a, b) => (b.first_seen || "").localeCompare(a.first_seen || "") || a.title.localeCompare(b.title));
  else if (controls.sort.value === "title") rows.sort((a, b) => a.title.localeCompare(b.title));
  else rows.sort((a, b) => postingDate(b).localeCompare(postingDate(a)) || (b.first_seen || "").localeCompare(a.first_seen || "") || a.title.localeCompare(b.title));
  document.getElementById("browse-count").textContent = `${rows.length} open ${roleOnly ? "approved-title matches" : marketOnly ? "target-market jobs" : "tracked postings"} · ${groupedRows(rows).length} cards`;
  document.getElementById("browse-as-of").textContent = `As of ${formatDate(latestDate(state.data))} · posted-date freshness is on by default · default titles are limited to the approved twenty · New York limited to IB/M&A`;
  renderJobList(document.getElementById("browse-list"), rows, { open: true, empty: "No postings match these filters." });
  bindStars();
}

function setupBrowse() {
  const employers = [...new Set(state.data.history.filter((row) => row.status === "open").map((row) => row.employer))].sort();
  document.getElementById("employer-filter").insertAdjacentHTML("beforeend", employers.map((value) => `<option>${escapeHTML(value)}</option>`).join(""));
  document.getElementById("market-filter").insertAdjacentHTML("beforeend", TARGET_MARKETS.map((value) => `<option>${escapeHTML(value)}</option>`).join(""));
  ["title-search", "employer-filter", "market-filter", "freshness-filter", "days-filter", "sort-filter"].forEach((id) => document.getElementById(id).addEventListener("input", renderBrowse));
  [["role-toggle", ["market-toggle", "all-toggle"]], ["market-toggle", ["role-toggle", "all-toggle"]], ["all-toggle", ["role-toggle", "market-toggle"]]].forEach(([activeId, inactiveIds]) => document.getElementById(activeId).addEventListener("click", () => { document.getElementById(activeId).classList.add("active"); inactiveIds.forEach((id) => document.getElementById(id).classList.remove("active")); renderBrowse(); }));
  renderExternalSearches();
  setupSavedSearches();
  renderBrowse();
}

async function loadData() {
  const mapRequest = document.body.dataset.page === "today" ? fetch("us-states.json", {cache:"no-store"}).catch(() => null) : Promise.resolve(null);
  const [statusResponse, historyResponse, mapResponse] = await Promise.all([fetch("data/status.json", {cache:"no-store"}), fetch("data/history.csv", {cache:"no-store"}), mapRequest]);
  state.data = { status: await statusResponse.json(), history: parseCSV(await historyResponse.text()) };
  state.mapGeometry = mapResponse?.ok ? await mapResponse.json() : null;
  return state.data;
}

function registerServiceWorker() { if ("serviceWorker" in navigator) navigator.serviceWorker.register("service-worker.js").catch(() => {}); }

window.jobWatcher = { state, ready: loadData().then(() => { registerServiceWorker(); renderTopbar(state.data.status); if (document.body.dataset.page === "today") renderToday(); if (document.body.dataset.page === "browse") setupBrowse(); return state.data; }) };
