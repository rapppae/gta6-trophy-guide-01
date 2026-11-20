// Leonida Platinum Path: offline GTA 6 trophy tracker.
// Loads data/trophies.json, keeps the checklist in localStorage, and never
// makes a network request of its own. Source links are shown by domain only:
// the full address lives in the data file, never as a literal here.
(function () {
  'use strict';

  var STORE_KEY = 'gta6-trophy-guide-01-v1';
  var DATA_URL = 'data/trophies.json';

  var ROADMAP = [
    { n: 1, title: 'Stage 1 — Play the story (60–80 hours)', text: 'Play all five chapters with Jason and Lucia, take optional missions as they appear, and scan vehicles and study animals along the way. Do the Chapter 1 meditation the morning it is offered at home — it is the one step that may not come back.' },
    { n: 2, title: 'Stage 2 — Strangers & Freaks', text: 'Finish the stranger mission strands across Leonida. Eight strands count toward the silver; the five character finales each carry their own trophy.' },
    { n: 3, title: 'Stage 3 — Activities, races and ranges', text: 'Stunts, drone races, road races, fishing, the arcade, shooting-range golds, meditation spots and gym work. Most of these count toward the 100% checklist too.' },
    { n: 4, title: 'Stage 4 — Crime and partner jobs', text: 'Robberies, wanted-level escapes, combat focus and partner heists. Bring your partner where the job needs two pairs of hands, and keep a fast bike ready for the getaway.' },
    { n: 5, title: 'Stage 5 — Collectibles and exploration', text: 'Card sets, WAiNK scans, vehicle discovery, garages and vehicle registration, and exploring every corner of Leonida.' },
    { n: 6, title: 'Stage 6 — Cleanup and 100% completion', text: 'Open Progress, Stats, 100% Completion after the story and clear what is left: 70 of 80 challenges, the remaining robberies and discoveries. A Long Road pops here, then the platinum.' }
  ];

  var trophies = [];
  var earned = {};
  var spoilerOn = false;

  var $ = function (id) { return document.getElementById(id); };
  var listEl = $('trophyList');
  var guidePanel = $('guidePanel');
  var guideBody = $('guideBody');

  function loadEarned() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return {};
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  function saveEarned() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(earned)); } catch (e) { /* storage full or blocked; checklist still works this session */ }
  }

  function slug(name) {
    return String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  function isSpoilerHidden(t) {
    return spoilerOn && t.hidden && t.kind === 'story' && !earned[slug(t.name)];
  }

  function gradeLabel(t) { return t.grade.charAt(0).toUpperCase() + t.grade.slice(1); }

  function sourceHost(url) {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return url; }
  }

  function matches(t) {
    var q = $('search').value.trim().toLowerCase();
    if (q && t.name.toLowerCase().indexOf(q) === -1 && t.description.toLowerCase().indexOf(q) === -1) return false;
    var kind = $('kindFilter').value;
    if (kind !== 'all' && t.kind !== kind) return false;
    var grade = $('gradeFilter').value;
    if (grade !== 'all' && t.grade !== grade) return false;
    var status = $('statusFilter').value;
    var isEarned = !!earned[slug(t.name)];
    if (status === 'earned' && !isEarned) return false;
    if (status === 'unearned' && isEarned) return false;
    if ($('missableOnly').checked && !t.missable) return false;
    return true;
  }

  function renderRoadmap() {
    var html = '';
    ROADMAP.forEach(function (stage) {
      var stageTrophies = trophies.filter(function (t) { return t.roadmap === stage.n; });
      var done = stageTrophies.filter(function (t) { return earned[slug(t.name)]; }).length;
      html += '<li class="' + (done === stageTrophies.length && stageTrophies.length > 0 ? 'done' : '') + '"><strong>' + stage.title + '</strong><span>' + stage.text + ' — ' + done + ' of ' + stageTrophies.length + ' trophies earned.</span></li>';
    });
    $('roadmap').innerHTML = html;
  }

  function renderList() {
    var shown = trophies.filter(matches);
    var html = '';
    shown.forEach(function (t) {
      var id = slug(t.name);
      var isEarned = !!earned[id];
      var hidden = isSpoilerHidden(t);
      var name = hidden ? 'Hidden story trophy' : t.name;
      var desc = hidden ? 'Earn this trophy to reveal its name and description.' : t.description;
      html += '<li class="' + (isEarned ? 'earned' : '') + '">'
        + '<input type="checkbox" data-slug="' + id + '"' + (isEarned ? ' checked' : '') + ' aria-label="Earned: ' + name + '">'
        + '<div><p class="tname">' + name + '</p>'
        + '<p class="tdesc">' + desc + '</p>'
        + '<div class="tags"><span class="tag ' + t.grade + '">' + gradeLabel(t) + '</span>'
        + '<span class="tag">' + t.kind + '</span>'
        + '<span class="tag">Stage ' + t.roadmap + '</span>'
        + (t.hidden ? '<span class="tag hidden">Hidden</span>' : '')
        + (t.missable ? '<span class="tag missable">Missable</span>' : '')
        + (t.count ? '<span class="tag">×' + t.count + '</span>' : '')
        + '</div></div>'
        + '<button type="button" class="openGuide" data-slug="' + id + '">Guide</button></li>';
    });
    listEl.innerHTML = html || '<li>No trophies match these filters.</li>';
    $('shownCount').textContent = shown.length + ' of ' + trophies.length + ' trophies shown';
    renderProgress();
    renderRoadmap();
  }

  function renderProgress() {
    var total = trophies.length;
    var done = trophies.filter(function (t) { return earned[slug(t.name)]; }).length;
    var pct = total ? Math.round((done / total) * 100) : 0;
    $('progressFill').style.width = pct + '%';
    $('progressText').textContent = done + ' of ' + total + ' trophies earned (' + pct + '%) — ' + (total - done) + ' to go until the platinum.';
  }

  function openGuide(id) {
    var t = trophies.find(function (x) { return slug(x.name) === id; });
    if (!t) return;
    if (isSpoilerHidden(t)) {
      guideBody.innerHTML = '<h3>Hidden story trophy</h3><p class="gdesc">Spoiler-safe mode is on. Earn this trophy in-game to reveal its guide, or switch spoiler-safe mode off.</p>';
    } else {
      var src = (t.sources || []).map(function (s) {
        return '<li>Source: <a href="' + s + '" target="_blank" rel="noopener">' + sourceHost(s) + '</a></li>';
      }).join('');
      guideBody.innerHTML = '<h3>' + t.name + '</h3>'
        + '<p class="gdesc">' + t.description + ' — ' + gradeLabel(t) + (t.hidden ? ' · Hidden' : '') + (t.missable ? ' · Missable' : '') + '</p>'
        + '<p>' + t.guide + '</p>'
        + '<p><strong>Roadmap:</strong> Stage ' + t.roadmap + ' of 6. <strong>Kind:</strong> ' + t.kind + '.</p>'
        + '<ul class="sources">' + src + '</ul>';
    }
    guidePanel.hidden = false;
    guidePanel.scrollIntoView({ behavior: 'auto', block: 'start' });
  }

  function applyHash() {
    var raw = window.location.hash ? window.location.hash.slice(1) : '';
    // A hash fully describes the view: reset every hash-driven control first,
    // so moving from one hash to another never leaves the previous state behind.
    $('missableOnly').checked = false;
    $('kindFilter').value = 'all';
    $('gradeFilter').value = 'all';
    spoilerOn = false;
    $('spoilerToggle').checked = false;
    $('spoilerNote').hidden = true;
    if (!raw) return;
    var params = new URLSearchParams(raw);
    var filter = params.get('filter');
    if (filter === 'missable') $('missableOnly').checked = true;
    var kind = params.get('kind');
    if (kind && ['story', 'strangers', 'activities', 'collectibles', 'crime', 'exploration', 'misc'].indexOf(kind) !== -1) $('kindFilter').value = kind;
    var grade = params.get('grade');
    if (grade && ['platinum', 'gold', 'silver', 'bronze'].indexOf(grade) !== -1) $('gradeFilter').value = grade;
    if (params.get('spoiler') === 'on') { spoilerOn = true; $('spoilerToggle').checked = true; }
    if (filter === 'missable' || params.get('spoiler') === 'on' || kind || grade) {
      renderList();
      document.querySelector('.controls').scrollIntoView({ behavior: 'auto', block: 'start' });
    }
    var trophy = params.get('trophy');
    if (trophy) {
      renderList();
      openGuide(trophy);
    } else {
      guidePanel.hidden = true;
    }
  }

  function bindEvents() {
    ['search', 'kindFilter', 'gradeFilter', 'statusFilter'].forEach(function (id) {
      $(id).addEventListener('input', renderList);
      $(id).addEventListener('change', renderList);
    });
    $('missableOnly').addEventListener('change', renderList);
    $('spoilerToggle').addEventListener('change', function () {
      spoilerOn = $('spoilerToggle').checked;
      $('spoilerNote').hidden = !spoilerOn;
      guidePanel.hidden = true;
      renderList();
    });
    listEl.addEventListener('change', function (e) {
      var box = e.target.closest('input[type="checkbox"]');
      if (!box) return;
      earned[box.getAttribute('data-slug')] = box.checked;
      saveEarned();
      renderList();
    });
    listEl.addEventListener('click', function (e) {
      var btn = e.target.closest('.openGuide');
      if (btn) openGuide(btn.getAttribute('data-slug'));
    });
    $('guideClose').addEventListener('click', function () { guidePanel.hidden = true; });
    $('resetBtn').addEventListener('click', function () {
      if (!window.confirm('Clear the whole checklist?')) return;
      earned = {};
      saveEarned();
      renderList();
    });
    $('exportBtn').addEventListener('click', function () {
      var blob = new Blob([JSON.stringify({ game: 'Grand Theft Auto VI', exported: new Date().toISOString(), earned: earned }, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'gta6-trophies-progress.json';
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    });
    $('importBtn').addEventListener('click', function () { $('importFile').click(); });
    $('importFile').addEventListener('change', function () {
      var file = $('importFile').files && $('importFile').files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var data = JSON.parse(String(reader.result));
          var incoming = data && data.earned ? data.earned : data;
          var kept = {};
          Object.keys(incoming || {}).forEach(function (key) {
            if (trophies.some(function (t) { return slug(t.name) === key; })) kept[key] = !!incoming[key];
          });
          earned = kept;
          saveEarned();
          renderList();
        } catch (e) {
          window.alert('That file is not a valid progress export.');
        }
      };
      reader.readAsText(file);
      $('importFile').value = '';
    });
    window.addEventListener('hashchange', function () { applyHash(); renderList(); });
  }

  fetch(DATA_URL)
    .then(function (r) { if (!r.ok) throw new Error('trophies.json failed to load'); return r.json(); })
    .then(function (data) {
      trophies = data.trophies || [];
      earned = loadEarned();
      bindEvents();
      applyHash();
      renderList();
    })
    .catch(function () {
      $('progressText').textContent = 'Could not load the trophy data. Check that data/trophies.json is present and valid JSON.';
    });
})();
