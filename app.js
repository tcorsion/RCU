/* ============================================================
   Chauffage Urbain ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â appli terrain (PWA hors-ligne)
   ============================================================ */
'use strict';

/* ---------- petits utilitaires ---------- */
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const view = $('#view');

function toast(msg, ms = 2600) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(toast._h);
  toast._h = setTimeout(() => t.classList.add('hidden'), ms);
}

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
         ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function netStatus() {
  const el = $('#net-status');
  const update = () => {
    if (navigator.onLine) { el.textContent = 'ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ÂÃƒâ€šÃ‚Â en ligne'; el.classList.remove('off'); }
    else { el.textContent = 'ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“Ãƒâ€šÃ‚Â² hors-ligne ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â tout reste dispo'; el.classList.add('off'); }
  };
  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  update();
}

/* ---------- thÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨me sombre / clair ---------- */
function applyTheme(dark) {
  document.documentElement.classList.toggle('dark', dark);
  localStorage.setItem('cu_dark', dark ? '1' : '0');
  const b = $('#btn-theme');
  if (b) b.textContent = dark ? 'ÃƒÆ’Ã‚Â¢Ãƒâ€¹Ã…â€œÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¸Ãƒâ€šÃ‚Â' : 'ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€¦Ã¢â‚¬â„¢ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢';
}
function initTheme() {
  const saved = localStorage.getItem('cu_dark');
  const dark = saved === null
    ? !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
    : saved === '1';
  applyTheme(dark);
}

/* ---------- verrouillage par code PIN ---------- */
function pinHash(pin) {
  // hash local simple (djb2) ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â verrou d'accÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨s, pas du chiffrement
  let h = 5381;
  const s = 'cu|' + pin;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(16);
}
function initLock() {
  const pin = localStorage.getItem('cu_pin');
  const screen = $('#lock-screen');
  if (!pin || !screen) { if (screen) screen.classList.add('hidden'); return; }
  screen.classList.remove('hidden');
  const input = $('#lock-pin');
  const err = $('#lock-error');
  const tryUnlock = () => {
    if (pinHash(input.value) === pin) {
      screen.classList.add('hidden');
      input.value = '';
      if (err) err.classList.add('hidden');
    } else {
      if (err) err.classList.remove('hidden');
      input.value = '';
      input.focus();
    }
  };
  $('#lock-ok').onclick = tryUnlock;
  input.onkeydown = (e) => { if (e.key === 'Enter') tryUnlock(); };
  input.focus();
}

/* ---------- carte de gestion du PIN (accueil) ---------- */
function renderPinZone() {
  const zone = $('#pin-zone');
  if (!zone) return;
  if (!localStorage.getItem('cu_pin')) {
    zone.innerHTML = `
      <div class="grid2">
        <div class="field"><label>Nouveau code PIN (4 ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  8 chiffres)</label><input type="password" id="pin-a" inputmode="numeric" pattern="[0-9]*" maxlength="8" autocomplete="off"></div>
        <div class="field"><label>Confirmer le code</label><input type="password" id="pin-b" inputmode="numeric" pattern="[0-9]*" maxlength="8" autocomplete="off"></div>
      </div>
      <div class="btn-row"><button class="btn" id="pin-set" type="button">ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Activer le verrouillage</button></div>
      <p class="small muted" style="margin:6px 0 0">Le code n'est stockÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â© que sur cet appareil ; l'appli se verrouille ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  chaque dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©marrage.</p>`;
    $('#pin-set', zone).onclick = () => {
      const a = $('#pin-a', zone).value, b = $('#pin-b', zone).value;
      if (!/^[0-9]{4,8}$/.test(a)) return toast('ÃƒÆ’Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒâ€¦Ã¢â‚¬â„¢ Le code doit faire 4 ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  8 chiffres');
      if (a !== b) return toast('ÃƒÆ’Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒâ€¦Ã¢â‚¬â„¢ Les deux codes ne correspondent pas');
      localStorage.setItem('cu_pin', pinHash(a));
      toast('ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Verrouillage activÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©');
      renderPinZone();
    };
  } else {
    zone.innerHTML = `
      <p class="small">ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ Un code PIN est actif : l'application se verrouille au dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©marrage.</p>
      <div class="btn-row">
        <button class="btn secondary" id="pin-change" type="button">ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¸Ãƒâ€šÃ‚Â Modifier le code</button>
        <button class="btn danger" id="pin-off" type="button">ÃƒÆ’Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒâ€¦Ã¢â‚¬â„¢ DÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©sactiver</button>
      </div>
      <div id="pin-change-zone"></div>`;
    $('#pin-off', zone).onclick = () => {
      if (confirm('DÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©sactiver le verrouillage par code PIN ?')) {
        localStorage.removeItem('cu_pin');
        toast('Verrouillage dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©sactivÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©');
        renderPinZone();
      }
    };
    $('#pin-change', zone).onclick = () => {
      const cz = $('#pin-change-zone', zone);
      cz.innerHTML = `
        <div class="grid2">
          <div class="field"><label>Code actuel</label><input type="password" id="pin-old" inputmode="numeric" maxlength="8" autocomplete="off"></div>
          <div class="field"><label>Nouveau code (4 ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  8 chiffres)</label><input type="password" id="pin-new" inputmode="numeric" maxlength="8" autocomplete="off"></div>
        </div>
        <div class="btn-row"><button class="btn" id="pin-save" type="button">ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢Ãƒâ€šÃ‚Â¾ Enregistrer le nouveau code</button></div>`;
      $('#pin-save', cz).onclick = () => {
        const old = $('#pin-old', cz).value, nw = $('#pin-new', cz).value;
        if (pinHash(old) !== localStorage.getItem('cu_pin')) return toast('ÃƒÆ’Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒâ€¦Ã¢â‚¬â„¢ Code actuel incorrect');
        if (!/^[0-9]{4,8}$/.test(nw)) return toast('ÃƒÆ’Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒâ€¦Ã¢â‚¬â„¢ Le code doit faire 4 ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  8 chiffres');
        localStorage.setItem('cu_pin', pinHash(nw));
        toast('ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ Code modifiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©');
        renderPinZone();
      };
    };
  }
}

/* ---------- stockage IndexedDB (inspections, projets, avancements, photos) ---------- */
const DB = {
  db: null,
  open() {
    return new Promise((res, rej) => {
      if (DB.db) return res(DB.db);
      const rq = indexedDB.open('chauffage-urbain', 2);
      rq.onupgradeneeded = () => {
        const db = rq.result;
        for (const s of ['inspections', 'projets', 'avancements']) {
          if (!db.objectStoreNames.contains(s)) db.createObjectStore(s, { keyPath: 'id' });
        }
      };
      rq.onsuccess = () => { DB.db = rq.result; res(DB.db); };
      rq.onerror = () => rej(rq.error);
    });
  },
  async put(store, obj) {
    const db = await DB.open();
    return new Promise((res, rej) => {
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).put(obj);
      tx.oncomplete = res; tx.onerror = () => rej(tx.error);
    });
  },
  async get(store, id) {
    const db = await DB.open();
    return new Promise((res, rej) => {
      const rq = db.transaction(store).objectStore(store).get(id);
      rq.onsuccess = () => res(rq.result); rq.onerror = () => rej(rq.error);
    });
  },
  async all(store) {
    const db = await DB.open();
    return new Promise((res, rej) => {
      const rq = db.transaction(store).objectStore(store).getAll();
      rq.onsuccess = () => res((rq.result || []).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')));
      rq.onerror = () => rej(rq.error);
    });
  },
  async del(store, id) {
    const db = await DB.open();
    return new Promise((res, rej) => {
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).delete(id);
      tx.oncomplete = res; tx.onerror = () => rej(tx.error);
    });
  }
};

/* ---------- chargement des donnÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©es ---------- */
/* DÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©codage UTF-8 forcÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â© : certains hÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©bergeurs servent les .json sans charset */
async function fetchJsonUtf8(url) {
  const buf = await (await fetch(url)).arrayBuffer();
  return JSON.parse(new TextDecoder('utf-8').decode(buf));
}
async function loadData() {
  if (loadData._p) return loadData._p;
  loadData._p = Promise.all([
    fetchJsonUtf8('data/docs.json'),
    fetchJsonUtf8('data/fiches.json'),
    fetchJsonUtf8('data/checklists.json'),
    fetchJsonUtf8('data/forms.json'),
  ]).then(([docs, fiches, checklists, forms]) => ({ docs, fiches, checklists, forms }));
  return loadData._p;
}

/* ---------- ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©tat de l'app ---------- */
const App = {
  data: null,
  draft: null, // inspection en cours de remplissage
};

/* ============================================================
   VUES
   ============================================================ */

const Routes = {};

/* ---------- Accueil ---------- */
Routes.accueil = async function () {
  const data = await loadData();
  const insp = await DB.all('inspections');
  const projets = await DB.all('projets');
  const avancements = await DB.all('avancements');
  const last = insp.slice(0, 3);

  // ---- donnÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©es du tableau de bord ----
  let ncTotal = 0;
  for (const r of insp) ncTotal += computeStats(r).nc;
  const etats = {};
  for (const p of projets) { const e = p.values?.etat || 'Non renseignÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©'; etats[e] = (etats[e] || 0) + 1; }
  // avancement moyen : dernier point d'avancement de chaque projet
  const lastAvByProjet = {};
  for (const a of avancements) {
    const pid = a.values?.projet || a.values?.projetLibre || '(sans projet)';
    if (!lastAvByProjet[pid] || (a.values?.date || '') >= (lastAvByProjet[pid].values?.date || '')) lastAvByProjet[pid] = a;
  }
  const avs = Object.values(lastAvByProjet).map(a => a.values?.avancementGlobal).filter(x => x !== null && x !== undefined && x !== '');
  const avMoyen = avs.length ? Math.round(avs.reduce((s, x) => s + Number(x), 0) / avs.length) : null;
  const today = new Date().toISOString().slice(0, 10);
  const mes = projets
    .filter(p => p.values?.dateMES && p.values.dateMES >= today)
    .sort((a, b) => (a.values.dateMES || '').localeCompare(b.values.dateMES || ''))
    .slice(0, 3);

  const descs = {
    accueil: "Vue d'ensemble de l'application",
    projets: `${projets.length} fiche(s) projet ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â retrouver toutes les infos d'un chantier`,
    avancement: `${avancements.length} point(s) d'avancement des travaux`,
    connaissances: `${data.docs.length} documents + ${data.fiches.length} fiches de synthÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨se, hors-ligne`,
    inspection: 'Check-list de sous-station (mars 2023) ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  remplir sur le terrain',
    rapports: `${insp.length} inspection(s) enregistrÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©e(s) ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â voir / exporter les PV`,
  };

  view.innerHTML = `
    <h2 class="page-title">Bienvenue</h2>
    <p class="page-sub">Ta base de connaissances chauffage urbain et tes outils de terrain, mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªme sans rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©seau.</p>

    <input id="global-search" class="search" type="search" placeholder="ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚Â Rechercher partout : documents, fiches, projets, avancements, inspectionsÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦">
    <div id="global-results"></div>

    <div class="card dash">
      <h3>ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒâ€¦Ã‚Â  Tableau de bord</h3>
      <div class="dash-grid">
        <div class="stat"><span class="n">${insp.length}</span><span class="l">inspection(s)</span></div>
        <div class="stat"><span class="n" style="color:var(--ko)">${ncTotal}</span><span class="l">non-conformitÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©(s)</span></div>
        <div class="stat"><span class="n">${projets.length}</span><span class="l">projet(s)</span></div>
        <div class="stat"><span class="n">${avMoyen !== null ? avMoyen + ' %' : 'ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â'}</span><span class="l">avancement moyen</span></div>
      </div>
      ${Object.keys(etats).length ? `<p class="small muted" style="margin:8px 0 0">Projets par ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©tat : ${Object.entries(etats).map(([e, n]) => esc(e) + ' : ' + n).join(' ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· ')}</p>` : ''}
      ${mes.length ? `<p class="small" style="margin:6px 0 0">ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€¦Ã‚Â¡ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ Prochaines mises en service : ${mes.map(p => `<a href="#/projets/voir/${encodeURIComponent(p.id)}">${esc(p.values.nom || 'Projet')}</a> ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ${esc(p.values.dateMES)}`).join(' ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· ')}</p>` : ''}
    </div>

    <div class="tiles">
      ${TABS.filter(t => t.route !== 'accueil').map(t => `
      <a class="tile${t.cta ? ' cta' : ''}" href="#/${t.route}">
        <span class="ico">${t.ico}</span><span class="t">${esc(t.label)}</span>
        <span class="d">${esc(descs[t.route] || '')}</span>
      </a>`).join('')}
    </div>

    <div class="card" style="margin-top:18px">
      <h3>ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾ Synchronisation & sauvegarde</h3>
      <p class="muted small">Tes donnÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©es restent sur cet appareil. Exporte-les en JSON pour les transfÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©rer vers un autre appareil (tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©phone ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ordinateur), ou synchronise automatiquement si l'appli est servie par le serveur local du PC (mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªme Wi-Fi).</p>
      <div id="host-info" class="small" style="background:var(--orange-light);border-radius:10px;padding:10px 12px;margin-bottom:10px">ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¸Ãƒâ€šÃ‚Â Adresse de cet ordinateur : chargementÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦</div>
      <div class="btn-row">
        <button class="btn secondary" id="btn-export-all-data">ÃƒÆ’Ã‚Â¢Ãƒâ€šÃ‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡ Exporter mes donnÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©es</button>
        <button class="btn secondary" id="btn-import-data">ÃƒÆ’Ã‚Â¢Ãƒâ€šÃ‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â  Importer un fichierÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦</button>
        <button class="btn secondary" id="btn-test-sync">ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€šÃ‚Â§Ãƒâ€šÃ‚Âª Tester la connexion</button>
        <button class="btn" id="btn-sync">ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾ Synchroniser</button>
      </div>
      <div class="field" style="margin-top:10px">
        <label for="sync-url">URL du serveur de synchro (vide = ce serveur-ci)</label>
        <input type="text" id="sync-url" placeholder="ex. http://192.168.0.7:8765  (l'appli ajoute /api/sync tout seul)" value="${esc(localStorage.getItem('cu_sync_url') || '')}">
        <div id="sync-test-result" class="small" style="margin-top:6px"></div>
      </div>
      <p class="muted small" style="margin-top:8px">ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒâ€šÃ‚Â± <strong>Depuis le tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©phone :</strong> mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªme Wi-Fi que le PC ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ ouvre directement <code>http://&lt;IP-du-PC&gt;:8765/</code> dans Safari (l'adresse s'affiche dans la carte ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¸Ãƒâ€šÃ‚Â ci-dessus) ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ le champ URL se prÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©-remplit tout seul ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â« ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€šÃ‚Â§Ãƒâ€šÃ‚Âª Tester ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â» puis ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â« ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾ Synchroniser ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â».<br>
      <em>Sur le tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©phone, ne passe pas par la version https (GitHub Pages) : Safari bloque les appels vers un PC en http depuis une page https.</em> Si le pare-feu Windows demande l'autorisation, clique ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â« Autoriser l'accÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨s ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â». En cas de blocage : ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â« ÃƒÆ’Ã‚Â¢Ãƒâ€šÃ‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡ Exporter mes donnÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©es ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â» sur un appareil, ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â« ÃƒÆ’Ã‚Â¢Ãƒâ€šÃ‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â  Importer ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â» sur l'autre.</p>
      <input type="file" id="file-import" accept="application/json,.json" style="display:none">
    </div>

    <div class="card" style="margin-top:18px">
      <h3>ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Verrouillage par code PIN</h3>
      <p class="muted small">Un code PIN verrouille l'application ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  chaque dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©marrage (les donnÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©es restent locales sur l'appareil).</p>
      <div id="pin-zone"></div>
    </div>

    ${last.length ? `
    <h3 style="margin:18px 0 10px">DerniÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨res inspections</h3>
    <div class="list">
      ${last.map(renderInspItem).join('')}
    </div>` : ''}
  `;

  $('#btn-export-all-data', view).onclick = exportAllData;
  $('#btn-import-data', view).onclick = () => $('#file-import', view).click();
  $('#file-import', view).onchange = (e) => { if (e.target.files[0]) importAllFromFile(e.target.files[0]); e.target.value = ''; };
  $('#btn-sync', view).onclick = syncNow;
  const bts = $('#btn-test-sync', view);
  if (bts) bts.onclick = testSyncUrl;
  const su = $('#sync-url', view);
  if (su) su.oninput = (e) => localStorage.setItem('cu_sync_url', e.target.value.trim());

  // recherche globale
  const gs = $('#global-search', view);
  const gr = $('#global-results', view);
  if (gs && gr) gs.addEventListener('input', () => renderGlobalSearch(gs.value.trim().toLowerCase(), gr, { insp, projets, avancements, data }));

  // carte PIN
  renderPinZone();

  // afficher l'adresse de cet ordinateur (endpoint /api/host du serveur local)
  (async () => {
    const el = $('#host-info', view);
    if (!el) return;
    try {
      const info = await fetchJsonUtf8('api/host');
      if (info && (info.lan || info.pc)) {
        const lan = info.lan || info.pc;
        el.innerHTML = `ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¸Ãƒâ€šÃ‚Â <strong>Cet ordinateur</strong> sert l'appli sur :<br>
          ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ depuis le PC : <code>${esc(info.pc)}</code><br>
          ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ depuis le rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©seau (tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©phone) : <code id="lan-url">${esc(lan)}</code> <button type="button" class="btn ghost" id="copy-lan" style="padding:3px 10px">ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹ copier</button><br>
          ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ URL de synchro : <code>${esc(info.sync)}</code>`;
        const bc = $('#copy-lan', view);
        if (bc) bc.onclick = () => {
          const txt = lan;
          if (navigator.clipboard) navigator.clipboard.writeText(txt).then(() => toast('ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹ copiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â© : ' + txt));
          else toast('ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ copier : ' + txt);
        };
        // prÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©-remplir le champ URL de synchro si vide
        if (su && !su.value) { su.value = info.sync; localStorage.setItem('cu_sync_url', info.sync); }
      } else {
        el.innerHTML = 'ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¸Ãƒâ€šÃ‚Â Appli ouverte depuis : <code>' + esc(location.origin) + '</code>';
      }
    } catch (e) {
      // hors serveur local (ex. github.io) : afficher l'hote courant
      const h = location.hostname;
      const isLocal = h === 'localhost' || h === '127.0.0.1';
      el.innerHTML = isLocal
        ? 'ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¸Ãƒâ€šÃ‚Â Appli ouverte en local : <code>' + esc(location.origin) + '</code> (l\'adresse rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©seau s\'affiche quand le serveur local tourne)'
        : 'ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¸Ãƒâ€šÃ‚Â Appli ouverte depuis : <code>' + esc(location.origin) + '</code><br>URL de synchro proposÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©e : <code>' + esc(location.origin + '/api/sync') + '</code>';
    }
  })();
};

function renderInspItem(r) {
  const stats = computeStats(r);
  return `
  <a class="list-item" href="rapport.html?id=${encodeURIComponent(r.id)}">
    <span class="doc-ico">ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€šÃ‚Â¦Ãƒâ€šÃ‚Âº</span>
    <span class="grow">
      <span class="title">${esc(r.header?.site || 'Site non renseignÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©')} ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â SST ${esc(r.header?.sst || '?')}</span><br>
      <span class="meta">${esc(r.header?.technicien || '')} ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· ${fmtDate(r.header?.date || r.createdAt)} ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· ${esc(r.checklistTitle || '')}${r.header?.projetNom ? ' ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒâ€šÃ‚Â ' + esc(r.header.projetNom) : ''}</span>
    </span>
    ${stats.nc > 0 ? `<span class="badge ko">${stats.nc} NC</span>` : `<span class="badge ok">${stats.c} C</span>`}
  </a>`;
}

function computeStats(r) {
  let c = 0, nc = 0, na = 0, todo = 0;
  for (const cat of r.checklist?.categories || []) {
    for (const p of cat.points || []) {
      const a = r.answers?.[p.id];
      if (!a || !a.status) todo++;
      else if (a.status === 'C') c++;
      else if (a.status === 'NC') nc++;
      else na++;
    }
  }
  return { c, nc, na, todo, total: (r.checklist?.categories || []).reduce((n, cat) => n + (cat.points || []).length, 0) };
}

/* ---------- recherche globale (accueil) ---------- */
function renderGlobalSearch(q, container, ctx) {
  if (!q) { container.innerHTML = ''; return; }
  const { insp, projets, avancements, data } = ctx;
  const docs = data.docs.filter(d => (d.title + ' ' + (d.desc || '') + ' ' + (d.tags || '')).toLowerCase().includes(q));
  const fiches = data.fiches.filter(f => (f.title + ' ' + f.tags + ' ' + f.body.replace(/<[^>]+>/g, ' ')).toLowerCase().includes(q));
  const pr = projets.filter(p => (p.title || '').toLowerCase().includes(q) || JSON.stringify(p.values || {}).toLowerCase().includes(q));
  const av = avancements.filter(a => (a.title || '').toLowerCase().includes(q) || JSON.stringify(a.values || {}).toLowerCase().includes(q));
  const ins = insp.filter(r => (r.header?.site || '').toLowerCase().includes(q) || (r.header?.projetNom || '').toLowerCase().includes(q) || JSON.stringify(r.answers || {}).toLowerCase().includes(q));
  const sect = (label, items) => items.length ? `<h4 class="gs-sect">${label} (${items.length})</h4><div class="list" style="margin-bottom:14px">${items.join('')}</div>` : '';
  container.innerHTML =
    sect('ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾ Documents', docs.map(d => `<a class="list-item" href="docs/${encodeURIComponent(d.file)}" target="_blank" rel="noopener"><span class="doc-ico">${d.icon || 'ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾'}</span><span class="grow"><span class="title">${esc(d.title)}</span><br><span class="meta">${esc(d.tags || '')}</span></span><span class="badge na">PDF</span></a>`)) +
    sect('ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒâ€šÃ‚Â Fiches de synthÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨se', fiches.map(f => `<a class="list-item" href="#/fiche/${encodeURIComponent(f.id)}"><span class="doc-ico">ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒâ€šÃ‚Â</span><span class="grow"><span class="title">${esc(f.title)}</span><br><span class="meta">${esc(f.tags || '')}</span></span></a>`)) +
    sect('ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒâ€šÃ‚Â Projets', pr.map(p => `<a class="list-item" href="#/projets/voir/${encodeURIComponent(p.id)}"><span class="doc-ico">ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒâ€šÃ‚Â</span><span class="grow"><span class="title">${esc(p.values?.nom || p.title || p.id)}</span><br><span class="meta">${[p.values?.ville, p.values?.etat].filter(Boolean).map(esc).join(' ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· ')}</span></span></a>`)) +
    sect('ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€¦Ã‚Â¡Ãƒâ€šÃ‚Â§ Avancements', av.map(a => `<a class="list-item" href="#/avancement/voir/${encodeURIComponent(a.id)}"><span class="doc-ico">ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€¦Ã‚Â¡Ãƒâ€šÃ‚Â§</span><span class="grow"><span class="title">${esc(a.title || 'Point d\'avancement')}</span><br><span class="meta">${esc(a.values?.date || '')}</span></span></a>`)) +
    sect('ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€šÃ‚Â¦Ãƒâ€šÃ‚Âº Inspections', ins.map(r => renderInspItem(r)));
  if (!docs.length && !fiches.length && !pr.length && !av.length && !ins.length) {
    container.innerHTML = `<div class="empty"><span class="ico">ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚Â</span>Aucun rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©sultat pour ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â« ${esc(q)} ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â».</div>`;
  }
}

/* ---------- Connaissances (docs + fiches) ---------- */
Routes.connaissances = async function () {
  const data = await loadData();
  const state = { tab: (location.hash.split('?')[1] || 'docs') };

  function render() {
    const q = ($('#search')?.value || '').toLowerCase();
    let inner = `
      <h2 class="page-title">Connaissances</h2>
      <p class="page-sub">Documents de rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©fÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©rence et fiches de synthÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨se ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â disponibles hors-ligne.</p>
      <div class="seg no-print">
        <button data-tab="docs" class="${state.tab === 'docs' ? 'active' : ''}">ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾ Documents (${data.docs.length})</button>
        <button data-tab="fiches" class="${state.tab === 'fiches' ? 'active' : ''}">ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒâ€šÃ‚Â Fiches de synthÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨se (${data.fiches.length})</button>
      </div>
      <input id="search" class="search" type="search" placeholder="RechercherÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦" value="${esc($('#search')?.value || '')}">
    `;
    if (state.tab === 'docs') {
      const docs = data.docs.filter(d => (d.title + ' ' + d.tags + ' ' + (d.desc || '')).toLowerCase().includes(q));
      inner += `<div class="list">` + docs.map(d => `
        <a class="list-item" href="docs/${encodeURIComponent(d.file)}" target="_blank" rel="noopener">
          <span class="doc-ico">${d.icon || 'ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾'}</span>
          <span class="grow">
            <span class="title">${esc(d.title)}</span><br>
            <span class="meta">${esc(d.desc || '')} ${d.tags ? 'ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· ' + esc(d.tags) : ''}</span>
          </span>
          <span class="badge na">PDF</span>
        </a>`).join('') + `</div>`;
      if (!docs.length) inner += `<div class="empty"><span class="ico">ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚Â</span>Aucun document ne correspond.</div>`;
    } else {
      const fiches = data.fiches.filter(f => (f.title + ' ' + f.tags + ' ' + f.body).toLowerCase().includes(q));
      inner += `<div class="list">` + fiches.map((f, i) => `
        <a class="list-item" href="#/fiche/${f.id}">
          <span class="doc-ico">ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒâ€šÃ‚Â</span>
          <span class="grow">
            <span class="title">${esc(f.title)}</span><br>
            <span class="meta">${esc(f.tags)}</span>
          </span>
        </a>`).join('') + `</div>`;
      if (!fiches.length) inner += `<div class="empty"><span class="ico">ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚Â</span>Aucune fiche ne correspond.</div>`;
    }
    view.innerHTML = inner;
    $$('.seg button', view).forEach(b => b.onclick = () => { state.tab = b.dataset.tab; render(); });
    $('#search', view).addEventListener('input', render);
    $('#search', view).focus();
  }
  render();
};

/* ---------- Fiche individuelle ---------- */
Routes.fiche = async function (id) {
  const data = await loadData();
  const f = data.fiches.find(x => x.id === id);
  if (!f) { view.innerHTML = `<div class="empty">Fiche introuvable. <a href="#/connaissances">Retour</a></div>`; return; }
  view.innerHTML = `
    <p class="no-print"><a href="#/connaissances">ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Ãƒâ€šÃ‚Â Connaissances</a></p>
    <div class="card fiche">
      <h3>${esc(f.title)}</h3>
      <p class="muted small">${esc(f.tags)}</p>
      ${f.body}
    </div>
  `;
};

/* ---------- Inspection : liste des formulaires ---------- */
Routes.inspection = async function () {
  const data = await loadData();
  if (data.checklists.length === 1) { location.hash = '#/inspection/nouveau/' + data.checklists[0].id; return; }
  view.innerHTML = `
    <h2 class="page-title">Inspection SST</h2>
    <p class="page-sub">Choisis le formulaire ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  remplir sur le terrain. La saisie est enregistrÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©e localement, mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªme hors-ligne.</p>
    <div class="list">
      ${data.checklists.map(cl => `
        <a class="list-item" href="#/inspection/nouveau/${cl.id}">
          <span class="doc-ico">ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€šÃ‚Â¦Ãƒâ€šÃ‚Âº</span>
          <span class="grow">
            <span class="title">${esc(cl.title)}</span><br>
            <span class="meta">${esc(cl.desc || '')} ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· ${(cl.categories || []).reduce((n, c) => n + (c.points || []).length, 0)} points de contrÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´le</span>
          </span>
          <span class="badge warn">Nouveau</span>
        </a>`).join('')}
    </div>
  `;
};

/* ---------- Inspection : nouveau / reprise de brouillon ---------- */
Routes['inspection/nouveau'] = async function (clId) {
  const data = await loadData();
  const cl = data.checklists.find(c => c.id === clId);
  if (!cl) { view.innerHTML = `<div class="empty">Formulaire introuvable. <a href="#/inspection">Retour</a></div>`; return; }
  App.draft = {
    id: 'insp-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7),
    checklistId: cl.id,
    checklistTitle: cl.title,
    checklist: cl,
    header: { site: '', sst: '', date: new Date().toISOString().slice(0, 16), technicien: localStorage.getItem('cu_technicien') || '', type: 'BT' },
    answers: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  location.hash = '#/inspection/remplir';
};

/* ---------- Inspection : remplissage ---------- */
Routes['inspection/remplir'] = async function () {
  const d = App.draft;
  if (!d) { location.hash = '#/inspection'; return; }
  const cl = d.checklist;
  const projets = await DB.all('projets');

  const total = cl.categories.reduce((n, c) => n + c.points.length, 0);
  const done = () => Object.values(d.answers).filter(a => a && a.status).length;
  // types rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©ellement couverts par ce formulaire
  const typesCouverts = new Set();
  cl.categories.forEach(c => c.points.forEach(p => (p.types || ['ALL']).forEach(t => typesCouverts.add(t))));
  if (typesCouverts.has('ALL')) { typesCouverts.add('HT'); typesCouverts.add('BT'); typesCouverts.add('FROID'); }
  const opts = [];
  if (typesCouverts.has('BT')) opts.push('<option value="BT" ' + (d.header.type === 'BT' ? 'selected' : '') + '>BT ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â tempÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©rature &lt; 110 ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°C</option>');
  if (typesCouverts.has('HT')) opts.push('<option value="HT" ' + (d.header.type === 'HT' ? 'selected' : '') + '>HT ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â tempÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©rature ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â°Ãƒâ€šÃ‚Â¥ 110 ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°C</option>');
  if (typesCouverts.has('FROID')) opts.push('<option value="FROID" ' + (d.header.type === 'FROID' ? 'selected' : '') + '>FROID ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©seau de froid urbain</option>');
  if (!typesCouverts.has(d.header.type)) d.header.type = opts.length ? (opts[0].match(/value="(\w+)"/) || [])[1] : 'BT';

  function render() {
    const stats = computeStats(d);
    const answered = done();
    view.innerHTML = `
      <h2 class="page-title">${esc(cl.title)}</h2>
      <p class="page-sub">${esc(cl.desc || '')}</p>

      <div class="card">
        <h3>En-tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªte de l'inspection</h3>
        <div class="grid2">
          <div class="field"><label>Site / Installation</label>
            <input type="text" id="f-site" value="${esc(d.header.site)}" placeholder="Ex. RÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©sidence Les Tilleuls, Lyon 3e"></div>
          <div class="field"><label>RepÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨re sous-station</label>
            <input type="text" id="f-sst" value="${esc(d.header.sst)}" placeholder="Ex. SST Bat B ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â local chaufferie RDC"></div>
          <div class="field"><label>Date</label>
            <input type="datetime-local" id="f-date" value="${esc(d.header.date)}"></div>
          <div class="field"><label>Technicien</label>
            <input type="text" id="f-tech" value="${esc(d.header.technicien)}" placeholder="Nom et prÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©nom"></div>
          <div class="field"><label>Type de sous-station</label>
            <select id="f-type">${opts.join('')}</select></div>
          <div class="field"><label>Projet liÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â© (facultatif)</label>
            <select id="f-projet"><option value="">ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â aucun projet ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â</option>${projets.map(p => `<option value="${esc(p.id)}" ${d.header.projetId === p.id ? 'selected' : ''}>${esc(p.values?.nom || p.id)}</option>`).join('')}</select></div>
        </div>
      </div>

      <div class="progress">
        Progression : ${answered}/${total} points renseignÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©s
        ${stats.nc ? ` ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· <span class="badge ko">${stats.nc} NC</span>` : ''}
        ${stats.todo ? ` ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· <span class="badge na">${stats.todo} ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  faire</span>` : ' ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· <span class="badge ok">terminÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©</span>'}
        <div class="bar"><div style="width:${total ? (answered / total * 100) : 0}%"></div></div>
      </div>

      ${cl.categories.map((cat, ci) => `
        <div class="cat-header"><span>${esc(cat.name)}</span><span class="count">${cat.points.filter(p => d.answers[p.id]?.status).length}/${cat.points.length}</span></div>
        ${cat.points.map(p => renderPoint(d, cat, p)).join('')}
      `).join('')}

      <div class="card">
        <h3>Finaliser</h3>
        <p class="muted small">L'inspection est enregistrÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©e sur cet appareil. Tu pourras ensuite ouvrir le PV, l'imprimer (PDF) ou l'exporter.</p>
        <div class="btn-row">
          <button class="btn" id="btn-save">ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢Ãƒâ€šÃ‚Â¾ Enregistrer l'inspection</button>
          <button class="btn secondary" id="btn-pv">ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾ Voir le PV</button>
        </div>
      </div>
    `;

    // en-tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªte
    $('#f-site').oninput = e => d.header.site = e.target.value;
    $('#f-sst').oninput = e => d.header.sst = e.target.value;
    $('#f-date').oninput = e => d.header.date = e.target.value;
    $('#f-tech').oninput = e => { d.header.technicien = e.target.value; localStorage.setItem('cu_technicien', e.target.value); };
    $('#f-type').onchange = e => d.header.type = e.target.value;
    const fp = $('#f-projet');
    if (fp) fp.onchange = e => {
      d.header.projetId = e.target.value || null;
      const p = projets.find(x => x.id === e.target.value);
      d.header.projetNom = p ? (p.values?.nom || '') : '';
    };

    // points de contrÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´le
    $$('.ctrl', view).forEach(el => {
      const pid = el.dataset.pid;
      const a = d.answers[pid] || (d.answers[pid] = { status: null, obs: '', photos: [] });
      $$('.rep', el).forEach(b => b.onclick = () => {
        a.status = b.dataset.v;
        d.updatedAt = new Date().toISOString();
        render();
      });
      const obs = $('.obs', el);
      if (obs) { obs.value = a.obs || ''; obs.oninput = e => a.obs = e.target.value; }
      const file = $('.file', el);
      if (file) file.onchange = () => {
        const f = file.files[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const max = 1280;
            const scale = Math.min(1, max / Math.max(img.width, img.height));
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            a.photos.push(canvas.toDataURL('image/jpeg', 0.82));
            d.updatedAt = new Date().toISOString();
            render();
          };
          img.src = reader.result;
        };
        reader.readAsDataURL(f);
      };
      $$('.photo .del', el).forEach((b, i) => b.onclick = () => { a.photos.splice(i, 1); render(); });
    });

    $('#btn-save').onclick = async () => {
      d.updatedAt = new Date().toISOString();
      await DB.put('inspections', d);
      App.draft = null;
      toast('ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ Inspection enregistrÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©e');
      location.hash = '#/rapports';
    };
    $('#btn-pv').onclick = async () => {
      d.updatedAt = new Date().toISOString();
      await DB.put('inspections', d);
      window.open('rapport.html?id=' + encodeURIComponent(d.id), '_blank');
    };
  }

  function renderPoint(d, cat, p) {
    const a = d.answers[p.id] || {};
    const applies = !p.types || p.types.includes(d.header.type) || p.types.includes('ALL');
    if (!applies) return '';
    return `
      <div class="ctrl" data-pid="${esc(p.id)}">
        <div class="q">${esc(p.label)}</div>
        ${p.reg ? `<div class="reg">ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“ ${esc(p.reg)}</div>` : ''}
        <div class="rep-row">
          <button class="rep c ${a.status === 'C' ? 'sel-c' : ''}" data-v="C">ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Conforme</button>
          <button class="rep nc ${a.status === 'NC' ? 'sel-nc' : ''}" data-v="NC">ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“Ãƒâ€¹Ã…â€œ Non conforme</button>
          <button class="rep na ${a.status === 'NA' ? 'sel-na' : ''}" data-v="NA">ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â N/A</button>
        </div>
        <textarea class="obs" placeholder="ObservationÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦">${esc(a.obs || '')}</textarea>
        <div class="photos">
          ${(a.photos || []).map((ph, i) => `<div class="photo"><img src="${ph}" alt="photo ${i + 1}"><button class="del" title="Supprimer">ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢</button></div>`).join('')}
          <label class="add-photo" title="Ajouter une photo">ÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¼ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹<input class="file" type="file" accept="image/*" capture="environment" style="display:none"></label>
        </div>
      </div>`;
  }

  render();
};

/* ============================================================
   FORMULAIRES GÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â°NÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â°RIQUES ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Fiches projet & Points d'avancement
   ============================================================ */

function fieldHtml(f, val, projets) {
  const v = val ?? '';
  const req = f.required ? 'required' : '';
  const lab = esc(f.label) + (f.required ? ' *' : '');
  switch (f.type) {
    case 'textarea':
      return `<div class="field"><label>${lab}</label><textarea id="fld-${esc(f.id)}" ${req} placeholder="${esc(f.placeholder || '')}">${esc(v)}</textarea></div>`;
    case 'select': {
      const opts = (f.options || []).map(o => `<option value="${esc(o)}" ${String(v) === o ? 'selected' : ''}>${esc(o)}</option>`).join('');
      return `<div class="field"><label>${lab}</label><select id="fld-${esc(f.id)}" ${req}><option value="">ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â</option>${opts}</select></div>`;
    }
    case 'select-projets': {
      const opts = (projets || []).map(p => `<option value="${esc(p.id)}" ${String(v) === p.id ? 'selected' : ''}>${esc(p.values?.nom || p.id)}</option>`).join('');
      return `<div class="field"><label>${lab}</label><select id="fld-${esc(f.id)}"><option value="">ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â choisir un projet enregistrÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â© ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â</option>${opts}</select></div>`;
    }
    case 'contacts': {
      const list = Array.isArray(v) ? v : [];
      const blocHtml = (c) => `
        <div class="c-bloc" style="border:1px solid var(--line);border-radius:10px;padding:10px;margin-bottom:8px;background:#fff">
          <div class="grid2">
            ${(f.subfields || []).map(sf => `<div class="field"><label>${esc(sf.label)}</label><input type="${esc(sf.type || 'text')}" class="c-in" data-k="${esc(sf.id)}" value="${esc(c?.[sf.id] ?? '')}" placeholder="${esc(sf.placeholder || sf.label)}"></div>`).join('')}
          </div>
          <button type="button" class="btn ghost c-del" style="padding:6px 12px">ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ Retirer ce contact</button>
        </div>`;
      return `<div class="field"><label>${lab}</label>
        <div id="fld-contacts">${list.map(blocHtml).join('')}</div>
        <button type="button" class="btn secondary c-add">ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã‚Â¾ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ Ajouter un contact</button>
      </div>`;
    }
    case 'postes': {
      const cur = v || {};
      return `<div class="card"><h3>${lab}</h3>` + (f.postes || []).map(p => `
        <div class="field" style="border-top:1px dashed var(--line);padding-top:8px;margin-bottom:8px">
          <label>${esc(p)}</label>
          <div class="grid2">
            <input type="number" min="0" max="100" class="poste-pct" data-p="${esc(p)}" value="${esc(cur[p]?.pct ?? '')}" placeholder="Avancement %">
            <input type="text" class="poste-com" data-p="${esc(p)}" value="${esc(cur[p]?.com || '')}" placeholder="CommentaireÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦">
          </div>
        </div>`).join('') + `</div>`;
    }
    case 'photos': {
      const arr = Array.isArray(v) ? v : [];
      return `<div class="field"><label>${lab}</label>
        <input type="hidden" id="fld-${esc(f.id)}" value="${esc(JSON.stringify(arr))}">
        <div class="photos" id="ph-${esc(f.id)}">
          ${arr.map((ph, i) => `<div class="photo"><img src="${ph}" alt="photo ${i + 1}"><button type="button" class="del" title="Supprimer">ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢</button></div>`).join('')}
          <label class="add-photo" title="Ajouter une photo">ÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¼ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹<input class="file" type="file" accept="image/*" capture="environment" style="display:none"></label>
        </div>
      </div>`;
    }
    default:
      return `<div class="field"><label>${lab}</label><input type="${esc(f.type || 'text')}" id="fld-${esc(f.id)}" ${req} value="${esc(v)}" placeholder="${esc(f.placeholder || '')}"></div>`;
  }
}

function readField(f) {
  if (f.type === 'photos') {
    const el = $('#fld-' + f.id);
    try { return JSON.parse(el ? el.value : '[]'); } catch (e) { return []; }
  }
  if (f.type === 'contacts') {
    const box = $('#fld-contacts');
    if (!box) return [];
    return $$('.c-bloc', box).map(b => {
      const o = {};
      $$('.c-in', b).forEach(inp => { o[inp.dataset.k] = inp.value; });
      return o;
    }).filter(o => Object.values(o).some(x => String(x).trim() !== ''));
  }
  if (f.type === 'postes') {
    const out = {};
    $$('.poste-pct').forEach(el => {
      const p = el.dataset.p;
      const com = $(`.poste-com[data-p="${CSS.escape(p)}"]`);
      if (el.value !== '' || (com && com.value !== '')) out[p] = { pct: el.value === '' ? null : Number(el.value), com: com ? com.value : '' };
    });
    return out;
  }
  if (f.type === 'photos') {
    const el = $('#fld-' + f.id);
    if (!el) return [];
    try { const a = JSON.parse(el.value || '[]'); return Array.isArray(a) ? a : []; } catch { return []; }
  }
  const el = $('#fld-' + f.id);
  if (!el) return '';
  return f.type === 'number' ? (el.value === '' ? null : Number(el.value)) : el.value;
}

function formTitleOf(def, values) {
  if (def.id === 'projet') return values.nom || 'Projet sans nom';
  if (def.id === 'avancement') {
    const p = values.projetLibre || values.projet || '';
    return 'Point du ' + (values.date || 'ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦') + (p ? ' ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ' + p : '');
  }
  return values[def.listTitle] || def.title;
}

/* ---------- Liste (projets ou avancement) ---------- */
function listView(defId) {
  return async function () {
    const data = await loadData();
    const def = data.forms[defId];
    const items = await DB.all(def.store);
    const projets = await DB.all('projets');

    function render() {
      const q = ($('#search')?.value || '').toLowerCase();
      const filtered = items.filter(it => JSON.stringify(it.values).toLowerCase().includes(q));
      view.innerHTML = `
        <h2 class="page-title">${def.ico} ${esc(def.title)}</h2>
        <p class="page-sub">${esc(def.desc)}</p>
        <div class="btn-row" style="margin-bottom:12px">
          <a class="btn" href="#/${defId === 'projet' ? 'projets' : 'avancement'}/nouveau">ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã‚Â¾ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ Nouveau</a>
          <button class="btn ghost" id="btn-export-all">ÃƒÆ’Ã‚Â¢Ãƒâ€šÃ‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡ Exporter tout (JSON)</button>
        </div>
        <input id="search" class="search" type="search" placeholder="Rechercher dans les ${defId === 'projet' ? 'fiches projet' : 'points d\'avancement'}ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦" value="${esc($('#search')?.value || '')}">
        ${filtered.length ? `<div class="list">${filtered.map(it => {
          const title = formTitleOf(def, it.values);
          let meta = fmtDate(it.createdAt);
          if (def.id === 'projet') meta = [it.values.ville, it.values.etat].filter(Boolean).join(' ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· ') || meta;
          if (def.id === 'avancement') {
            const pn = it.values.projet ? (projets.find(p => p.id === it.values.projet)?.values?.nom || it.values.projet) : '';
            meta = [it.values.date, pn, it.values.avancementGlobal != null ? it.values.avancementGlobal + ' %' : ''].filter(Boolean).join(' ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· ');
          }
          return `
          <a class="list-item" href="#/${defId === 'projet' ? 'projets' : 'avancement'}/voir/${encodeURIComponent(it.id)}">
            <span class="doc-ico">${def.ico}</span>
            <span class="grow"><span class="title">${esc(title)}</span><br><span class="meta">${esc(meta)}</span></span>
            <span class="badge na">${esc(def.title)}</span>
          </a>`;
        }).join('')}</div>`
        : `<div class="empty"><span class="ico">${def.ico}</span>Aucun enregistrement${q ? ' ne correspond ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â« ' + esc(q) + ' ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â»' : ''}.</div>`}
      `;
      $('#search', view).addEventListener('input', render);
      const be = $('#btn-export-all', view);
      if (be) be.onclick = () => exportJson(def.store + '.json', items);
    }
    render();
  };
}

function exportJson(filename, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
  toast('ÃƒÆ’Ã‚Â¢Ãƒâ€šÃ‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡ Export JSON tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©chargÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©');
}

/* ============================================================
   SYNCHRONISATION ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â export/import JSON + API serveur local
   ============================================================ */
function deviceId() {
  let id = localStorage.getItem('cu_device');
  if (!id) { id = 'dev-' + Math.random().toString(36).slice(2, 10) + '-' + Date.now().toString(36); localStorage.setItem('cu_device', id); }
  return id;
}
function deletedList() { try { return JSON.parse(localStorage.getItem('cu_deleted') || '[]'); } catch { return []; } }
function markDeleted(id) {
  const l = deletedList();
  l.push({ id, at: new Date().toISOString() });
  localStorage.setItem('cu_deleted', JSON.stringify(l));
}
async function delRec(store, id) { await DB.del(store, id); markDeleted(id); }

async function collectAll() {
  return {
    app: 'chauffage-urbain',
    exportedAt: new Date().toISOString(),
    device: deviceId(),
    inspections: await DB.all('inspections'),
    projets: await DB.all('projets'),
    avancements: await DB.all('avancements'),
    deleted: deletedList(),
  };
}

/* Fusionne un payload {inspections, projets, avancements, deleted} dans le local.
   RÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨gle : par id, la version avec l'updatedAt le plus rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©cent gagne ; les suppressions se propagent. */
async function applyPayload(obj) {
  let upsert = 0, suppr = 0;
  for (const store of ['inspections', 'projets', 'avancements']) {
    const local = await DB.all(store);
    const byId = new Map(local.map(x => [x.id, x]));
    for (const rec of (obj[store] || [])) {
      const cur = byId.get(rec.id);
      if (!cur || (rec.updatedAt || '') >= (cur.updatedAt || '')) { await DB.put(store, rec); upsert++; byId.set(rec.id, rec); }
    }
    for (const d of (obj.deleted || [])) {
      if (byId.has(d.id)) { await DB.del(store, d.id); suppr++; }
      markDeleted(d.id);
    }
  }
  // tombstones de plus de 30 jours ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ oubli
  const cutoff = Date.now() - 30 * 24 * 3600 * 1000;
  localStorage.setItem('cu_deleted', JSON.stringify(deletedList().filter(d => Date.parse(d.at) > cutoff)));
  return { upsert, suppr };
}

function exportAllData() {
  collectAll().then(data => exportJson('chauffage-urbain_' + new Date().toISOString().slice(0, 10) + '.json', data));
}

function importAllFromFile(file) {
  file.text()
    .then(t => JSON.parse(t))
    .then(async (obj) => {
      if (!obj || (!obj.inspections && !obj.projets && !obj.avancements)) { toast('ÃƒÆ’Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒâ€¦Ã¢â‚¬â„¢ Fichier non reconnu (pas une sauvegarde Chauffage Urbain)'); return; }
      const r = await applyPayload(obj);
      toast(`ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ Import : ${r.upsert} enregistrement(s) fusionnÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©(s), ${r.suppr} suppression(s) propagÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©e(s)`);
      router();
    })
    .catch(e => toast('ÃƒÆ’Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒâ€¦Ã¢â‚¬â„¢ Import impossible : ' + e.message));
}

/* Normalise l'URL de synchro : ajoute /api/sync si manquante (ex. http://192.168.0.7:8765 -> .../api/sync) */
function normalizeSyncUrl(raw) {
  let u = (raw || '').trim();
  if (!u) return location.origin.replace(/\/+$/, '') + '/api/sync';
  u = u.replace(/\/+$/, '');
  if (!/\/api\/sync$/i.test(u)) u += '/api/sync';
  return u;
}

async function testSyncUrl() {
  const base = normalizeSyncUrl(localStorage.getItem('cu_sync_url'));
  const hostUrl = base.replace(/\/api\/sync$/i, '/api/host');
  const el = $('#sync-test-result');
  const say = (html, ok) => { if (el) { el.innerHTML = html; el.style.color = ok ? 'var(--ok)' : 'var(--ko)'; } };
  say('ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€šÃ‚Â§Ãƒâ€šÃ‚Âª Test de <code>' + esc(hostUrl) + '</code>ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦', true);
  try {
    const res = await fetch(hostUrl, { cache: 'no-store' });
    if (!res.ok) { say('ÃƒÆ’Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒâ€¦Ã¢â‚¬â„¢ RÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©ponse HTTP ' + res.status + ' ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â le serveur ne rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©pond pas sur cette URL (elle doit finir par <code>/api/host</code> ou <code>/api/sync</code>).', false); return; }
    const info = await res.json();
    say('ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ <strong>PC joignable</strong> : <code>' + esc(info.ip || '?') + ':' + esc(info.port || '?') + '</code> ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â tu peux lancer ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â« ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾ Synchroniser ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â».', true);
  } catch (e) {
    say('ÃƒÆ’Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒâ€¦Ã¢â‚¬â„¢ PC injoignable (' + esc(e.message || 'erreur rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©seau') + '). VÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©rifie :<br>' +
      'ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ le tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©phone est sur le <strong>mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªme Wi-Fi</strong> que le PC (pas en 4G/5G)<br>' +
      'ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ le PC est allumÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â© et le serveur tourne (raccourci bureau ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â« Appli Chauffage Urbain ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â»)<br>' +
      'ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ le <strong>pare-feu Windows</strong> a autorisÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â© le port (popup ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â« Autoriser l\'accÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨s ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â»)<br>' +
      'ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ l\'IP du PC n\'a pas changÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â© (DHCP) ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â la recopier depuis la carte ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¸Ãƒâ€šÃ‚Â ci-dessus<br>' +
      'ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ sur le tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©phone, ouvrir directement <code>http://&lt;IP&gt;:' + esc((new URL(base)).port || '8765') + '/</code> (pas la version https GitHub Pages : Safari bloque les appels http depuis une page https)', false);
  }
}

async function syncNow() {
  // URL de synchro personnalisable (PC en Wi-Fi), sinon origine actuelle ; /api/sync ajoutÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â© si besoin
  const base = normalizeSyncUrl(localStorage.getItem('cu_sync_url'));
  const su = $('#sync-url');
  if (su && su.value.trim() !== base) su.value = base;
  localStorage.setItem('cu_sync_url', base);
  let res;
  try {
    const payload = await collectAll();
    res = await fetch(base, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    toast('ÃƒÆ’Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒâ€¦Ã¢â‚¬â„¢ Synchro impossible vers ' + base + ' ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â clique d\'abord sur ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€šÃ‚Â§Ãƒâ€šÃ‚Âª Tester (mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªme Wi-Fi, pare-feu, PC allumÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©), sinon utilise Exporter/Importer');
    return;
  }
  if (!res.ok) { toast('ÃƒÆ’Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒâ€¦Ã¢â‚¬â„¢ Synchro refusÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©e (HTTP ' + res.status + ') depuis ' + base + ' ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â l\'URL doit finir par /api/sync'); return; }
  const merged = await res.json();
  const r = await applyPayload(merged);
  toast(`ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾ Synchro OK : ${r.upsert} enregistrement(s) reÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§us/mis ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  jour, ${r.suppr} suppression(s)`);
  router();
}

/* ---------- Voir une fiche ---------- */
function formReadView(defId, id) {
  return async function () {
    const data = await loadData();
    const def = data.forms[defId];
    const rec = await DB.get(def.store, id);
    if (!rec) {
      view.innerHTML = '<div class="empty">Enregistrement introuvable. <a href="#/' + (defId === 'projet' ? 'projets' : 'avancement') + '">Retour</a></div>';
      return;
    }
    const listRoute = defId === 'projet' ? 'projets' : 'avancement';

    let projetNom = '';
    if (def.id === 'avancement' && rec.values.projet) {
      const ps = await DB.all('projets');
      projetNom = ps.find(p => p.id === rec.values.projet)?.values?.nom || rec.values.projet;
    }

    let linkedHtml = '';
    if (def.id === 'projet') {
      const inspAll = await DB.all('inspections');
      const linked = inspAll.filter(r => r.header && r.header.projetId === rec.id);
      linkedHtml = '<h3 style="margin:18px 0 10px">ðŸ¦º Inspections liÃ©es Ã  ce projet (' + linked.length + ')</h3>' +
        (linked.length
          ? '<div class="list">' + linked.map(renderInspItem).join('') + '</div>'
          : '<p class="muted small">Aucune inspection liÃ©e pour l\'instant â€” choisis ce projet dans l\'en-tÃªte d\'une inspection SST.</p>');
    }

    let qrHtml = '';
    let qrUrl = '';
    if (def.id === 'projet') {
      let base = location.origin;
      try {
        const info = await fetchJsonUtf8('api/host');
        if (info && info.lan) base = info.lan.replace(/\/+$/, '');
      } catch (e) {}
      qrUrl = base + location.pathname.replace(/index\.html$/, '') + '#/projets/voir/' + encodeURIComponent(rec.id);
      qrHtml = '<div class="card no-print" style="margin-top:14px">' +
        '<h3>ðŸ“± Ouvrir cette fiche sur un autre appareil</h3>' +
        '<p class="muted small">Flash ce QR code avec un tÃ©lÃ©phone (mÃªme rÃ©seau / mÃªme appli) pour ouvrir directement cette fiche :</p>' +
        '<div class="qr-wrap"><div id="qr-box"></div><div class="small muted qr-url">' + esc(qrUrl) + '</div></div>' +
        '</div>';
    }

    const rowsHtml = def.fields.map(f => {
      let v = rec.values[f.id];
      if (f.type === 'select-projets') v = projetNom || v || 'â€”';
      if (f.type === 'contacts') {
        const cs = Array.isArray(v) ? v : [];
        const inner = cs.length
          ? '<ul style="margin:0;padding-left:16px">' + cs.map(c =>
              '<li><strong>' + esc(c.nom || 'â€”') + '</strong>' +
              (c.role ? ' Â· ' + esc(c.role) : '') +
              (c.tel ? ' Â· ðŸ“ž ' + esc(c.tel) : '') +
              (c.mail ? ' Â· âœ‰ï¸ <a href="mailto:' + esc(c.mail) + '">' + esc(c.mail) + '</a>' : '') +
              '</li>').join('') + '</ul>'
          : '<span class="muted">â€”</span>';
        return '<tr><th style="width:40%">' + esc(f.label) + '</th><td>' + inner + '</td></tr>';
      }
      if (f.type === 'postes') {
        const postes = v && Object.keys(v).length
          ? Object.entries(v).map(([p, x]) => '<tr><td>' + esc(p) + '</td><td style="width:70px;text-align:right">' + (x.pct != null ? esc(x.pct) + ' %' : 'â€”') + '</td><td>' + esc(x.com || '') + '</td></tr>').join('')
          : '';
        return '<tr><th colspan="2" style="background:var(--orange-light)">' + esc(f.label) + '</th></tr>' + (postes || '<tr><td colspan="2" class="muted">â€”</td></tr>');
      }
      if (f.type === 'photos') {
        const arr = Array.isArray(v) ? v : [];
        const inner = arr.length
          ? '<div class="photos">' + arr.map((ph, i) => '<div class="photo" style="width:110px;height:110px"><img src="' + ph + '" alt="photo ' + (i + 1) + '"></div>').join('') + '</div>'
          : '<span class="muted">â€”</span>';
        return '<tr><th style="width:40%">' + esc(f.label) + '</th><td>' + inner + '</td></tr>';
      }
      const disp = (v === null || v === undefined || v === '') ? '<span class="muted">â€”</span>' : esc(v);
      return '<tr><th style="width:40%">' + esc(f.label) + '</th><td>' + disp + '</td></tr>';
    }).join('');

    view.innerHTML = `
      <p class="no-print"><a href="#/${listRoute}">â† Retour Ã  la liste</a></p>
      <h2 class="page-title">${def.ico} ${esc(formTitleOf(def, rec.values))}</h2>
      <p class="page-sub">${esc(def.title)} Â· enregistrÃ©e le ${fmtDate(rec.createdAt)}</p>
      <div class="card">
        <table class="pv">${rowsHtml}</table>
      </div>
      ${qrHtml}
      ${linkedHtml}
      <div class="btn-row no-print">
        <a class="btn" href="#/${listRoute}/nouveau/${encodeURIComponent(rec.id)}">âœï¸ Modifier</a>
        <button class="btn secondary" id="btn-print">ðŸ–¨ Imprimer / PDF</button>
        <button class="btn secondary" id="btn-export">â¬‡ Exporter (JSON)</button>
        <button class="btn danger" id="btn-del">ðŸ—‘ Supprimer</button>
      </div>
    `;

    $('#btn-print', view).onclick = () => window.print();

    if (def.id === 'projet' && window.QRCode && qrUrl) {
      try {
        const box = $('#qr-box', view);
        if (box) new QRCode(box, { text: qrUrl, width: 200, height: 200, colorDark: '#000000', colorLight: '#ffffff' });
      } catch (e) { console.warn('QR:', e); }
    }

    $('#btn-export', view).onclick = () => exportJson(formTitleOf(def, rec.values).replace(/[^a-z0-9]+/gi, '_') + '.json', rec);
    $('#btn-del', view).onclick = async () => {
      if (confirm('Supprimer dÃ©finitivement cet enregistrement ?')) {
        await delRec(def.store, rec.id);
        toast('ðŸ—‘ SupprimÃ©');
        location.hash = '#/' + listRoute;
      }
    };
  };
}

/* ---------- Nouveau / Ã©dition ---------- */
function formEditView(defId, existingId) {
  return async function () {
    const data = await loadData();
    const def = data.forms[defId];
    const projets = await DB.all('projets');
    const rec = existingId ? await DB.get(def.store, existingId) : null;
    if (existingId && !rec) { view.innerHTML = `<div class="empty">Enregistrement introuvable.</div>`; return; }
    const values = rec ? { ...rec.values } : {};
    if (rec && rec.values.contactNom && !rec.values.contacts) {
      values.contacts = [{ nom: rec.values.contactNom || '', role: '', tel: rec.values.contactTel || '', mail: rec.values.contactMail || '' }];
    }
    if (!rec && def.id === 'avancement' && !values.date) values.date = new Date().toISOString().slice(0, 10);
    if (!rec && def.id === 'avancement' && !values.redacteur) values.redacteur = localStorage.getItem('cu_technicien') || '';
    const listRoute = defId === 'projet' ? 'projets' : 'avancement';

    view.innerHTML = `
      <p class="no-print"><a href="#/${listRoute}">â† Retour Ã  la liste</a></p>
      <h2 class="page-title">${def.ico} ${rec ? 'Modifier' : 'Nouveau'} â€” ${esc(def.title)}</h2>
      <p class="page-sub">${esc(def.desc)}</p>
      <div class="card">
        <div class="grid2">
          ${def.fields.map(f => fieldHtml(f, values[f.id], projets)).join('')}
        </div>
        <div class="btn-row">
          <button class="btn" id="btn-save">ðŸ’¾ Enregistrer</button>
          <button class="btn ghost" id="btn-cancel">Annuler</button>
        </div>
      </div>
    `;

    // champ "contacts" dynamique : ajouter / retirer
    const contactsDef = def.fields.find(f => f.type === 'contacts');
    if (contactsDef) {
      const bindDel = (btn) => { btn.onclick = () => btn.closest('.c-bloc').remove(); };
      $$('.c-del', view).forEach(bindDel);
      const addBtn = $('.c-add', view);
      if (addBtn) addBtn.onclick = () => {
        const box = $('#fld-contacts', view);
        const div = document.createElement('div');
        div.className = 'c-bloc';
        div.style.cssText = 'border:1px solid var(--line);border-radius:10px;padding:10px;margin-bottom:8px;background:#fff';
        const fields = contactsDef.subfields.map(sf =>
          `<div class="field"><label>${esc(sf.label)}</label><input type="${esc(sf.type || 'text')}" class="c-in" data-k="${esc(sf.id)}" placeholder="${esc(sf.placeholder || sf.label)}"></div>`).join('');
        div.innerHTML = `<div class="grid2">${fields}</div><button type="button" class="btn ghost c-del" style="padding:6px 12px">âœ• Retirer ce contact</button>`;
        box.appendChild(div);
        bindDel($('.c-del', div));
        const first = $('.c-in', div);
        if (first) first.focus();
      };
    }

    // champ "photos" : galerie + ajout redimensionnÃ© (hidden #fld-<id> = JSON du tableau)
    const photosDef = def.fields.find(f => f.type === 'photos');
    if (photosDef) {
      const box = $('#ph-' + photosDef.id, view);
      const hidden = $('#fld-' + photosDef.id, view);
      const addFile = $('.file', box);
      const delPhoto = (ph) => {
        const i = [...box.querySelectorAll('.photo')].indexOf(ph);
        const c = JSON.parse(hidden.value || '[]');
        c.splice(i, 1);
        hidden.value = JSON.stringify(c);
        ph.remove();
      };
      if (addFile) addFile.onchange = () => {
        const f = addFile.files[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const max = 1280;
            const scale = Math.min(1, max / Math.max(img.width, img.height));
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            const cur = JSON.parse(hidden.value || '[]');
            cur.push(canvas.toDataURL('image/jpeg', 0.82));
            hidden.value = JSON.stringify(cur);
            const ph = document.createElement('div');
            ph.className = 'photo';
            ph.innerHTML = '<img alt=""><button type="button" class="del" title="Supprimer">âœ•</button>';
            ph.querySelector('img').src = cur[cur.length - 1];
            ph.querySelector('.del').onclick = () => delPhoto(ph);
            box.insertBefore(ph, addFile.closest('label'));
          };
          img.src = reader.result;
        };
        reader.readAsDataURL(f);
        addFile.value = '';
      };
      $$('.photo .del', box).forEach((b) => { b.onclick = () => delPhoto(b.closest('.photo')); });
    }

    $('#btn-cancel', view).onclick = () => location.hash = '#/' + listRoute;
    $('#btn-save', view).onclick = async () => {
      const vals = {};
      for (const f of def.fields) vals[f.id] = readField(f);
      if (def.id === 'avancement' && vals.redacteur) localStorage.setItem('cu_technicien', vals.redacteur);
      const now = new Date().toISOString();
      const record = {
        id: rec ? rec.id : def.id + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7),
        formId: def.id,
        title: formTitleOf(def, vals),
        values: vals,
        createdAt: rec ? rec.createdAt : now,
        updatedAt: now,
      };
      await DB.put(def.store, record);
      toast('âœ… EnregistrÃ© : ' + record.title);
      location.hash = '#/' + listRoute;
    };
  };
}

/* ---------- routes concrÃ¨tes ---------- */
Routes.projets = listView('projet');
Routes['projets/nouveau'] = function (id) { return formEditView('projet', id || null)(); };
Routes['projets/voir'] = function (id) { return formReadView('projet', id)(); };

Routes.avancement = listView('avancement');
Routes['avancement/nouveau'] = function (id) { return formEditView('avancement', id || null)(); };
Routes['avancement/voir'] = function (id) { return formReadView('avancement', id)(); };

/* ---------- Rapports ---------- */
Routes.rapports = async function () {
  const insp = await DB.all('inspections');
  view.innerHTML = `
    <h2 class="page-title">Rapports d'inspection</h2>
    <p class="page-sub">Historique enregistrÃ© sur cet appareil.</p>
    ${insp.length ? `<div class="list">${insp.map(renderInspItem).join('')}</div>`
      : `<div class="empty"><span class="ico">ðŸ¦º</span>Aucune inspection enregistrÃ©e.<br><br><a class="btn" href="#/inspection">Faire une inspection SST</a></div>`}
  `;
};

/* ============================================================
   Routeur + ruban + initialisation
   ============================================================ */
const TABS = [
  { route: 'accueil', ico: 'ðŸ ', label: 'Accueil' },
  { route: 'projets', ico: 'ðŸ“', label: 'Projets' },
  { route: 'avancement', ico: 'ðŸš§', label: 'Avancement' },
  { route: 'connaissances', ico: 'ðŸ“š', label: 'Connaissances' },
  { route: 'inspection', ico: 'ðŸ¦º', label: 'Inspection SST', cta: true },
  { route: 'rapports', ico: 'ðŸ“‹', label: 'Rapports' },
];

function renderTabbar(route) {
  const bar = $('#tabbar');
  const isHome = !route || route === 'accueil';
  if (isHome) {
    bar.innerHTML = '';
    bar.style.display = 'none';
    document.body.style.paddingBottom = '0';
    return;
  }
  bar.style.display = 'flex';
  document.body.style.paddingBottom = '76px';
  bar.innerHTML = `<a href="#/accueil" data-route="accueil" class="active"><span class="tab-ico">ðŸ </span>Accueil</a>`;
}

async function router() {
  netStatus();
  const hash = location.hash.replace(/^#\/?/, '');
  const [route, ...params] = hash.split('/');
  renderTabbar(route);
  try {
    if (!route || route === 'accueil') await Routes.accueil();
    else if (route === 'connaissances') await Routes.connaissances();
    else if (route === 'fiche') await Routes.fiche(params[0]);
    else if (route === 'projets' && !params[0]) await Routes.projets();
    else if (route === 'projets' && params[0] === 'nouveau') await Routes['projets/nouveau'](params[1]);
    else if (route === 'projets' && params[0] === 'voir') await Routes['projets/voir'](decodeURIComponent(params[1] || ''));
    else if (route === 'avancement' && !params[0]) await Routes.avancement();
    else if (route === 'avancement' && params[0] === 'nouveau') await Routes['avancement/nouveau'](params[1]);
    else if (route === 'avancement' && params[0] === 'voir') await Routes['avancement/voir'](decodeURIComponent(params[1] || ''));
    else if (route === 'inspection' && !params[0]) await Routes.inspection();
    else if (route === 'inspection' && params[0] === 'nouveau') await Routes['inspection/nouveau'](params[1]);
    else if (route === 'inspection' && params[0] === 'remplir') await Routes['inspection/remplir']();
    else if (route === 'rapports') await Routes.rapports();
    else view.innerHTML = `<div class="empty">Page introuvable. <a href="#/accueil">Accueil</a></div>`;
  } catch (e) {
    console.error(e);
    view.innerHTML = `<div class="card"><h3>Erreur</h3><p class="muted">${esc(e.message)}</p></div>`;
  }
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', router);

(function ensureThemeBtn() {
  const bar = $('#topbar');
  if (bar && !$('#btn-theme')) {
    const b = document.createElement('button');
    b.id = 'btn-theme';
    b.className = 'btn ghost';
    b.style.cssText = 'color:#fff;border-color:rgba(255,255,255,.4);padding:4px 10px';
    b.title = 'ThÃ¨me sombre / clair';
    b.onclick = () => applyTheme(!document.documentElement.classList.contains('dark'));
    bar.appendChild(b);
  }
})();

initTheme();
initLock();
router();
