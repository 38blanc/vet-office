/* VET Office – werkwijze 1:1 zoals Dexxter, deel 1: schil (menu, boekjaar, gsm-knop), verkopen (lijsten, factuur maken in 4 stappen, factuur bekijken) en klanten.
 * Alle eigen VET-functies blijven: te factureren uit VET Work/Heat, herinneringen, online offertes, Peppol, attesten, VEKA, verzekeringen, … */

/* ================= menu als boom (zoals Dexxter) ================= */
const DXNAV = [
  { k: 'home', i: '🏠', t: 'Dashboard' },
  { g: 'Inkomsten', i: '💶', items: [['werkbonnen', 'Te factureren (VET)'], ['offertes', 'Offertes'], ['facturen', 'Verkoopfacturen'], ['creditnotas', "Creditnota's"], ['dagontv', 'Dagontvangsten']] },
  { g: 'Uitgaven', i: '💸', items: [['uitgaven', 'Kosten'], ['peppol', 'Inbox (Peppol)'], ['invest', 'Afschrijvingen'], ['kostcats', 'Kostencategorieën', 'instellingen', 'kostcats']] },
  { k: 'bank', i: '🏦', t: 'Bank' },
  { g: 'Aangiftes', i: '📊', items: [['btw', 'Btw-aangifte'], ['ic', 'IC-aangifte'], ['listing', 'Klantenlisting', 'btw', 'listing']] },
  { g: 'Personenbelasting', i: '🧮', items: [['pb-aangifte', 'Aangifte', 'belasting', 'aangifte'], ['pb-overzicht', 'Overzicht', 'belasting', 'overzicht'], ['pb-va', 'Voorafbetalingen', 'belasting', 'va'], ['voorraad', 'Voorraad']] },
  { k: 'pb-rsz', i: '🛡', t: 'Sociale bijdragen', v: 'belasting', s: 'rsz' },
  { k: 'tijdlijn', i: '🗓', t: 'Tijdlijn' },
  { g: 'Rapporten', i: '📈', items: [['rap-res', 'Inkomsten & uitgaven', 'rapport', 'resultaat'], ['dagboeken', 'Dagboeken'], ['rap-maand', 'Per maand', 'rapport', 'maand'], ['rap-open', 'Openstaand', 'rapport', 'openstaand']] },
  { g: 'VET-apps', i: '🔥', items: [['attesten', 'Attesten (Heat)'], ['veka', 'VEKA-meldingen'], ['aanvragen', 'Aanvragen (Secretaris)'], ['reviews', 'Reviews vragen']] },
  'Beheer',
  { k: 'verz', i: '🛡', t: 'Verzekeringen' },
  { k: 'art', i: '📦', t: 'Verkoopartikelen', v: 'instellingen', s: 'artikels' },
  { k: 'wagens', i: '🚐', t: "Auto's" },
  { g: 'Relaties', i: '👥', items: [['klanten', 'Klanten'], ['leveranciers', 'Leveranciers']] },
  { k: 'instellingen', i: '⚙️', t: 'Instellingen' }
];
const dxLS = (k, d) => { try { const x = localStorage.getItem('vo_' + k); return x == null ? d : JSON.parse(x); } catch (e) { return d; } };
const dxLSset = (k, x) => { try { localStorage.setItem('vo_' + k, JSON.stringify(x)); } catch (e) {} };
let DXOPEN = dxLS('navopen', {});
function dxActief() {
  let on = v;
  if (v === 'doc') { const t = (curDoc() || {}).type; on = t === 'offerte' ? 'offertes' : t === 'creditnota' ? 'creditnotas' : 'facturen'; }
  else if (v === 'klant') on = 'klanten'; else if (v === 'uitgave') on = 'uitgaven';
  const sub0 = { belasting: 'overzicht', rapport: 'resultaat', instellingen: 'bedrijf' }[v];
  const alle = []; DXNAV.forEach((n) => { if (n && n.items) n.items.forEach((x) => alle.push({ k: x[0], v: x[2], s: x[3] })); else if (n && n.k) alle.push({ k: n.k, v: n.v, s: n.s }); });
  const hit = alle.find((x) => x.v === v && x.s === (sub || sub0)); if (hit) on = hit.k;
  return on;
}
function dxItem(k, t, vv, s, i) {
  const c = telling(k); const klik = vv ? `go('${vv}',null,'${s}')` : `go('${k}')`;
  return `<a class="${dxActief() === k ? 'on' : ''}" onclick="${klik}">${i ? `<span class="ic">${i}</span>` : ''}<span class="tx">${t}</span>${c ? `<span class="cnt">${c}</span>` : ''}</a>`;
}
function dxToggle(g) { const act = (DXNAV.find((n) => n.g === g) || { items: [] }).items.some((x) => x[0] === dxActief()); const nu = DXOPEN[g] ?? act; DXOPEN[g] = !nu; dxLSset('navopen', DXOPEN); sideR(); }
sideR = function () {
  const on = dxActief();
  $('#side').innerHTML = `<div class="brand"><img src="logo-app.png" alt="Van Eyen Technics" class="blogo"><span>VET Office</span></div>` + DXNAV.map((n) => {
    if (typeof n === 'string') return `<div class="grp">${n}</div>`;
    if (n.g) {
      const act = n.items.some((x) => x[0] === on); const open = DXOPEN[n.g] ?? act;
      const c = n.items.reduce((s, x) => s + telling(x[0]), 0);
      return `<a class="dxg ${act ? 'act' : ''}" onclick="dxToggle('${n.g}')"><span class="ic">${n.i}</span><span class="tx">${n.g}</span>${!open && c ? `<span class="cnt">${c}</span>` : ''}<span class="chev">${open ? '⌃' : '⌄'}</span></a>${open ? `<div class="dxsub">${n.items.map((x) => dxItem(x[0], x[1], x[2], x[3])).join('')}</div>` : ''}`;
    }
    return dxItem(n.k, n.t, n.v, n.s, n.i);
  }).join('') + `<div style="padding:14px 10px 0;font-size:12px;opacity:.7" id="cloudst">${window.CLOUDST ? CLOUDST() : ''}</div>`;
};

/* ================= bovenbalk: boekjaar (pc) / ☰ logo jaar (gsm) + "+"-knop op gsm ================= */
filt.jaar = +dxLS('jaar', JAAR()) || JAAR();
function dxJaren() { return [...new Set([JAAR() + 1, JAAR(), JAAR() - 1, JAAR() - 2, ...S.docs.map((d) => +String(d.datum).slice(0, 4)).filter(Boolean)])].filter((j) => j <= JAAR() + 1 && j >= 2020).sort((a, b) => b - a); }
function dxJaarZet(j) { filt.jaar = +j; dxLSset('jaar', +j); filt.pg = 1; R(); }
function dxJaarMenu(ev) { dxMenu(ev, dxJaren().map((j) => [String(j), `dxJaarZet(${j})`, { on: +filt.jaar === j }])); }
function topR() {
  const t = $('#top'); if (!t) return;
  t.innerHTML = `<button class="dxham" onclick="menu(1)" aria-label="Menu">☰</button><img class="dxlogo" src="logo-app.png" alt="VET Office" onclick="go('home')"><span class="sp"></span><span id="cloudst2" class="dxcloud">${window.CLOUDST ? CLOUDST() : ''}</span><button class="dxjaar" onclick="dxJaarMenu(event)"><span class="lb">Boekjaar</span> ${filt.jaar} ▾</button>`;
}
const DXFAB = {
  home: [['Factuur maken', "nieuwDoc('factuur')", '🧾'], ['Offerte maken', "nieuwDoc('offerte')", '📝'], ['Kost toevoegen', "go('uitgaven')", '💸']],
  facturen: [['Factuur maken', "nieuwDoc('factuur')", '🧾'], ['Voorschotfactuur maken', "nieuwDoc('voorschot')", '💶']],
  offertes: [['Offerte maken', "nieuwDoc('offerte')", '📝']],
  creditnotas: [['Creditnota maken', 'creditnotaKies()', '↩️']],
  uitgaven: [['Ticket fotograferen', "dxKies('image/*','ticket',1)", '📷'], ['Kosten uploaden', "dxKies('image/*,application/pdf','',0)", '⬆️'], ['Zonder bijlage', 'uitgaveNieuw()', '✏️']],
  klanten: [['Klant toevoegen', 'klantNieuw()', '👤']],
  dagontv: [['Dagontvangst toevoegen', 'dagNieuw()', '💶']],
  werkbonnen: [['Factuur maken', "nieuwDoc('factuur')", '🧾']]
};
function dxKies(accept, soort, cam) { const i = document.createElement('input'); i.type = 'file'; i.accept = accept; i.multiple = !cam; if (cam) i.capture = 'environment'; i.onchange = () => [...i.files].forEach((f) => kostBestand(f, soort || undefined)); i.click(); }
function fabR() {
  let f = $('#dxfab'); const acts = RO ? null : DXFAB[v];
  if (!acts) { if (f) f.remove(); return; }
  if (!f) { f = document.createElement('div'); f.id = 'dxfab'; document.body.appendChild(f); }
  f.className = ''; f.innerHTML = `<div class="dxfabl">${acts.map(([t, k, i]) => `<div class="dxfabi" onclick="dxFab(0);${k}"><span class="lb">${t}</span><span class="rb">${i}</span></div>`).join('')}</div><button class="dxfabb" onclick="dxFab()" aria-label="Nieuw">+</button>`;
}
function dxFab(o) { const f = $('#dxfab'); if (f) f.classList.toggle('open', o == null ? !f.classList.contains('open') : !!o); }

/* ================= kleine keuzemenu's (⋮, Verzenden ▾, Acties ▾, status) ================= */
function dxMenu(ev, items) {
  ev.stopPropagation(); dxMenuSluit();
  const r = ev.currentTarget.getBoundingClientRect();
  const m = document.createElement('div'); m.id = 'dxmenu';
  m.innerHTML = items.filter(Boolean).map(([t, k, o = {}]) => o.kop ? `<div class="kop">${t}</div>` : `<div class="it ${o.red ? 'rood' : ''} ${o.dis ? 'dis' : ''} ${o.on ? 'on' : ''}" onclick="${o.dis ? '' : esc(`dxMenuSluit();${k}`)}">${t}${o.sub ? `<div class="mu">${o.sub}</div>` : ''}</div>`).join('');
  document.body.appendChild(m);
  const w = m.offsetWidth, h = m.offsetHeight;
  let left = r.right - w; if (left < 8) left = Math.min(r.left, innerWidth - w - 8);
  let top = r.bottom + 4; if (top + h > innerHeight - 8) top = Math.max(8, r.top - h - 4);
  m.style.left = left + 'px'; m.style.top = top + 'px';
  setTimeout(() => document.addEventListener('click', dxMenuSluit, { once: true }), 0);
}
function dxMenuSluit() { const m = $('#dxmenu'); if (m) m.remove(); }
addEventListener('scroll', dxMenuSluit, { passive: true });

/* ================= statussen zoals Dexxter ================= */
function dxStatus(d) {
  const s = status(d);
  if (s === 'vervallen') { const dagen = Math.max(1, Math.round((Date.parse(today()) - Date.parse(d.verval)) / 864e5)); return { t: dagen >= 60 ? Math.floor(dagen / 30) + 'm te laat' : dagen + 'd te laat', c: 'r2', i: '⏰', s }; }
  const M = { concept: ['Concept', 'n', '✎'], open: ['Open', '', '•'], verzonden: ['Verzonden', '', '➤'], betaald: ['Betaald', 'g', '✓'], 'deels betaald': ['Deels betaald', 'o', '◐'], gecrediteerd: ['Gecrediteerd', 'n', '↩'], geannuleerd: ['Geannuleerd', 'n', '✕'], definitief: ['Definitief', '', '•'], terugbetaald: ['Terugbetaald', 'g', '✓'], aanvaard: ['Geaccepteerd', 'g', '✓'], geweigerd: ['Geweigerd', 'r2', '✕'], gefactureerd: ['Gefactureerd', 'g', '🧾'] };
  const x = M[s] || [s, '', '•']; return { t: x[0], c: x[1], i: x[2], s };
}
const dxChip = (d) => { const x = dxStatus(d); return `<span class="tag ${x.c}">${x.i} ${x.t}</span>`; };
const DXLIJST = { factuur: 'facturen', voorschot: 'facturen', offerte: 'offertes', creditnota: 'creditnotas' };
const DXTITEL = { factuur: 'Verkoopfactuur', voorschot: 'Voorschotfactuur', offerte: 'Offerte', creditnota: 'Creditnota' };

/* ================= lijsten: verkoopfacturen, offertes, creditnota's ================= */
filt.ps = +dxLS('ps', 10) || 10; filt.pg = 1;
const DXF = { klant: '', van: '', tot: '', kw: 0, st: [] }; // actieve filters
function dxFilterActief() { return !!(DXF.klant || DXF.van || DXF.tot || DXF.kw || DXF.st.length || filt.cnRef || filt.bron); }
function dxDocsLijst(type) {
  const types = type === 'factuur' ? ['factuur', 'voorschot'] : [type]; const q = (filt.q || '').toLowerCase();
  let l = S.docs.filter((d) => types.includes(d.type) && jaarVan(d.datum) === +filt.jaar);
  if (q) l = l.filter((d) => [d.nr, d.klant && d.klant.naam, ...(d.lijnen || []).map((x) => x.oms), C.totalen(d).inc.toFixed(2).replace('.', ',')].join(' ').toLowerCase().includes(q));
  if (DXF.klant) l = l.filter((d) => (d.klant && (d.klant.id === DXF.klant || d.klant.naam === DXF.klant)));
  if (DXF.van) l = l.filter((d) => d.datum >= DXF.van); if (DXF.tot) l = l.filter((d) => d.datum <= DXF.tot);
  if (DXF.kw) l = l.filter((d) => Math.ceil(+String(d.datum).slice(5, 7) / 3) === DXF.kw);
  if (DXF.st.length) l = l.filter((d) => DXF.st.includes(dxStatus(d).s));
  if (filt.cnRef) l = l.filter((d) => d.ref && d.ref.id === filt.cnRef);
  if (filt.bron) l = l.filter((d) => d.bron && d.bron.id === filt.bron);
  return l.sort((a, b) => (b.datum || '').localeCompare(a.datum || '') || String(b.nr).localeCompare(String(a.nr), 'nl', { numeric: true }));
}
vDocs = function (type) {
  const l = dxDocsLijst(type); const titel = { factuur: 'Verkoopfacturen', offerte: 'Offertes', creditnota: "Creditnota's" }[type];
  const nrK = { factuur: 'Factuurnummer', offerte: 'Offertenummer', creditnota: 'Creditnotanummer' }[type];
  const ps = filt.ps, pgs = Math.max(1, Math.ceil(l.length / ps)); if (filt.pg > pgs) filt.pg = pgs; const pg = filt.pg || 1;
  const blad = l.slice((pg - 1) * ps, pg * ps);
  const sum = blad.reduce((s, d) => { const t = C.totalen(d); const k = d.type === 'creditnota' ? 1 : 1; return { ex: s.ex + k * t.ex, inc: s.inc + k * t.inc }; }, { ex: 0, inc: 0 });
  const knoppen = RO ? '' : type === 'factuur' ? `<button onclick="nieuwDoc('factuur')">＋ Factuur maken</button><button class="b2o" onclick="nieuwDoc('voorschot')">＋ Voorschotfactuur</button>` : type === 'offerte' ? `<button onclick="nieuwDoc('offerte')">＋ Offerte maken</button>` : `<button onclick="creditnotaKies()">＋ Creditnota maken</button>`;
  const fchips = [DXF.klant && ['Klant: ' + ((S.klanten.find((k) => k.id === DXF.klant) || {}).n || DXF.klant), "DXF.klant=''"], (DXF.van || DXF.tot) && ['Periode: ' + (DXF.van ? dt(DXF.van) : '…') + ' – ' + (DXF.tot ? dt(DXF.tot) : '…'), "DXF.van='';DXF.tot=''"], DXF.kw && ['Kwartaal ' + DXF.kw, 'DXF.kw=0'], DXF.st.length && ['Status: ' + DXF.st.map(dxStatusNaam).join(', '), 'DXF.st=[]'], filt.cnRef && ["Creditnota's van factuur " + ((S.docs.find((d) => d.id === filt.cnRef) || {}).nr || ''), "filt.cnRef=''"], filt.bron && ['Facturen van offerte ' + ((S.docs.find((d) => d.id === filt.bron) || {}).nr || ''), "filt.bron=''"]].filter(Boolean);
  const verzIc = (d) => d.peppol && d.peppol.id ? '<span class="tag" title="Verstuurd via Peppol">Peppol</span>' : (d.mail || d.verzonden) ? `<span class="dxenv ja" title="Verzonden ${esc(String((d.mail && d.mail.datum) || d.verzonden || '').slice(0, 10))}">✉</span>` : d.status === 'concept' ? '' : '<span class="dxenv" title="Nog niet verzonden">✉</span>';
  return `<div class="dxhead"><h1>${titel}</h1><span class="sp"></span><div class="row wrap dxknop">${knoppen}</div></div>
  <div class="c dxcard">
    <div class="row" style="gap:10px;margin-bottom:12px"><div class="dxzoek"><span>🔍</span><input placeholder="Zoeken" value="${esc(filt.q || '')}" oninput="filt.q=this.value;filt.pg=1;clearTimeout(window._ft);window._ft=setTimeout(R,250)"></div><button class="b2o" onclick="dxFilters('${type}')">⚲ Filters${dxFilterActief() ? ' •' : ''}</button></div>
    ${fchips.length ? `<div class="chips">${fchips.map(([t, k]) => `<button class="chip on" onclick="${k};filt.pg=1;R()">${esc(t)} ✕</button>`).join('')}</div>` : ''}
    <div class="dxt-d" style="overflow:auto"><table class="t dxt"><tr><th>${nrK}</th><th>Klant</th><th>Datum</th><th>Vervaldatum</th><th class="r">Excl. btw</th><th class="r">Incl. btw</th><th>Status</th><th class="c0">Verzonden</th><th class="c0">Acties</th></tr>
    ${blad.map((d) => { const t = C.totalen(d); return `<tr class="cl" onclick="go('doc','${d.id}')"><td class="nw"><a class="dxnr">${esc(d.nr || 'concept')}</a>${d.type === 'voorschot' ? ' <span class="tag n">voorschot</span>' : ''}${d.online && d.online.status === 'open' ? ' <span class="tag" title="Online ter goedkeuring">🔗</span>' : ''}</td><td>${esc(d.klant && d.klant.naam)}</td><td class="nw">${dt(d.datum)}</td><td class="nw">${d.type !== 'creditnota' || d.verval ? dt(d.verval) : ''}</td><td class="r tab nw">${eur(t.ex)}</td><td class="r tab nw">${eur(t.inc)}</td><td>${dxChip(d)}</td><td class="c0">${verzIc(d)}</td><td class="c0"><button class="dxdots" onclick="event.stopPropagation();dxRijMenu(event,'${d.id}')" aria-label="Meer acties">⋮</button></td></tr>`; }).join('') || `<tr><td colspan="9" class="mu" style="padding:18px">Niets gevonden in ${filt.jaar}${dxFilterActief() || filt.q ? ' met deze filters' : ''}.</td></tr>`}
    ${blad.length ? `<tr class="dxsom"><td colspan="4"><b>Totaal van de pagina</b></td><td class="r tab nw"><b>${eur(sum.ex)}</b></td><td class="r tab nw"><b>${eur(sum.inc)}</b></td><td colspan="3"></td></tr>` : ''}</table></div>
    <div class="dxt-m">${blad.map((d) => `<div class="dxrm" onclick="go('doc','${d.id}')"><div class="a"><b>${esc((d.klant && d.klant.naam) || '—')}</b><b class="tab">${eur(C.totalen(d).inc)}</b></div><div class="b"><span class="mu">${esc(d.nr || 'concept')} · ${dt(d.datum).slice(0, 5)}</span>${dxChip(d)}</div></div>`).join('') || `<p class="mu">Niets gevonden in ${filt.jaar}.</p>`}</div>
    ${dxPager(l.length)}
  </div>`;
};
function dxPager(n) {
  const ps = filt.ps, pgs = Math.max(1, Math.ceil(n / ps)), pg = filt.pg || 1; const van = n ? (pg - 1) * ps + 1 : 0, tot = Math.min(n, pg * ps);
  return `<div class="dxpager"><span class="mu">Aantal per pagina:</span><select onchange="filt.ps=+this.value;dxLSset('ps',filt.ps);filt.pg=1;R()">${[10, 25, 50, 100].map((x) => `<option ${x === ps ? 'selected' : ''}>${x}</option>`).join('')}</select><span class="mu">${van}-${tot} van ${n}</span>
  <button class="lnk" ${pg <= 1 ? 'disabled' : ''} onclick="filt.pg=1;R()">«</button><button class="lnk" ${pg <= 1 ? 'disabled' : ''} onclick="filt.pg=${pg - 1};R()">‹</button><b>${pg}</b><button class="lnk" ${pg >= pgs ? 'disabled' : ''} onclick="filt.pg=${pg + 1};R()">›</button><button class="lnk" ${pg >= pgs ? 'disabled' : ''} onclick="filt.pg=${pgs};R()">»</button></div>`;
}
function dxRijMenu(ev, id) {
  const d = S.docs.find((x) => x.id === id); if (!d) return; const c = d.status === 'concept';
  const open = `go('doc','${id}')`;
  const items = d.type === 'offerte' ? [
    ['Bewerken', `window._dxEdit='${id}';WZ['${id}']={stap:3};${open}`, { dis: RO }], ['Dupliceren', `cur='${id}';dupliceer()`, { dis: RO }], ['Downloaden', `dxDownload('${id}')`],
    ['Factuur aanmaken', `cur='${id}';offerteNaar('factuur')`, { dis: RO || c }], ['Facturen bekijken', `filt.bron='${id}';filt.pg=1;go('facturen')`], ['Verwijderen', `dxWeg('${id}')`, { red: 1, dis: RO }]
  ] : [
    ['Bewerken', open, { dis: RO || !c, sub: !c ? 'definitief: corrigeer met een creditnota' : '' }], ['Dupliceren', `cur='${id}';dupliceer()`, { dis: RO }], ['Downloaden', `dxDownload('${id}')`],
    isFactuur(d) && ['Creditnota aanmaken', `maakCreditnota('${id}')`, { dis: RO || c }], isFactuur(d) && ["Bekijk creditnota's", `filt.cnRef='${id}';filt.pg=1;go('creditnotas')`],
    ['Verwijderen', `dxWeg('${id}')`, { red: 1, dis: RO || !c, sub: !c ? 'enkel concepten' : '' }]
  ];
  dxMenu(ev, items);
}
async function dxDownload(id) { const d = S.docs.find((x) => x.id === id); toast('PDF maken…', 1200); const b = await pdfVan(d); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = VET_PDF.naam(d); a.click(); }
function dxWeg(id) {
  const d = S.docs.find((x) => x.id === id); if (!d) return;
  if (d.status !== 'concept' && d.type !== 'offerte') return alert('Een definitieve ' + TYPENAAM[d.type].toLowerCase() + ' kan je niet verwijderen. Maak een creditnota.');
  if (!confirm(TYPENAAM[d.type] + ' ' + (d.nr || '(concept)') + ' verwijderen?')) return;
  S.docs = S.docs.filter((x) => x !== d); window.CLOUD && CLOUD.markDeleted('office', 'doc', d.id); save(); go(DXLIJST[d.type]);
}
function dxFilters(type) {
  const tab = window._dxft || 'periode'; const klanten = [...new Map(S.docs.filter((d) => (type === 'factuur' ? isFactuur(d) : d.type === type) && d.klant && d.klant.naam).map((d) => [d.klant.id || d.klant.naam, d.klant.naam])).entries()].sort((a, b) => a[1].localeCompare(b[1]));
  const sts = [...new Set(S.docs.filter((d) => (type === 'factuur' ? isFactuur(d) : d.type === type)).map((d) => dxStatus(d).s))];
  window._dxf = JSON.parse(JSON.stringify(DXF));
  const m = modal(`<div class="dxfilt"><h2 style="color:var(--tx);font-size:17px">Filters</h2><div class="dxfgrid"><div class="dxftabs">${[['klant', '👤 Klant'], ['periode', '📅 Periode'], ['status', '☰ Status']].map(([k, t]) => `<button class="${tab === k ? 'on' : ''}" onclick="window._dxft='${k}';dxFiltTab('${k}')">${t}</button>`).join('')}</div>
    <div class="dxfbody">
      <div data-t="klant" ${tab !== 'klant' ? 'hidden' : ''}><b>Filter op klant</b><select style="margin-top:8px" onchange="_dxf.klant=this.value"><option value="">Alle klanten</option>${klanten.map(([id, n]) => `<option value="${esc(id)}" ${DXF.klant === id ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></div>
      <div data-t="periode" ${tab !== 'periode' ? 'hidden' : ''}><div class="cols"><div><b>Filter op periode</b><label class="f" style="margin-top:8px"><span>Van</span><input type="date" value="${DXF.van}" onchange="_dxf.van=this.value"></label><label class="f"><span>Tot</span><input type="date" value="${DXF.tot}" onchange="_dxf.tot=this.value"></label></div>
        <div><b>Filter op kwartaal</b><div class="dxkw" style="margin-top:8px">${[1, 2, 3, 4].map((k) => `<button class="${DXF.kw === k ? 'on' : ''}" onclick="_dxf.kw=_dxf.kw===${k}?0:${k};this.parentElement.querySelectorAll('button').forEach((b,i)=>b.classList.toggle('on',_dxf.kw===i+1))">${k}</button>`).join('')}</div></div></div></div>
      <div data-t="status" ${tab !== 'status' ? 'hidden' : ''}><b>Filter op status</b>${sts.map((s) => `<label class="row" style="gap:8px;margin-top:8px"><input type="checkbox" style="width:auto;margin:0" ${DXF.st.includes(s) ? 'checked' : ''} onchange="_dxf.st=this.checked?[..._dxf.st,'${s}']:_dxf.st.filter(x=>x!=='${s}')"> ${dxStatusNaam(s)}</label>`).join('')}</div>
    </div></div>
    <div class="row" style="margin-top:14px"><button class="lnk" onclick="Object.assign(DXF,{klant:'',van:'',tot:'',kw:0,st:[]});filt.pg=1;sluit();R()">Alles wissen</button><span class="sp"></span><button class="b2o" onclick="sluit()">Annuleren</button><button onclick="Object.assign(DXF,_dxf);filt.pg=1;sluit();R()">Toepassen</button></div></div>`);
  m.querySelector('.c').style.maxWidth = '680px';
}
function dxStatusNaam(s) { return ({ concept: 'Concept', open: 'Open', verzonden: 'Verzonden', betaald: 'Betaald', 'deels betaald': 'Deels betaald', vervallen: 'Te laat', gecrediteerd: 'Gecrediteerd', geannuleerd: 'Geannuleerd', definitief: 'Definitief', terugbetaald: 'Terugbetaald', aanvaard: 'Geaccepteerd', geweigerd: 'Geweigerd', gefactureerd: 'Gefactureerd' })[s] || s; }
function dxFiltTab(k) { document.querySelectorAll('.dxftabs button').forEach((b) => b.classList.toggle('on', b.getAttribute('onclick').includes(`'${k}'`))); document.querySelectorAll('.dxfbody>div').forEach((x) => { x.hidden = x.dataset.t !== k; }); }

/* ================= document: concept → "Factuur maken" in 4 stappen, definitief → bekijken ================= */
const WZ = {}; // per document: { stap, nk (nieuwe klant), betaald, via, concept }
window._dxEdit = '';
vDoc = function () {
  const d = curDoc(); if (!d) return '<p>Niet gevonden.</p>';
  if (!RO && (d.status === 'concept' || (d.type === 'offerte' && window._dxEdit === d.id))) return dxWizard(d);
  return dxDetail(d);
};
const DXSTAPPEN = ['Klantinformatie', 'Basisinformatie', 'Verkoopartikelen', 'Mededeling'];
function wz(d) { return WZ[d.id] = WZ[d.id] || { stap: d.klant && d.klant.naam ? (d.lijnen.length ? 3 : 2) : 1, nk: 0, via: 'overschrijving', concept: false }; }
function wzZet(k, val) { const d = curDoc(); wz(d)[k] = val; R(); }
function dxWizard(d) {
  const w = wz(d); const st = w.stap; const nieuw = !d.nr;
  const titel = d.type === 'offerte' ? (nieuw ? 'Offerte maken' : 'Offerte ' + d.nr + ' bewerken') : d.type === 'creditnota' ? 'Creditnota maken' : d.type === 'voorschot' ? 'Voorschotfactuur maken' : 'Factuur maken';
  const stepper = `<div class="dxsteps">${DXSTAPPEN.map((s, i) => `<div class="dxstep ${st === i + 1 ? 'on' : st > i + 1 ? 'klaar' : ''}" onclick="dxNaarStap(${i + 1})"><span class="n">${st > i + 1 ? '✓' : i + 1}</span><span class="t">${s}</span></div>`).join('<div class="dxline"></div>')}</div>`;
  const body = [dxStap1, dxStap2, dxStap3, dxStap4][st - 1](d, w);
  const knop = `<div class="row" style="margin-top:16px">${st > 1 ? `<button class="b2o" onclick="dxNaarStap(${st - 1})">Vorige</button>` : ''}<span class="sp"></span>${st < 4 ? `<button onclick="dxNaarStap(${st + 1})">Volgende</button>` : `<button onclick="dxOpslaan()">Opslaan</button>`}</div>`;
  return `<div class="dxhead"><div><h1>${titel}</h1><a class="dxback" onclick="dxAnnuleer()">← ${d.type === 'offerte' && !nieuw ? 'Terug zonder bewerken' : 'Terug naar ' + ({ facturen: 'verkoopfacturen', offertes: 'offertes', creditnotas: "creditnota's" })[DXLIJST[d.type]]}</a></div><span class="sp"></span>${d.status === 'concept' ? `<span class="tag n">concept – automatisch bewaard</span>` : ''}</div>
  <div class="c dxcard dxwiz">${stepper}<div class="dxwb">${body}</div>${knop}</div>
  ${d.bron ? `<p class="mu">Gemaakt van ${esc(d.bron.label || d.bron.app)}.</p>` : ''}`;
}
function dxAnnuleer() { const d = curDoc(); window._dxEdit = ''; go(d && d.status !== 'concept' ? 'doc' : DXLIJST[(d || {}).type || 'factuur'], d && d.status !== 'concept' ? d.id : null); }
function dxNaarStap(n) {
  const d = curDoc(); const w = wz(d);
  if (n > w.stap) { const f = dxStapFout(d, w); if (f) return alert(f); }
  w.stap = Math.max(1, Math.min(4, n)); R(); scrollTo(0, 0);
}
function dxStapFout(d, w) {
  if (w.stap === 1) {
    if (w.nk) { const k = window._nk || {}; if (!(k.n || '').trim()) return 'Vul de naam van de klant in.'; dxNieuweKlantMaak(d); return ''; }
    if (!d.klant || !d.klant.naam) return 'Kies een klant (of maak een nieuwe klant).';
  }
  if (w.stap === 2) { if (!d.datum) return 'Vul de datum in.'; if (d.type === 'creditnota' && !d.ref) return 'Kies over welke factuur deze creditnota gaat.'; }
  if (w.stap === 3 && !(d.lijnen || []).length) return 'Voeg minstens één artikel toe.';
  return '';
}
/* stap 1: klant */
function dxStap1(d, w) {
  const k = d.klant || {}; const kTxt = [k.straat, [k.pc, k.gemeente].filter(Boolean).join(' '), k.btw ? C.fmtBtw(k.btw) : ''].filter(Boolean);
  return `<div class="dxtgl"><button class="${!w.nk ? 'on' : ''}" onclick="wzZet('nk',0)">🔍 ZOEKEN</button><button class="${w.nk ? 'on' : ''}" onclick="window._nk={type:'particulier',n:''};wzZet('nk',1)">＋ NIEUWE KLANT</button></div>
  ${!w.nk ? `<div class="ac" style="max-width:460px;margin-top:14px"><label class="f"><span>Klant</span><input id="kz" autocomplete="off" placeholder="Zoek op naam, adres of btw-nummer" value="${esc(k.naam || '')}" oninput="dxKlantZoek(this)" onfocus="dxKlantZoek(this)" onblur="setTimeout(()=>{const l=this.closest('.ac').querySelector('.lst');if(l)l.style.display='none'},180)"></label><div class="lst" style="display:none"></div></div>
    ${k.naam ? `<div class="dxkl"><div><b>${esc(k.naam)}</b>${kTxt.map((x) => `<div class="mu">${esc(x)}</div>`).join('')}${k.email ? `<div class="mu">${esc(k.email)}</div>` : ''}${k.peppol ? `<div class="mu">Peppol: ${esc(k.peppol)}</div>` : ''}</div>${k.id ? `<button class="lnk" title="Klant bewerken" onclick="go('klant','${k.id}','terug:${d.id}')">✎</button>` : ''}</div>` : ''}`
    : dxNieuweKlantForm()}`;
}
function dxKlantZoek(el) {
  const box = el.closest('.ac').querySelector('.lst'); const l = klantOpties(el.value);
  box.innerHTML = l.map((k) => `<div onmousedown="klantKies('${k.id}')"><b>${esc(k.n)}</b><div class="mu">${esc([k.straat, k.pc].filter(Boolean).join(', '))}</div></div>`).join('') + `<div onmousedown="window._nk={type:'particulier',n:${esc(JSON.stringify(el.value))}};wzZet('nk',1)" style="color:var(--ac);font-weight:600">＋ Nieuwe klant${el.value ? ' "' + esc(el.value) + '"' : ''}</div>`;
  box.style.display = 'block';
}
function dxNieuweKlantForm() {
  const k = window._nk = window._nk || { type: 'particulier', n: '' }; const f = (lab, key, o = {}) => `<label class="f"><span>${lab}</span><input ${o.type ? `type="${o.type}"` : ''} value="${esc(k[key] || '')}" placeholder="${esc(o.ph || '')}" oninput="_nk['${key}']=this.value"></label>`;
  return `<div style="max-width:640px;margin-top:14px"><div class="cols"><label class="f"><span>Wie is je klant? (verplicht)</span><select onchange="_nk.type=this.value;R()">${[['particulier', 'Particulier'], ['bedrijf', 'Bedrijf (btw-plichtig)'], ['aannemer', 'Aannemer – btw verleggen']].map(([x, t]) => `<option value="${x}" ${k.type === x ? 'selected' : ''}>${t}</option>`).join('')}</select></label>${k.type !== 'particulier' ? f('Btw-nummer', 'btw', { ph: 'BE0123456789' }) : '<span></span>'}</div>
    ${f('Naam (verplicht)', 'n')}<div class="cols">${f('E-mail', 'mail', { type: 'email' })}${f('Telefoon', 'tel', { type: 'tel' })}</div>
    <div class="dxadr">${f('Straatnaam + huisnummer', 'straat')}${f('Postcode', 'pc0')}${f('Gemeente', 'gem')}</div></div>`;
}
function dxNieuweKlantMaak(d) {
  const x = window._nk; const k = { id: uid('c'), n: x.n.trim(), straat: (x.straat || '').trim(), pc: [x.pc0, x.gem].filter(Boolean).join(' ').trim(), adres: '', tel: x.tel || '', mail: x.mail || '' };
  S.klanten.push(k); S.klantx[k.id] = { type: x.type, btw: x.btw || '' }; d.klant = klantSnapshot(k);
  if (x.type === 'aannemer') d.lijnen.forEach((l) => { l.btw = 'VERL'; });
  wz(d).nk = 0; window._nk = null; save(); toast('Klant ' + k.n + ' aangemaakt');
}
/* stap 2: basisinformatie */
function dxStap2(d, w) {
  const of = d.type === 'offerte', cn = d.type === 'creditnota'; const k = d.klant || {};
  const nrVeld = !of && S.cfg.dexxter ? inp((cn ? 'Creditnotanummer' : 'Factuurnummer') + ' (zoals in Dexxter)', 'D.nr', { ph: 'bv. ' + JAAR() + '-55' }) : `<label class="f"><span>${of ? 'Offertenummer' : cn ? 'Creditnotanummer' : 'Factuurnummer'}</span><input readonly value="${esc(d.nr || volgNr(d.type).nr)}" title="Wordt toegekend bij opslaan"></label>`;
  return `<div style="max-width:640px"><div class="cols">${inp((of ? 'Offertedatum' : cn ? 'Creditnotadatum' : 'Factuurdatum') + ' (verplicht)', 'D.datum', { type: 'date', re: 1 })}${!cn ? inp(of ? 'Geldig tot' : 'Vervaldatum', 'D.verval', { type: 'date' }) : '<span></span>'}</div>
    ${!of && !cn ? `<div class="row" style="gap:6px;margin:-2px 0 10px"><span class="mu">Betaaltermijn:</span>${[0, 7, 14, 30].map((n) => `<button class="chip sm" onclick="set('D.verval',C.addDays(curDoc().datum,${n}));R()">${n ? n + ' dagen' : 'contant'}</button>`).join('')}</div>` : ''}
    <div class="cols">${nrVeld}<span></span></div>
    ${cn ? `<label class="f"><span>Betreft factuur (verplicht)</span><select onchange="cnRef(this.value)"><option value="">— kies —</option>${S.docs.filter((x) => isFactuur(x) && x.status !== 'concept' && (!k.id || !x.klant || x.klant.id === k.id || x.klant.naam === k.naam)).map((x) => `<option value="${x.id}" ${d.ref && d.ref.id === x.id ? 'selected' : ''}>${esc(x.nr)} – ${esc(x.klant && x.klant.naam)} – ${dt(x.datum)} – ${eur(C.totalen(x).inc)}</option>`).join('')}</select></label>` : ''}
    <details ${d.klantRef ? 'open' : ''} class="dxopen"><summary>▸ Referentie (optioneel)</summary><div style="margin-top:8px">${inp('Referentie van de klant (bv. bestelbon, PO-nummer, werfadres)', 'D.klantRef')}</div></details></div>`;
}
/* stap 3: verkoopartikelen */
function dxStap3(d, w) {
  const t = C.totalen(d); const art = C.r2((d.lijnen || []).reduce((s, l) => s + C.num(l.aantal) * C.num(l.prijs), 0)); const kArt = C.r2(art - t.bruto);
  const btwL = (l) => (RL.btwCodes[l.btw] || {}).label || l.btw;
  const korting = (l) => C.num(l.korting) ? C.num(l.korting) + '%' : '€ 0,00';
  return `<div class="dxt-d" style="overflow:auto">${(d.lijnen || []).length ? `<table class="t dxlt"><tr><th>Naam</th><th class="r">Prijs excl. btw</th><th class="r">Aantal</th><th>Eenheid</th><th class="r">Korting</th><th class="r">Totaal excl. btw</th><th class="r">Btw</th><th class="r">Totaal incl. btw</th><th></th></tr>
    ${d.lijnen.map((l, i) => `<tr><td><b>${esc(l.oms || '—')}</b>${l.det ? `<div class="mu" style="white-space:pre-line">${esc(l.det)}</div>` : ''}</td><td class="r tab nw">${eur(l.prijs)}</td><td class="r tab">${esc(String(l.aantal).replace('.', ','))}</td><td>${esc(l.eenheid)}</td><td class="r tab nw">${korting(l)}</td><td class="r tab nw"><b>${eur(C.lijnEx(l))}</b></td><td class="r nw">${esc(btwL(l))}</td><td class="r tab nw"><b>${eur(C.lijnInc(l))}</b></td><td class="nw"><button class="lnk" title="Bewerken" onclick="dxArt(${i})">✎</button><button class="lnk" title="Verwijderen" onclick="lijnWeg(${i})">🗑</button>${i ? `<button class="lnk" title="Omhoog" onclick="dxLijnOp(${i})">↑</button>` : ''}</td></tr>`).join('')}</table>` : ''}</div>
  <div class="dxt-m">${(d.lijnen || []).map((l, i) => `<div class="dxrm" onclick="dxArt(${i})"><div class="a"><b>${esc(l.oms || '—')}</b><b class="tab">${eur(C.lijnInc(l))}</b></div><div class="b"><span class="mu">${esc(String(l.aantal).replace('.', ','))} ${esc(l.eenheid)} × ${eur(l.prijs)} · ${esc(btwL(l))}</span><button class="lnk" onclick="event.stopPropagation();lijnWeg(${i})">🗑</button></div></div>`).join('')}</div>
  <div class="row wrap" style="margin:12px 0;gap:8px"><button class="b2o" onclick="dxArt(-1)">＋ Artikel toevoegen</button><button class="b2o" onclick="werkurenAdd()">＋ Werkuren</button>${d.type === 'factuur' ? `<button class="b2o" onclick="voorschotVerrekenen()">Voorschot verrekenen</button>` : ''}<span class="sp"></span>
    ${(d.lijnen || []).length ? `<label class="f" style="margin:0;max-width:200px"><span>Globale korting</span><div class="row" style="gap:4px"><input id="gk" inputmode="decimal" style="margin:0" value="${w.kE ? esc(C.r2(t.korting)) : esc(d.korting || 0)}" onchange="dxGlobKort(this.value)"><button class="chip sm ${w.kE ? 'on' : ''}" onclick="wz(curDoc()).kE=1;R()">€</button><button class="chip sm ${!w.kE ? 'on' : ''}" onclick="wz(curDoc()).kE=0;R()">%</button></div></label>` : ''}</div>
  ${(d.lijnen || []).length ? `<div class="tot dxtot"><div><span>Totaal artikelen</span><span class="tab">${eur(art)}</span></div><div><span>Korting op de artikelen</span><span class="tab">${eur(kArt)}</span></div><div><span>Globale korting</span><span class="tab">${eur(t.korting)}</span></div><div><span><b>Totaal excl. btw</b></span><b class="tab">${eur(t.ex)}</b></div>${t.groepen.map((g) => `<div class="mu"><span>Btw ${esc((RL.btwCodes[g.code] || {}).label)} op ${eur(g.basis)}</span><span class="tab">${eur(g.btw)}</span></div>`).join('')}<div><span>Totaal btw</span><span class="tab">${eur(t.btw)}</span></div><div class="big"><span>Totaal incl. btw</span><span class="tab">${eur(t.inc)}</span></div></div>` : '<p class="mu">Nog geen artikelen. Klik op "Artikel toevoegen".</p>'}`;
}
function dxLijnOp(i) { const d = curDoc(); const l = d.lijnen.splice(i, 1)[0]; d.lijnen.splice(i - 1, 0, l); save(); R(); }
function dxGlobKort(val) { const d = curDoc(); const w = wz(d); const t = C.totalen(d); const x = C.num(val); d.korting = w.kE ? (t.bruto ? C.r2(x / t.bruto * 100 * 10000) / 10000 : 0) : x; save(); R(); }
/* dialoog "Artikel toevoegen" */
function dxArt(i) {
  const d = curDoc(); const l = i >= 0 ? d.lijnen[i] : lijnNieuw(); window._al = { i, l: JSON.parse(JSON.stringify(l)), kE: 0, opslaan: false };
  const btwOpts = Object.entries(RL.btwCodes).filter(([k]) => S.cfg.btwRegime === 'kleine' ? k === 'KO' : k !== 'KO');
  const eenh = [...new Set(['stuks', 'uren', 'm', 'm²', 'forfait', 'km', 'kg', 'l', 'dagen', ...(S.artikels || []).map((a) => a.u).filter(Boolean)])];
  const m = modal(`<div class="row"><h2 style="color:var(--tx);font-size:17px;margin:0">${i >= 0 ? 'Artikel bewerken' : 'Artikel toevoegen'}</h2><span class="sp"></span><button class="lnk" onclick="sluit()">✕</button></div>
  <div class="dxartg" style="margin-top:12px">
    <label class="f g2"><span>Naam (verplicht)</span><input id="al_n" list="dxartl" value="${esc(l.oms)}" oninput="_al.l.oms=this.value" onchange="dxArtKies(this.value)" autocomplete="off"></label>
    <label class="f"><span>Aantal (verplicht)</span><input id="al_a" inputmode="decimal" value="${esc(String(l.aantal).replace('.', ','))}" oninput="_al.l.aantal=C.num(this.value);dxArtCalc()"></label>
    <label class="f"><span>Eenheid</span><input id="al_u" list="dxeenh" value="${esc(l.eenheid)}" oninput="_al.l.eenheid=this.value"></label>
    <label class="f"><span>Prijs excl. btw (verplicht)</span><input id="al_p" inputmode="decimal" value="${esc(String(l.prijs).replace('.', ','))}" oninput="_al.l.prijs=C.num(this.value);dxArtCalc('ex')"></label>
    <label class="f"><span>Btw-tarief (verplicht)</span><select id="al_b" onchange="_al.l.btw=this.value;dxArtCalc('ex')">${btwOpts.map(([k, c]) => `<option value="${k}" ${String(l.btw) === k ? 'selected' : ''}>${esc(c.label)}</option>`).join('')}</select></label>
    <label class="f"><span>Prijs incl. btw (verplicht)</span><input id="al_pi" inputmode="decimal" oninput="dxArtCalc('inc',this.value)"></label>
    <label class="f"><span>Korting</span><div class="row" style="gap:4px"><input id="al_k" inputmode="decimal" style="margin:0" value="${esc(String(l.korting || 0).replace('.', ','))}" oninput="dxArtCalc('k',this.value)"><button id="al_ke" class="chip sm" onclick="_al.kE=1;dxArtKE()">€</button><button id="al_kp" class="chip sm on" onclick="_al.kE=0;dxArtKE()">%</button></div></label>
    <label class="f g4"><span>Beschrijving</span><textarea id="al_d" rows="4" oninput="_al.l.det=this.value">${esc(l.det || '')}</textarea></label>
  </div>
  <datalist id="dxartl">${(S.artikels || []).filter((a) => a.n).map((a) => `<option value="${esc(a.n)}">${a.p != null ? eur(a.p) : ''}</option>`).join('')}</datalist><datalist id="dxeenh">${eenh.map((u) => `<option value="${esc(u)}">`).join('')}</datalist>
  <div class="row wrap" style="margin-top:4px"><label class="row" style="gap:8px"><input type="checkbox" style="width:auto;margin:0" onchange="_al.opslaan=this.checked"> Verkoopartikel opslaan (in je artikellijst)</label><span class="sp"></span><div class="tot" style="min-width:220px"><div><span>Totaal excl. btw</span><b id="al_tx" class="tab"></b></div><div><span>Totaal incl. btw</span><b id="al_ti" class="tab"></b></div></div></div>
  <div class="row" style="margin-top:12px"><span class="sp"></span><button class="b2o" onclick="sluit()">Annuleren</button><button onclick="dxArtOk()">${i >= 0 ? 'Opslaan' : 'Artikel toevoegen'}</button></div>`);
  m.querySelector('.c').style.maxWidth = '820px'; dxArtCalc(); setTimeout(() => { const e = $('#al_n'); if (e && i < 0) e.focus(); }, 30);
}
function dxArtKies(naam) {
  const a = (S.artikels || []).find((x) => x.n === naam); if (!a) return; const l = _al.l;
  if (a.p != null) l.prijs = C.num(a.p); if (a.u) l.eenheid = a.u === 'stuk' ? 'stuks' : a.u === 'uur' ? 'uren' : a.u; if (a.det) l.det = a.det; if (a.btw) l.btw = a.btw;
  $('#al_p').value = String(l.prijs).replace('.', ','); $('#al_u').value = l.eenheid; $('#al_d').value = l.det || ''; $('#al_b').value = String(l.btw); dxArtCalc('ex');
}
function dxArtKE() { $('#al_ke').classList.toggle('on', !!_al.kE); $('#al_kp').classList.toggle('on', !_al.kE); $('#al_k').value = _al.kE ? String(C.r2(C.num(_al.l.aantal) * C.num(_al.l.prijs) * C.num(_al.l.korting) / 100)).replace('.', ',') : String(_al.l.korting || 0).replace('.', ','); }
function dxArtCalc(bron, val) {
  const l = _al.l; const pct = (RL.btwCodes[l.btw] || {}).pct || 0;
  if (bron === 'inc') { l.prijs = C.r2(C.num(val) / (1 + pct / 100) * 10000) / 10000; $('#al_p').value = String(C.r2(l.prijs)).replace('.', ','); }
  if (bron === 'k') { const x = C.num(val); const br = C.num(l.aantal) * C.num(l.prijs); l.korting = _al.kE ? (br ? x / br * 100 : 0) : x; }
  if (bron !== 'inc') { const e = $('#al_pi'); if (e) e.value = String(C.r2(C.num(l.prijs) * (1 + pct / 100))).replace('.', ','); }
  const tx = $('#al_tx'), ti = $('#al_ti'); if (tx) tx.textContent = eur(C.lijnEx(l)); if (ti) ti.textContent = eur(C.lijnInc(l));
}
function dxArtOk() {
  const a = window._al; const l = a.l; l.oms = ($('#al_n').value || '').trim(); l.eenheid = $('#al_u').value || 'stuks'; l.det = $('#al_d').value;
  if (!l.oms) return alert('Vul de naam van het artikel in.'); if (!C.num(l.aantal)) return alert('Vul het aantal in.');
  const d = curDoc(); if (a.i >= 0) d.lijnen[a.i] = l; else d.lijnen.push(l);
  if (a.opslaan) { S.artikels = S.artikels || []; const bestaand = S.artikels.find((x) => x.n === l.oms); const art = { n: l.oms, p: C.num(l.prijs), u: l.eenheid, det: l.det, btw: l.btw }; if (bestaand) Object.assign(bestaand, art); else S.artikels.push(art); toast('Verkoopartikel bewaard'); }
  sluit(); save(); R();
}
/* stap 4: mededeling + afronden */
function dxStap4(d, w) {
  const f = isFactuur(d); const verm = vermeldingen(d);
  return `<div style="max-width:760px">${inp('Mededeling (komt onderaan op het document)', 'D.opm', { area: 1, rows: 5 })}
    ${verm.length ? `<div class="mu" style="margin:-2px 0 10px">Wordt automatisch toegevoegd (wettelijke vermeldingen):<ul style="margin:4px 0 0 18px;padding:0">${verm.map((x) => `<li>${esc(x.slice(0, 120))}${x.length > 120 ? '…' : ''}</li>`).join('')}</ul></div>` : ''}
    <label class="f"><span>Bijlagen</span></label><div class="dxbij">${(d.bijlagen || []).map((b, i) => `<div class="dl"><span>${b.soort === 'werkbon' ? '🔧' : b.soort === 'attest' ? '🔥' : '📎'} ${esc(b.naam)}</span><span class="row"><button class="lnk sm" onclick="bestandOpen(curDoc().bijlagen[${i}].ref)">👁</button><button class="lnk sm" onclick="curDoc().bijlagen.splice(${i},1);save();R()">✕</button></span></div>`).join('')}<label class="dxupl">＋ Bijlage(n) uploaden<input type="file" multiple accept="application/pdf,image/*" style="display:none" onchange="[...this.files].forEach(x=>bijlageDoc(x))"></label></div>
    ${f && d.type !== 'creditnota' ? `<label class="row dxchk"><input type="checkbox" ${w.betaald ? 'checked' : ''} onchange="wzZet('betaald',this.checked)"> ${d.type === 'voorschot' ? 'Voorschot' : 'Factuur'} is al betaald</label>${w.betaald ? `<div class="row" style="gap:8px;margin:0 0 6px 30px"><span class="mu">Betaald via</span><select style="width:auto;margin:0" onchange="wz(curDoc()).via=this.value">${['cash', 'overschrijving', 'bancontact / payconiq'].map((x) => `<option ${w.via === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>` : ''}
      <label class="row dxchk"><input type="checkbox" ${d.qr !== false ? 'checked' : ''} onchange="set('D.qr',this.checked)"> QR-betaalcode toevoegen</label>` : ''}
    ${d.status === 'concept' ? `<label class="row dxchk"><input type="checkbox" ${w.concept ? 'checked' : ''} onchange="wzZet('concept',this.checked)"> Concept <span class="mu">(nog niet definitief: krijgt nog geen nummer en kan nog gewijzigd worden)</span></label>` : ''}
    ${f ? `<label class="f" style="margin-top:8px"><span>Gestructureerde mededeling</span><input readonly value="${esc(d.ogm || 'wordt aangemaakt bij opslaan')}"></label>` : ''}
    <div class="dxsam"><b>${esc((d.klant || {}).naam || '')}</b><span class="mu">${(d.lijnen || []).length} artikel(en)</span><span class="sp"></span><span class="mu">Totaal incl. btw</span><b class="tab">${eur(C.totalen(d).inc)}</b></div></div>`;
}
async function dxOpslaan() {
  const d = curDoc(); const w = wz(d);
  if (d.type === 'offerte' && d.status !== 'concept') { window._dxEdit = ''; delete WZ[d.id]; await save(); R(); toast('Offerte opgeslagen'); return; }
  if (w.concept) { await save(); toast('Concept opgeslagen'); delete WZ[d.id]; go(DXLIJST[d.type]); return; }
  await definitief();
  if (d.status === 'concept') return; // controle niet in orde of geannuleerd
  if (w.betaald && isFactuur(d)) { const t = C.totalen(d); d.betalingen = d.betalingen || []; if (t.open > 0) d.betalingen.push({ datum: d.datum, bedrag: t.open, via: w.via || 'overschrijving' }); d.status = 'betaald'; await save(); }
  delete WZ[d.id]; R();
}

/* ---------- document bekijken (zoals Dexxter: voorbeeld links, status/verzendingen/bijlagen rechts) ---------- */
function dxDetail(d) {
  const t = C.totalen(d); const st = dxStatus(d); const of = d.type === 'offerte', cn = d.type === 'creditnota', f = isFactuur(d);
  dxMenusVoor(d); const verz = dxM.verz.filter(Boolean), stMenu = dxM.st;
  const verzLijst = [d.peppol && `<div class="dxvz"><span class="ic">⇄</span><div><b>${dt(String(d.peppol.datum || '').slice(0, 10))}</b><div class="mu">Verstuurd via Peppol naar ${esc(d.peppol.naar || '')} · ${esc(d.peppol.status || '')}</div></div></div>`, d.mail && `<div class="dxvz"><span class="ic">✉</span><div><b>${dt(String(d.mail.datum || '').slice(0, 10))}</b><div class="mu">Verstuurd via e-mail naar ${esc(d.mail.naar || '')}</div></div></div>`, !d.mail && !d.peppol && d.verzonden && `<div class="dxvz"><span class="ic">✉</span><div><b>${dt(String(d.verzonden).slice(0, 10))}</b><div class="mu">Gemarkeerd als verzonden</div></div></div>`, ...(d.herinneringen || []).map((h) => `<div class="dxvz"><span class="ic">⏰</span><div><b>${dt(String(h.datum || '').slice(0, 10))}</b><div class="mu">${esc(h.soort || 'Herinnering')}${h.naar ? ' naar ' + esc(h.naar) : ''}</div></div></div>`)].filter(Boolean);
  return `<div class="dxhead"><div><h1>${DXTITEL[d.type]} ${esc(d.nr)}</h1><a class="dxback" onclick="go('${DXLIJST[d.type]}')">← Terug</a></div><span class="sp"></span>${verz.length ? `<button class="b2o" onclick="dxMenu(event,dxM.verz)">Verzenden ▾</button>` : ''}<button class="b2o" onclick="dxMenu(event,dxM.act)">Acties ▾</button></div>
  <div class="dxdet"><div class="dxpvw"><div id="dxpv" class="dxpv"><div class="mu" style="padding:30px;text-align:center">Voorbeeld laden…</div></div></div>
  <div class="dxside">
    <div class="c"><h3>Status</h3><button class="dxst ${st.c}" ${stMenu.filter(Boolean).length ? 'onclick="dxMenu(event,dxM.st)"' : ''}>${st.i} ${st.t} ${stMenu.filter(Boolean).length ? '▾' : ''}</button>
      ${f && !cn ? `<div class="dl" style="margin-top:8px"><span class="mu">Totaal</span><b class="tab">${eur(t.inc)}</b></div>${t.betaald ? `<div class="dl"><span class="mu">Betaald</span><span class="tab">${eur(t.betaald)}</span></div>` : ''}<div class="dl"><span class="mu">Nog open</span><b class="tab">${eur(Math.max(0, t.open))}</b></div><div class="dl"><span class="mu">Vervaldatum</span><span>${dt(d.verval)}</span></div>` : ''}
      ${of ? `<div class="dl" style="margin-top:8px"><span class="mu">Totaal</span><b class="tab">${eur(t.inc)}</b></div><div class="dl"><span class="mu">Geldig tot</span><span>${dt(d.verval)}</span></div>` : ''}
      ${cn && d.ref ? `<div class="dl" style="margin-top:8px"><span class="mu">Op factuur</span><a class="lnk" onclick="go('doc','${d.ref.id}')">${esc(d.ref.nr)}</a></div>` : ''}</div>
    ${f && (d.betalingen || []).length ? `<div class="c"><h3>Betalingen</h3>${d.betalingen.map((b, i) => `<div class="dl"><span>${dt(b.datum)} · ${esc(b.via || 'overschrijving')}</span><span class="row"><b class="tab nw">${eur(b.bedrag)}</b>${RO || b.cn ? '' : `<button class="lnk" onclick="betalingWeg(${i})">✕</button>`}</span></div>`).join('')}</div>` : ''}
    <div class="c"><h3>Verzendingen</h3>${verzLijst.join('') || '<p class="mu" style="margin:0">Nog niet verzonden.</p>'}</div>
    ${window.vOnline ? vOnline(d) : ''}${window.vHerHist ? vHerHist(d) : ''}
    <div class="c"><h3>Bijlagen</h3>${(d.bijlagen || []).map((b, i) => `<div class="dl"><span>${esc(b.naam)}</span><span class="row"><button class="lnk" title="Bekijk bestand" onclick="bestandOpen(curDoc().bijlagen[${i}].ref)">👁</button>${RO ? '' : `<button class="lnk" title="Verwijderen" onclick="curDoc().bijlagen.splice(${i},1);save();R()">✕</button>`}</span></div>`).join('') || '<p class="mu" style="margin:0 0 6px">Geen bijlagen.</p>'}${RO ? '' : `<label class="dxupl">＋ Bijlage toevoegen<input type="file" accept="application/pdf,image/*" style="display:none" onchange="bijlageDoc(this.files[0])"></label>`}</div>
    ${d.klant ? `<div class="c"><h3>Klant</h3><b>${esc(d.klant.naam)}</b><div class="mu">${esc([d.klant.straat, [d.klant.pc, d.klant.gemeente].filter(Boolean).join(' ')].filter(Boolean).join(', '))}</div>${d.klant.email ? `<div class="mu">${esc(d.klant.email)}</div>` : ''}${d.klant.id ? `<a class="lnk" style="padding:0" onclick="go('klant','${d.klant.id}')">Klantdossier openen →</a>` : ''}</div>` : ''}
    ${d.bron ? `<p class="mu">Gemaakt van ${esc(d.bron.label || d.bron.app)}.</p>` : ''}
  </div></div>`;
}
window.dxM = {};
function dxMenusVoor(d) {
  // zelfde lijsten als in dxDetail, apart opgebouwd zodat de knoppen ze kunnen openen
  const t = C.totalen(d); const st = dxStatus(d); const of = d.type === 'offerte', cn = d.type === 'creditnota', f = isFactuur(d); const pid = d.klant && (d.klant.peppol || C.peppolId(d.klant.btw));
  dxM.verz = RO ? [] : of ? [['✉ Verstuur via e-mail', 'verstuur()'], window.offerteLink && (d.online && d.online.status === 'open' ? ['🔗 Online link bekijken', 'offerteLinkToon()'] : ['🔗 Online laten goedkeuren', 'offerteLink()', { sub: 'klant keurt goed met één klik' }])]
    : [['Verstuur via Peppol', S.cfg.dexxter ? "alert('Dexxter-modus: verstuur via Peppol in Dexxter. Uitschakelen kan in Instellingen › Dexxter.')" : pid ? 'peppolVerstuur()' : "alert('Deze klant heeft geen btw-nummer of Peppol-ID (particulier): verstuur per e-mail.')", { sub: 'Enkel naar Belgische bedrijven' }], ['Nieuwe e-mail versturen', 'verstuur()'], f && !cn && ['Betaalherinnering versturen', window.herinnerKan && herinnerKan(d) ? 'herinnering()' : "alert('Er kan pas een herinnering gestuurd worden als de vervaldatum voorbij is en de factuur nog openstaat.')"]];
  dxM.act = RO ? [['Downloaden', `dxDownload('${d.id}')`]] : of ? [['Bewerken', `window._dxEdit='${d.id}';WZ['${d.id}']={stap:3};R()`], ['Dupliceren', 'dupliceer()'], ['Downloaden', `dxDownload('${d.id}')`], ['Factuur aanmaken', "offerteNaar('factuur')"], ['Voorschotfactuur aanmaken', "offerteNaar('voorschot')"], ['Facturen bekijken', `filt.bron='${d.id}';filt.pg=1;go('facturen')`], ['Verwijderen', `dxWeg('${d.id}')`, { red: 1 }]]
    : [['Bewerken', "alert('Deze ' + TYPENAAM[curDoc().type].toLowerCase() + ' is definitief en kan wettelijk niet meer gewijzigd worden. Maak een creditnota en daarna een nieuwe factuur (Dupliceren).')", { sub: 'definitief: via creditnota' }], ['Dupliceren', 'dupliceer()'], ['Downloaden', `dxDownload('${d.id}')`], f && ['Creditnota aanmaken', `maakCreditnota('${d.id}')`], f && ["Bekijk creditnota's", `filt.cnRef='${d.id}';filt.pg=1;go('creditnotas')`], d.archief && ['Archief: origineel PDF', "archiefOpen('pdf')"], d.archief && ['Archief: UBL (Peppol-XML)', "archiefOpen('ubl')"]];
  dxM.st = (RO ? [] : of ? [['Markeer verzonden', "dxOfSt('verzonden')"], ['Markeer geaccepteerd door klant', "dxOfSt('aanvaard')"], ['Markeer geweigerd door klant', "dxOfSt('geweigerd')"], ['Markeer gefactureerd', "dxOfSt('gefactureerd')"]]
    : cn ? [['Markeer terugbetaald', "set('D.status','betaald');R()"], ['Markeer niet terugbetaald', "set('D.status','open');R()"]]
      : [!afgehandeld(d) && ['Betaling registreren', 'betaling()', { sub: 'deel of volledig bedrag, met datum' }], !afgehandeld(d) && ['Markeer betaald', 'dxBetaald()'], st.s === 'betaald' && (d.betalingen || []).some((b) => !b.cn) && ['Markeer niet betaald', 'dxNietBetaald()'], d.verzonden ? ['Markeer niet verzonden', 'dxVerz(0)'] : ['Markeer verzonden', 'dxVerz(1)'], !afgehandeld(d) && ['Markeer gecrediteerd', `maakCreditnota('${d.id}')`, { sub: 'maakt een creditnota' }]]).filter(Boolean);
  return t;
}
function dxOfSt(s) { const d = curDoc(); d.status = s; if (s === 'verzonden' && !d.verzonden) d.verzonden = new Date().toISOString(); save(); R(); }
function dxBetaald() { const d = curDoc(); const t = C.totalen(d); d.betalingen = d.betalingen || []; if (t.open > 0) d.betalingen.push({ datum: today(), bedrag: t.open, via: 'overschrijving' }); d.status = 'betaald'; save(); R(); toast('Gemarkeerd als betaald'); }
function dxNietBetaald() { const d = curDoc(); d.betalingen = (d.betalingen || []).filter((b) => b.cn); d.status = 'open'; save(); R(); }
function dxVerz(on) { const d = curDoc(); d.verzonden = on ? new Date().toISOString() : null; if (!on) { d.mail = null; } save(); R(); }
/* voorbeeld van het document: de echte PDF, getekend met pdf.js */
let dxPvTok = 0;
async function dxVoorbeeld() {
  const d = curDoc(); const box = $('#dxpv'); if (!d || !box) return; const tok = ++dxPvTok;
  try {
    const blob = await pdfVan(d); await laadPdfjs(); if (tok !== dxPvTok) return;
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(await blob.arrayBuffer()), isEvalSupported: false }).promise; if (tok !== dxPvTok) return;
    box.innerHTML = ''; const w = Math.min(box.clientWidth || 800, 1000);
    for (let p = 1; p <= pdf.numPages; p++) {
      const pg = await pdf.getPage(p); const vp0 = pg.getViewport({ scale: 1 }); const sc = w / vp0.width; const dpr = Math.min(2, devicePixelRatio || 1); const vp = pg.getViewport({ scale: sc * dpr });
      const c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height; c.style.width = '100%'; await pg.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise; if (tok !== dxPvTok) return; box.appendChild(c);
    }
  } catch (e) { console.warn(e); if (tok === dxPvTok) box.innerHTML = `<div class="mu" style="padding:20px">Voorbeeld kon niet getoond worden. <button class="b2o sm" onclick="toonPdf()">PDF openen</button></div>`; }
}

/* ================= klanten (zoals Dexxter: lijst met ⋮) ================= */
vKlanten = function () {
  const q = (filt.q || '').toLowerCase();
  const l = S.klanten.filter((k) => !q || [k.n, k.straat, k.pc, k.tel, k.mail, (S.klantx[k.id] || {}).btw].join(' ').toLowerCase().includes(q)).sort((a, b) => (a.n || '').localeCompare(b.n || ''));
  const ps = filt.ps, pgs = Math.max(1, Math.ceil(l.length / ps)); if ((filt.pg || 1) > pgs) filt.pg = pgs; const blad = l.slice(((filt.pg || 1) - 1) * ps, (filt.pg || 1) * ps);
  const ic = (k) => ['bedrijf', 'aannemer'].includes((S.klantx[k.id] || {}).type) ? '🏢' : '👤';
  return `<div class="dxhead"><h1>Klanten</h1><span class="sp"></span>${RO ? '' : `<button onclick="klantNieuw()">＋ Klant toevoegen</button>`}</div>
  <div class="c dxcard"><div class="row" style="margin-bottom:12px"><div class="dxzoek"><span>🔍</span><input placeholder="Zoeken" value="${esc(filt.q || '')}" oninput="filt.q=this.value;filt.pg=1;clearTimeout(window._ft);window._ft=setTimeout(R,250)"></div></div>
  <div class="dxt-d" style="overflow:auto"><table class="t dxt"><tr><th>Naam</th><th>Ondernemingsnummer</th><th>E-mail</th><th>Telefoon</th><th>Adres</th><th class="c0"></th></tr>
  ${blad.map((k) => { const x = S.klantx[k.id] || {}; return `<tr class="cl" onclick="go('klant','${k.id}')"><td><span class="mu">${ic(k)}</span> <a class="dxnr">${esc(k.n || '(zonder naam)')}</a></td><td class="nw">${esc(x.btw ? C.fmtBtw(x.btw) : '')}</td><td>${k.mail || x.email ? `<a href="mailto:${esc(x.email || k.mail)}" onclick="event.stopPropagation()">${esc(x.email || k.mail)}</a>` : '-'}</td><td class="nw">${k.tel ? `<a href="tel:${esc(k.tel)}" onclick="event.stopPropagation()">${esc(k.tel)}</a>` : '-'}</td><td>${esc(k.straat || '')}<div>${esc(k.pc || '')}</div></td><td class="c0"><button class="dxdots" onclick="event.stopPropagation();dxKlantMenu(event,'${k.id}')">⋮</button></td></tr>`; }).join('') || '<tr><td colspan="6" class="mu" style="padding:16px">Geen klanten gevonden.</td></tr>'}</table></div>
  <div class="dxt-m">${blad.map((k) => `<div class="dxrm" onclick="go('klant','${k.id}')"><div class="a"><b>${ic(k)} ${esc(k.n || '(zonder naam)')}</b></div><div class="b"><span class="mu">${esc([k.straat, k.pc].filter(Boolean).join(', '))}</span><span class="mu">${esc(k.tel || '')}</span></div></div>`).join('')}</div>
  ${dxPager(l.length)}<p class="mu" style="margin:10px 0 0">Klanten worden gedeeld met VET Heat en VET Work.</p></div>`;
};
function dxKlantMenu(ev, id) { const snap = `klantSnapshot(S.klanten.find(x=>x.id==='${id}'))`; dxMenu(ev, [['Bewerken / klantdossier', `go('klant','${id}')`], !RO && ['Factuur maken', `nieuwDoc('factuur',{klant:${snap}})`], !RO && ['Offerte maken', `nieuwDoc('offerte',{klant:${snap}})`], !RO && ['Verwijderen', `klantWeg('${id}')`, { red: 1 }]]); }

/* ================= router: na elke weergave bovenbalk, "+"-knop en voorbeeld ================= */
const _R2 = R;
R = function () {
  if (v !== 'doc') dxPvTok++;
  _R2(); topR(); fabR();
  if (v === 'doc') { const d = curDoc(); if (d && !$('.dxwiz')) dxVoorbeeld(); }
};
const _go0 = go;
go = function (nv, id, s) {
  if (nv !== 'doc' && nv !== window._dxLijst) { filt.q = ''; filt.pg = 1; Object.assign(DXF, { klant: '', van: '', tot: '', kw: 0, st: [] }); if (nv !== 'creditnotas') filt.cnRef = ''; if (nv !== 'facturen') filt.bron = ''; }
  if (nv !== 'doc') window._dxLijst = nv;
  dxFab(0); dxMenuSluit(); _go0(nv, id, s);
};
