const STORE_KEY = "leonida-platinum-path-v1";
const KIND_LABELS = { story: "Story", side: "Side characters", collectible: "Collectibles", activity: "Activities", combat: "Combat & robbery", misc: "Miscellaneous" };
const STAGES = [
  { n: 1, title: "Stage 1 — Play the story (60–80 hours)", text: "Finish Chapters 1 to 5 and the named story missions. Do the Chapter 1 balcony meditation for Positive Mental Attitude right after Down to Earth, and take the optional Chapter 4 mission That's Where The Money Is so bank vaults open up.", safe: "Finish the story's chapters and named missions in order. Do the Chapter 1 balcony meditation before the chapter ends — see the missable section below." },
  { n: 2, title: "Stage 2 — Side characters", text: "Finish the final missions for Andy, Kenton, Billy, Randy and Tyrone, and hunt Bret's unique animal. Andy is Lucia-only; Tyrone and Bret are Jason-only. Start each chain as soon as it appears.", safe: "Finish the final mission for each side character you meet along the way. Some quest chains belong to one protagonist only, so play them with the right character. Start each chain as soon as it appears." },
  { n: 3, title: "Stage 3 — Strangers & Freaks", text: "Complete 8 stranger mission strands across Leonida. These are the question-mark missions on the map; each strand counts when its chain ends.", safe: "Complete 8 stranger mission strands across Leonida. These are the question-mark missions on the map; each strand counts when its chain ends." },
  { n: 4, title: "Stage 4 — Activities & challenges", text: "Gold all 42 shooting range challenges, win drone races at all 14 locations, win 20 different races, land 250 stunts, finish 50 challenges, try every activity type, beat Cal at fishing, finish an arcade game, and meditate at all 18 spots." },
  { n: 5, title: "Stage 5 — Collectibles & exploration", text: "Complete 3 card sets, WAiNK It at 100 locations, discover 100 vehicles, explore all 52 areas of Leonida, buy all 8 garages, and register 10 vehicles to the Scooter Bros app." },
  { n: 6, title: "Stage 6 — Cleanup & 100% completion", text: "Rob 5 bank vaults, one illegal operation per gang, an armored truck and a jewelry store unseen; earn $250,000 laundering Marked Bills; spend $100,000 in shops; make 500 profile choices; then finish the 100% checklist for A Long Road — and the platinum pops." },
];

let trophies = [];
let earned = new Set();
let selectedId = null;
let spoilerOn = false;

const listEl = document.getElementById("trophyList");
const detailEl = document.getElementById("detailPane");
const searchEl = document.getElementById("searchBox");
const kindEl = document.getElementById("kindFilter");
const gradeEl = document.getElementById("gradeFilter");
const statusEl = document.getElementById("statusFilter");
const spoilerEl = document.getElementById("spoilerToggle");

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (Array.isArray(data.earned)) earned = new Set(data.earned.filter((x) => Number.isInteger(x)));
    if (typeof data.spoiler === "boolean") spoilerOn = data.spoiler;
  } catch { earned = new Set(); }
}

function save() {
  localStorage.setItem(STORE_KEY, JSON.stringify({ earned: [...earned].sort((a, b) => a - b), spoiler: spoilerOn }));
}

function gradeLabel(t) { return t.grade.charAt(0).toUpperCase() + t.grade.slice(1); }

function isStoryHidden(t) { return spoilerOn && t.kind === "story" && !earned.has(trophies.indexOf(t)); }

function visibleName(t) {
  if (isStoryHidden(t)) return "Hidden story trophy";
  return t.name;
}

function visibleDesc(t) {
  if (isStoryHidden(t)) return "Earn this trophy to reveal its name and description.";
  return t.description;
}

function filtered() {
  const q = searchEl.value.trim().toLowerCase();
  return trophies.filter((t, i) => {
    if (kindEl.value !== "all" && t.kind !== kindEl.value) return false;
    if (gradeEl.value !== "all" && t.grade !== gradeEl.value) return false;
    if (statusEl.value === "earned" && !earned.has(i)) return false;
    if (statusEl.value === "unearned" && earned.has(i)) return false;
    if (statusEl.value === "missable" && !t.missable) return false;
    if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))) return false;
    return true;
  });
}

function renderProgress() {
  const n = earned.size;
  document.getElementById("earnedCount").textContent = n + " / 55";
  document.getElementById("progressFill").style.width = (n / 55 * 100) + "%";
  document.getElementById("platinumNote").textContent = n >= 55 ? "— platinum earned. Leonida Legend!" : "— " + (54 - Math.min(n, 54)) + " to go before the platinum pops.";
  const counts = {};
  for (const t of trophies) counts[t.grade] = (counts[t.grade] || 0) + 1;
  const got = {};
  earned.forEach((i) => { const g = trophies[i].grade; got[g] = (got[g] || 0) + 1; });
  document.getElementById("gradeCounts").textContent =
    ["platinum", "gold", "silver", "bronze"].map((g) => gradeLabel({ grade: g }) + " " + (got[g] || 0) + "/" + (counts[g] || 0)).join("  ·  ");
}

function renderRoadmap() {
  const box = document.getElementById("stageList");
  box.innerHTML = "";
  for (const s of STAGES) {
    const items = trophies.filter((t) => t.roadmap === s.n);
    const done = items.filter((t) => earned.has(trophies.indexOf(t))).length;
    const li = document.createElement("li");
    if (items.length && done === items.length) li.className = "done";
    const h = document.createElement("h3");
    h.textContent = s.title;
    const p = document.createElement("p");
    // Spoiler-safe mode must not leak story names through the roadmap either:
    // stages 1-3 name characters and missions, so show their safe wording.
    p.textContent = spoilerOn && s.safe ? s.safe : s.text;
    const c = document.createElement("p");
    c.className = "stage-count";
    c.textContent = done + " / " + items.length + " trophies in this stage";
    li.append(h, p, c);
    box.append(li);
  }
}

function renderList() {
  const rows = filtered();
  document.getElementById("shownCount").textContent = "(" + rows.length + " shown)";
  listEl.innerHTML = "";
  for (const t of rows) {
    const i = trophies.indexOf(t);
    const li = document.createElement("li");
    li.className = "trophy" + (earned.has(i) ? " earned" : "") + (selectedId === i ? " selected" : "");
    const head = document.createElement("div");
    head.className = "trophy-head";
    const box = document.createElement("input");
    box.type = "checkbox";
    box.checked = earned.has(i);
    box.setAttribute("aria-label", "Mark " + t.name + " as earned");
    box.addEventListener("click", (e) => { e.stopPropagation(); toggleEarned(i); });
    const top = document.createElement("div");
    top.className = "trophy-top";
    const name = document.createElement("span");
    name.className = "trophy-name";
    name.textContent = visibleName(t);
    const badge = document.createElement("span");
    badge.className = "badge " + t.grade;
    badge.textContent = gradeLabel(t);
    top.append(name, badge);
    if (t.hidden) { const f = document.createElement("span"); f.className = "flag hidden"; f.textContent = "Hidden"; top.append(f); }
    if (t.missable) { const f = document.createElement("span"); f.className = "flag missable"; f.textContent = "Missable"; top.append(f); }
    head.append(box, top);
    const desc = document.createElement("p");
    desc.className = "trophy-desc";
    desc.textContent = visibleDesc(t);
    const meta = document.createElement("p");
    meta.className = "trophy-meta";
    const bits = [KIND_LABELS[t.kind] || t.kind, "Roadmap stage " + t.roadmap];
    if (t.count) bits.push("Target: " + t.count.toLocaleString("en-US"));
    meta.textContent = bits.join(" · ");
    li.append(head, desc, meta);
    li.addEventListener("click", () => selectTrophy(i));
    listEl.append(li);
  }
  if (!rows.length) {
    const li = document.createElement("li");
    li.textContent = "No trophies match these filters.";
    listEl.append(li);
  }
}

function selectTrophy(i) {
  selectedId = i;
  renderList();
  renderDetail();
  try { history.replaceState(null, "", "#trophy=" + i); } catch { /* file:// and sandboxed frames forbid history edits; selection still works */ }
}

function toggleEarned(i) {
  if (earned.has(i)) earned.delete(i); else earned.add(i);
  save();
  renderAll();
}

function renderDetail() {
  if (selectedId === null || !trophies[selectedId]) {
    detailEl.innerHTML = "<p class=\"detail-empty\">Pick a trophy from the checklist to read its guide, its sources, and when it can be missed.</p>";
    return;
  }
  const t = trophies[selectedId];
  detailEl.innerHTML = "";
  const h = document.createElement("h3");
  h.textContent = visibleName(t);
  const badges = document.createElement("p");
  const badge = document.createElement("span");
  badge.className = "badge " + t.grade;
  badge.textContent = gradeLabel(t);
  badges.append(badge);
  if (t.hidden) { const f = document.createElement("span"); f.className = "flag hidden"; f.textContent = " Hidden"; badges.append(f); }
  if (t.missable) { const f = document.createElement("span"); f.className = "flag missable"; f.textContent = " Missable"; badges.append(f); }
  const off = document.createElement("p");
  off.className = "official";
  off.textContent = "Official: " + visibleDesc(t);
  const guideH = document.createElement("h4");
  guideH.textContent = "Guide";
  const guide = document.createElement("p");
  guide.textContent = isStoryHidden(t) ? "This story trophy is hidden while spoiler-safe is on. Earn it (or switch spoiler-safe off) to read its guide." : t.guide;
  const srcH = document.createElement("h4");
  srcH.textContent = "Sources";
  const ul = document.createElement("ul");
  for (const s of t.sources) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = s;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = new URL(s).hostname.replace(/^www\./, "");
    li.append(a);
    ul.append(li);
  }
  const missH = document.createElement("h4");
  missH.textContent = "Can it be missed?";
  const miss = document.createElement("p");
  miss.textContent = t.missable
    ? "Yes — possibly. Do the Chapter 1 balcony meditation for this trophy before Chapter 1 ends."
    : "No. It stays available in free-roam after the story, or comes naturally from story progress.";
  const earnedBtn = document.createElement("button");
  earnedBtn.type = "button";
  earnedBtn.textContent = earned.has(selectedId) ? "Mark as unearned" : "Mark as earned";
  earnedBtn.addEventListener("click", () => toggleEarned(selectedId));
  detailEl.append(h, badges, off, guideH, guide, srcH, ul, missH, miss, earnedBtn);
}

function renderAll() {
  renderProgress();
  renderRoadmap();
  renderList();
  renderDetail();
}

function exportProgress() {
  const blob = new Blob([JSON.stringify({ app: "leonida-platinum-path", earned: [...earned].sort((a, b) => a - b), spoiler: spoilerOn }, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "gta6-trophy-progress.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function importProgress(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result));
      if (!Array.isArray(data.earned)) throw new Error("bad file");
      earned = new Set(data.earned.filter((x) => Number.isInteger(x) && x >= 0 && x < trophies.length));
      if (typeof data.spoiler === "boolean") { spoilerOn = data.spoiler; spoilerEl.checked = spoilerOn; }
      save();
      renderAll();
    } catch { alert("That file is not a progress export from this guide."); }
  };
  reader.readAsText(file);
}

function applyHash() {
  const hash = new URLSearchParams(location.hash.slice(1));
  if (hash.get("spoiler") === "on") { spoilerOn = true; spoilerEl.checked = true; }
  if (hash.get("filter") === "missable") statusEl.value = "missable";
  const rawId = hash.get("trophy");
  const id = rawId === null ? NaN : Number(rawId);
  if (Number.isInteger(id) && id >= 0 && id < trophies.length) selectedId = id;
}

async function boot() {
  const res = await fetch("data/trophies.json");
  const data = await res.json();
  trophies = data.trophies;
  loadSaved();
  spoilerEl.checked = spoilerOn;
  applyHash();
  searchEl.addEventListener("input", renderList);
  kindEl.addEventListener("change", renderList);
  gradeEl.addEventListener("change", renderList);
  statusEl.addEventListener("change", renderList);
  spoilerEl.addEventListener("change", () => { spoilerOn = spoilerEl.checked; save(); renderAll(); });
  document.getElementById("exportBtn").addEventListener("click", exportProgress);
  document.getElementById("importBtn").addEventListener("click", () => document.getElementById("importFile").click());
  document.getElementById("importFile").addEventListener("change", (e) => { if (e.target.files[0]) importProgress(e.target.files[0]); });
  document.getElementById("resetBtn").addEventListener("click", () => {
    if (confirm("Clear all earned trophies?")) { earned = new Set(); save(); renderAll(); }
  });
  renderAll();
}

boot();
