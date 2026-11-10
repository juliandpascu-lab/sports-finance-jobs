const WORD_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const ZIP_EOCD = 0x06054b50;
const ZIP_CENTRAL = 0x02014b50;
let objectUrl = null;
let resumeContext = { text: "", paragraphs: [] };
const resumeFinderState = { data: null, selectedId: "", scope: "preferred", market: "", search: "", sort: "match" };

const RESUME_SIGNAL_CATALOG = [
  { id: "fpna", label: "FP&A / planning", terms: ["fp&a", "financial planning", "forecast", "budget", "variance"], evidence: "FP&A, planning, forecasting, budgeting, or variance language", tailor: "Make the planning connection explicit: name the forecast, budget, variance review, or planning process you actually supported." },
  { id: "analysis", label: "Financial analysis", terms: ["financial analyst", "financial data", "revenue", "financial analysis", "analytics", "analysis"], evidence: "financial analysis, analytics, or revenue language", tailor: "Lead with the financial question you answered, the analysis you performed, and the decision or result it supported." },
  { id: "tools", label: "Excel / Power BI", terms: ["excel", "power bi", "dashboard", "kpi", "powerpoint", "financial data analytics"], evidence: "Excel, Power BI, dashboard, KPI, or reporting-tool language", tailor: "Tie each tool to an outcome: name the model, dashboard, reporting process, or decision it helped move." },
  { id: "impact", label: "Quantified impact", terms: ["$", "%", "million", "revenue", "identified", "recruited"], evidence: "scale, revenue, percentage, or other quantified-impact language", tailor: "Keep at least one measurable outcome in the top half of the resume; lead with the result and scale, not only the task." },
  { id: "execution", label: "Cross-functional execution", terms: ["implementation", "stakeholder", "leadership", "recruitment", "team", "present"], evidence: "implementation, leadership, team, or stakeholder language", tailor: "Show who used your work and how you moved it forward across teams, especially when the role emphasizes communication." },
  { id: "banking", label: "Banking / transactions", terms: ["investment banking", "valuation", "m&a", "merger", "acquisition", "transaction", "deal", "credit", "treasury", "portfolio", "equity research", "asset management"], evidence: "banking, valuation, transaction, credit, treasury, or portfolio language", tailor: "For banking or transaction roles, add relevant coursework, modeling, valuation, case, credit, or deal-project evidence if you have it—never imply experience you do not have." }
];

const byId = (id) => document.getElementById(id);

function formatBytes(bytes) {
  if (!bytes) return "0 bytes";
  if (bytes < 1024) return `${bytes} bytes`;
  return `${(bytes / 1024).toFixed(bytes < 1024 * 1024 ? 1 : 2)} KB`;
}

function setStatus(title, detail, kind = "") {
  const status = byId("resume-status");
  status.className = `resume-status ${kind}`;
  status.innerHTML = `<strong>${title}</strong><span>${detail}</span>`;
}

function setPreviewState(heading, label, kind = "") {
  byId("resume-preview-heading").textContent = heading;
  const state = byId("resume-preview-state");
  state.textContent = label;
  state.className = `pill ${kind}`;
}

function setMetadata(file, hash) {
  byId("resume-name").textContent = file.name;
  byId("resume-size").textContent = formatBytes(file.size);
  byId("resume-fingerprint").textContent = hash;
  byId("resume-integrity").textContent = "Local read complete";
  byId("resume-integrity").className = "resume-integrity-ok";
}

function findEndOfCentralDirectory(view) {
  const minimum = 22;
  for (let offset = view.byteLength - minimum; offset >= 0; offset -= 1) {
    if (view.getUint32(offset, true) === ZIP_EOCD) return offset;
  }
  throw new Error("This file does not contain a readable DOCX archive.");
}

function locateZipEntry(buffer, name) {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const eocd = findEndOfCentralDirectory(view);
  const count = view.getUint16(eocd + 10, true);
  const centralOffset = view.getUint32(eocd + 16, true);
  let cursor = centralOffset;
  const decoder = new TextDecoder();

  for (let index = 0; index < count; index += 1) {
    if (view.getUint32(cursor, true) !== ZIP_CENTRAL) throw new Error("The DOCX archive index is invalid.");
    const nameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);
    const entryName = decoder.decode(bytes.slice(cursor + 46, cursor + 46 + nameLength));
    if (entryName === name) {
      const localOffset = view.getUint32(cursor + 42, true);
      const method = view.getUint16(cursor + 10, true);
      const compressedSize = view.getUint32(cursor + 20, true);
      const localNameLength = view.getUint16(localOffset + 26, true);
      const localExtraLength = view.getUint16(localOffset + 28, true);
      const dataStart = localOffset + 30 + localNameLength + localExtraLength;
      return { method, compressed: bytes.slice(dataStart, dataStart + compressedSize) };
    }
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  throw new Error(`The DOCX is missing ${name}.`);
}

async function inflateEntry(entry) {
  if (entry.method === 0) return entry.compressed;
  if (entry.method !== 8 || typeof DecompressionStream === "undefined") {
    throw new Error("This browser cannot decompress the selected DOCX locally. Try the latest Chrome, Edge, Firefox, or Safari.");
  }
  const stream = new Blob([entry.compressed]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function extractDocxText(buffer) {
  const entry = locateZipEntry(buffer, "word/document.xml");
  const xmlBytes = await inflateEntry(entry);
  const xml = new TextDecoder("utf-8").decode(xmlBytes);
  const xmlDocument = new DOMParser().parseFromString(xml, "application/xml");
  if (xmlDocument.querySelector("parsererror")) throw new Error("The DOCX text could not be read locally.");
  const paragraphs = [...xmlDocument.getElementsByTagNameNS(WORD_NS, "p")].map((paragraph) => {
    const pieces = [];
    const walker = xmlDocument.createTreeWalker(paragraph, NodeFilter.SHOW_ELEMENT);
    let node = walker.currentNode;
    while (node) {
      if (node.namespaceURI === WORD_NS && node.localName === "t") pieces.push(node.textContent || "");
      if (node.namespaceURI === WORD_NS && node.localName === "tab") pieces.push("\t");
      if (node.namespaceURI === WORD_NS && (node.localName === "br" || node.localName === "cr")) pieces.push("\n");
      node = walker.nextNode();
    }
    return pieces.join("");
  });
  return paragraphs.length ? paragraphs : ["No readable paragraphs were found in this DOCX."];
}

async function sha256(buffer) {
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function renderPreview(paragraphs) {
  resumeContext = { paragraphs, text: resumeNormalize(paragraphs.join("\n")) };
  const preview = byId("resume-preview");
  preview.innerHTML = "";
  paragraphs.forEach((text) => {
    const paragraph = document.createElement("p");
    paragraph.textContent = text || " ";
    preview.appendChild(paragraph);
  });
  renderResumeJobs();
}

function clearSelection() {
  resumeContext = { text: "", paragraphs: [] };
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = null;
  byId("resume-file").value = "";
  byId("resume-open-original").hidden = true;
  byId("resume-clear").disabled = true;
  byId("resume-name").textContent = "—";
  byId("resume-size").textContent = "—";
  byId("resume-fingerprint").textContent = "—";
  byId("resume-integrity").textContent = "Not compared";
  byId("resume-integrity").className = "";
  byId("resume-preview").innerHTML = "<div class=\"resume-empty\"><span>◫</span><strong>Your resume will appear here.</strong><p>The preview is extracted from the selected DOCX in your browser. Your original file stays unchanged.</p></div>";
  setStatus("No file selected", "Your resume will stay on this device.");
  setPreviewState("Waiting for your file", "No file loaded");
  renderResumeJobs();
}

async function handleFile(file) {
  if (!file) return;
  clearSelection();
  byId("resume-clear").disabled = false;
  setStatus("Reading locally…", "The file has not left this browser tab.");
  setPreviewState("Reading your resume", "Processing locally");

  if (!file.name.toLowerCase().endsWith(".docx")) {
    setStatus("DOCX file required", "Choose the original Microsoft Word .docx file.", "error");
    setPreviewState("Unsupported file", "Choose a DOCX", "error");
    return;
  }

  try {
    const buffer = await file.arrayBuffer();
    const hash = await sha256(buffer);
    setMetadata(file, hash);
    const paragraphs = await extractDocxText(buffer);
    renderPreview(paragraphs);
    objectUrl = URL.createObjectURL(file);
    const openOriginal = byId("resume-open-original");
    openOriginal.href = objectUrl;
    openOriginal.download = file.name;
    openOriginal.hidden = false;
    setStatus("Original loaded locally", "The selected file was read without changing it.", "success");
    setPreviewState("Resume preview", "Local file loaded", "success");
  } catch (error) {
    setMetadata(file, "Unavailable");
    setStatus("Could not read this DOCX", error.message || "The file could not be parsed in this browser.", "error");
    setPreviewState("Preview unavailable", "Read error", "error");
  }
}

byId("resume-file").addEventListener("change", (event) => handleFile(event.target.files?.[0]));
byId("resume-clear").addEventListener("click", clearSelection);
window.addEventListener("beforeunload", () => { if (objectUrl) URL.revokeObjectURL(objectUrl); });

function resumeEscape(value) {
  if (typeof escapeHTML === "function") return escapeHTML(value);
  return String(value ?? "").replace(/[&<>'"]/g, (char) => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", "\"":"&quot;"}[char]));
}

function resumeNormalize(value) { return String(value || "").toLowerCase().replace(/\s+/g, " ").trim(); }
function resumePostingDate(row) { return row.posted_date || row.first_seen || ""; }
function resumeDateLabel(value) { return value ? new Date(`${value}T00:00:00Z`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : "Date not provided"; }
function resumeRoleLabel(row) { return typeof roleFamily === "function" ? roleFamily(row) : "Finance role"; }
function resumeMarkets(row) { return typeof matchedMarkets === "function" ? matchedMarkets(row) : []; }
function resumeTargetRole(row) { return typeof isPreferredRow === "function" ? isPreferredRow(row) : String(row.in_role).toLowerCase() === "true"; }
function resumeTargetMarket(row) { return typeof isTargetMarketRow === "function" ? isTargetMarketRow(row) : resumeMarkets(row).length > 0; }
function resumeSource(row) { return typeof SOURCE_LABELS !== "undefined" ? (SOURCE_LABELS[row.source] || row.source || "Employer board") : (row.source || "Employer board"); }
function resumeFitScore(row) {
  if (!resumeContext.text) return null;
  const signals = resumeRoleSignals(row);
  const matched = signals.filter((signal) => signal.terms.some((term) => resumeContext.text.includes(resumeNormalize(term))));
  const score = 46 + Math.round((matched.length / Math.max(signals.length, 1)) * 45) + (matched.some((signal) => signal.id === "impact") ? 4 : 0);
  return Math.min(97, Math.max(42, score));
}

function resumeRoleSignals(row) {
  const roleText = resumeNormalize(`${row.title} ${row.department}`);
  const ids = new Set();
  if (["fp&a", "financial planning", "forecast", "budget", "revenue finance"].some((term) => roleText.includes(term))) ids.add("fpna");
  if (["analyst", "finance", "revenue", "strategy", "business analytics"].some((term) => roleText.includes(term))) ids.add("analysis");
  if (["analyst", "associate", "finance", "analytics"].some((term) => roleText.includes(term))) ids.add("tools");
  if (["analyst", "associate", "finance", "strategy", "investment", "banking"].some((term) => roleText.includes(term))) ids.add("impact");
  if (["strategic", "corporate", "business", "commercial", "client", "relationship"].some((term) => roleText.includes(term))) ids.add("execution");
  if (["investment banking", "m&a", "merger", "acquisition", "valuation", "equity research", "credit", "treasury", "portfolio", "asset management", "transaction", "private credit", "corporate banking"].some((term) => roleText.includes(term))) ids.add("banking");
  if (!ids.size) ["analysis", "tools", "impact"].forEach((id) => ids.add(id));
  return RESUME_SIGNAL_CATALOG.filter((signal) => ids.has(signal.id));
}

function resumeRowsForView() {
  if (!resumeFinderState.data) return [];
  let rows = resumeFinderState.data.history.filter((row) => row.status === "open");
  if (resumeFinderState.scope === "preferred") rows = rows.filter(resumeTargetRole);
  if (resumeFinderState.scope === "market") rows = rows.filter(resumeTargetMarket);
  if (resumeFinderState.market) rows = rows.filter((row) => resumeMarkets(row).includes(resumeFinderState.market));
  if (resumeFinderState.search) {
    const query = resumeNormalize(resumeFinderState.search);
    rows = rows.filter((row) => resumeNormalize(`${row.title} ${row.employer} ${row.location} ${row.department}`).includes(query));
  }
  const grouped = typeof groupedRows === "function" ? groupedRows(rows) : rows;
  grouped.sort((a, b) => {
    if (resumeFinderState.sort === "match") return (resumeFitScore(b) || 0) - (resumeFitScore(a) || 0) || resumePostingDate(b).localeCompare(resumePostingDate(a)) || a.title.localeCompare(b.title);
    if (resumeFinderState.sort === "first_seen") return (b.first_seen || "").localeCompare(a.first_seen || "") || a.title.localeCompare(b.title);
    return resumePostingDate(b).localeCompare(resumePostingDate(a)) || a.title.localeCompare(b.title);
  });
  return grouped;
}

function resumeJobCard(row) {
  const selected = row.posting_id === resumeFinderState.selectedId;
  const fit = resumeFitScore(row);
  const fitLabel = fit == null ? "Resume pending" : `${fit}% fit`;
  const markets = resumeMarkets(row).join(" · ") || "Outside focus markets";
  return `<article class="resume-job-card ${selected ? "selected" : ""}">
    <button class="resume-job-select" type="button" data-resume-job-id="${resumeEscape(row.posting_id)}" aria-pressed="${selected}">
      <span class="resume-job-copy"><span class="job-employer">${resumeEscape(row.employer)} <span>·</span> ${resumeEscape(resumeRoleLabel(row))}</span><strong>${resumeEscape(row.title)}</strong><small>${resumeEscape(row.location || "Location not provided")} · ${resumeEscape(markets)}</small></span>
      <span class="resume-job-fit">${resumeEscape(fitLabel)}</span>
    </button>
    <div class="resume-job-footer"><span>Posted ${resumeEscape(resumeDateLabel(resumePostingDate(row)))} · ${resumeEscape(resumeSource(row))}</span><a href="${resumeEscape(row.url)}" target="_blank" rel="noopener">Apply ↗</a></div>
  </article>`;
}

function renderResumeJobs() {
  const list = byId("resume-job-list");
  if (!list) return;
  if (!resumeFinderState.data) {
    list.innerHTML = "<div class=\"resume-job-loading\">Loading current open roles…</div>";
    return;
  }
  const rows = resumeRowsForView();
  if (!rows.some((row) => row.posting_id === resumeFinderState.selectedId)) resumeFinderState.selectedId = rows[0]?.posting_id || "";
  const scopeLabel = resumeFinderState.scope === "preferred" ? "target-role" : resumeFinderState.scope === "market" ? "target-market" : "open";
  byId("resume-job-count").textContent = `${rows.length} ${scopeLabel} ${rows.length === 1 ? "role" : "roles"}`;
  list.innerHTML = rows.length ? rows.map(resumeJobCard).join("") : "<div class=\"resume-job-loading\">No open roles match these filters.</div>";
  renderResumeMatch();
}

function resumeSelectedJob() {
  return resumeFinderState.data?.history.find((row) => row.posting_id === resumeFinderState.selectedId) || null;
}

function resumeSignalMatches(row) {
  const signals = resumeRoleSignals(row);
  return { signals, matched: signals.filter((signal) => signal.terms.some((term) => resumeContext.text.includes(resumeNormalize(term)))) };
}

function resumeTailorSuggestions(job, missing) {
  const suggestions = missing.slice(0, 2).map((signal) => signal.tailor);
  if (!missing.length) suggestions.push("The core signals are already visible. Tighten the top third by echoing the exact role family in a truthful summary or first bullet.");
  if (missing.length > 2) suggestions.push(`Prioritize ${missing.length - 2} more role signals after you open the full description; use its wording only where your experience supports it.`);
  suggestions.push("Open the application and mirror two or three recurring requirements in your bullets, keeping every claim accurate and measurable.");
  return [...new Set(suggestions)].slice(0, 3);
}

function renderResumeMatch() {
  const heading = byId("resume-match-heading");
  const summary = byId("resume-match-summary");
  const strengths = byId("resume-strengths");
  const tailor = byId("resume-tailor");
  const apply = byId("resume-apply-link");
  if (!heading || !resumeFinderState.data) return;
  const job = resumeSelectedJob();
  if (!job) {
    heading.textContent = "Choose a role";
    byId("resume-match-score").textContent = "—";
    summary.textContent = "Select a role from the finder to see local, role-specific guidance.";
    strengths.innerHTML = "<div class=\"resume-signal-empty\">Your matching strengths will appear here.</div>";
    tailor.innerHTML = "<div class=\"resume-signal-empty\">Choose a role to see suggested edits.</div>";
    apply.hidden = true;
    return;
  }
  heading.textContent = job.title;
  apply.href = job.url;
  apply.hidden = false;
  if (!resumeContext.text) {
    byId("resume-match-score").textContent = "Load resume";
    summary.textContent = `This ${resumeRoleLabel(job)} role at ${job.employer} is selected. Choose your DOCX above to compare the role signals with your actual resume text.`;
    strengths.innerHTML = "<div class=\"resume-signal-empty\">Select your resume to activate the local match analysis.</div>";
    tailor.innerHTML = "<div class=\"resume-signal-empty\">No edits are suggested until the resume is loaded in this browser tab.</div>";
    return;
  }
  const { signals, matched } = resumeSignalMatches(job);
  const missing = signals.filter((signal) => !matched.includes(signal));
  const score = resumeFitScore(job);
  byId("resume-match-score").textContent = `${score}% fit`;
  summary.textContent = `${matched.length} of ${signals.length} role signals were found in your local resume text. This is a title-and-skill signal, not a hiring prediction; confirm it against the full posting.`;
  strengths.innerHTML = matched.length ? matched.map((signal) => `<div class="resume-signal-item match"><strong>${resumeEscape(signal.label)}</strong><span>${resumeEscape(signal.evidence)} detected in your resume.</span></div>`).join("") : "<div class=\"resume-signal-empty\">No direct signal was detected for this role yet. Review the full description before deciding whether it is a fit.</div>";
  tailor.innerHTML = resumeTailorSuggestions(job, missing).map((item) => `<div class="resume-signal-item"><strong>Tailor next</strong><span>${resumeEscape(item)}</span></div>`).join("");
}

function setupResumeFinder(data) {
  resumeFinderState.data = data;
  const scope = byId("resume-job-scope");
  const market = byId("resume-job-market");
  const search = byId("resume-job-search");
  const sort = byId("resume-job-sort");
  scope.addEventListener("change", () => { resumeFinderState.scope = scope.value; renderResumeJobs(); });
  market.addEventListener("change", () => { resumeFinderState.market = market.value; renderResumeJobs(); });
  search.addEventListener("input", () => { resumeFinderState.search = search.value; renderResumeJobs(); });
  sort.addEventListener("change", () => { resumeFinderState.sort = sort.value; renderResumeJobs(); });
  byId("resume-job-list").addEventListener("click", (event) => {
    const button = event.target.closest("[data-resume-job-id]");
    if (!button) return;
    resumeFinderState.selectedId = button.dataset.resumeJobId;
    renderResumeJobs();
  });
  renderResumeJobs();
}

if (window.jobWatcher?.ready) {
  window.jobWatcher.ready.then(setupResumeFinder).catch(() => {
    byId("resume-job-list").innerHTML = "<div class=\"resume-job-loading\">The role list is unavailable offline until this page has loaded the latest job data.</div>";
  });
}
