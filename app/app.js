// LEONIDA — GTA VI Trophy Guide & Tracker (offline, static, no build step).
// Loads app/data/trophies.json (a file of this app, so it works with the network off),
// keeps the checklist in localStorage, and never makes a network request of its own.

const STORE_KEY = 'leonida-gta6-trophies-v1';
const SPOILER_KEY = 'leonida-gta6-spoiler-v1';

const ROADMAP = [
  { title: 'Stage 1 — Story first', text: 'Play Chapters 1–4 and the final mission. Story trophies unlock as you go; do not chase collectibles yet.' },
  { title: 'Stage 2 — Strangers & side missions', text: 'Finish the stranger strands and the final missions for Andy, Kenton, Billy, Randy and Tyrone.' },
  { title: 'Stage 3 — Activities', text: 'Stunts, Shooting Range golds, races, fishing, arcade, bowling and meditation spots.' },
  { title: 'Stage 4 — Collectibles', text: 'Collectible Card sets, WAiNK It locations, vehicles and every area of Leonida.' },
  { title: 'Stage 5 — Combat & chaos', text: 'Wanted levels with your partner, robberies, Combat Focus and the Rhino tank.' },
  { title: 'Stage 6 — Cleanup & 100%', text: 'Mop up the counters, reach 100% completion (gold), then the platinum pops.' },
];

const KIND_LABEL = { story: 'Story', missable: 'Missable', collectibles: 'Collectibles', activities: 'Activities', online: 'Online', platinum: 'Platinum' };

let trophies = [];
let earned = new Set();
let spoilerSafe = false;

function loadStore() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) earned = new Set(JSON.parse(raw).filter((n) => typeof n === 'number'));
  } catch { earned = new Set(); }
  try { spoilerSafe = localStorage.getItem(SPOILER_KEY) === '1'; } catch { spoilerSafe = false; }
}
function saveStore() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify([...earned].sort((a, b) => a - b))); } catch { /* storage unavailable */ }
}
function saveSpoiler() {
  try { localStorage.setItem(SPOILER_KEY, spoilerSafe ? '1' : '0'); } catch { /* ignore */ }
}

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined && text !== null) n.textContent = text;
  return n;
}

function isStory(t) { return (t.kind || []).includes('story'); }
function isHiddenName(t) { return spoilerSafe && isStory(t) && !earned.has(t.id); }

function gradeBadge(grade) {
  const b = el('span', 'grade grade-' + grade, grade);
  return b;
}

function renderRoadmap() {
  const ol = document.getElementById('roadmap');
  ol.textContent = '';
  for (const s of ROADMAP) {
    const li = document.createElement('li');
    li.appendChild(el('b', null, s.title));
    li.appendChild(el('span', null, s.text));
    ol.appendChild(li);
  }
}

function trophyKinds(t) { return Array.isArray(t.kind) ? t.kind : (t.kind ? [t.kind] : []); }

function matches(t) {
  const q = (document.getElementById('search').value || '').trim().toLowerCase();
  const kind = document.getElementById('kindFilter').value;
  const grade = document.getElementById('gradeFilter').value;
  const status = document.getElementById('statusFilter').value;
  if (q) {
    const hay = [t.name, t.description, t.guide, (t.steps || []).join(' ')].join(' ').toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (kind !== 'all') {
    if (kind === 'missable') { if (!t.missable) return false; }
    else if (!trophyKinds(t).includes(kind)) return false;
  }
  if (grade !== 'all' && t.grade !== grade) return false;
  if (status === 'earned' && !earned.has(t.id)) return false;
  if (status === 'unearned' && earned.has(t.id)) return false;
  return true;
}

function renderList() {
  const list = document.getElementById('trophyList');
  list.textContent = '';
  const shown = trophies.filter(matches);
  const countLine = document.getElementById('countLine');
  countLine.textContent = 'Showing ' + shown.length + ' of ' + trophies.length + ' trophies · ' + earned.size + ' earned';
  if (!shown.length) {
    list.appendChild(el('p', 'empty', 'No trophies match these filters.'));
    return;
  }
  for (const t of shown) {
    const card = el('article', 'card' + (earned.has(t.id) ? ' earned' : ''));
    card.tabIndex = 0;
    const head = el('div', 'card-head');
    const check = el('button', 'check', '✓');
    check.type = 'button';
    check.setAttribute('aria-label', (earned.has(t.id) ? 'Mark unearned: ' : 'Mark earned: ') + t.name);
    check.addEventListener('click', (e) => { e.stopPropagation(); toggleEarned(t.id); });
    head.appendChild(check);
    const title = el('div', 'card-title');
    const hidden = isHiddenName(t);
    title.appendChild(el('h3', null, hidden ? 'Hidden trophy — earn it to reveal' : t.name));
    title.appendChild(el('p', null, hidden ? 'A story trophy. Its name and description stay hidden until you earn it.' : t.description));
    head.appendChild(title);
    head.appendChild(gradeBadge(t.grade));
    card.appendChild(head);
    const tags = el('div', 'tags');
    for (const k of trophyKinds(t)) tags.appendChild(el('span', 'tag tag-' + k, KIND_LABEL[k] || k));
    if (t.missable) tags.appendChild(el('span', 'tag tag-missable', 'Missable'));
    if (t.hidden) tags.appendChild(el('span', 'tag tag-hidden', 'Hidden on PS'));
    card.appendChild(tags);
    if (!hidden) card.appendChild(el('p', 'guide-preview', t.guide || ''));
    const foot = el('div', 'card-foot');
    foot.appendChild(el('span', null, earned.has(t.id) ? '✓ Earned' : 'Not earned yet'));
    foot.appendChild(el('span', 'open', 'Guide →'));
    card.appendChild(foot);
    const open = () => openDetail(t);
    card.addEventListener('click', open);
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    list.appendChild(card);
  }
}

function renderProgress() {
  const total = trophies.length || 55;
  const n = earned.size;
  const pct = total ? Math.round((n / total) * 100) : 0;
  document.getElementById('earnedCount').textContent = String(n);
  document.getElementById('progressPct').textContent = pct + '%';
  document.getElementById('progressFill').style.width = pct + '%';
  const plat = trophies.find((t) => t.grade === 'platinum');
  const note = document.getElementById('platinumNote');
  if (plat && earned.has(plat.id)) note.textContent = 'Platinum earned — you are a Leonida Legend.';
  else if (n >= total - 1) note.textContent = 'One trophy left — the platinum is next.';
  else note.textContent = 'Platinum locked — earn the other 54 first.';
}

function toggleEarned(id) {
  if (earned.has(id)) earned.delete(id); else earned.add(id);
  saveStore();
  renderProgress();
  renderList();
}

function openDetail(t) {
  const modal = document.getElementById('detailModal');
  const body = document.getElementById('detailBody');
  body.textContent = '';
  const hidden = isHiddenName(t);
  body.appendChild(el('h2', null, hidden ? 'Hidden trophy' : t.name)).id = 'detailTitle';
  const meta = el('p', 'desc', hidden ? 'A story trophy. Earn it in the game to reveal its name and description here.' : t.description);
  body.appendChild(meta);
  const tags = el('div', 'tags');
  tags.appendChild(gradeBadge(t.grade));
  for (const k of trophyKinds(t)) tags.appendChild(el('span', 'tag tag-' + k, KIND_LABEL[k] || k));
  if (t.missable) tags.appendChild(el('span', 'tag tag-missable', 'Missable'));
  body.appendChild(tags);
  if (t.missable && !hidden) {
    body.appendChild(el('div', 'warn', 'Missable — do this when the moment comes. ' + (t.missable_note || 'Some missables can be retried with mission replay; a one-time choice or event cannot.')));
  }
  if (!hidden) {
    body.appendChild(el('h3', null, 'Guide'));
    body.appendChild(el('p', null, t.guide || ''));
    if (Array.isArray(t.steps) && t.steps.length) {
      body.appendChild(el('h3', null, 'Steps'));
      const ol = document.createElement('ol');
      for (const s of t.steps) ol.appendChild(el('li', null, s));
      body.appendChild(ol);
    }
    if (Array.isArray(t.sources) && t.sources.length) {
      body.appendChild(el('h3', null, 'Sources'));
      const ul = el('ul', 'src-list');
      for (const s of t.sources) {
        const li = document.createElement('li');
        if (s.url) {
          const a = document.createElement('a');
          a.href = s.url; a.textContent = s.name; a.target = '_blank'; a.rel = 'noopener';
          li.appendChild(a);
        } else li.textContent = s.name;
        ul.appendChild(li);
      }
      body.appendChild(ul);
    }
  }
  const actions = el('div', 'control-row');
  const toggle = el('button', null, earned.has(t.id) ? 'Mark as not earned' : 'Mark as earned');
  toggle.type = 'button';
  toggle.addEventListener('click', () => { toggleEarned(t.id); closeDetail(); });
  actions.appendChild(toggle);
  body.appendChild(actions);
  modal.hidden = false;
  document.getElementById('detailClose').focus();
}
function closeDetail() { document.getElementById('detailModal').hidden = true; }

function exportProgress() {
  const data = { app: 'leonida-gta6-trophy-guide', version: 1, earned: [...earned].sort((a, b) => a - b), exported_at: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophies-progress.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function importProgress(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result));
      const ids = Array.isArray(data) ? data : data.earned;
      if (!Array.isArray(ids)) throw new Error('bad file');
      const valid = new Set(trophies.map((t) => t.id));
      earned = new Set(ids.filter((n) => valid.has(n)));
      saveStore(); renderProgress(); renderList();
    } catch { alert('That file is not a LEONIDA progress export.'); }
  };
  reader.readAsText(file);
}

async function init() {
  loadStore();
  document.getElementById('spoilerToggle').checked = spoilerSafe;
  renderRoadmap();
  try {
    const res = await fetch('data/trophies.json');
    const data = await res.json();
    trophies = Array.isArray(data) ? data : data.trophies;
  } catch {
    document.getElementById('trophyList').textContent = '';
    document.getElementById('trophyList').appendChild(el('p', 'empty', 'Could not load data/trophies.json. Serve app/ over HTTP and try again.'));
    return;
  }
  for (const id of ['search', 'kindFilter', 'gradeFilter', 'statusFilter']) {
    document.getElementById(id).addEventListener('input', renderList);
    document.getElementById(id).addEventListener('change', renderList);
  }
  document.getElementById('spoilerToggle').addEventListener('change', (e) => {
    spoilerSafe = e.target.checked; saveSpoiler(); renderList();
  });
  document.getElementById('exportBtn').addEventListener('click', exportProgress);
  document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFile').click());
  document.getElementById('importFile').addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) importProgress(e.target.files[0]);
    e.target.value = '';
  });
  document.getElementById('resetBtn').addEventListener('click', () => {
    if (confirm('Clear all earned trophies?')) { earned = new Set(); saveStore(); renderProgress(); renderList(); }
  });
  document.getElementById('detailClose').addEventListener('click', closeDetail);
  document.getElementById('detailModal').addEventListener('click', (e) => { if (e.target.id === 'detailModal') closeDetail(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDetail(); });
  renderProgress();
  renderList();
}

init();
