const SOURCE_LABELS = {
  baltimoreorioles: "Baltimore Orioles", nflcareers: "NFL", lions: "Detroit Lions", fccincinnati: "FC Cincinnati",
  hudl: "Hudl", geniussports: "Genius Sports", seatgeek: "SeatGeek", sbnation: "SB Nation",
  fanaticsfbg: "Fanatics Betting & Gaming", theathletic: "The Athletic", legend: "Legend", flosports: "FloSports",
  novig: "Novig", onyx: "Onyx Games", brodie_rec_league: "Brodie Rec League",
  campusapps: "Campus Apps / FT Partners", ducerapartnerscampus: "Ducera Partners",
  financialtechnologypartners: "Financial Technology Partners", glcadvisors: "GLC Advisors",
  solomonpartnersprofessionals: "Solomon Partners", saxllp: "SAX Advisory Group", offdeal: "OffDeal",
  fourhands: "Four Hands", capitalfarmcredit: "Capital Farm Credit",
  successacademycharterschool: "Success Academy", taketwo: "Take-Two Interactive"
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
  "Dallas-Fort Worth": ["dallas", "dallas-fort worth", "dfw", "fort worth", "arlington", "frisco", "irving", "mckinney", "plano", "richardson"],
  "Kansas City": ["kansas city", "lee's summit", "lenexa", "olathe", "overland park", "shawnee"],
  "Austin": ["austin", "cedar park", "georgetown", "pflugerville", "round rock"],
  "Fayetteville / Northwest Arkansas": ["fayetteville", "bentonville", "bella vista", "rogers", "springdale"],
  "New York": ["new york", "new york city", "nyc", "brooklyn", "bronx", "jersey city", "manhattan", "nassau county", "queens", "staten island", "suffolk county", "white plains"]
};
const INVESTMENT_BANKING_TERMS = ["investment banking", "investment banker", "ibd", "m&a", "merger", "corporate development", "transaction", "deals"];
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
  if (site === "Indeed") return `https://www.indeed.com/jobs?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}&fromage=7`;
  return `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&f_TPR=r604800`;
}
function renderExternalSearches() {
  const element = document.getElementById("external-searches");
  if (!element) return;
  const queries = ["Financial Analyst", "FP&A Analyst", "Credit Analyst", "Business Analyst"];
  const bankingQueries = ["Investment Banking Analyst", "M&A Analyst", "FP&A Analyst", "Credit Analyst"];
  element.innerHTML = TARGET_MARKETS.map((market) => {
    const searchQueries = market === "New York" ? bankingQueries : queries;
    const location = MARKET_SEARCH_LOCATIONS[market];
    const links = searchQueries.map((query) => `<span class="external-search-item"><span>${escapeHTML(query)}</span><a href="${externalJobSearchURL("Indeed", query, location)}" target="_blank" rel="noopener">Indeed ↗</a><a href="${externalJobSearchURL("LinkedIn", query, location)}" target="_blank" rel="noopener">LinkedIn ↗</a></span>`).join("");
    return `<div class="external-market"><strong>${escapeHTML(market)}</strong>${links}</div>`;
  }).join("");
}

function jobCard(row, options = {}) {
  const days = dateDiff(row.first_seen, latestDate(state.data));
  const postedDays = postedAge(row);
  const star = state.shortlist.has(row.posting_id);
  return `<article class="job-card ${options.compact ? "job-card-compact" : ""}">
    <div class="job-card-main"><p class="job-employer">${escapeHTML(row.employer)} <span>·</span> ${escapeHTML(row.department || "Sports business")}</p>
    <h3><a href="${escapeHTML(row.url)}" target="_blank" rel="noopener">${escapeHTML(row.title)}</a></h3>
    <p class="job-meta">${escapeHTML(row.location || "Location not provided")} · ${escapeHTML(marketLabel(row) || "Outside target markets")} · Posted ${escapeHTML(formatDate(postingDate(row)))}${options.open ? ` · ${postedDays} days since posted · ${days} days observed` : ""}</p></div>
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
  const preferredOpen = history.filter((row) => row.status === "open" && isPreferredRow(row) && postedAge(row) <= 7);
  document.getElementById("preference-summary").textContent = `${preferredOpen.length} preferred jobs posted in the last 7 days across Dallas–Fort Worth, Kansas City, Austin, Fayetteville/NWA, and New York IB/M&A`;
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
  document.getElementById("browse-count").textContent = `${rows.length} open ${roleOnly ? "entry-level matches" : marketOnly ? "target-market jobs" : "tracked postings"}`;
  document.getElementById("browse-as-of").textContent = `As of ${formatDate(latestDate(state.data))} · posted-date freshness is on by default · New York limited to IB/M&A in the default view`;
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
