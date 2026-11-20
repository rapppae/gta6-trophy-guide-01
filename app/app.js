// Leonida Platinum Path — tracker logic.
// Loads the trophy data from data/trophies.json (a relative path, so the app
// works offline), renders the checklist, and keeps progress in localStorage.
// Deep links: #trophy=<slug> opens one trophy, #filter=missable shows only
// missable trophies, #spoiler=on turns spoiler-safe mode on.

const STORE_KEY = "leonida-platinum-path-v1";
const listEl = document.getElementById("trophyList");
const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");
const countLine = document.getElementById("countLine");
const searchBox = document.getElementById("searchBox");
const kindFilter = document.getElementById("kindFilter");
const gradeFilter = document.getElementById("gradeFilter");
const statusFilter = document.getElementById("statusFilter");
const spoilerToggle = document.getElementById("spoilerToggle");

let trophies = [];
let earned = new Set();
let openId = null;

function slugOf(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.earned)) earned = new Set(parsed.earned);
    if (typeof parsed.spoiler === "boolean") spoilerToggle.checked = parsed.spoiler;
    // Restore the reader's last filters too, so a returning visitor picks up
    // exactly where they left off instead of starting from the full list.
    if (typeof parsed.kind === "string" && [...kindFilter.options].some((o) => o.value === parsed.kind)) kindFilter.value = parsed.kind;
    if (typeof parsed.grade === "string" && [...gradeFilter.options].some((o) => o.value === parsed.grade)) gradeFilter.value = parsed.grade;
    if (typeof parsed.status === "string" && [...statusFilter.options].some((o) => o.value === parsed.status)) statusFilter.value = parsed.status;
  } catch (err) {
    console.warn("Saved progress could not be read; starting fresh.", err);
  }
}

function save() {
  localStorage.setItem(STORE_KEY, JSON.stringify({ earned: [...earned], spoiler: spoilerToggle.checked, kind: kindFilter.value, grade: gradeFilter.value, status: statusFilter.value }));
}

function hostOf(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function hiddenBySpoiler(t) {
  return spoilerToggle.checked && t.hidden && t.kind === "story" && !earned.has(slugOf(t.name));
}

function matchesFilters(t) {
  const q = searchBox.value.trim().toLowerCase();
  if (q && !t.name.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) return false;
  if (kindFilter.value !== "all" && t.kind !== kindFilter.value) return false;
  if (gradeFilter.value !== "all" && t.grade !== gradeFilter.value) return false;
  const has = earned.has(slugOf(t.name));
  if (statusFilter.value === "earned" && !has) return false;
  if (statusFilter.value === "unearned" && has) return false;
  if (statusFilter.value === "missable" && !t.missable) return false;
  return true;
}

function render() {
  const shown = trophies.filter(matchesFilters);
  const done = trophies.filter((t) => earned.has(slugOf(t.name))).length;
  const pct = trophies.length ? Math.round((done / trophies.length) * 100) : 0;
  progressFill.style.width = pct + "%";
  progressText.textContent = `${done} of ${trophies.length} trophies earned — ${pct}% to the platinum`;
  countLine.textContent = `Showing ${shown.length} of ${trophies.length} trophies.`;
  document.body.classList.toggle("spoiler-hidden", spoilerToggle.checked);

  listEl.innerHTML = "";
  if (shown.length === 0) {
    const p = document.createElement("p");
    p.className = "empty";
    p.textContent = "No trophies match these filters. Try clearing the search or the filters.";
    listEl.appendChild(p);
    return;
  }

  for (const t of shown) {
    const id = slugOf(t.name);
    const isEarned = earned.has(id);
    const secret = hiddenBySpoiler(t);
    const card = document.createElement("article");
    card.className = `trophy grade-${t.grade}${isEarned ? " earned" : ""}`;
    card.id = `trophy-${id}`;

    const head = document.createElement("div");
    head.className = "trophy-head";
    const title = document.createElement("h3");
    title.textContent = secret ? "Hidden story trophy — earn it to reveal the name" : t.name;
    if (secret) title.classList.add("secret");
    const grade = document.createElement("span");
    grade.className = "grade";
    grade.textContent = t.grade;
    head.append(title, grade);
    if (t.missable) {
      const tag = document.createElement("span");
      tag.className = "tag missable";
      tag.textContent = "Missable";
      head.appendChild(tag);
    }
    if (t.hidden) {
      const tag = document.createElement("span");
      tag.className = "tag hidden-tag";
      tag.textContent = "Hidden";
      head.appendChild(tag);
    }
    card.appendChild(head);

    const desc = document.createElement("p");
    desc.className = "desc" + (secret ? " secret" : "");
    desc.textContent = secret ? "Spoiler-safe mode hides this description until the trophy is earned." : t.description;
    card.appendChild(desc);

    const guide = document.createElement("p");
    guide.className = "guide";
    guide.textContent = secret
      ? "Story trophy. Play through the story and it will unlock — no extra step is needed."
      : t.guide;
    card.appendChild(guide);

    const meta = document.createElement("p");
    meta.className = "meta";
    const bits = [`Roadmap stage ${t.roadmap}`, `Kind: ${t.kind}`];
    if (t.count !== null && t.count !== undefined) bits.push(`Target: ${t.count}`);
    meta.textContent = bits.join(" · ");
    card.appendChild(meta);

    if (!secret && Array.isArray(t.sources) && t.sources.length > 0) {
      const src = document.createElement("p");
      src.className = "sources";
      src.textContent = "Sources: " + t.sources.map(hostOf).join(", ");
      card.appendChild(src);
    }

    const label = document.createElement("label");
    label.className = "check";
    const box = document.createElement("input");
    box.type = "checkbox";
    box.checked = isEarned;
    box.addEventListener("change", () => {
      if (box.checked) earned.add(id);
      else earned.delete(id);
      save();
      render();
    });
    const span = document.createElement("span");
    span.textContent = isEarned ? "Earned" : "Mark as earned";
    label.append(box, span);
    card.appendChild(label);

    listEl.appendChild(card);
  }

  if (openId) {
    const target = document.getElementById(`trophy-${openId}`);
    if (target) target.scrollIntoView({ block: "start" });
  }
}

function readHash() {
  const params = new URLSearchParams(location.hash.slice(1));
  if (params.get("trophy")) openId = params.get("trophy");
  if (params.get("filter") === "missable") statusFilter.value = "missable";
  if (params.get("spoiler") === "on") spoilerToggle.checked = true;
  if (params.get("kind")) kindFilter.value = params.get("kind");
  if (params.get("grade")) gradeFilter.value = params.get("grade");
}

function exportProgress() {
  const blob = new Blob([JSON.stringify({ earned: [...earned], spoiler: spoilerToggle.checked, kind: kindFilter.value, grade: gradeFilter.value, status: statusFilter.value }, null, 2)], {
    type: "application/json",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "gta6-trophy-progress.json";
  link.click();
  URL.revokeObjectURL(link.href);
}

function importProgress(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      if (!Array.isArray(parsed.earned)) throw new Error("file has no earned list");
      earned = new Set(parsed.earned.filter((x) => typeof x === "string"));
      if (typeof parsed.spoiler === "boolean") spoilerToggle.checked = parsed.spoiler;
      if (typeof parsed.kind === "string") kindFilter.value = parsed.kind;
      if (typeof parsed.grade === "string") gradeFilter.value = parsed.grade;
      if (typeof parsed.status === "string") statusFilter.value = parsed.status;
      save();
      render();
    } catch (err) {
      alert("That file could not be imported: " + err.message);
    }
  };
  reader.readAsText(file);
}

searchBox.addEventListener("input", render);
kindFilter.addEventListener("change", () => {
  save();
  render();
});
gradeFilter.addEventListener("change", () => {
  save();
  render();
});
statusFilter.addEventListener("change", () => {
  save();
  render();
});
spoilerToggle.addEventListener("change", () => {
  save();
  render();
});
document.getElementById("exportBtn").addEventListener("click", exportProgress);
document.getElementById("importBtn").addEventListener("click", () => document.getElementById("importFile").click());
document.getElementById("importFile").addEventListener("change", (event) => {
  if (event.target.files && event.target.files[0]) importProgress(event.target.files[0]);
  event.target.value = "";
});

loadSaved();
readHash();
fetch("data/trophies.json")
  .then((res) => {
    if (!res.ok) throw new Error("trophies.json failed to load");
    return res.json();
  })
  .then((data) => {
    trophies = data.trophies || [];
    render();
  })
  .catch((err) => {
    progressText.textContent = "Could not load the trophy list: " + err.message;
  });
