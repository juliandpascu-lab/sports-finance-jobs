function groupCount(rows, key) {
  return rows.reduce((groups, row) => { const value = row[key] || "Unknown"; groups[value] = (groups[value] || 0) + 1; return groups; }, {});
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b), middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function chart(element, entries, suffix = "") {
  const values = entries.map((entry) => entry[1]), max = Math.max(...values, 1);
  element.innerHTML = entries.length ? entries.map(([label, value]) => `<div class="bar-row"><span class="bar-label" title="${escapeHTML(label)}">${escapeHTML(label)}</span><span class="bar-track"><span class="bar-fill" style="width:${Math.max(4, value / max * 100)}%"></span></span><strong class="bar-value">${value}${suffix}</strong></div>`).join("") : `<div class="empty-state"><p>Not enough history yet.</p></div>`;
}

function renderMarket(data) {
  const rows = data.history, lastRun = latestDate(data), lastRunDate = asDate(lastRun), nonFirst = rows.filter((row) => !asBool(row.first_run));
  document.getElementById("market-as-of").textContent = `Computed from ${rows.length} postings through ${formatDate(lastRun)} · ${data.status.days_with_success || 0} successful collection dates`;

  const newAll = groupCount(nonFirst.filter((row) => row.first_seen), "first_seen");
  const newRole = groupCount(nonFirst.filter((row) => row.first_seen && asBool(row.in_role)), "first_seen");
  const newEntries = Object.entries(newAll).sort((a, b) => a[0].localeCompare(b[0])).slice(-14);
  const newRoleEntries = Object.entries(newRole).sort((a, b) => a[0].localeCompare(b[0])).slice(-14);
  chart(document.getElementById("new-all-chart"), newEntries);
  chart(document.getElementById("new-role-chart"), newRoleEntries);
  document.getElementById("new-heading").textContent = `${Object.values(newAll).reduce((a, b) => a + b, 0)} new postings tracked`;
  document.getElementById("new-explanation").textContent = `The chart shows non-first-run postings first seen on each day. ${Object.values(newRole).reduce((a, b) => a + b, 0)} of the tracked postings match one of the twenty approved job-title families.`;

  const removed = groupCount(rows.filter((row) => row.removed_date), "removed_date");
  chart(document.getElementById("removed-chart"), Object.entries(removed).sort((a, b) => a[0].localeCompare(b[0])).slice(-14));
  document.getElementById("removed-heading").textContent = `${Object.values(removed).reduce((a, b) => a + b, 0)} postings removed`;
  document.getElementById("removed-explanation").textContent = "A posting is counted here when its source returned successfully but no longer listed it on that date.";

  const open = rows.filter((row) => row.status === "open"), employerCounts = Object.entries(groupCount(open, "employer")).sort((a, b) => b[1] - a[1]).slice(0, 10);
  chart(document.getElementById("employer-chart"), employerCounts);
  document.getElementById("employer-heading").textContent = `${open.length} open postings across ${new Set(open.map((row) => row.employer)).size} employers`;
  document.getElementById("employer-explanation").textContent = "This is the current open inventory by employer, including postings outside the default role filter.";

  const removedWithKnownStart = rows.filter((row) => !asBool(row.first_run) && row.removed_date && row.first_seen).map((row) => dateDiff(row.first_seen, row.removed_date));
  const medianDays = median(removedWithKnownStart);
  document.getElementById("median-days").textContent = medianDays == null ? "—" : `${medianDays}d`;
  document.getElementById("days-heading").textContent = medianDays == null ? "Days open is waiting" : `Median time open: ${medianDays} days`;
  document.getElementById("days-explanation").textContent = removedWithKnownStart.length ? `Based on ${removedWithKnownStart.length} removed postings that were not already open when their source entered the watchlist.` : "The metric will appear after the watcher has observed removals.";

  const eligible = rows.filter((row) => !asBool(row.first_run) && row.first_seen && lastRunDate && (lastRunDate - asDate(row.first_seen)) >= 7);
  const removedWithinSeven = eligible.filter((row) => row.removed_date && dateDiff(row.first_seen, row.removed_date) <= 7).length;
  const share = eligible.length ? Math.round(removedWithinSeven / eligible.length * 100) : null;
  document.getElementById("seven-share").textContent = share == null ? "—" : `${share}%`;
  document.getElementById("seven-heading").textContent = share == null ? "Share within seven days is waiting" : `${share}% removed within seven days`;
  document.getElementById("seven-explanation").textContent = `${removedWithinSeven} of ${eligible.length} eligible postings were removed within seven days of first being seen. Open postings remain in the denominator.`;
  document.getElementById("seven-denominator").textContent = `${eligible.length} postings first seen at least seven days before the last run`;

  const locations = {};
  open.forEach((row) => row.location.split(";").map((value) => value.trim()).filter(Boolean).forEach((value) => { locations[value] = (locations[value] || 0) + 1; }));
  chart(document.getElementById("location-chart"), Object.entries(locations).sort((a, b) => b[1] - a[1]).slice(0, 10));
  const topLocation = Object.entries(locations).sort((a, b) => b[1] - a[1])[0];
  document.getElementById("location-heading").textContent = topLocation ? `${topLocation[0]} leads the open market` : "Top locations are waiting";
  document.getElementById("location-explanation").textContent = topLocation ? "Locations are counted from the open postings as of the latest successful run; multi-location postings can contribute to more than one location." : "Location data will appear after the first successful collection.";
}

window.jobWatcher.ready.then(renderMarket).catch(() => {});
