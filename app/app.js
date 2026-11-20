const DATA_URL = "data/trophies.json";
const STORE_KEY = "leonida-legend-earned-v1";
const SPOILER_KEY = "leonida-legend-spoiler-v1";

const STAGES = [
  { n: 1, title: "Play Chapter 1 — and do the one missable meditation", text: "Finish Gone Fishing and Chapter 1. Before the chapter ends, do Lucia's balcony meditation at Jason's house, or Positive Mental Attitude may be lost for this playthrough." },
  { n: 2, title: "Chapters 2–3 — unlock both characters and the tools", text: "Coffee Break unlocks switching between Jason and Lucia and the partner trophies. The Key Cloner, the Snap Gun and the fences open the robbery and side-quest trophies. Scan vehicles and study animals as you travel." },
  { n: 3, title: "Chapters 4–5 — finish the story", text: "Clear the last chapters and the final mission. After the credits you return to free-roam, so nothing else can be missed." },
  { n: 4, title: "The 100% checklist grind", text: "Shooting ranges, drone races, stunts, cards, WAiNK scans, bank vaults, garages and the money trophies. This stage is most of the roughly 200 hours." },
  { n: 5, title: "Strangers, side quests and odd jobs", text: "The 8 counting stranger strands, the criminal-profile tally and the UFO easter egg. Check what is still missing in the tracker." },
  { n: 6, title: "Platinum", text: "Vice Got a Price! pops the moment the other 54 trophies are earned." },
];

const KIND_LABELS = {
  story: "Story",
  side: "Side quest",
  collectibles: "Collectibles",
  activities: "Activities",
  completion: "Completion",
  platinum: "Platinum",
};

let trophies = [];
let earned = new Set();
let spoilerOn = false;
let kindFilter = "all";
let gradeFilter = "all";
let statusFilter = "all";
let query = "";
let openGuide = null;

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) earned = new Set(JSON.parse(raw).filter((x) => Number.isInteger(x)));
  } catch (e) { earned = new Set(); }
  try { spoilerOn = localStorage.getItem(SPOILER_KEY) === "1"; } catch (e) { spoilerOn = false; }
}

function saveEarned() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(Array.from(earned).sort((a, b) => a - b))); } catch (e) { /* storage full or blocked; progress still shows this session */ }
}

function saveSpoiler() {
  try { localStorage.setItem(SPOILER_KEY, spoilerOn ? "1" : "0"); } catch (e) { /* ignore */ }
}

function readHash() {
  const hash = new URLSearchParams(location.hash.slice(1));
  const kind = hash.get("filter");
  if (kind && ["story", "missable", "collectibles", "activities", "side"].includes(kind)) kindFilter = kind;
  if (hash.get("spoiler") === "on") spoilerOn = true;
  const earnedParam = hash.get("earned");
  if (earnedParam) {
    earnedParam.split(",").forEach((part) => {
      const n = parseInt(part, 10);
      if (Number.isInteger(n) && n >= 1 && n <= 55) earned.add(n);
    });
    saveEarned();
  }
  const trophyParam = hash.get("trophy");
  if (trophyParam) {
    const n = parseInt(trophyParam, 10);
    if (Number.isInteger(n) && n >= 1 && n <= 55) openGuide = n;
  }
}

function isStoryHidden(t) {
  return t.hidden && t.kind === "story";
}

function displayName(t, id) {
  if (spoilerOn && isStoryHidden(t) && !earned.has(id)) return "Hidden story trophy";
  return t.name;
}

function displayDesc(t, id) {
  if (spoilerOn && isStoryHidden(t) && !earned.has(id)) return "Its name and description stay hidden until you earn it.";
  return t.description;
}

function gradeLabel(g) {
  return g.charAt(0).toUpperCase() + g.slice(1);
}

function renderProgress() {
  const total = trophies.length;
  const done = trophies.filter((t, i) => earned.has(i + 1)).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  document.getElementById("progressFill").style.width = pct + "%";
  document.getElementById("progressText").textContent = done + " of " + total + " earned · " + pct + "%";
  const byGrade = {};
  trophies.forEach((t, i) => {
    if (!byGrade[t.grade]) byGrade[t.grade] = [0, 0];
    byGrade[t.grade][1] += 1;
    if (earned.has(i + 1)) byGrade[t.grade][0] += 1;
  });
  document.getElementById("gradeCounts").textContent = ["platinum", "gold", "silver", "bronze"]
    .map((g) => gradeLabel(g) + " " + (byGrade[g] ? byGrade[g][0] : 0) + "/" + (byGrade[g] ? byGrade[g][1] : 0))
    .join(" · ");
}

function renderRoadmap() {
  const list = document.getElementById("stageList");
  list.innerHTML = "";
  STAGES.forEach((stage) => {
    const members = trophies.filter((t) => t.roadmap === stage.n);
    const li = document.createElement("li");
    const h = document.createElement("h3");
    const num = document.createElement("span");
    num.className = "n";
    num.textContent = stage.n;
    h.appendChild(num);
    h.appendChild(document.createTextNode(stage.title));
    const p = document.createElement("p");
    p.textContent = stage.text;
    const inner = document.createElement("p");
    inner.className = "in";
    const got = members.filter((t, i) => earned.has(trophies.indexOf(t) + 1)).length;
    const visibleNames = [];
    let hiddenCount = 0;
    members.forEach((t) => {
      const id = trophies.indexOf(t) + 1;
      if (spoilerOn && isStoryHidden(t) && !earned.has(id)) hiddenCount += 1;
      else visibleNames.push(t.name);
    });
    let stageLine = "Trophies in this stage: " + got + "/" + members.length;
    if (visibleNames.length) stageLine += " — " + visibleNames.join(", ");
    if (hiddenCount) stageLine += (visibleNames.length ? " · " : " — ") + hiddenCount + " hidden story " + (hiddenCount === 1 ? "trophy" : "trophies");
    inner.textContent = stageLine;
    li.appendChild(h);
    li.appendChild(p);
    li.appendChild(inner);
    list.appendChild(li);
  });
}

function trophyMatches(t, id) {
  if (kindFilter === "missable" && !t.missable) return false;
  if (kindFilter !== "all" && kindFilter !== "missable" && t.kind !== kindFilter) return false;
  if (gradeFilter !== "all" && t.grade !== gradeFilter) return false;
  if (statusFilter === "earned" && !earned.has(id)) return false;
  if (statusFilter === "todo" && earned.has(id)) return false;
  if (query) {
    const hay = (t.name + " " + t.description + " " + t.guide).toLowerCase();
    if (!hay.includes(query)) return false;
  }
  return true;
}

function renderList() {
  const list = document.getElementById("trophyList");
  list.innerHTML = "";
  let shown = 0;
  trophies.forEach((t, index) => {
    const id = index + 1;
    if (!trophyMatches(t, id)) return;
    shown += 1;
    const li = document.createElement("li");
    li.className = "trophy" + (earned.has(id) ? " earned" : "") + (t.hidden ? " hiddenTrophy" : "");
    li.id = "trophy-" + id;

    const row = document.createElement("div");
    row.className = "row";
    const box = document.createElement("input");
    box.type = "checkbox";
    box.checked = earned.has(id);
    box.setAttribute("aria-label", "Mark " + t.name + " as earned");
    box.addEventListener("change", () => {
      if (box.checked) earned.add(id); else earned.delete(id);
      saveEarned();
      renderProgress();
      renderRoadmap();
      renderList();
    });
    const main = document.createElement("div");
    main.className = "main";
    const h = document.createElement("h3");
    if (spoilerOn && isStoryHidden(t) && !earned.has(id)) {
      const span = document.createElement("span");
      span.className = "spoiled";
      span.textContent = "Hidden story trophy";
      h.appendChild(span);
    } else {
      h.textContent = t.name;
    }
    const desc = document.createElement("p");
    desc.className = "desc";
    desc.textContent = displayDesc(t, id);
    const tags = document.createElement("div");
    tags.className = "tags";
    const gradeTag = document.createElement("span");
    gradeTag.className = "tag grade-" + t.grade;
    gradeTag.textContent = gradeLabel(t.grade);
    tags.appendChild(gradeTag);
    const kindTag = document.createElement("span");
    kindTag.className = "tag kind";
    kindTag.textContent = KIND_LABELS[t.kind] || t.kind;
    tags.appendChild(kindTag);
    if (t.count) {
      const countTag = document.createElement("span");
      countTag.className = "tag";
      countTag.textContent = "Target: " + t.count.toLocaleString("en-US");
      tags.appendChild(countTag);
    }
    if (t.hidden) {
      const hiddenTag = document.createElement("span");
      hiddenTag.className = "tag hiddenTag";
      hiddenTag.textContent = "Hidden on PS5";
      tags.appendChild(hiddenTag);
    }
    if (t.missable) {
      const missTag = document.createElement("span");
      missTag.className = "tag miss";
      missTag.textContent = "MISSABLE — do in Chapter 1";
      tags.appendChild(missTag);
    }
    const stageTag = document.createElement("span");
    stageTag.className = "tag";
    stageTag.textContent = "Roadmap stage " + t.roadmap;
    tags.appendChild(stageTag);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "guideBtn";
    btn.textContent = openGuide === id ? "Hide guide" : "Read the guide";
    btn.addEventListener("click", () => {
      openGuide = openGuide === id ? null : id;
      renderList();
    });

    main.appendChild(h);
    main.appendChild(desc);
    main.appendChild(tags);
    main.appendChild(btn);
    if (openGuide === id) {
      const guide = document.createElement("div");
      guide.className = "guide";
      const gp = document.createElement("p");
      gp.textContent = t.guide;
      guide.appendChild(gp);
      const src = document.createElement("p");
      src.className = "src";
      src.textContent = "Sources: ";
      t.sources.forEach((url, i) => {
        if (i > 0) src.appendChild(document.createTextNode(" · "));
        const a = document.createElement("a");
        a.href = url;
        a.textContent = hostOf(url);
        a.target = "_blank";
        a.rel = "noopener";
        src.appendChild(a);
      });
      guide.appendChild(src);
      main.appendChild(guide);
    }
    row.appendChild(box);
    row.appendChild(main);
    li.appendChild(row);
    list.appendChild(li);
  });
  document.getElementById("listHead").textContent = "Showing " + shown + " of " + trophies.length + " trophies";
  document.getElementById("emptyNote").hidden = shown !== 0;
}

function hostOf(url) {
  try { return new URL(url).hostname.replace("www.", ""); } catch (e) { return "source"; }
}

function exportProgress() {
  const payload = {
    app: "leonida-legend",
    exportedAt: new Date().toISOString(),
    earned: Array.from(earned).sort((a, b) => a - b),
    spoiler: spoilerOn,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "gta6-trophy-progress.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function importProgress(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result));
      const ids = Array.isArray(data.earned) ? data.earned : data;
      const next = new Set();
      ids.forEach((n) => {
        const v = parseInt(n, 10);
        if (Number.isInteger(v) && v >= 1 && v <= trophies.length) next.add(v);
      });
      earned = next;
      if (typeof data.spoiler === "boolean") {
        spoilerOn = data.spoiler;
        document.getElementById("spoilerToggle").checked = spoilerOn;
        saveSpoiler();
      }
      saveEarned();
      renderProgress();
      renderRoadmap();
      renderList();
      document.getElementById("saveNote").textContent = "Progress imported: " + earned.size + " trophies earned.";
    } catch (e) {
      document.getElementById("saveNote").textContent = "That file could not be read as a progress export. Nothing was changed.";
    }
  };
  reader.readAsText(file);
}

function bindControls() {
  document.getElementById("kindFilters").addEventListener("click", (event) => {
    const btn = event.target.closest("button[data-kind]");
    if (!btn) return;
    kindFilter = btn.dataset.kind;
    document.querySelectorAll("#kindFilters button").forEach((b) => b.classList.toggle("on", b === btn));
    renderList();
  });
  document.getElementById("gradeFilter").addEventListener("change", (event) => {
    gradeFilter = event.target.value;
    renderList();
  });
  document.getElementById("statusFilter").addEventListener("change", (event) => {
    statusFilter = event.target.value;
    renderList();
  });
  document.getElementById("searchBox").addEventListener("input", (event) => {
    query = event.target.value.trim().toLowerCase();
    renderList();
  });
  const spoiler = document.getElementById("spoilerToggle");
  spoiler.checked = spoilerOn;
  spoiler.addEventListener("change", () => {
    spoilerOn = spoiler.checked;
    saveSpoiler();
    renderList();
  });
  document.getElementById("exportBtn").addEventListener("click", exportProgress);
  document.getElementById("importBtn").addEventListener("click", () => {
    document.getElementById("importFile").click();
  });
  document.getElementById("importFile").addEventListener("change", (event) => {
    if (event.target.files && event.target.files[0]) importProgress(event.target.files[0]);
    event.target.value = "";
  });
  document.getElementById("resetBtn").addEventListener("click", () => {
    if (window.confirm("Clear every ticked trophy? This cannot be undone.")) {
      earned = new Set();
      saveEarned();
      renderProgress();
      renderRoadmap();
      renderList();
    }
  });
}

async function boot() {
  loadSaved();
  readHash();
  const response = await fetch(DATA_URL);
  if (!response.ok) throw new Error("Could not load the trophy data.");
  const data = await response.json();
  trophies = data.trophies || data;
  document.querySelectorAll("#kindFilters button").forEach((b) => b.classList.toggle("on", b.dataset.kind === kindFilter));
  bindControls();
  renderProgress();
  renderRoadmap();
  renderList();
  if (openGuide) {
    const el = document.getElementById("trophy-" + openGuide);
    if (el) el.scrollIntoView({ block: "start" });
  }
}

boot().catch((err) => {
  document.getElementById("listHead").textContent = "The trophy data could not be loaded. Serve the app folder over HTTP and reload.";
});
