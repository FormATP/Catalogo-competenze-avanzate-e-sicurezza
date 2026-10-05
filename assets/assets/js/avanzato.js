/* =========================================================
   avanzato.js — Catalogo Competenze Avanzate
   Carica i dati da /assets/data/data-avanzato.json
   ========================================================= */

const AMBITI_CONFIG = {
  AI:   { color:'#0D9488', label:'Intelligenza artificiale e realtà virtuale',               icon:'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 9h.01M15 9h.01M9 15c.83.67 1.83 1 3 1s2.17-.33 3-1"/>' },
  AMM:  { color:'#E85D26', label:'Amministrazione, finanza e controllo',                      icon:'<path d="M12 2v20M17 5H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H6"/>' },
  COMP: { color:'#D97706', label:'Compliance, ESG e reporting',                               icon:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>' },
  HR:   { color:'#7C3AED', label:'Gestione risorse umane, sicurezza organizzativa e welfare', icon:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>' },
  LING: { color:'#DB2777', label:"Servizi linguistici per l'internazionalizzazione",          icon:'<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z"/>' },
  MARK: { color:'#0EA5E9', label:'Marketing, vendite, comunicazione e statistica',            icon:'<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>' },
  OPS:  { color:'#DC2626', label:'Operations, qualità, R&D e supply chain',                   icon:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 4.6a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>' },
  SOST: { color:'#16A34A', label:'Transizione energetica e sostenibilità',                    icon:'<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c.5 2.5 0 6.5-3 9-3.5 3-6.5 3.5-9 3-2.5 5.4 0 6-1 6Z"/><path d="M11 20v-9"/>' },
};

/* Solo 2 tab — le informazioni utili al cliente */
const TABS = [
  { key: 'descrizione', label: 'Descrizione' },
  { key: 'modalita_svolgimento', label: 'Come si svolge' },
];

/* Mappatura ore → testo modalità */
function buildModalita(c) {
  const parts = [];
  if (c.aula)            parts.push(`Aula: ${c.aula}h`);
  if (c.fad)             parts.push(`E-learning (FAD): ${c.fad}h`);
  if (c.action_learning) parts.push(`Action learning: ${c.action_learning}h`);
  if (c.affiancamento)   parts.push(`Affiancamento: ${c.affiancamento}h`);
  return parts.join('\n');
}

/* ── Stato ─────────────────────────────────────────────── */
const state = {
  view: 'home',
  currentAmbito: null,
  activeCompetenza: null,
  searchTerm: '',
  sort: 'competenza',
  openCards: new Set(),
  activeTabs: {},
};

/* ── Helpers ──────────────────────────────────────────── */
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

function hl(text, term) {
  if (!term) return esc(text);
  const idx = text.toLowerCase().indexOf(term.toLowerCase());
  if (idx === -1) return esc(text);
  return esc(text.slice(0,idx)) + '<mark>' + esc(text.slice(idx,idx+term.length)) + '</mark>' + esc(text.slice(idx+term.length));
}

function svg(path, size=22) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}

function getColor(ambito) { return AMBITI_CONFIG[ambito]?.color ?? '#194496'; }

function matchSearch(c, term) {
  if (!term) return true;
  const t = term.toLowerCase();
  return [c.titolo, c.descrizione_competenza, c.codice, c.descrizione, c.tematica || ''].join(' ').toLowerCase().includes(t);
}

/* ── Viste ───────────────────────────────────────────── */
function showView(name) {
  ['home','ambito','search'].forEach(v =>
    document.getElementById(`view-${v}`).style.display = v === name ? '' : 'none'
  );
  state.view = name;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ── Home: griglia ambiti ─────────────────────────────── */
function renderHome() {
  const grouped = {};
  COURSES.forEach(c => {
    if (!grouped[c.ambito]) grouped[c.ambito] = { n: 0, codici: new Set() };
    grouped[c.ambito].n++;
    grouped[c.ambito].codici.add(c.codice);
  });

  document.getElementById('ambiti-grid').innerHTML = Object.entries(AMBITI_CONFIG).map(([sigla, cfg], i) => {
    const g = grouped[sigla] || { n: 0, codici: new Set() };
    return `
    <div class="ambito-tile" data-ambito="${sigla}" style="--tile-color:${cfg.color}; animation-delay:${i*.04}s">
      <div class="tile-arrow">${svg('<polyline points="9 18 15 12 9 6"/>',16)}</div>
      <div class="tile-icon-wrap">${svg(cfg.icon,22)}</div>
      <span class="tile-sigla">${sigla}</span>
      <div class="tile-name">${cfg.label}</div>
      <div class="tile-meta">
        <span><span class="tile-dot"></span>${g.n} corsi</span>
        <span><span class="tile-dot"></span>${g.codici.size} competenze</span>
      </div>
    </div>`;
  }).join('');

  document.querySelectorAll('.ambito-tile').forEach(t => t.addEventListener('click', () => {
    state.currentAmbito = t.dataset.ambito;
    state.activeCompetenza = null;
    state.openCards.clear(); state.activeTabs = {};
    renderAmbitoView();
    showView('ambito');
  }));
}

/* ── Vista ambito ─────────────────────────────────────── */
function renderAmbitoView() {
  const amb = state.currentAmbito;
  const cfg = AMBITI_CONFIG[amb];
  const color = cfg.color;
  const corsi = COURSES.filter(c => c.ambito === amb);
  const codiciMap = {};
  corsi.forEach(c => {
    if (!codiciMap[c.codice]) codiciMap[c.codice] = { desc: c.descrizione_competenza, count: 0 };
    codiciMap[c.codice].count++;
  });

  document.getElementById('bc-current').textContent = cfg.label;
  document.getElementById('ambito-hero').style.background = `linear-gradient(135deg, ${color}, ${color}CC)`;
  document.getElementById('ambito-hero').innerHTML = `
    <div class="ah-icon">${svg(cfg.icon,26)}</div>
    <span class="ah-sigla">${amb}</span>
    <div class="ah-name">${cfg.label}</div>
    <div class="ah-stats">${corsi.length} corsi · ${Object.keys(codiciMap).length} codici competenza</div>`;

  /* Popola il menu a tendina */
  const sel = document.getElementById('comp-select');
  const countEl = document.getElementById('comp-select-count');
  sel.style.setProperty('--sel-color', color);

  /* Ricostruisce le opzioni */
  sel.innerHTML = `<option value="">Tutti i corsi (${corsi.length})</option>`;
  Object.entries(codiciMap).forEach(([cod, {desc, count}]) => {
    const opt = document.createElement('option');
    opt.value = cod;
    opt.textContent = `${desc}  ·  ${count} ${count > 1 ? 'corsi' : 'corso'}`;
    opt.dataset.code = cod;
    if (cod === state.activeCompetenza) opt.selected = true;
    sel.appendChild(opt);
  });

  /* Aggiorna il counter visibile */
  const updateCount = () => {
    const n = state.activeCompetenza
      ? codiciMap[state.activeCompetenza]?.count ?? 0
      : corsi.length;
    countEl.textContent = `${n} ${n !== 1 ? 'corsi' : 'corso'}`;
  };
  updateCount();

  /* Rimuove vecchio listener e ne aggiunge uno nuovo */
  const newSel = sel.cloneNode(true);
  sel.parentNode.replaceChild(newSel, sel);
  document.getElementById('comp-select').addEventListener('change', e => {
    state.activeCompetenza = e.target.value || null;
    state.openCards.clear();
    renderCorsi();
    const n = state.activeCompetenza
      ? codiciMap[state.activeCompetenza]?.count ?? 0
      : corsi.length;
    document.getElementById('comp-select-count').textContent = `${n} ${n !== 1 ? 'corsi' : 'corso'}`;
  });

  renderCorsi();
}

function renderCorsi() {
  const amb = state.currentAmbito;
  const color = AMBITI_CONFIG[amb]?.color;
  let list = COURSES.filter(c => c.ambito === amb && (!state.activeCompetenza || c.codice === state.activeCompetenza));
  list = sortList(list);
  document.getElementById('corsi-count').textContent = list.length;
  const grid = document.getElementById('corsi-grid');
  grid.innerHTML = buildCardsHtml(list, color, '');
  attachCardListeners(grid);
}

/* ── Vista ricerca ───────────────────────────────────── */
function renderSearch() {
  const term = state.searchTerm;
  const results = COURSES.filter(c => matchSearch(c, term));
  document.getElementById('search-results-label').textContent =
    `${results.length} risultat${results.length === 1 ? 'o' : 'i'} per "${term}"`;
  const grid = document.getElementById('search-grid');
  if (!results.length) { grid.innerHTML = emptyHtml(); return; }
  grid.innerHTML = buildCardsHtml(results, null, term, true);
  attachCardListeners(grid);
}

/* ── HTML cards ──────────────────────────────────────── */
function buildCardsHtml(list, defaultColor, term='', showBadge=false) {
  if (!list.length) return emptyHtml();

  return list.map((c, idx) => {
    const id = c.codice + '|' + c.titolo;
    const isOpen = state.openCards.has(id);
    const color = defaultColor || getColor(c.ambito);
    const cfg = AMBITI_CONFIG[c.ambito];
    const total = (c.aula||0) + (c.action_learning||0) + (c.affiancamento||0) + (c.fad||0) || 1;

    /* Barra segmentata */
    const segs = [
      { cls:'aula', val:c.aula||0,           label:'Aula' },
      { cls:'al',   val:c.action_learning||0, label:'Action Learning' },
      { cls:'aff',  val:c.affiancamento||0,   label:'Affiancamento' },
      { cls:'fad',  val:c.fad||0,             label:'E-learning' },
    ].filter(s => s.val > 0);

    /* Contenuto dettaglio */
    const activeTab = state.activeTabs[id] || 'descrizione';
    const tabContent = {
      descrizione: `<div class="detail-text scroll">${esc(c.descrizione || '')}</div>`,
      modalita_svolgimento: `<div class="modalita-grid">${buildModalitaHtml(c)}</div>`,
    };

    const detailHtml = isOpen ? `
      <div class="tabs">
        ${TABS.map(t => `<button class="tab-btn ${activeTab===t.key?'active':''}" data-tabid="${esc(id)}" data-tabkey="${t.key}">${t.label}</button>`).join('')}
      </div>
      <div>
        ${TABS.map(t => `<div class="tab-panel ${activeTab===t.key?'active':''}" data-panel="${t.key}">${tabContent[t.key]}</div>`).join('')}
      </div>` : '';

    const badgeHtml = showBadge && cfg
      ? `<div class="card-ambito-badge" style="color:${color}">${esc(c.ambito)} · ${esc(cfg.label)}</div>` : '';

    /* Tematica pill */
    const tematicaHtml = c.tematica
      ? `<span class="tematica-pill" style="--pill-color:${color}">${esc(c.tematica)}</span>` : '';

    return `
    <div class="card ${isOpen?'open':''}" data-cid="${esc(id)}" style="--card-color:${color}; animation-delay:${Math.min(idx,10)*.03}s">
      <div class="card-top" data-toggle="${esc(id)}">
        ${badgeHtml}
        <div class="card-comp-row">
          <div class="card-comp-icon">${svg(cfg?.icon||'',15)}</div>
          <div class="card-comp-info">
            <div class="card-comp-desc">${hl(c.descrizione_competenza||'', term)}</div>
            <div class="card-comp-code">${esc(c.codice||'')}</div>
          </div>
        </div>
        <h3 class="card-title">${hl(c.titolo, term)}</h3>
        <div class="card-meta-row">
          <span class="duration-pill">
            ${svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',13)}
            ${c.durata} ore
          </span>
          ${tematicaHtml}
        </div>
        <div class="seg-bar">${segs.map(s=>`<div class="seg ${s.cls}" style="width:${s.val/total*100}%"></div>`).join('')}</div>
        <div class="seg-legend">${segs.map(s=>`<span><span class="dot ${s.cls}"></span>${s.label} ${s.val}h</span>`).join('')}</div>
        <div class="card-expand-hint">${svg('<polyline points="6 9 12 15 18 9"/>',13)} ${isOpen?'Chiudi':'Scopri il corso'}</div>
      </div>
      <div class="card-detail" style="${isOpen?'':'max-height:0'}">
        <div class="detail-inner">${detailHtml}</div>
      </div>
    </div>`;
  }).join('');
}

function buildModalitaHtml(c) {
  const modes = [
    { cls:'aula', val:c.aula||0,           label:'Aula', desc:'Lezioni in presenza con docente' },
    { cls:'fad',  val:c.fad||0,             label:'E-learning', desc:'Formazione a distanza' },
    { cls:'al',   val:c.action_learning||0, label:'Action Learning', desc:'Apprendimento attivo su casi reali' },
    { cls:'aff',  val:c.affiancamento||0,   label:'Affiancamento', desc:'Training on the job' },
  ].filter(m => m.val > 0);

  return modes.map(m => `
    <div class="modal-item">
      <div class="modal-dot dot ${m.cls}"></div>
      <div>
        <div class="modal-label">${m.label} — <strong>${m.val}h</strong></div>
        <div class="modal-desc">${m.desc}</div>
      </div>
    </div>`).join('');
}

function attachCardListeners(grid) {
  grid.querySelectorAll('[data-toggle]').forEach(el => el.addEventListener('click', () => {
    const id = el.dataset.toggle;
    if (state.openCards.has(id)) state.openCards.delete(id);
    else { state.openCards.add(id); state.activeTabs[id] = state.activeTabs[id] || 'descrizione'; }
    if (state.view === 'ambito') renderCorsi();
    else renderSearch();
    requestAnimationFrame(() => {
      const card = document.querySelector(`[data-cid="${id.replace(/"/g,'\\"')}"]`);
      if (card && state.openCards.has(id)) {
        card.querySelector('.card-detail').style.maxHeight = card.querySelector('.card-detail').scrollHeight + 'px';
        card.scrollIntoView({ behavior:'smooth', block:'nearest' });
      }
    });
  }));

  grid.querySelectorAll('.tab-btn').forEach(btn => btn.addEventListener('click', e => {
    e.stopPropagation();
    const id = btn.dataset.tabid, key = btn.dataset.tabkey;
    state.activeTabs[id] = key;
    const card = btn.closest('.card');
    card.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tabkey === key));
    card.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.dataset.panel === key));
    card.querySelector('.card-detail').style.maxHeight = card.querySelector('.card-detail').scrollHeight + 'px';
  }));
}

function sortList(list) {
  if (state.sort === 'competenza') return [...list].sort((a,b) => a.codice.localeCompare(b.codice) || a.titolo.localeCompare(b.titolo));
  if (state.sort === 'title')      return [...list].sort((a,b) => a.titolo.localeCompare(b.titolo));
  if (state.sort === 'dur-asc')    return [...list].sort((a,b) => a.durata - b.durata);
  if (state.sort === 'dur-desc')   return [...list].sort((a,b) => b.durata - a.durata);
  return list;
}

function emptyHtml() {
  return `<div class="empty-state"><div class="empty-icon">${svg('<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',24)}</div><h3>Nessun corso trovato</h3><p>Modifica i filtri o il termine di ricerca.</p></div>`;
}

/* ── Init ──────────────────────────────────────────────── */
let COURSES = [];

async function init() {
  const res = await fetch('assets/data/data-avanzato.json');
  COURSES = await res.json();

  document.getElementById('stat-total').textContent = COURSES.length;
  document.getElementById('stat-cats').textContent = Object.keys(AMBITI_CONFIG).length;
  document.getElementById('stat-comp').textContent = new Set(COURSES.map(c => c.codice)).size;

  const searchEl = document.getElementById('global-search');
  const clearBtn = document.getElementById('global-search-clear');

  searchEl.addEventListener('input', () => {
    const term = searchEl.value.trim();
    state.searchTerm = term;
    clearBtn.style.display = term ? '' : 'none';
    if (term.length >= 2) { state.openCards.clear(); renderSearch(); showView('search'); }
    else if (!term) { state.currentAmbito ? showView('ambito') : showView('home'); }
  });
  clearBtn.addEventListener('click', () => {
    searchEl.value = ''; state.searchTerm = ''; clearBtn.style.display = 'none';
    state.currentAmbito ? showView('ambito') : showView('home');
  });

  document.getElementById('back-btn').addEventListener('click', () => {
    state.currentAmbito = null; state.activeCompetenza = null; state.openCards.clear(); showView('home');
  });
  document.getElementById('search-back-btn').addEventListener('click', () => {
    document.getElementById('global-search').value = ''; state.searchTerm = ''; clearBtn.style.display = 'none';
    state.currentAmbito ? showView('ambito') : showView('home');
  });

  document.getElementById('sort-select').addEventListener('change', e => { state.sort = e.target.value; renderCorsi(); });

  renderHome();
  showView('home');
}

document.addEventListener('DOMContentLoaded', init);
