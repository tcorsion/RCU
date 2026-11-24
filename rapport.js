/* PV d'inspection : affichage, signature, impression, export HTML */
'use strict';
const $ = (s, el = document) => el.querySelector(s);
const view = $('#view');

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
         ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/* tombstones pour la synchro : une suppression doit se propager aux autres appareils */
function markDeleted(id) {
  try {
    const l = JSON.parse(localStorage.getItem('cu_deleted') || '[]');
    l.push({ id, at: new Date().toISOString() });
    localStorage.setItem('cu_deleted', JSON.stringify(l));
  } catch (_) {}
}

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
  async get(id) {
    const db = await DB.open();
    return new Promise((res, rej) => {
      const rq = db.transaction('inspections').objectStore('inspections').get(id);
      rq.onsuccess = () => res(rq.result); rq.onerror = () => rej(rq.error);
    });
  },
  async put(obj) {
    const db = await DB.open();
    return new Promise((res, rej) => {
      const tx = db.transaction('inspections', 'readwrite');
      tx.objectStore('inspections').put(obj);
      tx.oncomplete = res; tx.onerror = () => rej(tx.error);
    });
  },
  async del(id) {
    const db = await DB.open();
    return new Promise((res, rej) => {
      const tx = db.transaction('inspections', 'readwrite');
      tx.objectStore('inspections').delete(id);
      tx.oncomplete = res; tx.onerror = () => rej(tx.error);
    });
  }
};

function stats(r) {
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
  return { c, nc, na, todo };
}

const badge = s => s === 'C' ? '<span class="badge ok">Conforme</span>'
  : s === 'NC' ? '<span class="badge ko">NON CONFORME</span>'
  : s === 'NA' ? '<span class="badge na">N/A</span>' : '<span class="badge warn">Non renseigné</span>';

async function main() {
  const id = new URLSearchParams(location.search).get('id');
  if (!id) { view.innerHTML = '<p>Aucune inspection sélectionnée. <a href="index.html#/rapports">Retour aux rapports</a></p>'; return; }
  const r = await DB.get(id);
  if (!r) { view.innerHTML = '<p>Inspection introuvable. <a href="index.html#/rapports">Retour aux rapports</a></p>'; return; }
  const st = stats(r);
  const h = r.header || {};
  const verdict = st.nc > 0 ? '<span class="badge ko">AVIS DÉFAVORABLE — ' + st.nc + ' point(s) non conforme(s)</span>'
    : st.todo > 0 ? '<span class="badge warn">Inspection incomplète — ' + st.todo + ' point(s) non renseigné(s)</span>'
    : '<span class="badge ok">AVIS FAVORABLE — tous les points conformes</span>';

  view.innerHTML = `
    <div class="no-print btn-row" style="margin-bottom:14px">
      <button class="btn" id="btn-print">🖨 Imprimer / Enregistrer en PDF</button>
      <button class="btn secondary" id="btn-export">⬇ Exporter le PV (HTML)</button>
      <button class="btn ghost" id="btn-back">← Rapports</button>
      <button class="btn danger" id="btn-del">🗑 Supprimer</button>
    </div>

    <div class="card pv-head">
      <div>
        <h2>PV d'inspection — Sous-station ${esc(h.type === 'HT' ? 'HT (≥ 110 °C)' : h.type === 'FROID' ? 'FROID (réseau de froid urbain)' : 'BT (< 110 °C)')}</h2>
        <p class="muted small">${esc(r.checklistTitle || '')}</p>
      </div>
      <div style="text-align:right">
        <div>${verdict}</div>
        <p class="small muted">Généré le ${fmtDate(r.updatedAt || r.createdAt)}</p>
      </div>
    </div>

    <div class="card">
      <h3>Informations</h3>
      <table class="pv">
        <tr><th>Site / Installation</th><td>${esc(h.site || '—')}</td>
            <th>Repère SST</th><td>${esc(h.sst || '—')}</td></tr>
        <tr><th>Date de l'inspection</th><td>${fmtDate(h.date)}</td>
            <th>Technicien</th><td>${esc(h.technicien || '—')}</td></tr>
        <tr><th>Type</th><td>${h.type === 'HT' ? 'HT — température ≥ 110 °C' : h.type === 'FROID' ? 'FROID — réseau de froid urbain' : 'BT — température < 110 °C'}</td>
            <th>Référence</th><td>${esc(r.id)}</td></tr>
      </table>
    </div>

    <div class="card">
      <h3>Bilan</h3>
      <p>
        <span class="badge ok">${st.c} conforme(s)</span>
        <span class="badge ko">${st.nc} non conforme(s)</span>
        <span class="badge na">${st.na} N/A</span>
        ${st.todo ? `<span class="badge warn">${st.todo} non renseigné(s)</span>` : ''}
      </p>
    </div>

    ${r.checklist.categories.map(cat => `
      <div class="card">
        <h3>${esc(cat.name)}</h3>
        <table class="pv">
          <tr><th style="width:44%">Point de contrôle</th><th style="width:14%">Résultat</th><th>Observations / photos</th></tr>
          ${cat.points.map(p => {
            const a = r.answers?.[p.id] || {};
            const applies = !p.types || p.types.includes(h.type) || p.types.includes('ALL');
            if (!applies) return '';
            return `<tr>
              <td>${esc(p.label)}${p.reg ? `<br><span class="small muted">📖 ${esc(p.reg)}</span>` : ''}</td>
              <td>${badge(a.status)}</td>
              <td>${a.obs ? esc(a.obs) : '<span class="muted">—</span>'}
                ${a.photos?.length ? `<div class="pv-photos">${a.photos.map(ph => `<img src="${ph}">`).join('')}</div>` : ''}
              </td>
            </tr>`;
          }).join('')}
        </table>
      </div>
    `).join('')}

    <div class="card">
      <h3>Signature</h3>
      ${r.signature ? `<img src="${r.signature}" alt="signature" style="max-width:320px;border:1px solid var(--line);border-radius:8px">` :
      `<div class="no-print">
         <p class="muted small">Signe ci-dessous (doigt ou souris) :</p>
         <canvas class="sig-canvas" id="sig"></canvas>
         <div class="btn-row">
           <button class="btn secondary" id="sig-clear">Effacer</button>
           <button class="btn" id="sig-save">Enregistrer la signature</button>
         </div>
       </div>`}
      <p class="small muted">Signé par : ${esc(h.technicien || '____________________')} — le ${fmtDate(h.date)}</p>
    </div>
  `;

  $('#btn-print').onclick = () => window.print();
  $('#btn-back').onclick = () => location.href = 'index.html#/rapports';
  $('#btn-del').onclick = async () => {
    if (confirm('Supprimer définitivement cette inspection ?')) {
      await DB.del(r.id);
      markDeleted(r.id);
      location.href = 'index.html#/rapports';
    }
  };
  $('#btn-export').onclick = () => {
    const html = '<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>PV ' + esc(r.id) + '</title>' +
      '<style>body{font-family:Segoe UI,Arial,sans-serif;margin:24px;color:#1c1917}table{border-collapse:collapse;width:100%;font-size:.85rem}td,th{border:1px solid #ddd;padding:6px 8px;text-align:left;vertical-align:top}h2{color:#9a3412}h3{color:#c2410c;margin-bottom:6px}.card{border:1px solid #e7e5e4;border-radius:12px;padding:14px 16px;margin-bottom:14px}.badge{display:inline-block;font-size:.72rem;font-weight:700;padding:2px 9px;border-radius:999px;margin-right:4px}.ok{background:#dcfce7;color:#15803d}.ko{background:#fee2e2;color:#b91c1c}.na{background:#e7e5e4;color:#57534e}.warn{background:#fef3c7;color:#b45309}.muted{color:#78716c}.small{font-size:.78rem}.pv-photos{display:flex;gap:8px;flex-wrap:wrap;margin-top:6px}.pv-photos img{width:110px;height:110px;object-fit:cover;border-radius:8px;border:1px solid #ddd}</style></head><body>' +
      view.innerHTML.replace(/<div class="no-print[^"]*"[\s\S]*?<\/div>\s*<\/div>/g, '') +
      '</body></html>';
    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'PV_' + (h.site || 'SST').replace(/[^a-z0-9]+/gi, '_') + '_' + (h.sst || r.id) + '.html';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // signature tactile
  const canvas = $('#sig');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * devicePixelRatio;
      canvas.height = rect.height * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);
      ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.strokeStyle = '#1c1917';
    };
    resize();
    let drawing = false;
    const pos = e => {
      const rect = canvas.getBoundingClientRect();
      const t = e.touches ? e.touches[0] : e;
      return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    };
    const start = e => { drawing = true; const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); e.preventDefault(); };
    const move = e => { if (!drawing) return; const p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); e.preventDefault(); };
    const end = () => drawing = false;
    canvas.addEventListener('mousedown', start); canvas.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);
    canvas.addEventListener('touchstart', start, { passive: false }); canvas.addEventListener('touchmove', move, { passive: false });
    canvas.addEventListener('touchend', end);
    $('#sig-clear').onclick = () => { const rect = canvas.getBoundingClientRect(); ctx.clearRect(0, 0, rect.width, rect.height); };
    $('#sig-save').onclick = async () => {
      r.signature = canvas.toDataURL('image/png');
      r.updatedAt = new Date().toISOString();
      await DB.put(r);
      main();
    };
  }
}

main();
