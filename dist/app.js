const SOURCE_LABELS = {
  baltimoreorioles: "Baltimore Orioles", nflcareers: "NFL", lions: "Detroit Lions", fccincinnati: "FC Cincinnati",
  hudl: "Hudl", geniussports: "Genius Sports", seatgeek: "SeatGeek", sbnation: "SB Nation",
  fanaticsfbg: "Fanatics Betting & Gaming", theathletic: "The Athletic", legend: "Legend", flosports: "FloSports",
  novig: "Novig", onyx: "Onyx Games", brodie_rec_league: "Brodie Rec League"
};

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
function latestDate(data) { return data.status.run_time?.slice(0, 10) || data.history.reduce((latest, row) => row.last_seen > latest ? row.last_seen : latest, ""); }
function formatDate(value) { return value ? new Date(`${value}T00:00:00Z`).toLocaleDateString(undefined, {month:"short", day:"numeric", year:"numeric", timeZone:"UTC"}) : "—"; }
function formatDateTime(value) { return value ? new Date(value).toLocaleString(undefined, {month:"short", day:"numeric", hour:"numeric", minute:"2-digit", timeZoneName:"short"}) : "No completed run yet"; }
function saveShortlist() { localStorage.setItem("sportsFinanceShortlist", JSON.stringify([...state.shortlist])); }

function jobCard(row, options = {}) {
  const days = dateDiff(row.first_seen, latestDate(state.data));
  const star = state.shortlist.has(row.posting_id);
  return `<article class="job-card ${options.compact ? "job-card-compact" : ""}">
    <div class="job-card-main"><p class="job-employer">${escapeHTML(row.employer)} <span>·</span> ${escapeHTML(row.department || "Sports business")}</p>
    <h3><a href="${escapeHTML(row.url)}" target="_blank" rel="noopener">${escapeHTML(row.title)}</a></h3>
    <p class="job-meta">${escapeHTML(row.location || "Location not provided")} · Posted ${escapeHTML(formatDate(row.posted_date || row.first_seen))}${options.open ? ` · ${days} days observed` : ""}</p></div>
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
  const newRows = history.filter((row) => row.first_seen === runDate && !asBool(row.first_run));
  const removedRows = history.filter((row) => row.removed_date === runDate);
  document.getElementById("new-count").textContent = newRows.length;
  document.getElementById("removed-count").textContent = removedRows.length;
  renderJobList(document.getElementById("new-list"), newRows, { compact: true, empty: "No new non-first-run postings today." });
  renderJobList(document.getElementById("removed-list"), removedRows, { compact: true, empty: "No postings were removed today." });
  bindStars();
}

function renderBrowse() {
  const controls = { role: document.getElementById("role-toggle"), all: document.getElementById("all-toggle"), search: document.getElementById("title-search"), employer: document.getElementById("employer-filter"), location: document.getElementById("location-filter"), days: document.getElementById("days-filter") };
  const roleOnly = controls.role.classList.contains("active");
  let rows = state.data.history.filter((row) => row.status === "open");
  if (roleOnly) rows = rows.filter((row) => asBool(row.in_role));
  const search = controls.search.value.trim().toLowerCase();
  if (search) rows = rows.filter((row) => row.title.toLowerCase().includes(search));
  if (controls.employer.value) rows = rows.filter((row) => row.employer === controls.employer.value);
  if (controls.location.value) rows = rows.filter((row) => row.location.includes(controls.location.value));
  const minimumDays = Number(controls.days.value || 0);
  if (minimumDays) rows = rows.filter((row) => dateDiff(row.first_seen, latestDate(state.data)) >= minimumDays);
  rows.sort((a, b) => (b.first_seen || "").localeCompare(a.first_seen || "") || a.title.localeCompare(b.title));
  document.getElementById("browse-count").textContent = `${rows.length} open ${roleOnly ? "role matches" : "postings"}`;
  document.getElementById("browse-as-of").textContent = `As of ${formatDate(latestDate(state.data))} · sorted by first-seen date`;
  renderJobList(document.getElementById("browse-list"), rows, { open: true, empty: "No postings match these filters." });
  bindStars();
}

function setupBrowse() {
  const employers = [...new Set(state.data.history.filter((row) => row.status === "open").map((row) => row.employer))].sort();
  const locations = [...new Set(state.data.history.filter((row) => row.status === "open").flatMap((row) => row.location.split(";").map((value) => value.trim())).filter(Boolean))].sort();
  document.getElementById("employer-filter").insertAdjacentHTML("beforeend", employers.map((value) => `<option>${escapeHTML(value)}</option>`).join(""));
  document.getElementById("location-filter").insertAdjacentHTML("beforeend", locations.map((value) => `<option>${escapeHTML(value)}</option>`).join(""));
  ["title-search", "employer-filter", "location-filter", "days-filter"].forEach((id) => document.getElementById(id).addEventListener("input", renderBrowse));
  document.getElementById("role-toggle").addEventListener("click", () => { document.getElementById("role-toggle").classList.add("active"); document.getElementById("all-toggle").classList.remove("active"); renderBrowse(); });
  document.getElementById("all-toggle").addEventListener("click", () => { document.getElementById("all-toggle").classList.add("active"); document.getElementById("role-toggle").classList.remove("active"); renderBrowse(); });
  renderBrowse();
}

async function loadData() {
  const [statusResponse, historyResponse] = await Promise.all([fetch("data/status.json", {cache:"no-store"}), fetch("data/history.csv", {cache:"no-store"})]);
  state.data = { status: await statusResponse.json(), history: parseCSV(await historyResponse.text()) };
  return state.data;
}

function registerServiceWorker() { if ("serviceWorker" in navigator) navigator.serviceWorker.register("service-worker.js").catch(() => {}); }

window.jobWatcher = { state, ready: loadData().then(() => { registerServiceWorker(); if (document.body.dataset.page === "today") renderToday(); if (document.body.dataset.page === "browse") setupBrowse(); return state.data; }) };
