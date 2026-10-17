/* VET Office – werkwijze zoals Dexxter: menu, overzicht, leveranciers, dagontvangsten, voorraad */
Object.defineProperty(C, 'dagontv', { get: () => S.dagontv || [], configurable: true });

/* ---------------- menu (zelfde indeling als Dexxter + de VET-apps) ---------------- */
nav.length = 0;
nav.push(
  ['home', '🏠', 'Overzicht'],
  'Verkopen', ['werkbonnen', '🔧', 'Te factureren'], ['offertes', '📝', 'Offertes'], ['facturen', '🧾', 'Verkoopfacturen'], ['creditnotas', '↩️', "Creditnota's"], ['dagontv', '💶', 'Dagontvangsten'],
  'Aankopen', ['peppol', '📥', 'Inbox (Peppol)'], ['uitgaven', '💸', 'Kosten'], ['invest', '🛠', 'Afschrijvingen'], ['kostcats', '🏷', 'Kostencategorieën', 'instellingen', 'kostcats'],
  'Bank', ['bank', '🏦', 'Bank'],
  'Btw', ['btw', '📊', 'Btw-aangifte'], ['ic', '🇪🇺', 'IC-aangifte'], ['listing', '📋', 'Klantenlisting', 'btw', 'listing'],
  'Personenbelasting', ['pb-aangifte', '🧾', 'Aangifte', 'belasting', 'aangifte'], ['pb-overzicht', '🧮', 'Overzicht', 'belasting', 'overzicht'], ['pb-va', '💳', 'Voorafbetalingen', 'belasting', 'va'], ['voorraad', '📦', 'Voorraad'],
  'Sociaal statuut', ['pb-rsz', '🛡', 'Sociale bijdragen', 'belasting', 'rsz'],
  'Planning', ['tijdlijn', '🗓', 'Tijdlijn'],
  'Rapporten', ['rap-res', '📈', 'Inkomsten & uitgaven', 'rapport', 'resultaat'], ['rap-maand', '📆', 'Per maand', 'rapport', 'maand'], ['rap-open', '⏳', 'Openstaand', 'rapport', 'openstaand'],
  'VET-apps', ['veka', '📨', 'VEKA-meldingen'], ['attesten', '🔥', 'Attesten'], ['aanvragen', '📞', 'Aanvragen'],
  'Lijsten', ['art', '📦', 'Verkoopartikelen', 'instellingen', 'artikels'], ['wagens', '🚐', "Auto's"], ['klanten', '👥', 'Klanten'], ['leveranciers', '🏭', 'Leveranciers'],
  'Beheer', ['verz', '🛡', 'Verzekeringen'], ['instellingen', '⚙️', 'Instellingen']
);
// menu-items die naar een tabblad van een scherm gaan
sideR = function () {
  let on = v; if (v === 'doc') { const t = (curDoc() || {}).type; on = t === 'offerte' ? 'offertes' : t === 'creditnota' ? 'creditnotas' : 'facturen'; }
  else if (v === 'klant') on = 'klanten'; else if (v === 'uitgave') on = 'uitgaven';
  const sub0 = { belasting: 'overzicht', rapport: 'resultaat', instellingen: 'bedrijf' }[v];
  const hit = nav.find((n) => Array.isArray(n) && n[3] === v && n[4] === (sub || sub0)); if (hit) on = hit[0];
  $('#side').innerHTML = `<div class="brand"><img src="logo-app.png" alt="Van Eyen Technics" class="blogo"><span>VET Office</span></div>` + nav.map((n) => {
    if (n === null) return '<div style="height:8px"></div>';
    if (typeof n === 'string') return `<div class="grp">${n}</div>`;
    const c = telling(n[0]); const klik = n[3] ? `go('${n[3]}',null,'${n[4]}')` : `go('${n[0]}')`;
    return `<a class="${on === n[0] ? 'on' : ''}" onclick="${klik}"><span>${n[1]}</span>${n[2]}${c ? `<span class="cnt">${c}</span>` : ''}</a>`;
  }).join('') + `<div style="padding:14px 10px 0;font-size:12px;opacity:.7" id="cloudst">${window.CLOUDST ? CLOUDST() : ''}</div>`;
};

/* extra schermen in de router */
const _R0 = R;
R = function () {
  const extra = { leveranciers: vLeveranciers, dagontv: vDagontv, voorraad: vVoorraad };
  if (extra[v]) { sideR(); $('#app').innerHTML = extra[v](); const c2 = $('#cloudst2'); if (c2 && window.CLOUDST) c2.innerHTML = CLOUDST(); return; }
  _R0();
  if (v === 'home') dashboardBoven();
};

/* ---------------- overzicht: zoals het Dexxter-dashboard ---------------- */
function dashboardBoven() {
  const j = JAAR(); const w = winstJaar(j);
  const uit = C.r2(w.kosten + w.afschr - w.verworpen - (w.voorraadW || 0));
  const teOntv = S.docs.filter((d) => isFactuur(d) && d.status !== 'concept' && !afgehandeld(d)).reduce((s, d) => s + C.totalen(d).open, 0);
  const teBet = (S.uitgaven || []).filter((u) => !u.betaald && !u.privé).reduce((s, u) => s + (u.tarieven || []).reduce((t, x) => t + C.num(x.basis) + C.num(x.btw), 0) * (u.creditnota ? -1 : 1), 0);
  const m = Array.from({ length: 12 }, () => ({ in: 0, uit: 0 }));
  S.docs.filter((d) => d.status !== 'concept' && d.status !== 'geannuleerd' && ['factuur', 'voorschot', 'creditnota'].includes(d.type) && jaarVan(d.datum) === j).forEach((d) => { m[+d.datum.slice(5, 7) - 1].in += (d.type === 'creditnota' ? -1 : 1) * C.totalen(d).ex; });
  (S.dagontv || []).filter((x) => jaarVan(x.datum) === j).forEach((x) => { m[+x.datum.slice(5, 7) - 1].in += C.num(x.ex); });
  (S.uitgaven || []).filter((u) => !u.privé && jaarVan(u.datum) === j).forEach((u) => { const k = kostVan(u, j); if (k.c.soort !== 'invest') m[+u.datum.slice(5, 7) - 1].uit += k.kost; });
  const max = Math.max(1, ...m.map((x) => Math.max(x.in, x.uit)));
  const mn = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
  const html = `<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">
    ${[['Resultaat', w.winst, "go('rapport',null,'resultaat')"], ['Inkomsten', w.omzet, "go('facturen')"], ['Uitgaven', uit, "go('uitgaven')"], ['Te ontvangen van klanten', teOntv, "filt.st='';go('facturen')"], ['Te betalen aan leveranciers', teBet, "go('uitgaven')"]]
      .map(([t, x, k]) => `<div class="c kpi" style="cursor:pointer" onclick="${k}"><h2>${t}</h2><div class="v">${eur(x)}</div></div>`).join('')}</div>
  <div class="c"><h2>${j} in kleur</h2><div style="display:flex;align-items:flex-end;gap:6px;height:170px;padding-top:6px">${m.map((x, i) => `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%;justify-content:flex-end" title="${mn[i]}: inkomsten ${eur(x.in)} · uitgaven ${eur(x.uit)}">
      <div style="display:flex;gap:2px;align-items:flex-end;height:140px;width:100%;justify-content:center"><div style="width:42%;background:#7dd3e8;border-radius:3px 3px 0 0;height:${Math.max(0, x.uit) / max * 100}%"></div><div style="width:42%;background:#f5d76e;border-radius:3px 3px 0 0;height:${Math.max(0, x.in) / max * 100}%"></div></div>
      <span class="mu" style="font-size:11px">${mn[i]}</span></div>`).join('')}</div>
    <div class="row" style="gap:14px;justify-content:center;font-size:12px;margin-top:6px"><span><span style="display:inline-block;width:10px;height:10px;background:#7dd3e8;border-radius:2px"></span> Uitgaven</span><span><span style="display:inline-block;width:10px;height:10px;background:#f5d76e;border-radius:2px"></span> Inkomsten</span></div></div>`;
  const h1 = $('#app h1'); if (h1) h1.insertAdjacentHTML('afterend', html);
}

/* ---------------- leveranciers ---------------- */
// leveranciers aanvullen uit je kosten (naam + meest gebruikte kostencategorie)
function levUitKosten() {
  if (RO) return 0; S.leveranciers = S.leveranciers || []; const per = {};
  (S.uitgaven || []).forEach((u) => { const n = (u.leverancier || '').trim(); if (!n) return; const k = n.toLowerCase(); const p = per[k] = per[k] || { n, kc: {} }; p.kc[u.kc] = (p.kc[u.kc] || 0) + 1; });
  let nieuw = 0;
  Object.entries(per).forEach(([k, p]) => { if (S.leveranciers.some((x) => (x.n || '').trim().toLowerCase() === k)) return; const kc = Object.entries(p.kc).sort((a, b) => b[1] - a[1])[0][0]; S.leveranciers.push({ id: uid('v'), n: p.n, btw: '', kc, adres: '' }); nieuw++; });
  if (nieuw) save(); return nieuw;
}
function vLeveranciers() {
  levUitKosten();
  const q = (filt.lq || '').toLowerCase(); const cats = alleCats();
  const l = (S.leveranciers || []).filter((x) => !q || [x.n, x.btw, x.mail].join(' ').toLowerCase().includes(q)).sort((a, b) => (a.n || '').localeCompare(b.n || ''));
  const tot = (n) => (S.uitgaven || []).filter((u) => (u.leverancier || '').trim().toLowerCase() === (n || '').trim().toLowerCase()).reduce((s, u) => s + kostVan(u).bb, 0);
  return `<div class="row wrap" style="margin-bottom:12px"><h1 style="margin:0">Leveranciers</h1><span class="sp"></span>${RO ? '' : '<button onclick="levNieuw()">+ Leverancier</button>'}</div>
  <input style="max-width:320px" placeholder="Zoeken…" value="${esc(filt.lq || '')}" oninput="filt.lq=this.value;clearTimeout(window._ft);window._ft=setTimeout(R,250)">
  <p class="mu">Kies bij een leverancier de standaard kostencategorie: bij een nieuwe kost van die leverancier wordt ze automatisch ingevuld.</p>
  <div class="c" style="padding:0;overflow:auto"><table class="t"><tr><th>Naam</th><th>Ondernemingsnr</th><th>Standaard kostencategorie</th><th class="r">Kosten</th><th></th></tr>
  ${l.map((x) => `<tr><td>${RO ? `<b>${esc(x.n)}</b>` : `<input style="margin:0" value="${esc(x.n)}" onchange="levZet('${x.id}','n',this.value)">`}<div class="mu">${esc(x.adres || '')}</div></td><td class="nw">${esc(x.btw ? C.fmtBtw(x.btw) : '')}</td>
    <td>${RO ? esc((cats.find((c) => c.id === x.kc) || {}).n || '') : `<select style="margin:0" onchange="levZet('${x.id}','kc',this.value)"><option value="">—</option>${cats.map((c) => `<option value="${c.id}" ${c.id === x.kc ? 'selected' : ''}>${esc(c.n)}</option>`).join('')}</select>`}</td>
    <td class="r tab">${eur(tot(x.n))}</td><td>${RO ? '' : `<button class="lnk" title="Verwijderen" onclick="levWeg('${x.id}')">✕</button>`}</td></tr>`).join('') || '<tr><td colspan="5" class="mu" style="padding:16px">Nog geen leveranciers. Ze komen er vanzelf bij via "Overnemen uit Dexxter" of als je een kost opslaat.</td></tr>'}</table></div>`;
}
function levNieuw() { const n = prompt('Naam leverancier?'); if (!n) return; S.leveranciers = S.leveranciers || []; S.leveranciers.push({ id: uid('v'), n, btw: '', kc: '' }); save(); R(); }
function levZet(id, k, val) { const x = (S.leveranciers || []).find((y) => y.id === id); if (x) { x[k] = val; save(); } }
function levWeg(id) { if (!confirm('Leverancier uit de lijst verwijderen? Bestaande kosten blijven staan.')) return; S.leveranciers = (S.leveranciers || []).filter((y) => y.id !== id); save(); R(); }
// bij een kost: leverancier kiezen uit de lijst vult de categorie in
function levKies(naam) {
  const u = curUitgave(); if (!u) return; u.leverancier = naam;
  const x = (S.leveranciers || []).find((y) => (y.n || '').trim().toLowerCase() === naam.trim().toLowerCase());
  if (x && x.kc && (!u.kc || u.kc === 'handelsgoederen-verbruiksmaterialen') && !(u.tarieven || []).some((t) => C.num(t.basis))) { kostCat(x.kc); return; }
  if (!x && naam.trim()) { S.leveranciers = S.leveranciers || []; S.leveranciers.push({ id: uid('v'), n: naam.trim(), btw: '', kc: u.kc || '' }); }
  save();
}

/* ---------------- dagontvangsten (contante verkopen zonder factuur, bv. aan particulieren) ---------------- */
function vDagontv() {
  const j = +(filt.dj || JAAR()); const l = (S.dagontv || []).filter((x) => jaarVan(x.datum) === j).sort((a, b) => b.datum.localeCompare(a.datum));
  const tot = l.reduce((s, x) => s + C.num(x.ex), 0), totB = l.reduce((s, x) => s + C.num(x.btwBedrag), 0);
  return `<div class="row wrap" style="margin-bottom:12px"><h1 style="margin:0">Dagontvangsten</h1><span class="sp"></span><select style="width:auto;margin:0" onchange="filt.dj=this.value;R()">${[JAAR(), JAAR() - 1].map((x) => `<option ${x === j ? 'selected' : ''}>${x}</option>`).join('')}</select>${RO ? '' : '<button onclick="dagNieuw()">+ Dagontvangst</button>'}</div>
  <p class="mu">Voor verkopen aan particulieren waarvoor je geen factuur hoeft te maken (dagboek van ontvangsten). Geef het bedrag inclusief btw in; de btw wordt berekend en komt in je btw-aangifte en je omzet.</p>
  <div class="c" style="padding:0;overflow:auto"><table class="t"><tr><th>Datum</th><th>Omschrijving</th><th>Btw</th><th class="r">Incl. btw</th><th class="r">Excl. btw</th><th class="r">Btw</th><th></th></tr>
  ${l.map((x) => `<tr><td>${RO ? dt(x.datum) : `<input type="date" style="margin:0" value="${x.datum}" onchange="dagZet('${x.id}','datum',this.value)">`}</td><td>${RO ? esc(x.oms) : `<input style="margin:0" value="${esc(x.oms || '')}" onchange="dagZet('${x.id}','oms',this.value)">`}</td>
    <td>${RO ? x.btw + '%' : `<select style="margin:0;width:auto" onchange="dagZet('${x.id}','btw',this.value)">${['21', '6', '12', '0'].map((p) => `<option value="${p}" ${String(x.btw) === p ? 'selected' : ''}>${p}%</option>`).join('')}</select>`}</td>
    <td class="r">${RO ? eur(x.inc) : `<input inputmode="decimal" style="margin:0;width:110px;text-align:right" value="${esc(x.inc)}" onchange="dagZet('${x.id}','inc',this.value)">`}</td><td class="r tab">${eur(x.ex)}</td><td class="r tab">${eur(x.btwBedrag)}</td><td>${RO ? '' : `<button class="lnk" onclick="dagWeg('${x.id}')">✕</button>`}</td></tr>`).join('') || '<tr><td colspan="7" class="mu" style="padding:16px">Geen dagontvangsten in ' + j + '.</td></tr>'}
  ${l.length ? `<tr><td colspan="4"><b>Totaal ${j}</b></td><td class="r"><b>${eur(tot)}</b></td><td class="r"><b>${eur(totB)}</b></td><td></td></tr>` : ''}</table></div>`;
}
function dagReken(x) { const p = C.num(x.btw) / 100; x.ex = C.r2(C.num(x.inc) / (1 + p)); x.btwBedrag = C.r2(C.num(x.inc) - x.ex); }
function dagNieuw() { S.dagontv = S.dagontv || []; const x = { id: uid('o'), datum: today(), oms: 'Contante verkoop', btw: '21', inc: 0 }; dagReken(x); S.dagontv.push(x); save(); R(); }
function dagZet(id, k, val) { const x = (S.dagontv || []).find((y) => y.id === id); if (!x) return; x[k] = k === 'inc' ? C.num(val) : val; dagReken(x); save(); R(); }
function dagWeg(id) { if (!confirm('Dagontvangst verwijderen?')) return; S.dagontv = S.dagontv.filter((y) => y.id !== id); window.CLOUD && CLOUD.soon(); save(); R(); }

/* ---------------- voorraad op 31 december ---------------- */
function vVoorraad() {
  S.voorraad = S.voorraad || {}; const j = +(filt.vj || JAAR()); const x = S.voorraad[j] = S.voorraad[j] || {};
  const begin = x.begin ?? ((S.voorraad[j - 1] || {}).eind ?? 0);
  return `<h1>Voorraad</h1><select style="max-width:120px" onchange="filt.vj=this.value;R()">${[JAAR(), JAAR() - 1].map((y) => `<option ${y === j ? 'selected' : ''}>${y}</option>`).join('')}</select>
  <div class="c"><p class="mu">Koop je handelsgoederen of materiaal aan dat op 31 december nog niet gebruikt of verkocht is? Dan hoort de waarde daarvan niet bij je kosten van dit jaar. Tel je voorraad op 31 december (aankoopprijs excl. btw) en vul hem hier in. De wijziging (eind − begin) wordt bij je winst geteld, zoals in Dexxter.</p>
  <div class="cols"><label class="f"><span>Voorraad op 1 januari ${j}</span><input inputmode="decimal" ${RO ? 'readonly' : ''} value="${esc(begin)}" onchange="S.voorraad[${j}].begin=C.num(this.value);save();R()"></label>
  <label class="f"><span>Voorraad op 31 december ${j}</span><input inputmode="decimal" ${RO ? 'readonly' : ''} value="${esc(x.eind ?? '')}" placeholder="0,00" onchange="S.voorraad[${j}].eind=C.num(this.value);save();R()"></label></div>
  <div class="dl"><span>Voorraadwijziging (telt mee in je winst)</span><b>${eur(C.num(x.eind) - C.num(begin))}</b></div>
  ${RO ? '' : `<label class="f" style="margin-top:10px"><span>Notities (wat ligt er in voorraad?)</span><textarea rows="4" oninput="S.voorraad[${j}].notitie=this.value;save()">${esc(x.notitie || '')}</textarea></label>`}</div>`;
}
