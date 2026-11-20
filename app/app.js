/* Leonida Legend: offline GTA 6 trophy guide and tracker.
   Loads data/trophies.json, keeps progress in localStorage, and never
   fetches anything else. Source links in the guide come from the data
   file, so this script names no outside address of its own. */
var STORE_KEY = 'leonida-legend-progress-v1';
var DATA_PATH = 'data/trophies.json';

var ROADMAP_STAGES = [
  { n: 1, title: 'Play the story, mind the one missable', hours: '60-80 hours',
    text: 'Finish Chapters 1 to 5 and the final mission. Do the first meditation at Jason\u2019s house in Chapter 1, right after Down to Earth, before the chapter ends — it is the run\u2019s only missable trophy. Save by hand at the start of every chapter: there is no mission replay.',
    tip: 'Trophies: chapter and mission trophies, plus Positive Mental Attitude.' },
  { n: 2, title: 'Side strands and strangers', hours: '10-20 hours',
    text: 'Finish the final missions for Andy, Kenton, Billy, Randy and Tyrone, hunt Bret\u2019s unique animal, beat Cal at fishing, and complete 8 stranger strands. Andy\u2019s strand is Lucia-only and Tyrone\u2019s and Bret\u2019s are Jason-only, so work each while playing the right character.',
    tip: 'Trophies: the five strand finals, Strangers & Freaks, Fair Game, Baited My Tackle.' },
  { n: 3, title: 'Activities and gold medals', hours: '20-30 hours',
    text: 'Gold all 42 Shooting Range challenges, win drone races at all 14 locations and 20 different races, finish an arcade game and a bowling game, have a cocktail on Ocean Beach, try all 9 activity types, and build your stunt count toward 250.',
    tip: 'Trophies: The Shootist, Top Fun, Earn Cash Not Kudos, Master of None, and more.' },
  { n: 4, title: 'Collectibles and the map', hours: '30-40 hours',
    text: 'Meditate at all 18 spots, complete card sets, WAiNK It at 100 locations, discover 100 vehicles, explore all 52 areas of Leonida, buy all 8 garages and register 10 vehicles to the Scooter Bros app.',
    tip: 'Trophies: Don\u2019t Touch My Deck, You WAiNKer!, Whip It Good, The Goodtime State, Little Boxes.' },
  { n: 5, title: 'Crime, robberies and money', hours: '20-30 hours',
    text: 'Rob 5 bank vaults and escape, rob an armored truck, rob one illegal operation of each of the 9 gangs, rob a jewelry store unseen, lose a 4-star wanted level with your partner, rob 3 shops back-to-back, and launder $250,000 in Marked Bills.',
    tip: 'Trophies: Maximum Withdrawal, Pest Control, Sneakthief, Hot Together, Retail Therapy.' },
  { n: 6, title: '100% completion and cleanup', hours: '30-40 hours',
    text: 'Open the 100% Completion Checklist after the story and work it down. You only need 70 of 80 Challenges, and the checklist is closer to 60% of true completion — but it does demand every robbery, underwater discovery, shooting range, drone race and Bret quest. Finish 50 challenges and spend $100,000 in shops on the way.',
    tip: 'Trophies: A Long Road, One Last Thing, Actions Speak Louder, Treat Yo Self — then the platinum.' }
];

var trophies = [];
var earned = {};
var counts = {};
var spoilerOn = false;
var openIndex = -1;

function $(id) { return document.getElementById(id); }
function loadStored() {
  try {
    var raw = localStorage.getItem(STORE_KEY);
    if (!raw) return;
    var data = JSON.parse(raw);
    earned = data.earned || {};
    counts = data.counts || {};
    spoilerOn = !!data.spoilerOn;
  } catch (e) { earned = {}; counts = {}; }
}
function saveStored() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({ earned: earned, counts: counts, spoilerOn: spoilerOn }));
    $('savedNote').textContent = 'Progress saved in this browser.';
  } catch (e) { $('savedNote').textContent = 'Could not save in this browser.'; }
}
function trophyId(t, i) { return i + 1; }
function isEarned(i) { return !!earned[String(i)]; }
function setEarned(i, value) {
  if (value) { earned[String(i)] = true; } else { delete earned[String(i)]; }
  saveStored(); renderAll();
}
function kindLabel(kind) {
  var labels = { story: 'Story', side: 'Side strand', collectibles: 'Collectibles', activities: 'Activities', crime: 'Crime', platinum: 'Platinum' };
  return labels[kind] || kind;
}
function isHiddenFromSpoilers(t, i) {
  return spoilerOn && t.kind === 'story' && !isEarned(i);
}
function displayName(t, i) {
  return isHiddenFromSpoilers(t, i) ? 'Hidden story trophy — earn it to reveal' : t.name;
}
function displayDesc(t, i) {
  return isHiddenFromSpoilers(t, i) ? 'Spoiler-safe mode hides this story trophy until it is earned.' : t.description;
}
function matchesFilters(t, i) {
  var q = $('searchBox').value.trim().toLowerCase();
  if (q && t.name.toLowerCase().indexOf(q) === -1 && t.description.toLowerCase().indexOf(q) === -1 && t.guide.toLowerCase().indexOf(q) === -1) return false;
  var kind = $('kindFilter').value;
  if (kind !== 'all' && t.kind !== kind) return false;
  var grade = $('gradeFilter').value;
  if (grade !== 'all' && t.grade !== grade) return false;
  var status = $('statusFilter').value;
  if (status === 'earned' && !isEarned(i)) return false;
  if (status === 'missing' && isEarned(i)) return false;
  if ($('missableOnly').checked && !t.missable) return false;
  return true;
}
function gradeCountsText() {
  var parts = [];
  ['platinum', 'gold', 'silver', 'bronze'].forEach(function (g) {
    var total = trophies.filter(function (t) { return t.grade === g; }).length;
    var got = trophies.filter(function (t, i) { return t.grade === g && isEarned(i); }).length;
    parts.push(got + '/' + total + ' ' + g);
  });
  return parts.join(' · ');
}
function renderProgress() {
  var got = trophies.filter(function (t, i) { return isEarned(i); }).length;
  $('earnedCount').textContent = String(got);
  $('progressFill').style.width = (trophies.length ? Math.round(got / trophies.length * 100) : 0) + '%';
  $('progressPct').textContent = Math.round(got / 55 * 100) + '% to the platinum';
  $('gradeCounts').textContent = gradeCountsText();
}
function renderRoadmap() {
  var list = $('stageList');
  list.innerHTML = '';
  ROADMAP_STAGES.forEach(function (stage) {
    var inStage = trophies.filter(function (t) { return t.roadmap === stage.n; });
    var done = inStage.filter(function (t, j) { return isEarned(trophies.indexOf(t)); }).length;
    var li = document.createElement('li');
    var h = document.createElement('h3');
    h.innerHTML = '';
    var num = document.createElement('span');
    num.className = 'n';
    num.textContent = 'Stage ' + stage.n;
    h.appendChild(num);
    h.appendChild(document.createTextNode(stage.title));
    var hours = document.createElement('p');
    hours.className = 'meta';
    hours.textContent = stage.hours + ' · ' + done + '/' + inStage.length + ' stage trophies earned';
    var body = document.createElement('p');
    body.textContent = stage.text;
    var tip = document.createElement('p');
    tip.className = 'meta';
    tip.textContent = stage.tip;
    li.appendChild(h); li.appendChild(hours); li.appendChild(body); li.appendChild(tip);
    list.appendChild(li);
  });
  var miss = trophies.filter(function (t) { return t.missable; });
  $('missableCallout').textContent = 'Missable: ' + miss.length + ' trophy — ' + miss.map(function (t) { return t.name; }).join(', ') +
    '. The first meditation at Jason\u2019s house can only be done in Chapter 1. Everything else can be finished in free-roam after the story.';
}
function renderList() {
  var list = $('trophyList');
  list.innerHTML = '';
  var shown = 0;
  trophies.forEach(function (t, i) {
    if (!matchesFilters(t, i)) return;
    shown++;
    var li = document.createElement('li');
    li.className = (isEarned(i) ? 'earned ' : '') + (t.missable ? 'missable ' : '') + (openIndex === i ? 'open' : '');
    li.setAttribute('data-index', String(i));
    var head = document.createElement('div');
    head.className = 'trophy-head';
    var box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = isEarned(i);
    box.setAttribute('aria-label', 'Mark ' + t.name + ' earned');
    box.addEventListener('click', function (ev) { ev.stopPropagation(); setEarned(i, box.checked); });
    var name = document.createElement('span');
    name.className = 'trophy-name';
    name.textContent = displayName(t, i);
    if (t.hidden) {
      var tag = document.createElement('span');
      tag.className = 'hidden-tag';
      tag.textContent = ' (hidden on PSN)';
      name.appendChild(tag);
    }
    var grade = document.createElement('span');
    grade.className = 'grade ' + t.grade;
    grade.textContent = t.grade;
    head.appendChild(box); head.appendChild(name); head.appendChild(grade);
    var desc = document.createElement('p');
    desc.className = 'trophy-desc';
    desc.textContent = displayDesc(t, i);
    var tags = document.createElement('div');
    tags.className = 'trophy-tags';
    var kindTag = document.createElement('span');
    kindTag.textContent = kindLabel(t.kind) + ' · Stage ' + t.roadmap;
    tags.appendChild(kindTag);
    if (t.count) {
      var countTag = document.createElement('span');
      countTag.textContent = 'Target: ' + t.count.toLocaleString('en-US');
      tags.appendChild(countTag);
    }
    if (t.missable) {
      var missTag = document.createElement('span');
      missTag.className = 'miss';
      missTag.textContent = 'MISSABLE';
      tags.appendChild(missTag);
    }
    if (isEarned(i)) {
      var doneTag = document.createElement('span');
      doneTag.className = 'done';
      doneTag.textContent = 'Earned';
      tags.appendChild(doneTag);
    }
    li.appendChild(head); li.appendChild(desc); li.appendChild(tags);
    li.addEventListener('click', function () { openTrophy(i); });
    list.appendChild(li);
  });
  $('shownCount').textContent = '· showing ' + shown + ' of ' + trophies.length;
}
function sourceHost(url) {
  try { return new URL(url).hostname; } catch (e) { return 'Source'; }
}
function openTrophy(i) {
  openIndex = i;
  var t = trophies[i];
  var panel = $('detailPanel');
  panel.innerHTML = '';
  var title = document.createElement('h2');
  title.textContent = isHiddenFromSpoilers(t, i) ? 'Hidden story trophy' : t.name;
  var meta = document.createElement('p');
  meta.className = 'desc';
  meta.textContent = t.grade.charAt(0).toUpperCase() + t.grade.slice(1) + ' · ' + kindLabel(t.kind) + ' · Roadmap stage ' + t.roadmap +
    (t.hidden ? ' · Hidden on PSN until earned' : '') + (t.missable ? ' · MISSABLE' : '');
  var desc = document.createElement('p');
  desc.className = 'desc';
  desc.textContent = 'Official description: ' + displayDesc(t, i);
  var guideHead = document.createElement('h3');
  guideHead.textContent = 'Guide';
  var guide = document.createElement('p');
  guide.className = 'guide';
  guide.textContent = t.guide;
  panel.appendChild(title); panel.appendChild(meta); panel.appendChild(desc);
  panel.appendChild(guideHead); panel.appendChild(guide);
  if (t.count) {
    var row = document.createElement('div');
    row.className = 'count-row';
    var label = document.createElement('label');
    label.textContent = 'My progress (target ' + t.count.toLocaleString('en-US') + '): ';
    var input = document.createElement('input');
    input.type = 'number';
    input.min = '0';
    input.max = String(t.count);
    input.value = counts[String(i)] != null ? String(counts[String(i)]) : '';
    input.addEventListener('change', function () {
      var v = parseInt(input.value, 10);
      if (isNaN(v) || v <= 0) { delete counts[String(i)]; } else { counts[String(i)] = Math.min(v, t.count); }
      saveStored();
      if (counts[String(i)] >= t.count) { setEarned(i, true); }
    });
    label.appendChild(input);
    row.appendChild(label);
    panel.appendChild(row);
  }
  var srcHead = document.createElement('h3');
  srcHead.textContent = 'Sources';
  var srcList = document.createElement('ul');
  srcList.className = 'sources';
  (t.sources || []).forEach(function (src) {
    var item = document.createElement('li');
    var a = document.createElement('a');
    a.href = src;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = sourceHost(src);
    item.appendChild(a);
    srcList.appendChild(item);
  });
  panel.appendChild(srcHead); panel.appendChild(srcList);
  var earnedBtn = document.createElement('button');
  earnedBtn.type = 'button';
  earnedBtn.className = 'ghost';
  earnedBtn.textContent = isEarned(i) ? 'Mark as not earned' : 'Mark as earned';
  earnedBtn.addEventListener('click', function () { setEarned(i, !isEarned(i)); });
  panel.appendChild(earnedBtn);
  renderList();
}
function renderAll() { renderProgress(); renderRoadmap(); renderList(); }
function exportProgress() {
  var blob = new Blob([JSON.stringify({ game: 'Grand Theft Auto VI', exportedAt: new Date().toISOString(), earned: earned, counts: counts }, null, 2)], { type: 'application/json' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
}
function importProgress(file) {
  var reader = new FileReader();
  reader.onload = function () {
    try {
      var data = JSON.parse(String(reader.result));
      if (data.earned) earned = data.earned;
      if (data.counts) counts = data.counts;
      saveStored(); renderAll();
      $('savedNote').textContent = 'Progress imported.';
    } catch (e) { $('savedNote').textContent = 'That file could not be read as progress.'; }
  };
  reader.readAsText(file);
}
function applyHash() {
  var hash = window.location.hash.slice(1);
  if (!hash) return;
  var params = new URLSearchParams(hash);
  var trophy = params.get('trophy');
  if (trophy !== null) {
    var idx = parseInt(trophy, 10) - 1;
    if (!isNaN(idx) && trophies[idx]) { openIndex = idx; }
  }
  var filter = params.get('filter');
  if (filter === 'missable') { $('missableOnly').checked = true; }
  if (filter && $('kindFilter').querySelector('option[value="' + filter + '"]')) { $('kindFilter').value = filter; }
  if (params.get('spoiler') === 'on') { spoilerOn = true; $('spoilerToggle').checked = true; }
  var earnedParam = params.get('earned');
  if (earnedParam) {
    earnedParam.split(',').forEach(function (piece) {
      var idx = parseInt(piece, 10) - 1;
      if (!isNaN(idx) && trophies[idx]) { earned[String(idx)] = true; }
    });
    saveStored();
  }
  if (openIndex >= 0 && trophies[openIndex]) { openTrophy(openIndex); }
}
function bindControls() {
  ['searchBox', 'kindFilter', 'gradeFilter', 'statusFilter'].forEach(function (id) {
    $(id).addEventListener('input', renderList);
    $(id).addEventListener('change', renderList);
  });
  $('missableOnly').addEventListener('change', renderList);
  $('spoilerToggle').addEventListener('change', function () { spoilerOn = $('spoilerToggle').checked; saveStored(); renderAll(); });
  $('exportBtn').addEventListener('click', exportProgress);
  $('importBtn').addEventListener('click', function () { $('importFile').click(); });
  $('importFile').addEventListener('change', function () { if ($('importFile').files[0]) importProgress($('importFile').files[0]); });
  $('shareBtn').addEventListener('click', function () {
    var ids = Object.keys(earned).map(function (k) { return parseInt(k, 10) + 1; }).sort(function (a, b) { return a - b; }).join(',');
    var link = window.location.origin + window.location.pathname + '#earned=' + ids;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link).then(function () { $('savedNote').textContent = 'Progress link copied.'; });
    } else { $('savedNote').textContent = 'Progress link: ' + link; }
  });
  $('resetBtn').addEventListener('click', function () {
    if (window.confirm('Reset all earned trophies and counts?')) { earned = {}; counts = {}; openIndex = -1; saveStored(); renderAll(); $('detailPanel').innerHTML = '<p class="empty">Pick a trophy to read its guide and sources.</p>'; }
  });
}
function boot() {
  loadStored();
  $('spoilerToggle').checked = spoilerOn;
  bindControls();
  fetch(DATA_PATH).then(function (res) { return res.json(); }).then(function (data) {
    trophies = data.trophies || data;
    applyHash();
    renderAll();
    if (openIndex >= 0 && trophies[openIndex]) { openTrophy(openIndex); }
  }).catch(function () {
    $('trophyList').innerHTML = '<li>Could not load the trophy data.</li>';
  });
}
boot();
