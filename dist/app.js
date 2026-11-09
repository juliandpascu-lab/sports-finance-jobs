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
const state = { data: null, shortlist: new Set(JSON.parse(localStorage.getItem("sportsFinanceShortlist") || "[]")) };

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
  return `<article class="job-card ${options.compact ? "job-card-compact" : ""}">
    <div class="job-card-main"><p class="job-employer">${escapeHTML(row.employer)} <span>·</span> ${escapeHTML(row.department || "Business function")}</p>
    <h3><a href="${escapeHTML(row.url)}" target="_blank" rel="noopener">${escapeHTML(row.title)}</a></h3>
    <p class="job-meta"><strong>Location:</strong> ${escapeHTML(row.location || "Location not provided")} · ${escapeHTML(marketLabel(row) || "Outside target markets")}</p>
    <p class="job-meta"><strong>Posted:</strong> ${escapeHTML(formatDate(postingDate(row)))} · <strong>Source:</strong> ${escapeHTML(SOURCE_LABELS[row.source] || row.source || "Employer board")}${options.open ? ` · ${postedDays} days since posted · ${days} days observed` : ""}</p></div>
    <div class="job-card-actions"><button class="star-button ${star ? "saved" : ""}" data-star="${escapeHTML(row.posting_id)}" aria-label="${star ? "Remove from" : "Save to"} shortlist">${star ? "★" : "☆"}</button><a class="apply-button" href="${escapeHTML(row.url)}" target="_blank" rel="noopener">Apply ↗</a></div>
  </article>`;
}

function renderJobList(element, rows, options = {}) {
  element.innerHTML = rows.length ? rows.map((row) => jobCard(row, options)).join("") : `<div class="empty-state"><span>◎</span><p>${escapeHTML(options.empty || "Nothing new in this snapshot.")}</p></div>`;
}

function bindStars() {
  document.querySelectorAll("[data-star]").forEach((button) => button.addEventListener("click", () => {
    const id = button.dataset.star;
    if (state.shortlist.has(id)) state.shortlist.delete(id); else state.shortlist.add(id);
    saveShortlist();
    if (document.body.dataset.page === "browse") renderBrowse(); else button.classList.toggle("saved");
  }));
}

function renderToday() {
  const { status, history } = state.data, runDate = latestDate(state.data);
  document.getElementById("run-status").textContent = `Last refresh ${formatDateTime(status.run_time)} · data through ${formatDate(runDate)}`;
  document.getElementById("metric-days").textContent = status.days_with_success ?? 0;
  document.getElementById("metric-open").textContent = status.open ?? 0;
  document.getElementById("metric-new").textContent = status.new_today ?? 0;
  document.getElementById("metric-removed").textContent = status.removed_today ?? 0;
  const good = (status.sources || []).filter((source) => source.ok).length;
  document.getElementById("source-health").textContent = `${good}/${(status.sources || []).length} healthy`;
  document.getElementById("source-list").innerHTML = (status.sources || []).map((source) => `<div class="source-row"><span class="source-state ${source.ok ? "ok" : "bad"}"></span><span>${escapeHTML(SOURCE_LABELS[source.name] || source.name)}</span><strong>${source.count}</strong></div>`).join("") || `<div class="empty-state"><p>No source data yet.</p></div>`;
  const currentRows = history.filter((row) => row.status === "open" && isPreferredRow(row)).sort((a, b) => postingDate(b).localeCompare(postingDate(a)) || a.title.localeCompare(b.title));
  const preferredOpen = currentRows.filter((row) => postedAge(row) <= 7);
  document.getElementById("preference-summary").textContent = `${currentRows.length} current approved-title matches across Dallas–Fort Worth, Kansas City, Austin, Fayetteville/NWA, and New York IB/M&A · ${preferredOpen.length} posted in the last 7 days`;
  document.getElementById("current-count").textContent = currentRows.length;
  document.getElementById("current-summary").textContent = currentRows.length ? "These are the open postings currently matching your exact role and location focus. Posted dates come from the employer feed; watcher dates show when this tool first saw them." : "No open posting currently matches both the approved role list and target locations.";
  renderJobList(document.getElementById("current-list"), currentRows, { open: true, empty: "No current approved-title matches." });
  const newRows = history.filter((row) => row.first_seen === runDate && !asBool(row.first_run) && isPreferredRow(row));
  const removedRows = history.filter((row) => row.removed_date === runDate && isPreferredRow(row));
  document.getElementById("new-count").textContent = newRows.length;
  document.getElementById("removed-count").textContent = removedRows.length;
  renderJobList(document.getElementById("new-list"), newRows, { compact: true, empty: "No new non-first-run postings today." });
  renderJobList(document.getElementById("removed-list"), removedRows, { compact: true, empty: "No postings were removed today." });
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
  if (controls.sort.value === "first_seen") rows.sort((a, b) => (b.first_seen || "").localeCompare(a.first_seen || "") || a.title.localeCompare(b.title));
  else if (controls.sort.value === "title") rows.sort((a, b) => a.title.localeCompare(b.title));
  else rows.sort((a, b) => postingDate(b).localeCompare(postingDate(a)) || (b.first_seen || "").localeCompare(a.first_seen || "") || a.title.localeCompare(b.title));
  document.getElementById("browse-count").textContent = `${rows.length} open ${roleOnly ? "approved-title matches" : marketOnly ? "target-market jobs" : "tracked postings"}`;
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
  renderBrowse();
}

async function loadData() {
  const [statusResponse, historyResponse] = await Promise.all([fetch("data/status.json", {cache:"no-store"}), fetch("data/history.csv", {cache:"no-store"})]);
  state.data = { status: await statusResponse.json(), history: parseCSV(await historyResponse.text()) };
  return state.data;
}

function registerServiceWorker() { if ("serviceWorker" in navigator) navigator.serviceWorker.register("service-worker.js").catch(() => {}); }

window.jobWatcher = { state, ready: loadData().then(() => { registerServiceWorker(); if (document.body.dataset.page === "today") renderToday(); if (document.body.dataset.page === "browse") setupBrowse(); return state.data; }) };
