/* =========================================================
   sicurezza.js — Catalogo Sicurezza sul Lavoro
   ========================================================= */

const AMBITI_CONFIG = {
  'SIC.GEN': { color:'#DC2626', label:'Formazione generale lavoratori',                                    icon:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/>' },
  'SIC.BAS': { color:'#EA580C', label:'Formazione specifica — Rischio basso',                             icon:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>',                                    },
  'SIC.MED': { color:'#D97706', label:'Formazione specifica — Rischio medio',                             icon:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="M12 8v4"/><path d="M12 16h.01"/>'},
  'SIC.ALT': { color:'#B91C1C', label:'Formazione specifica — Rischio alto',                              icon:'<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>'},
  'SIC.PRE': { color:'#7C3AED', label:'Formazione preposti',                                              icon:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/>'},
  'SIC.SPC': { color:'#0F766E', label:'Spazi confinati o sospetti di inquinamento',                       icon:'<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>'},
  'SIC.ATT': { color:'#0369A1', label:'Abilitazione operatori attrezzature di lavoro',                    icon:'<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>'},
  'SIC.SPP': { color:'#1D4ED8', label:'RSPP / ASPP — Responsabile servizio prevenzione e protezione',    icon:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>'},
  'SIC.AGG': { color:'#0D9488', label:'Aggiornamenti periodici',                                          icon:'<path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>'},
  'SIC.CSP': { color:'#6D28D9', label:'Coordinatore per la sicurezza nei cantieri',                       icon:'<polygon points="3 11 22 2 13 21 11 13 3 11"/>'},
};

const TABS = [
  { key: 'descrizione',         label: 'Descrizione' },
  { key: 'modalita_svolgimento',label: 'Come si svolge' },
];

const state = {
  view: 'home',
  currentAmbito: null,
  activeCompetenza: null,
  searchTerm: '',
  sort: 'competenza',
  openCards: new Set(),
  activeTabs: {},
};

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

function getColor(ambito) { return AMBITI_CONFIG[ambito]?.color ?? '#DC2626'; }

function matchSearch(c, term) {
  if (!term) return true;
  const t = term.toLowerCase();
  return [c.titolo, c.descrizione_competenza, c.codice, c.descrizione, c.ambito_label, c.tematica||''].join(' ').toLowerCase().includes(t);
}

function showView(name) {
  ['home','ambito','search'].forEach(v =>
    document.getElementById(`sic-view-${v}`).style.display = v === name ? '' : 'none'
  );
  state.view = name;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ── Home ── */
function renderHome() {
  const grouped = {};
  COURSES.forEach(c => {
    if (!grouped[c.ambito]) grouped[c.ambito] = { n: 0, codici: new Set() };
    grouped[c.ambito].n++;
    grouped[c.ambito].codici.add(c.codice);
  });

  document.getElementById('sic-ambiti-grid').innerHTML = Object.entries(AMBITI_CONFIG).map(([sigla, cfg], i) => {
    const g = grouped[sigla] || { n: 0, codici: new Set() };
    if (!g.n) return ''; // nascondi ambiti senza corsi
    return `
    <div class="ambito-tile" data-ambito="${sigla}" style="--tile-color:${cfg.color}; animation-delay:${i*.04}s">
      <div class="tile-arrow">${svg('<polyline points="9 18 15 12 9 6"/>',15)}</div>
      <div class="tile-icon-wrap">${svg(cfg.icon,20)}</div>
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

/* ── Ambito ── */
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

  document.getElementById('sic-bc-current').textContent = cfg.label;

  // Hero: tiro fuori la normativa dalla label_full se presente
  const normativa = corsi[0]?.ambito_label_full?.split(' — ')[1] || '';
  document.getElementById('sic-ambito-hero').style.background = `linear-gradient(135deg, ${color}, ${color}CC)`;
  document.getElementById('sic-ambito-hero').innerHTML = `
    <div class="ah-icon">${svg(cfg.icon,24)}</div>
    <span class="ah-sigla">${amb}</span>
    <div class="ah-name">${cfg.label}</div>
    ${normativa ? `<div class="ah-norm">${esc(normativa)}</div>` : ''}
    <div class="ah-stats">${corsi.length} ${corsi.length === 1 ? 'corso' : 'corsi'} · ${Object.keys(codiciMap).length} ${Object.keys(codiciMap).length === 1 ? 'competenza' : 'competenze'}</div>`;

  // Select competenza
  const sel = document.getElementById('sic-comp-select');
  const countEl = document.getElementById('sic-comp-select-count');
  sel.style.setProperty('--sel-color', color);
  sel.innerHTML = `<option value="">Tutti i corsi (${corsi.length})</option>`;
  Object.entries(codiciMap).forEach(([cod, {desc, count}]) => {
    const opt = document.createElement('option');
    opt.value = cod;
    opt.textContent = `${desc}  ·  ${count} ${count > 1 ? 'corsi' : 'corso'}`;
    if (cod === state.activeCompetenza) opt.selected = true;
    sel.appendChild(opt);
  });

  const updCount = () => {
    const n = state.activeCompetenza ? codiciMap[state.activeCompetenza]?.count ?? 0 : corsi.length;
    countEl.textContent = `${n} ${n !== 1 ? 'corsi' : 'corso'}`;
  };
  updCount();

  // Rimuovi vecchi listener clonando
  const newSel = sel.cloneNode(true);
  sel.parentNode.replaceChild(newSel, sel);
  document.getElementById('sic-comp-select').addEventListener('change', e => {
    state.activeCompetenza = e.target.value || null;
    state.openCards.clear();
    renderCorsi();
    const n = state.activeCompetenza ? codiciMap[state.activeCompetenza]?.count ?? 0 : corsi.length;
    document.getElementById('sic-comp-select-count').textContent = `${n} ${n !== 1 ? 'corsi' : 'corso'}`;
  });

  renderCorsi();
}

function renderCorsi() {
  const amb = state.currentAmbito;
  const color = AMBITI_CONFIG[amb]?.color;
  let list = COURSES.filter(c => c.ambito === amb && (!state.activeCompetenza || c.codice === state.activeCompetenza));
  list = sortList(list);
  document.getElementById('sic-corsi-count').textContent = list.length;
  const grid = document.getElementById('sic-corsi-grid');
  grid.innerHTML = buildCardsHtml(list, color, '');
  attachCardListeners(grid);
}

/* ── Ricerca ── */
function renderSearch() {
  const term = state.searchTerm;
  const results = COURSES.filter(c => matchSearch(c, term));
  document.getElementById('sic-search-results-label').textContent =
    `${results.length} risultat${results.length === 1 ? 'o' : 'i'} per "${term}"`;
  const grid = document.getElementById('sic-search-grid');
  if (!results.length) { grid.innerHTML = emptyHtml(); return; }
  grid.innerHTML = buildCardsHtml(results, null, term, true);
  attachCardListeners(grid);
}

/* ── Cards ── */
function buildCardsHtml(list, defaultColor, term='', showBadge=false) {
  if (!list.length) return emptyHtml();

  return list.map((c, idx) => {
    const id = c.codice + '|' + c.titolo;
    const isOpen = state.openCards.has(id);
    const color = defaultColor || getColor(c.ambito);
    const cfg = AMBITI_CONFIG[c.ambito];
    const total = (c.aula||0) + (c.fad||0) + (c.pratica||0) + (c.action_learning||0) || 1;

    const segs = [
      { cls:'aula',    val:c.aula||0,           label:'Aula / Presenza' },
      { cls:'fad',     val:c.fad||0,             label:'E-learning' },
      { cls:'pratica', val:c.pratica||0,          label:'Pratica' },
      { cls:'al',      val:c.action_learning||0,  label:'Action Learning' },
    ].filter(s => s.val > 0);

    const activeTab = state.activeTabs[id] || 'descrizione';

    const tabContent = {
      descrizione: `<div class="detail-text scroll">${esc(c.descrizione||'')}</div>`,
      modalita_svolgimento: `<div class="modalita-grid">${buildModalitaHtml(c)}</div>`,
    };

    const detailHtml = isOpen ? `
      <div class="tabs">
        ${TABS.map(t=>`<button class="tab-btn ${activeTab===t.key?'active':''}" data-tabid="${esc(id)}" data-tabkey="${t.key}">${t.label}</button>`).join('')}
      </div>
      <div>${TABS.map(t=>`<div class="tab-panel ${activeTab===t.key?'active':''}" data-panel="${t.key}">${tabContent[t.key]}</div>`).join('')}</div>` : '';

    const badgeHtml = showBadge && cfg
      ? `<div class="card-ambito-badge" style="color:${color}">${esc(c.ambito)} · ${esc(cfg.label)}</div>` : '';

    const tematicaHtml = c.tematica
      ? `<span class="tematica-pill" style="--pill-color:${color}">${esc(c.tematica)}</span>` : '';

    return `
    <div class="card ${isOpen?'open':''}" data-cid="${esc(id)}" style="--card-color:${color}; animation-delay:${Math.min(idx,10)*.03}s">
      <div class="card-top" data-toggle="${esc(id)}">
        ${badgeHtml}
        <div class="card-comp-row">
          <div class="card-comp-icon">${svg(cfg?.icon||'',14)}</div>
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
  return [
    { cls:'aula',    val:c.aula||0,           label:'Aula / Presenza', desc:'Lezioni in presenza con docente' },
    { cls:'fad',     val:c.fad||0,             label:'E-learning',      desc:'Formazione a distanza online' },
    { cls:'pratica', val:c.pratica||0,          label:'Pratica',         desc:'Esercitazioni pratiche sul campo' },
    { cls:'al',      val:c.action_learning||0,  label:'Action Learning', desc:'Apprendimento su casi reali' },
  ].filter(m => m.val > 0).map(m => `
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
  return `<div class="empty-state"><div class="empty-icon">${svg('<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',24)}</div><h3>Nessun corso trovato</h3><p>Modifica il termine di ricerca.</p></div>`;
}

/* ── Init ── */
let COURSES = [];

async function init() {
  const res = await fetch('assets/data/data-sicurezza.json');
  COURSES = await res.json();

  document.getElementById('sic-stat-total').textContent = COURSES.length;
  document.getElementById('sic-stat-cats').textContent = new Set(COURSES.map(c => c.ambito)).size;

  const searchEl = document.getElementById('sic-search');
  const clearBtn = document.getElementById('sic-search-clear');

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

  document.getElementById('sic-back-btn').addEventListener('click', () => {
    state.currentAmbito = null; state.activeCompetenza = null; state.openCards.clear(); showView('home');
  });
  document.getElementById('sic-search-back-btn').addEventListener('click', () => {
    searchEl.value = ''; state.searchTerm = ''; clearBtn.style.display = 'none';
    state.currentAmbito ? showView('ambito') : showView('home');
  });

  document.getElementById('sic-sort-select').addEventListener('change', e => {
    state.sort = e.target.value; renderCorsi();
  });

  renderHome();
  showView('home');
}

document.addEventListener('DOMContentLoaded', init);
