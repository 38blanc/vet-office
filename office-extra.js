/* VET Office – uitbreidingen (versie 2): kostencategorieën zoals Dexxter, kosten met voorbeeld, ticketfoto,
 * investeringen/afschrijvingen, auto's, verzekeringen, sociale bijdragen + personenbelasting (Dexxter-methode),
 * aangiftehulp Tax-on-web, IC-aangifte, rapporten, tijdlijn, VEKA-meldingen, dossiers (werkbon + attesten). */

/* ---------------- hulp ---------------- */
const LK = RL.links;
const ext = (url, label = 'Openen') => `<a class="extl" href="${esc(url)}" target="_blank" rel="noopener">${esc(label)} ↗</a>`;
const pct = (x) => (Math.round(Number(x) * 100) / 100).toString().replace('.', ',') + '%';
function alleCats() {
  const aanp = S.cfg.kcAanp || {};
  return RL.kostencats.concat(S.cfg.kcEigen || []).map((c) => Object.assign({}, c, aanp[c.id] || {}));
}
const catVan = (u) => { const l = alleCats(); return l.find((c) => c.id === u.kc) || l.find((c) => c.id === 'overige-diensten'); };
function migreer() {
  (S.uitgaven || []).forEach((u) => { if (!u.kc) u.kc = u.cat === '81' ? 'handelsgoederen-verbruiksmaterialen' : u.cat === '83' ? 'investering' : 'overige-diensten'; });
  if (!S.cfg.startdatum) S.cfg.startdatum = '2026-04-01';
  S.invest = S.invest || []; S.wagens = S.wagens || []; S.verz = S.verz || []; S.veka = S.veka || {}; S.ic = S.ic || {};
  if (!S.verz.length && !S.cfg.verzInit) { S.verz.push({ id: uid('v'), soort: 'Burgerlijke aansprakelijkheid (BA) uitbating', maatschappij: '', polis: '', dekking: 'Burgerlijke aansprakelijkheid & bedrijfsrisico’s', premie: '', freq: 'jaarlijks', verval: '' }); S.cfg.verzInit = true; }
}
const jaarVan = (d) => +String(d || '').slice(0, 4);

/* ---------------- resultaat (zoals Dexxter: berekeningsbasis × beroepsmatig gebruik, verworpen uitgaven) ---------------- */
function kostVan(u, jaar) {
  const c = catVan(u); const s = u.creditnota ? -1 : 1;
  const beroep = (u.beroep != null && u.beroep !== '' ? C.num(u.beroep) : c.beroep) / 100;
  const aftrek = (u.aftrek != null && u.aftrek !== '' ? C.num(u.aftrek) : c.btw) / 100;
  let basis = 0, btw = 0; (u.tarieven || []).forEach((t) => { basis += C.num(t.basis); btw += !u.regime || u.regime === 'normaal' ? C.num(t.btw) : 0; });
  const bb = C.r2((basis + btw * (1 - aftrek)) * s);
  const kost = C.r2(bb * beroep);
  let verwPct = (c.verworpen || 0) / 100;
  if (c.soort === 'wagen') { const w = (S.wagens || []).find((x) => x.id === u.voertuig); if (w) verwPct = 1 - RL.autoAftrek(w, jaar || jaarVan(u.datum)) / 100; }
  return { c, bb, kost, verworpen: C.r2(kost * verwPct), beroep, aftrek, btwAftrek: C.r2(btw * aftrek * s) };
}
function omzetJaar(j) { return C.r2(S.docs.filter((d) => d.status !== 'concept' && d.status !== 'geannuleerd' && ['factuur', 'voorschot', 'creditnota'].includes(d.type) && jaarVan(d.datum) === j).reduce((s, d) => s + (d.type === 'creditnota' ? -1 : 1) * C.totalen(d).ex, 0)); }
function afschrJaar(j) {
  let t = 0; const lijst = [];
  (S.invest || []).forEach((inv) => { const r = RL.afschrijvingTabel(inv).find((x) => x.jaar === j); if (r) { const a = C.r2(r.afschrijving * (C.num(inv.beroep || 100) / 100)); t += a; lijst.push({ inv, r, a }); } });
  return { tot: C.r2(t), lijst };
}
function winstJaar(j) {
  const omzet = omzetJaar(j); const per = {}; let kosten = 0, verworpen = 0, handel = 0, onder = 0, rsz = 0, vapz = 0;
  (S.uitgaven || []).filter((u) => !u.privé && jaarVan(u.datum) === j).forEach((u) => {
    const k = kostVan(u, j); if (k.c.soort === 'invest') return; // investeringen lopen via afschrijvingen
    kosten += k.kost; verworpen += k.verworpen;
    if (k.c.h === 'Handelsgoederen') handel += k.kost; if (k.c.h === 'Onderaannemingen') onder += k.kost;
    if (k.c.soort === 'rsz') { if (/VAPZ/.test(k.c.n)) vapz += k.kost; else rsz += k.kost; }
    const p = per[k.c.id] = per[k.c.id] || { c: k.c, bb: 0, kost: 0, verworpen: 0, n: 0 }; p.bb += k.bb; p.kost += k.kost; p.verworpen += k.verworpen; p.n++;
  });
  const af = afschrJaar(j);
  const winst = C.r2(omzet - kosten - af.tot + verworpen);
  return { omzet, kosten: C.r2(kosten), afschr: af.tot, verworpen: C.r2(verworpen), winst, per, handel: C.r2(handel), onder: C.r2(onder), rsz: C.r2(rsz), vapz: C.r2(vapz), afLijst: af.lijst };
}

/* ---------------- sociale bijdragen (zoals Dexxter: winst omgerekend naar een volledig jaar) ---------------- */
function belJaar(j) { S.bel[j] = S.bel[j] || {}; const b = S.bel[j]; b.statuut = b.statuut || [S.cfg.statuut, S.cfg.statuut, S.cfg.statuut, S.cfg.statuut]; b.vaQ = b.vaQ || [0, 0, 0, 0]; b.vbVa = b.vbVa || []; return b; }
function rszRaming(j) {
  const b = belJaar(j); const p = RL.jaar(j).rsz; const w = winstJaar(j);
  const actief = b.statuut.filter((x) => x && x !== 'geen').length;
  const prorata = actief ? C.r2(Math.max(0, w.winst) * 4 / actief) : 0;
  const jaarBijdr = Math.min(prorata, p.grens1) * p.pct1 + Math.max(0, Math.min(prorata, p.grens2) - p.grens1) * p.pct2;
  const kw = b.statuut.map((st) => {
    if (!st || st === 'geen') return { st, bijdrage: 0, beheer: 0 };
    let x = jaarBijdr / 4;
    if (st === 'bijberoep') x = prorata < p.drempelBij ? 0 : Math.max(p.minBij, x); else x = Math.max(p.minHoofd, x);
    x = Math.min(x, p.maxKwartaal); return { st, bijdrage: C.r2(x), beheer: C.r2(x * p.beheer) };
  });
  const tot = C.r2(kw.reduce((s, k) => s + k.bijdrage + k.beheer, 0));
  const betaald = C.r2(w.rsz + C.num(b.rszExtra));
  return { prorata, kw, tot, betaald, nog: C.r2(tot - betaald), grens: p.drempelBij, actief, beheerPct: p.beheer };
}
/* ---------------- personenbelasting (zoals Dexxter) ---------------- */
function pbRaming(j) {
  const b = belJaar(j); const P = RL.jaar(j).pb; const w = winstJaar(j);
  const gem = b.gemeente != null && b.gemeente !== '' ? C.num(b.gemeente) / 100 : P.gemeente;
  const ls = String(b.loonschijf ?? S.cfg.loonschijf ?? (S.cfg.statuut === 'bijberoep' ? '3' : '0'));
  let fed; const winst = Math.max(0, w.winst);
  if (ls !== '0') fed = winst * [0, 0.25, 0.40, 0.45, 0.50][+ls];
  else fed = Math.max(0, C.schijven(winst, P) - C.vrijeSomVoordeel(P));
  const gemB = fed * gem; const tot = C.r2(fed + gemB);
  const va = b.vaQ.map((x) => C.num(x)); const vaTot = C.r2(va.reduce((s, x) => s + x, 0));
  const bon = C.r2(va.reduce((s, x, i) => s + x * (RL.jaar(j).va.pb.bonificatie[i] || 0), 0));
  return { w, fed: C.r2(fed), gem: C.r2(gemB), tot, va, vaTot, bon, nog: C.r2(tot - vaTot), ls, gemPct: gem, netto: C.r2(w.winst - tot) };
}
function belastingRaming(j) { // gebruikt door het overzicht
  const natuurlijk = (RL.rechtsvormen[S.cfg.rechtsvorm] || {}).natuurlijk !== false;
  if (natuurlijk) { const p = pbRaming(j); return { nog: p.nog, w: p.w, type: 'pb' }; }
  const b = belJaar(j); const w = winstJaar(j); const loonBL = C.num(b.bedrijfsleider);
  const vb = C.ramingVB({ jaar: j, winst: w.winst - loonBL, loonBedrijfsleider: loonBL, va: b.vbVa });
  return { nog: vb.nog, w, vb, type: 'vb' };
}

/* ---------------- kosten ---------------- */
let thumbBusy = {};
// voorbeeldje zonder 'data:'-voorvoegsel bewaren, zodat de cloud het niet als apart bestand opslaat
const thumbKort = (d) => (d ? 'T' + String(d).split(',')[1] : '');
const thumbSrc = (u) => (u.thumb ? (u.thumb[0] === 'T' ? 'data:image/jpeg;base64,' + u.thumb.slice(1) : u.thumb) : '');
async function maakThumb(dataUrl) {
  try {
    if (/^data:image\//.test(dataUrl)) return await new Promise((res) => { const i = new Image(); i.onload = () => { const s = 160 / Math.max(i.width, i.height); const c = document.createElement('canvas'); c.width = i.width * s; c.height = i.height * s; c.getContext('2d').drawImage(i, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', 0.7)); }; i.onerror = () => res(''); i.src = dataUrl; });
    if (/^data:application\/pdf/.test(dataUrl)) {
      await laadPdfjs(); const bin = atob(dataUrl.split(',')[1]); const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      const pdf = await pdfjsLib.getDocument({ data: u8, isEvalSupported: false }).promise; const pg = await pdf.getPage(1); const vp0 = pg.getViewport({ scale: 1 }); const vp = pg.getViewport({ scale: 220 / vp0.height });
      const c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height; await pg.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise; return c.toDataURL('image/jpeg', 0.7);
    }
  } catch (e) { console.warn('thumb', e); }
  return '';
}
let pdfjsP = null;
const laadPdfjs = () => pdfjsP || (pdfjsP = new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'pdfjs.min.js'; s.onload = () => { pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs.worker.min.js'; res(); }; s.onerror = rej; document.head.appendChild(s); }));
async function thumbsAanvullen() { // voorbeeldjes maken voor kosten met een bijlage
  for (const u of (S.uitgaven || [])) {
    if (u.thumb || !u.bijlage || thumbBusy[u.id]) continue; thumbBusy[u.id] = 1;
    try { const data = await (window.CLOUD ? CLOUD.file(u.bijlage) : u.bijlage); u.thumb = thumbKort(await maakThumb(data)); if (u.thumb) { save(); const im = document.getElementById('th_' + u.id); if (im) im.src = thumbSrc(u); } } catch (e) {}
  }
}
function vUitgaven() {
  const j = +filt.jaar || JAAR(); const q = filt.q.toLowerCase(); const fc = sub || '';
  let l = (S.uitgaven || []).filter((u) => jaarVan(u.datum) === j && (!q || [u.leverancier, u.nr, u.oms, catVan(u).n].join(' ').toLowerCase().includes(q)));
  if (fc === 'open') l = l.filter((u) => !u.betaald); if (fc === 'zonder') l = l.filter((u) => !u.bijlage);
  l.sort((a, b) => (b.datum || '').localeCompare(a.datum || ''));
  const tot = l.reduce((s, u) => { const k = kostVan(u, j); s.inc += (u.tarieven || []).reduce((x, t) => x + C.num(t.basis) + C.num(t.btw), 0) * (u.creditnota ? -1 : 1); s.kost += k.kost; return s; }, { inc: 0, kost: 0 });
  setTimeout(thumbsAanvullen, 50);
  return `<div class="row wrap" style="margin-bottom:12px"><h1 style="margin:0">Kosten</h1><span class="sp"></span>${RO ? '' : `
    <label class="btnl">📷 Ticket fotograferen<input type="file" accept="image/*" capture="environment" style="display:none" onchange="kostBestand(this.files[0],'ticket')"></label>
    <label class="btnl b2l">🖼 Uit galerij / PDF<input type="file" accept="image/*,application/pdf" multiple style="display:none" onchange="[...this.files].forEach(f=>kostBestand(f))"></label>
    <button class="b2" onclick="uitgaveNieuw()">+ Zonder bijlage</button>`}</div>
  <div class="row wrap" style="margin-bottom:10px"><input style="max-width:280px" placeholder="Zoeken op leverancier, categorie…" value="${esc(filt.q)}" oninput="filt.q=this.value;clearTimeout(window._ft);window._ft=setTimeout(R,250)"><select style="max-width:110px" onchange="filt.jaar=this.value;R()">${[JAAR(), JAAR() - 1, JAAR() - 2].map((x) => `<option ${j === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
  <div class="chips">${[['', 'Alle'], ['open', 'Nog te betalen'], ['zonder', 'Zonder bijlage']].map(([k, lb]) => `<button class="chip ${fc === k ? 'on' : ''}" onclick="go('uitgaven',null,'${k}')">${lb}</button>`).join('')}</div>
  <div class="klist">${l.map((u) => { const k = kostVan(u, j); const inc = (u.tarieven || []).reduce((x, t) => x + C.num(t.basis) + C.num(t.btw), 0) * (u.creditnota ? -1 : 1); return `<div class="kitem" onclick="go('uitgave','${u.id}')">
    <div class="kth">${u.thumb ? `<img id="th_${u.id}" src="${thumbSrc(u)}" alt="">` : u.bijlage ? `<img id="th_${u.id}" alt=""><span>📄</span>` : '<span class="mu">geen bijlage</span>'}</div>
    <div class="kmid"><b>${esc(u.leverancier || 'Onbekende leverancier')}</b> <span class="mu">${dt(u.datum)}</span>${u.bron === 'peppol' ? ' <span class="tag">Peppol</span>' : ''}${u.creditnota ? ' <span class="tag o">creditnota</span>' : ''}${u.betaald ? ' <span class="tag g">Betaald</span>' : ' <span class="tag o">Open</span>'}
      <div>${esc(k.c.n)}</div><div class="mu">${Math.round(k.beroep * 100)}% beroepsmatig · ${Math.round(k.aftrek * 100)}% btw-aftrek${k.verworpen ? ' · ' + eur(k.verworpen) + ' verworpen' : ''}</div></div>
    <div class="r"><b class="tab">${eur(inc)}</b><div class="mu tab">${eur(k.kost)}</div></div></div>`; }).join('') || `<div class="c mu">Nog geen kosten in ${j}.</div>`}</div>
  <p class="mu">${l.length} kosten · ${eur(tot.inc)} incl. btw · ${eur(tot.kost)} beroepskost</p>`;
}
async function kostBestand(f, soort) {
  if (!f) return; const data = await bestandData(f); const thumb = thumbKort(await maakThumb(data));
  const o = { bijlage: data, thumb, oms: f.name.replace(/\.[a-z]+$/i, '') };
  if (soort === 'ticket') Object.assign(o, { kc: 'restaurantkosten', tarieven: [{ pct: 12, basis: 0, btw: 0 }] });
  uitgaveNieuw(o);
}
function uitgaveNieuw(o = {}) {
  if (RO) return; const c = alleCats().find((x) => x.id === (o.kc || 'handelsgoederen-verbruiksmaterialen'));
  const u = Object.assign({ id: uid('u'), datum: today(), leverancier: '', nr: '', oms: '', kc: c.id, cat: c.rooster, regime: 'normaal', tarieven: [{ pct: 21, basis: 0, btw: 0 }], aftrek: c.btw, beroep: c.beroep, betaald: false, bijlage: '' }, o);
  S.uitgaven = S.uitgaven || []; S.uitgaven.unshift(u); save(); go('uitgave', u.id);
}
function kostCat(id) { const u = curUitgave(); const c = alleCats().find((x) => x.id === id); u.kc = id; u.cat = c.rooster; u.aftrek = c.btw; u.beroep = c.beroep; if (c.soort === 'invest') investVanUitgave(u); save(); R(); }
function investVanUitgave(u) {
  S.invest = S.invest || []; let inv = S.invest.find((x) => x.uitgave === u.id); const k = kostVan(u);
  if (!inv) { inv = { id: uid('i'), uitgave: u.id, oms: u.oms || u.leverancier || 'Investering', datum: u.datum, waarde: Math.abs(k.bb), jaren: S.cfg.afschrijving || 3, beroep: Math.round(k.beroep * 100), cat: 'Overige' }; S.invest.push(inv); }
  else Object.assign(inv, { datum: u.datum, waarde: Math.abs(k.bb) });
}
function vUitgave() {
  const u = curUitgave(); if (!u) return 'Niet gevonden'; const ro = RO; const k = kostVan(u); const c = k.c;
  if (u.bron === 'peppol' && !u.gezien && !RO) { u.gezien = true; setTimeout(save, 10); }
  const groepen = [...new Set(alleCats().map((x) => x.h))].sort();
  const isPdf = /^data:application\/pdf/.test(u.bijlage) || /\.pdf$/i.test(u.bijlage);
  const inc = (u.tarieven || []).reduce((x, t) => x + C.num(t.basis) + C.num(t.btw), 0);
  return `<div class="row" style="margin-bottom:10px"><button class="lnk" onclick="go('uitgaven')">‹ Kosten</button><span class="sp"></span>${ro ? '' : `<button class="red" onclick="uitgaveWeg()">Verwijderen</button>`}</div>
  <h1>${esc(u.leverancier || 'Nieuwe kost')}</h1>
  <div class="kgrid"><div>
  <div class="c"><h2>Factuur / ticket</h2>
    ${inp('Leverancier', 'U.leverancier')}<div class="cols">${inp('Factuurnummer', 'U.nr')}${inp('Datum', 'U.datum', { type: 'date' })}</div>${inp('Omschrijving', 'U.oms')}
    <label class="f"><span>Kostencategorie</span><select ${ro ? 'disabled' : ''} onchange="kostCat(this.value)">${groepen.map((g) => `<optgroup label="${esc(g)}">${alleCats().filter((x) => x.h === g).map((x) => `<option value="${x.id}" ${x.id === c.id ? 'selected' : ''}>${esc(x.n)}</option>`).join('')}</optgroup>`).join('')}</select></label>
    ${c.oms ? `<p class="mu" style="margin:-4px 0 8px">${esc(c.oms)}</p>` : ''}
    ${['wagen', 'vracht', 'moto'].includes(c.soort) ? `<label class="f"><span>Voertuig</span><select ${ro ? 'disabled' : ''} onchange="set('U.voertuig',this.value);R()"><option value="">— kies —</option>${(S.wagens || []).map((w) => `<option value="${w.id}" ${u.voertuig === w.id ? 'selected' : ''}>${esc(w.naam)}</option>`).join('')}</select></label>${!(S.wagens || []).length ? `<p class="mu">Voeg eerst je voertuig toe bij <a class="lnk" onclick="go('wagens')">Auto's</a>.</p>` : ''}` : ''}
    ${c.soort === 'invest' ? `<div class="ban b">Deze aankoop wordt afgeschreven. <a style="cursor:pointer;text-decoration:underline" onclick="go('invest')">Bekijk bij Investeringen</a></div>` : ''}
    ${inp('Btw-regime', 'U.regime', { sel: [['normaal', 'Normaal (leverancier rekent btw aan)'], ['verlegd', 'Verlegd – jij voldoet de btw (onderaannemer, rooster 87/56)'], ['icdienst', 'Dienst uit ander EU-land (bv. Google, Meta) → 88/55'], ['icgoed', 'Goederen uit ander EU-land → 86/55']], re: 1 })}
    <label class="row" style="gap:8px;margin-bottom:8px"><input type="checkbox" style="width:auto;margin:0" ${u.creditnota ? 'checked' : ''} ${ro ? 'disabled' : ''} onchange="set('U.creditnota',this.checked);R()"> Creditnota van de leverancier</label>
  </div>
  <div class="c"><h2>Bedragen</h2>
    ${(u.tarieven || []).map((t, i) => `<div class="cols3"><label class="f"><span>Btw %</span><select ${ro ? 'disabled' : ''} onchange="tarSet(${i},'pct',this.value);R()">${[21, 12, 6, 0].map((p) => `<option ${C.num(t.pct) === p ? 'selected' : ''}>${p}</option>`).join('')}</select></label><label class="f"><span>Excl. btw</span><input ${ro ? 'readonly' : ''} inputmode="decimal" value="${esc(t.basis)}" oninput="tarSet(${i},'basis',this.value)" onchange="R()"></label><label class="f"><span>Btw</span><input ${ro ? 'readonly' : ''} inputmode="decimal" id="tb${i}" value="${esc(t.btw)}" oninput="tarSet(${i},'btw',this.value,1)" onchange="R()"></label></div>`).join('')}
    ${ro ? '' : `<div class="row wrap"><button class="b2 sm" onclick="curUitgave().tarieven.push({pct:6,basis:0,btw:0});save();R()">+ ander btw-tarief</button><button class="b2 sm" onclick="incNaarEx()">Ik ken enkel het totaal incl. btw</button></div>`}
    <div class="cols" style="margin-top:10px">${inp('% beroepsmatig gebruik', 'U.beroep', { num: 1, re: 1 })}${inp('% btw-aftrek', 'U.aftrek', { num: 1, re: 1 })}</div>
    <div class="dl"><span>Totaal incl. btw</span><b>${eur(inc)}</b></div><div class="dl"><span>Berekeningsbasis</span><span>${eur(k.bb)}</span></div><div class="dl"><span>Beroepskost</span><b>${eur(k.kost)}</b></div>${k.verworpen ? `<div class="dl"><span>Verworpen uitgave</span><span>${eur(k.verworpen)}</span></div>` : ''}<div class="dl"><span>Aftrekbare btw</span><span>${eur(k.btwAftrek)}</span></div>
    <label class="row" style="gap:8px;margin-top:8px"><input type="checkbox" style="width:auto;margin:0" ${u.betaald ? 'checked' : ''} ${ro ? 'disabled' : ''} onchange="set('U.betaald',this.checked)"> Betaald</label>
    <label class="row" style="gap:8px;margin-top:6px"><input type="checkbox" style="width:auto;margin:0" ${u.privé ? 'checked' : ''} ${ro ? 'disabled' : ''} onchange="set('U.privé',this.checked)"> Privé (niet meetellen)</label>
  </div></div>
  <div class="c"><h2>Bijlage</h2>${u.bijlage ? (isPdf ? `<iframe id="ubijpdf" class="kpv"></iframe><button class="b2 sm" onclick="bijlageOpen()">Openen in nieuw venster</button>` : `<img src="${String(u.bijlage).startsWith('vf:') ? '' : u.bijlage}" id="ubij" style="max-width:100%;border-radius:8px">`) : '<p class="mu">Geen bijlage. Aankoopfacturen 10 jaar bewaren.</p>'}
    ${ro ? '' : `<div class="row wrap" style="margin-top:8px"><label class="btnl b2l">📷 Foto<input type="file" accept="image/*" capture="environment" style="display:none" onchange="bijlageZet(this.files[0])"></label><label class="btnl b2l">${u.bijlage ? 'Vervangen' : 'PDF / afbeelding'}<input type="file" accept="image/*,application/pdf" style="display:none" onchange="bijlageZet(this.files[0])"></label></div>`}</div>
  </div>`;
}
async function bijlageZet(f) { if (!f) return; const u = curUitgave(); u.bijlage = await bestandData(f); u.thumb = thumbKort(await maakThumb(u.bijlage)); save(); R(); }
function incNaarEx() { const u = curUitgave(); const tot = C.num(prompt('Totaal incl. btw?', '') || 0); if (!tot) return; const p = C.num(u.tarieven[0].pct); const ex = C.r2(tot / (1 + p / 100)); u.tarieven = [{ pct: p, basis: ex, btw: C.r2(tot - ex) }]; save(); R(); }
async function bijlageVoorbeeld() {
  const u = curUitgave(); if (!u || !u.bijlage) return;
  const data = String(u.bijlage).startsWith('vf:') && window.CLOUD ? await CLOUD.file(u.bijlage) : u.bijlage;
  const fr = $('#ubijpdf'); if (fr) fr.src = URL.createObjectURL(b64Blob(String(data).split(',')[1], 'application/pdf'));
  const im = $('#ubij'); if (im && !im.src.startsWith('data')) im.src = data;
  if (!u.thumb) { u.thumb = thumbKort(await maakThumb(data)); if (u.thumb) save(); }
}

/* ---------------- investeringen ---------------- */
function vInvest() {
  const j = +(filt.ij || JAAR());
  const rows = (S.invest || []).map((inv) => { const t = RL.afschrijvingTabel(inv); const r = t.find((x) => x.jaar === j) || { begin: 0, afschrijving: 0, eind: 0 }; return { inv, r }; }).filter((x) => x.r.begin || x.r.afschrijving || jaarVan(x.inv.datum) <= j && !x.inv.verkocht);
  const tot = rows.reduce((s, x) => ({ w: s.w + C.num(x.inv.waarde), b: s.b + x.r.begin, a: s.a + x.r.afschrijving, e: s.e + x.r.eind }), { w: 0, b: 0, a: 0, e: 0 });
  return `<div class="row wrap" style="margin-bottom:12px"><h1 style="margin:0">Investeringen & afschrijvingen</h1><span class="sp"></span><select style="width:auto;margin:0" onchange="filt.ij=this.value;R()">${[JAAR() + 1, JAAR(), JAAR() - 1, JAAR() - 2].map((x) => `<option ${x === j ? 'selected' : ''}>${x}</option>`).join('')}</select>${RO ? '' : `<button onclick="investNieuw()">+ Investering</button>`}</div>
  <p class="mu">Aankopen van ± € 250 of meer per stuk die meerdere jaren meegaan, schrijf je af. Het eerste jaar pro rata per dag (zoals Dexxter), daarna gelijke jaarlijkse annuïteiten. Boek je een kost in de categorie "Investering", dan verschijnt ze hier automatisch.</p>
  <div class="c" style="padding:0;overflow:auto"><table class="t"><tr><th>Beschrijving</th><th>Startdatum</th><th>Termijn</th><th class="r">Totale waarde</th><th class="r">Beginwaarde ${j}</th><th class="r">Af te schrijven ${j}</th><th class="r">Eindwaarde ${j}</th></tr>
  ${rows.map(({ inv, r }) => `<tr class="cl" onclick="investOpen('${inv.id}')"><td><b>${esc(inv.oms)}</b><div class="mu">${esc(inv.cat || '')}${inv.verkocht ? ' · verkocht ' + dt(inv.verkocht) : ''}${C.num(inv.beroep || 100) < 100 ? ' · ' + inv.beroep + '% beroepsmatig' : ''}</div></td><td class="nw">${dt(inv.datum)}</td><td class="nw">${inv.jaren} jaar</td><td class="r tab">${eur(inv.waarde)}</td><td class="r tab">${eur(r.begin)}</td><td class="r tab"><b>${eur(r.afschrijving)}</b></td><td class="r tab">${eur(r.eind)}</td></tr>`).join('') || '<tr><td colspan="7" class="mu" style="padding:16px">Geen investeringen.</td></tr>'}
  ${rows.length ? `<tr><td colspan="3"><b>Totaal</b></td><td class="r tab">${eur(tot.w)}</td><td class="r tab">${eur(tot.b)}</td><td class="r tab"><b>${eur(tot.a)}</b></td><td class="r tab">${eur(tot.e)}</td></tr>` : ''}</table></div>`;
}
function investNieuw() { const inv = { id: uid('i'), oms: '', datum: today(), waarde: 0, jaren: S.cfg.afschrijving || 3, beroep: 100, cat: 'Machines & gereedschap' }; S.invest.push(inv); save(); investOpen(inv.id); }
function investOpen(id) {
  if (RO) return; const i = S.invest.findIndex((x) => x.id === id); const inv = S.invest[i];
  const tab = RL.afschrijvingTabel(inv);
  modal(`<h2>Investering</h2>${inp('Beschrijving', `S.invest.${i}.oms`)}<div class="cols">${inp('Soort', `S.invest.${i}.cat`, { sel: ['Machines & gereedschap', 'Meetapparatuur', 'Informatica', 'Voertuig', 'Inrichting & meubilair', 'Overige'].map((x) => [x, x]) })}${inp('In gebruik vanaf', `S.invest.${i}.datum`, { type: 'date' })}</div>
  <div class="cols3">${inp('Aankoopwaarde (excl. aftrekbare btw)', `S.invest.${i}.waarde`, { num: 1 })}${inp('Afschrijven over (jaar)', `S.invest.${i}.jaren`, { num: 1 })}${inp('% beroepsmatig', `S.invest.${i}.beroep`, { num: 1 })}</div>
  ${inp('Verkocht / buiten gebruik op (optioneel)', `S.invest.${i}.verkocht`, { type: 'date' })}
  <p class="mu">Gangbaar: gereedschap en machines 3 à 5 jaar, informatica 3 jaar, voertuigen 4 à 5 jaar, inrichting 10 jaar.</p>
  <table class="t" style="min-width:0"><tr><th>Jaar</th><th class="r">Begin</th><th class="r">Afschrijving</th><th class="r">Eind</th></tr>${tab.map((r) => `<tr><td>${r.jaar}</td><td class="r">${eur(r.begin)}</td><td class="r">${eur(r.afschrijving)}</td><td class="r">${eur(r.eind)}</td></tr>`).join('')}</table>
  <div class="row" style="margin-top:10px"><button class="red" onclick="if(confirm('Investering verwijderen?')){S.invest.splice(${i},1);save();sluit();R()}">Verwijderen</button><span class="sp"></span><button onclick="sluit();R()">Klaar</button></div>`);
}

/* ---------------- auto's ---------------- */
function vWagens() {
  const j = JAAR();
  return `<div class="row wrap" style="margin-bottom:12px"><h1 style="margin:0">Auto's</h1><span class="sp"></span>${RO ? '' : `<button onclick="wagenNieuw()">+ Voertuig</button>`}</div>
  <p class="mu">Kies bij een kost voor brandstof, onderhoud, verzekering, … het voertuig. VET Office past dan de fiscale aftrekbaarheid toe (verworpen uitgaven) en beperkt de btw-aftrek (personenwagen max. 50%). Regels: ${ext('https://www.wolterskluwer.com/nl-be/expert-insights/tax-deductible-car-related-expenses', 'uitleg aftrekbare autokosten')}</p>
  ${(S.wagens || []).map((w, i) => `<div class="c"><div class="row wrap"><b style="font-size:16px">${esc(w.naam || 'Voertuig')}</b><span class="tag">${{ wagen: 'Personenwagen', vracht: 'Lichte vracht', moto: 'Motorfiets' }[w.soort]}</span><span class="sp"></span><span>Fiscaal aftrekbaar ${j}: <b>${pct(RL.autoAftrek(w, j))}</b></span>${RO ? '' : `<button class="b2 sm" onclick="wagenOpen(${i})">Bewerken</button>`}</div>
    <div class="mu">${esc([w.merk, w.brandstof, w.co2 ? w.co2 + ' g CO₂/km' : '', w.aankoop ? 'aangekocht ' + dt(w.aankoop) : '', w.nummerplaat].filter(Boolean).join(' · '))}</div>
    <div class="mu">Kosten ${j}: ${eur((S.uitgaven || []).filter((u) => u.voertuig === w.id && jaarVan(u.datum) === j).reduce((s, u) => s + kostVan(u, j).kost, 0))} beroepskost</div></div>`).join('') || '<div class="c mu">Nog geen voertuigen. Je BMW is privé? Dan hoef je hem niet toe te voegen; een camionette voeg je toe als "Lichte vracht".</div>'}`;
}
function wagenNieuw() { S.wagens.push({ id: uid('w'), naam: '', soort: 'vracht', brandstof: 'diesel', co2: '', aankoop: '', merk: '', nummerplaat: '', beroep: 75 }); save(); wagenOpen(S.wagens.length - 1); }
function wagenOpen(i) {
  modal(`<h2>Voertuig</h2>${inp('Naam (bv. Vito)', `S.wagens.${i}.naam`)}<div class="cols">${inp('Soort', `S.wagens.${i}.soort`, { sel: [['vracht', 'Lichte vracht (bestelwagen, N1)'], ['wagen', 'Personenwagen'], ['moto', 'Motorfiets']] })}${inp('Brandstof', `S.wagens.${i}.brandstof`, { sel: [['diesel', 'Diesel'], ['benzine', 'Benzine'], ['lpg', 'LPG'], ['cng', 'Aardgas (CNG)'], ['hybride', 'Hybride (niet-plug-in)'], ['pluginhybride', 'Plug-in hybride'], ['elektrisch', 'Elektrisch']] })}</div>
  <div class="cols3">${inp('CO₂ (g/km, WLTP)', `S.wagens.${i}.co2`, { num: 1 })}${inp('Aankoop- of leasedatum', `S.wagens.${i}.aankoop`, { type: 'date' })}${inp('Nummerplaat', `S.wagens.${i}.nummerplaat`)}</div>
  ${inp('Merk / model', `S.wagens.${i}.merk`)}
  <p class="mu">Het % beroepsmatig gebruik stel je in per kostencategorie (Instellingen › Kostencategorieën); standaard 20% personenwagen, 75% lichte vracht.</p>
  <div class="row"><button class="red" onclick="if(confirm('Voertuig verwijderen?')){S.wagens.splice(${i},1);save();sluit();R()}">Verwijderen</button><span class="sp"></span><button onclick="sluit();R()">Klaar</button></div>`);
}

/* ---------------- verzekeringen ---------------- */
function vVerz() {
  return `<div class="row wrap" style="margin-bottom:12px"><h1 style="margin:0">Verzekeringen</h1><span class="sp"></span>${RO ? '' : `<button onclick="S.verz.push({id:uid('v'),soort:'',maatschappij:'',polis:'',dekking:'',premie:'',freq:'jaarlijks',verval:''});save();verzOpen(S.verz.length-1)">+ Verzekering</button>`}</div>
  ${(S.verz || []).map((x, i) => `<div class="c" style="cursor:pointer" onclick="${RO ? '' : `verzOpen(${i})`}"><div class="row wrap"><b style="font-size:16px">${esc(x.soort || 'Verzekering')}</b><span class="sp"></span>${x.verval ? `<span class="tag ${x.verval < C.addDays(today(), 30) ? 'o' : ''}">vervalt ${dt(x.verval)}</span>` : ''}</div>
    <div class="mu">${esc([x.maatschappij, x.makelaar, x.polis ? 'polis ' + x.polis : ''].filter(Boolean).join(' · '))}</div><div>${esc(x.dekking || '')}</div>${x.premie ? `<div class="mu">Premie ${eur(C.num(x.premie))} ${esc(x.freq || '')}</div>` : ''}</div>`).join('')}`;
}
function verzOpen(i) {
  const x = S.verz[i];
  modal(`<h2>Verzekering</h2>${inp('Soort', `S.verz.${i}.soort`, { ph: 'bv. BA uitbating, rechtsbijstand, gewaarborgd inkomen, gereedschap, voertuig' })}<div class="cols">${inp('Maatschappij', `S.verz.${i}.maatschappij`)}${inp('Makelaar / contact', `S.verz.${i}.makelaar`)}</div>
  <div class="cols">${inp('Polisnummer', `S.verz.${i}.polis`)}${inp('Vervaldag / jaarlijkse vervaldatum', `S.verz.${i}.verval`, { type: 'date' })}</div>
  ${inp('Wat is gedekt (en verzekerde bedragen)', `S.verz.${i}.dekking`, { area: 1 })}${inp('Uitsluitingen / opmerkingen', `S.verz.${i}.opm`, { area: 1 })}
  <div class="cols">${inp('Premie (€)', `S.verz.${i}.premie`, { num: 1 })}${inp('Betaling', `S.verz.${i}.freq`, { sel: [['jaarlijks', 'jaarlijks'], ['halfjaarlijks', 'halfjaarlijks'], ['per kwartaal', 'per kwartaal'], ['maandelijks', 'maandelijks']] })}</div>
  <div class="row wrap">${x.pdf ? `<button class="b2 sm" onclick="verzPdf(${i})">Polis openen</button>` : ''}<label class="btnl b2l">${x.pdf ? 'Polis vervangen' : 'Polis (PDF) toevoegen'}<input type="file" accept="application/pdf,image/*" style="display:none" onchange="bestandData(this.files[0]).then(d=>{S.verz[${i}].pdf=d;save();sluit();verzOpen(${i})})"></label></div>
  <div class="row" style="margin-top:10px"><button class="red" onclick="if(confirm('Verwijderen?')){S.verz.splice(${i},1);save();sluit();R()}">Verwijderen</button><span class="sp"></span><button onclick="sluit();R()">Klaar</button></div>`);
}
async function verzPdf(i) { const d = await (window.CLOUD ? CLOUD.file(S.verz[i].pdf) : S.verz[i].pdf); const w = window.open(); if (w) w.document.write(`<iframe src="${d}" style="border:0;width:100%;height:100%"></iframe>`); }

/* ---------------- belastingen & sociale bijdragen (zoals Dexxter) ---------------- */
function vBelasting() {
  const j = +(filt.bj || JAAR()); const b = belJaar(j); const t = sub || 'overzicht';
  const natuurlijk = (RL.rechtsvormen[S.cfg.rechtsvorm] || {}).natuurlijk !== false;
  const tabs = natuurlijk ? [['overzicht', 'Overzicht'], ['rsz', 'Sociale bijdragen'], ['va', 'Voorafbetalingen'], ['aangifte', 'Aangifte (Tax-on-web)']] : [['overzicht', 'Overzicht'], ['rsz', 'Sociale bijdragen'], ['va', 'Voorafbetalingen']];
  let body = '';
  const P = RL.jaar(j);
  if (natuurlijk) {
    const p = pbRaming(j); const w = p.w; const r = rszRaming(j);
    if (t === 'overzicht') body = `<div class="c"><h2>Samenvatting ${j}</h2>
      <div class="dl"><span>Inkomsten (totaal)</span><b>${eur(w.omzet)}</b></div><div class="dl"><span>− Uitgaven</span><span>${eur(w.kosten)}</span></div><div class="dl"><span>− Afschrijvingen</span><span>${eur(w.afschr)}</span></div><div class="dl"><span>+ Verworpen uitgaven</span><span>${eur(w.verworpen)}</span></div>
      <div class="dl"><span><b>= Belastbaar resultaat</b></span><b>${eur(w.winst)}</b></div><div class="dl"><span>− Te betalen personenbelasting (inschatting)</span><span>${eur(p.tot)}</span></div><div class="dl"><span><b>= Nettowinst</b></span><b>${eur(p.netto)}</b></div></div>
      <div class="cols"><div class="c"><h2>Personenbelasting (inschatting)</h2><div class="dl"><span>Personenbelasting</span><span>${eur(p.fed)}</span></div><div class="dl"><span>Gemeentebelasting (${pct(p.gemPct * 100)})</span><span>${eur(p.gem)}</span></div>
        <div class="dl"><span>− Reeds betaalde voorafbetalingen</span><span>${eur(p.vaTot)}</span></div>${p.va.map((x, i) => `<div class="dl mu"><span>Kwartaal ${i + 1}</span><span>${eur(x)}</span></div>`).join('')}
        <div class="dl" style="font-size:16px"><span><b>${p.nog >= 0 ? 'Nog bij te betalen' : 'Terug te krijgen'}</b></span><b style="color:var(--ac)">${eur(Math.abs(p.nog))}</b></div>
        ${p.bon ? `<p class="mu">Bonificatie op je voorafbetalingen: ${eur(p.bon)} (verlaagt je belasting).</p>` : ''}
        <label class="f" style="margin-top:8px"><span>Jaarlijks inkomen als werknemer (bepaalt je tarief)</span><select ${RO ? 'disabled' : ''} onchange="belJaar(${j}).loonschijf=this.value;S.cfg.loonschijf=this.value;save();R()">${RL.loonschijven.map(([k, l]) => `<option value="${k}" ${p.ls === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        ${inp('Gemeentebelasting %', `S.bel.${j}.gemeente`, { num: 1, re: 1, ph: String(P.pb.gemeente * 100) })}</div>
      <div class="c"><h2>Sociale bijdragen</h2><div class="dl"><span>Totaal ${j} (inschatting)</span><span>${eur(r.tot)}</span></div><div class="dl"><span>Reeds betaald</span><span>${eur(r.betaald)}</span></div><div class="dl" style="font-size:16px"><span><b>${r.nog >= 0 ? 'Nog te betalen' : 'Terug'}</b></span><b style="color:var(--ac)">${eur(Math.abs(r.nog))}</b></div><p>${ext(LK.xerius, 'MyXerius')}</p></div></div>
      <p class="mu">Inschatting op dezelfde manier als Dexxter (winst × tarief van je loonschijf + gemeentebelasting). Geen officiële berekening.</p>`;
    if (t === 'rsz') body = `<div class="c"><h2>Grens om vrijgesteld te zijn van sociale bijdragen als bijberoeper</h2><div class="kpi"><div class="v">${eur(r.prorata)} / ${eur(r.grens)}</div><div class="s">${r.prorata > r.grens ? 'Je zit boven de grens: je betaalt bijdragen.' : 'Je zit onder de grens.'}</div></div></div>
      <div class="c"><h2>Je sociaal statuut ${j}</h2><div class="cols">${[0, 1, 2, 3].map((i) => `<label class="f"><span>Kwartaal ${i + 1}</span><select ${RO ? 'disabled' : ''} onchange="belJaar(${j}).statuut[${i}]=this.value;save();R()">${[['geen', 'Geen actief ondernemingsnummer'], ['bijberoep', 'Zelfstandige in bijberoep'], ['hoofdberoep', 'Zelfstandige in hoofdberoep']].map(([k, l]) => `<option value="${k}" ${b.statuut[i] === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>`).join('')}</div></div>
      <div class="c" style="overflow:auto"><h2>Berekening op een geproratiseerde winst van ${eur(r.prorata)}</h2><table class="t"><tr><th>Kwartaal</th><th class="r">Te betalen sociale bijdragen</th><th class="r">Beheersbijdragen (${pct(r.beheerPct * 100)})</th><th class="r">Kwartaalbijdragen</th></tr>
      ${r.kw.map((k, i) => `<tr><td>Kwartaal ${i + 1} (${{ geen: 'geen actief ondernemingsnummer', bijberoep: 'zelfstandige in bijberoep', hoofdberoep: 'zelfstandige in hoofdberoep' }[k.st]})</td><td class="r">${k.st === 'geen' ? '-' : eur(k.bijdrage)}</td><td class="r">${k.st === 'geen' ? '-' : eur(k.beheer)}</td><td class="r">${k.st === 'geen' ? '-' : eur(k.bijdrage + k.beheer)}</td></tr>`).join('')}
      <tr><td><b>Jaar</b></td><td class="r">${eur(r.kw.reduce((s, k) => s + k.bijdrage, 0))}</td><td class="r">${eur(r.kw.reduce((s, k) => s + k.beheer, 0))}</td><td class="r"><b>${eur(r.tot)}</b></td></tr>
      <tr><td>Reeds betaalde sociale bijdragen (kosten in categorie "Sociale bijdragen")</td><td></td><td></td><td class="r">${eur(-r.betaald)}</td></tr><tr><td><b>Nog te betalen</b></td><td></td><td></td><td class="r"><b>${eur(r.nog)}</b></td></tr></table>
      ${inp('Andere betaalde bijdragen die je niet als kost inboekte', `S.bel.${j}.rszExtra`, { num: 1, re: 1 })}
      <p class="mu">Betaal je voorlopige bijdragen bij Xerius uiterlijk op het einde van elk kwartaal. Verhogen kan vrijwillig om een regularisatie te vermijden. ${ext(LK.xerius, 'MyXerius')}</p></div>`;
    if (t === 'va') body = `<div class="c" style="overflow:auto"><h2>Voorafbetalingen ${j}</h2><table class="t"><tr><th>Kwartaal</th><th>Uiterste datum</th><th>Voordeel voorafbetaling</th><th class="r">Bedrag</th></tr>
      ${[0, 1, 2, 3].map((i) => `<tr><td>Voorafbetaling betaald in kwartaal ${i + 1}</td><td>${dt(P.va.data[i])}</td><td>${pct(P.va.pb.bonificatie[i] * 100)}</td><td class="r"><input style="max-width:140px;margin:0;text-align:right" inputmode="decimal" ${RO ? 'readonly' : ''} value="${esc(b.vaQ[i] || '')}" onchange="belJaar(${j}).vaQ[${i}]=C.num(this.value);save();R()"></td></tr>`).join('')}
      <tr><td colspan="3"><b>Totaal</b></td><td class="r"><b>${eur(pbRaming(j).vaTot)}</b></td></tr></table>
      <p class="mu">Een voorafbetaling is nooit verplicht, maar hoe vroeger, hoe groter het voordeel. Gebruik je persoonlijke gestructureerde mededeling uit MyMinfin. ${ext(LK.myminfin, 'MyMinfin')} ${ext(LK.voorafbetaling, 'Uitleg FOD Financiën')}</p>
      ${pbRaming(j).nog > 0 ? `<p>Om je geschatte belasting volledig te dekken, betaal je nog ± <b>${eur(pbRaming(j).nog)}</b>.</p>` : ''}</div>`;
    if (t === 'aangifte') body = vPbAangifte(j);
  } else {
    const r = belastingRaming(j); const vb = r.vb;
    if (t === 'overzicht') body = `<div class="c"><h2>Vennootschapsbelasting ${j} (inschatting)</h2>${inp('Bezoldiging bedrijfsleider (bruto per jaar)', `S.bel.${j}.bedrijfsleider`, { num: 1, re: 1 })}
      <div class="dl"><span>Winst vóór bezoldiging</span><span>${eur(r.w.winst)}</span></div><div class="dl"><span>Tarief</span><span>${vb.kmo ? '20% op eerste € 100.000 (kmo)' : '25%'}</span></div><div class="dl"><span>Vennootschapsbelasting</span><b>${eur(vb.vb)}</b></div><div class="dl"><span>Voorafbetalingen</span><span>${eur(vb.vaTot)}</span></div><div class="dl"><span>Vermeerdering</span><span>${eur(vb.verm)}</span></div><div class="dl" style="font-size:16px"><span><b>Nog te betalen</b></span><b>${eur(vb.nog)}</b></div>
      <p class="mu">Je boekhouder doet de officiële aangifte. Kmo-tarief enkel bij een bezoldiging van minstens ${eur(P.vb.kmoMinLoon)}.</p></div>`;
    if (t === 'va') body = `<div class="c"><h2>Voorafbetalingen vennootschap</h2>${(b.vbVa || []).map((x, i) => `<div class="cols3"><label class="f"><span>Datum</span><input type="date" value="${esc(x.datum || '')}" onchange="S.bel[${j}].vbVa[${i}].datum=this.value;save();R()"></label><label class="f"><span>Bedrag</span><input inputmode="decimal" value="${esc(x.bedrag || '')}" onchange="S.bel[${j}].vbVa[${i}].bedrag=C.num(this.value);save();R()"></label></div>`).join('')}<button class="b2 sm" onclick="belJaar(${j}).vbVa.push({datum:today(),bedrag:0});save();R()">+ Voorafbetaling</button>
      <p class="mu">Data: ${P.va.data.map(dt).join(' · ')} · VA5 ${dt(P.va.vb.va5)}. ${ext(LK.myminfin, 'MyMinfin')}</p></div>`;
    if (t === 'rsz') body = `<div class="c"><h2>Sociale bijdragen bedrijfsleider</h2><p class="mu">Berekend op je bezoldiging als bedrijfsleider. ${ext(LK.xerius, 'MyXerius')}</p></div>`;
  }
  return `<div class="row wrap" style="margin-bottom:12px"><h1 style="margin:0">${natuurlijk ? 'Personenbelasting & sociale bijdragen' : 'Belastingen vennootschap'}</h1><span class="sp"></span><select style="width:auto;margin:0" onchange="filt.bj=this.value;R()">${[JAAR() + 1, JAAR(), JAAR() - 1, JAAR() - 2].map((x) => `<option ${x === j ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
  <div class="chips">${tabs.map(([k, l]) => `<button class="chip ${t === k ? 'on' : ''}" onclick="go('belasting',null,'${k}')">${l}</button>`).join('')}</div>${body}`;
}
function pbCodesWaarden(j) {
  const w = winstJaar(j); const r = rszRaming(j);
  const brutomarge = C.r2(w.omzet - w.handel - w.onder);
  const sociale = C.r2(w.rsz + w.vapz + C.num(belJaar(j).rszExtra));
  const kosten = C.r2(w.kosten - w.handel - w.onder - w.rsz - w.vapz + w.afschr - w.verworpen);
  const start = S.cfg.startdatum && jaarVan(S.cfg.startdatum) === j ? dt(S.cfg.startdatum) : '';
  return { brutomarge, sociale, kosten, bijberoep: S.cfg.statuut === 'bijberoep' ? brutomarge : '', start, w, r };
}
function vPbAangifte(j) {
  const v = pbCodesWaarden(j); const P = pbRaming(j);
  const val = (k) => v[k] === '' ? '' : typeof v[k] === 'number' ? C.eurPlain(v[k]) : v[k];
  return `<div class="c"><h2>Aangifte personenbelasting – inkomsten ${j} (aanslagjaar ${j + 1})</h2>
    <p class="mu">Tax-on-web neemt geen bestand aan. Neem deze bedragen over in ${esc('Deel 2 – Vak XVII (winsten)')}. Klik op een bedrag om het te kopiëren. ${ext(LK.taxonweb, 'Tax-on-web via MyMinfin')}</p>
    ${RL.pbCodes.filter(([, , k]) => v[k] !== '' && v[k] != null).map(([code, oms, k]) => `<div class="dl" style="cursor:pointer" onclick="kopieer('${val(k)}',this.querySelector('b'))"><span><span class="tag">${code}</span> ${esc(oms)}</span><b class="tab nw">${typeof v[k] === 'number' ? eur(v[k]) : esc(v[k])}</b></div>`).join('')}
    <div class="dl"><span><span class="tag">${RL.pbVoorafbetalingCode[0]}</span> ${esc(RL.pbVoorafbetalingCode[1])}</span><b>${eur(P.vaTot)}</b></div>
    <h3>Controle</h3><div class="dl"><span>Netto belastbare winst (1600 − 1606 − 1632)</span><b>${eur(v.brutomarge - v.kosten - v.sociale)}</b></div><div class="dl"><span>Belastbaar resultaat in VET Office</span><span>${eur(v.w.winst + v.sociale - v.sociale)}</span></div>
    <p class="mu">Codes volgens het aangiftemodel van aanslagjaar 2026; controleer bij een nieuw model. Het fiscaal attest van Xerius bevat het exacte bedrag voor code 1632.</p>
    <div class="row wrap"><button onclick="pbPdf(${j})">PDF met overzicht</button>${ext(LK.taxonweb, 'Naar Tax-on-web')}</div></div>`;
}
async function kopieer(t, el) { try { await navigator.clipboard.writeText(t); } catch (e) { const a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); document.execCommand('copy'); a.remove(); } if (el) { const o = el.innerHTML; el.innerHTML = '✓ gekopieerd'; setTimeout(() => { el.innerHTML = o; }, 900); } }
async function pbPdf(j) {
  await VET_PDF.laadFonts(); const v = pbCodesWaarden(j); const P = pbRaming(j); const { jsPDF } = window.jspdf; const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  pdf.addFileToVFS('r.ttf', VET_FONTS.regular); pdf.addFont('r.ttf', 'PT', 'normal'); pdf.addFileToVFS('b.ttf', VET_FONTS.bold); pdf.addFont('b.ttf', 'PT', 'bold');
  let y = 60; const L = 40; const t = (s, x, sz = 10, b) => { pdf.setFont('PT', b ? 'bold' : 'normal'); pdf.setFontSize(sz); pdf.text(String(s), x, y); };
  t('Aangifte personenbelasting – inkomsten ' + j + ' (aj. ' + (j + 1) + ')', L, 16, 1); y += 20; t(S.cfg.bedrijf.persoon + ' – ' + S.cfg.bedrijf.naam + ' – ' + S.cfg.bedrijf.btw, L, 10); y += 30;
  t('Deel 2 – Vak XVII: winsten', L, 12, 1); y += 20;
  RL.pbCodes.forEach(([code, oms, k]) => { if (v[k] === '' || v[k] == null) return; t(code, L, 10, 1); pdf.setFont('PT', 'normal'); pdf.text(pdf.splitTextToSize(oms, 360), L + 50, y); t(typeof v[k] === 'number' ? eur(v[k]) : v[k], 555, 10, 1); pdf.text('', 0, 0); y += 26; });
  y += 10; t('Voorafbetalingen (code 1570)', L, 10, 1); t(eur(P.vaTot), 470, 10); y += 30;
  t('Overzicht', L, 12, 1); y += 18;
  [['Inkomsten', v.w.omzet], ['Uitgaven', v.w.kosten], ['Afschrijvingen', v.w.afschr], ['Verworpen uitgaven', v.w.verworpen], ['Belastbaar resultaat', v.w.winst], ['Geschatte personenbelasting incl. gemeentebelasting', P.tot]].forEach(([a, b]) => { t(a, L, 10); t(eur(b), 470, 10); y += 16; });
  y += 20; t('Opgemaakt met VET Office op ' + dt(today()) + '. Controleer met het fiscaal attest van je sociaal verzekeringsfonds.', L, 8);
  const a = document.createElement('a'); a.href = URL.createObjectURL(pdf.output('blob')); a.download = 'personenbelasting-' + j + '.pdf'; a.click();
}

/* ---------------- IC-aangifte ---------------- */
function icLijst(j, q) {
  const per = {};
  S.docs.filter((d) => d.status !== 'concept' && d.status !== 'geannuleerd' && ['factuur', 'voorschot', 'creditnota'].includes(d.type) && C.inKwartaal(d.datum, j, q)).forEach((d) => {
    const s = d.type === 'creditnota' ? -1 : 1;
    C.totalen(d).groepen.forEach((g) => {
      const code = g.code === 'ICD' ? 'S' : g.code === 'ICL' ? 'L' : null; if (!code) return;
      const btw = String(d.klant.btw || '').replace(/[\s.]/g, '').toUpperCase(); const k = btw + code;
      per[k] = per[k] || { naam: d.klant.naam, land: btw.slice(0, 2), nr: btw.slice(2), code, bedrag: 0 }; per[k].bedrag = C.r2(per[k].bedrag + s * g.basis);
    });
  });
  return Object.values(per).filter((x) => x.bedrag !== 0);
}
function vIc() {
  const k0 = C.kwartaal(today()); const vor = k0.q === 1 ? { j: k0.j - 1, q: 4 } : { j: k0.j, q: k0.q - 1 };
  const [j, q] = (filt.icq || vor.j + '-' + vor.q).split('-').map(Number); const key = j + '-Q' + q; const st = S.ic[key] || {};
  const l = icLijst(j, q); const opties = []; for (let jj = JAAR(); jj >= JAAR() - 2; jj--) for (let qq = 4; qq >= 1; qq--) opties.push(jj + '-' + qq);
  return `<div class="row wrap" style="margin-bottom:12px"><h1 style="margin:0">IC-aangifte</h1><span class="sp"></span><select style="width:auto;margin:0" onchange="filt.icq=this.value;R()">${opties.map((o) => `<option value="${o}" ${o === j + '-' + q ? 'selected' : ''}>Kwartaal ${o.split('-')[1]} ${o.split('-')[0]}</option>`).join('')}</select></div>
  <p class="mu">De intracommunautaire opgave (listing) vermeldt je leveringen (L) en diensten (S) aan btw-plichtige klanten in andere EU-landen. Zelfde termijn als de btw-aangifte. Geen IC-handelingen in een kwartaal = niets indienen.</p>
  <div class="c" style="padding:0;overflow:auto"><table class="t"><tr><th>Bedrijfsnaam</th><th>Btw-nummer</th><th>Type transactie</th><th class="r">Totaal excl. btw</th></tr>${l.map((x) => `<tr><td>${esc(x.naam)}</td><td>${esc(x.land + x.nr)}</td><td>${x.code === 'S' ? 'Diensten (S)' : 'Leveringen (L)'}</td><td class="r">${eur(x.bedrag)}</td></tr>`).join('') || '<tr><td colspan="4" class="mu" style="padding:16px">Er is geen data: geen IC-aangifte nodig voor dit kwartaal.</td></tr>'}</table></div>
  ${l.length ? `<div class="c"><h2>Status IC-aangifte</h2><p>${st.ingediend ? '✓ Ingediend op ' + dt(st.ingediend) : 'Te doen – nog niet ingediend.'}</p><div class="row wrap"><button onclick="icXml(${j},${q})">⬇ XML voor Intervat</button>${ext(LK.intervat, 'Intervat')}${ext(LK.vies, 'Btw-nummers controleren (VIES)')}${RO ? '' : st.ingediend ? `<button class="b2" onclick="S.ic['${key}']={};save();R()">Ongedaan maken</button>` : `<button class="gr" onclick="S.ic['${key}']={ingediend:today()};save();R()">Markeer als ingediend</button>`}</div></div>` : ''}`;
}
function icXml(j, q) {
  const b = S.cfg.bedrijf; const l = icLijst(j, q); const sum = C.r2(l.reduce((s, x) => s + x.bedrag, 0)); const xe = C.xe; const tel = String(b.tel || '').replace(/[^0-9+]/g, '');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ns2:IntraConsignment xmlns="http://www.minfin.fgov.be/InputCommon" xmlns:ns2="http://www.minfin.fgov.be/IntraConsignment" IntraListingsNbr="1">
<ns2:IntraListing SequenceNumber="1" ClientsNbr="${l.length}" DeclarantReference="${xe(('VOIC' + j + 'Q' + q + String(Date.now()).slice(-5)).slice(0, 14))}" AmountSum="${sum.toFixed(2)}">
<ns2:Declarant><VATNumber>${C.btwDigits(b.btw)}</VATNumber><Name>${xe(b.naam)}</Name><Street>${xe(b.straat)}</Street><PostCode>${xe(b.pc)}</PostCode><City>${xe(b.gemeente)}</City><CountryCode>BE</CountryCode>${b.email ? `<EmailAddress>${xe(b.email)}</EmailAddress>` : ''}${tel ? `<Phone>${tel}</Phone>` : ''}</ns2:Declarant>
<ns2:Period><ns2:Quarter>${q}</ns2:Quarter><ns2:Year>${j}</ns2:Year></ns2:Period>
${l.map((x, i) => `<ns2:IntraClient SequenceNumber="${i + 1}"><ns2:CompanyVATNumber issuedBy="${x.land === 'GR' ? 'EL' : x.land}">${xe(x.nr)}</ns2:CompanyVATNumber><ns2:Code>${x.code}</ns2:Code><ns2:Amount>${x.bedrag.toFixed(2)}</ns2:Amount></ns2:IntraClient>`).join('\n')}
</ns2:IntraListing>
</ns2:IntraConsignment>
`;
  dl('ic-aangifte-' + j + '-Q' + q + '.xml', xml, 'application/xml');
}

/* ---------------- rapporten ---------------- */
function vRapport() {
  const j = +(filt.rj || JAAR()); const w = winstJaar(j); const wv = winstJaar(j - 1); const t = sub || 'resultaat';
  const tabs = [['resultaat', 'Inkomsten & uitgaven'], ['maand', 'Per maand'], ['klanten', 'Klanten'], ['openstaand', 'Openstaand']];
  let body = '';
  if (t === 'resultaat') {
    const groepen = {}; Object.values(w.per).forEach((p) => { const g = groepen[p.c.h] = groepen[p.c.h] || { bb: 0, kost: 0, v: 0, items: [] }; g.bb += p.bb; g.kost += p.kost; g.v += p.verworpen; g.items.push(p); });
    body = `<div class="c" style="padding:0;overflow:auto"><table class="t"><tr><th></th><th>Btw-aftrek</th><th class="r">Berekeningsbasis</th><th>Beroepsmatig</th><th class="r">Verworpen</th><th class="r">Totaal ${j}</th><th class="r mu">${j - 1}</th></tr>
      <tr><td><b>Algemene inkomsten</b></td><td></td><td class="r">${eur(w.omzet)}</td><td></td><td></td><td class="r"><b>${eur(w.omzet)}</b></td><td class="r mu">${eur(wv.omzet)}</td></tr>
      ${Object.entries(groepen).sort((a, b) => b[1].kost - a[1].kost).map(([g, x]) => `<tr><td><b>${esc(g)}</b></td><td></td><td class="r">${eur(-x.bb)}</td><td></td><td class="r">${x.v ? eur(x.v) : ''}</td><td class="r"><b>${eur(-x.kost)}</b></td><td class="r mu">${eur(-Object.values(wv.per).filter((p) => p.c.h === g).reduce((s, p) => s + p.kost, 0))}</td></tr>${x.items.map((p) => `<tr><td style="padding-left:22px">${esc(p.c.n)}</td><td>${p.c.btw}%</td><td class="r">${eur(-p.bb)}</td><td>${p.c.beroep}%</td><td class="r">${p.verworpen ? eur(p.verworpen) : ''}</td><td class="r">${eur(-p.kost)}</td><td></td></tr>`).join('')}`).join('')}
      ${w.afschr ? `<tr><td><b>Afschrijvingen</b></td><td></td><td></td><td></td><td></td><td class="r"><b>${eur(-w.afschr)}</b></td><td class="r mu">${eur(-wv.afschr)}</td></tr>` : ''}
      <tr><td><b>Resultaat</b></td><td></td><td></td><td></td><td class="r">${eur(w.verworpen)}</td><td class="r"><b style="font-size:16px">${eur(w.winst)}</b></td><td class="r mu">${eur(wv.winst)}</td></tr></table></div>
      <button class="b2" onclick="rapportCsv(${j})">⬇ Exporteren (CSV voor Excel)</button>`;
  }
  if (t === 'maand') {
    const m = Array.from({ length: 12 }, (_, i) => ({ in: 0, uit: 0 }));
    S.docs.filter((d) => d.status !== 'concept' && d.status !== 'geannuleerd' && ['factuur', 'voorschot', 'creditnota'].includes(d.type) && jaarVan(d.datum) === j).forEach((d) => { m[+d.datum.slice(5, 7) - 1].in += (d.type === 'creditnota' ? -1 : 1) * C.totalen(d).ex; });
    (S.uitgaven || []).filter((u) => !u.privé && jaarVan(u.datum) === j).forEach((u) => { const k = kostVan(u, j); if (k.c.soort !== 'invest') m[+u.datum.slice(5, 7) - 1].uit += k.kost; });
    const max = Math.max(1, ...m.map((x) => Math.max(x.in, x.uit))); const H = 180, bw = 18;
    const mn = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
    body = `<div class="c" style="overflow:auto"><h2>${j} in kleur</h2><svg viewBox="0 0 ${12 * 56 + 40} ${H + 40}" style="width:100%;min-width:600px;height:auto">
      ${[0, 0.25, 0.5, 0.75, 1].map((f) => `<line x1="36" x2="${12 * 56 + 36}" y1="${H - f * H + 10}" y2="${H - f * H + 10}" stroke="var(--bd)"/><text x="32" y="${H - f * H + 14}" font-size="10" text-anchor="end" fill="var(--mu)">${Math.round(max * f)}</text>`).join('')}
      ${m.map((x, i) => `<rect x="${40 + i * 56}" y="${H + 10 - x.in / max * H}" width="${bw}" height="${x.in / max * H}" fill="#2e8c62" rx="3"><title>Inkomsten ${mn[i]}: ${eur(x.in)}</title></rect><rect x="${40 + i * 56 + bw + 2}" y="${H + 10 - x.uit / max * H}" width="${bw}" height="${x.uit / max * H}" fill="#c8321c" rx="3"><title>Uitgaven ${mn[i]}: ${eur(x.uit)}</title></rect><text x="${40 + i * 56 + bw}" y="${H + 28}" font-size="11" text-anchor="middle" fill="var(--mu)">${mn[i]}</text>`).join('')}</svg>
      <div class="row"><span class="tag g">Inkomsten</span><span class="tag r">Uitgaven</span></div></div>
      <div class="c" style="padding:0;overflow:auto"><table class="t"><tr><th>Maand</th><th class="r">Inkomsten</th><th class="r">Uitgaven</th><th class="r">Verschil</th></tr>${m.map((x, i) => `<tr><td>${mn[i]}</td><td class="r">${eur(x.in)}</td><td class="r">${eur(x.uit)}</td><td class="r">${eur(x.in - x.uit)}</td></tr>`).join('')}</table></div>`;
  }
  if (t === 'klanten') {
    const per = {}; S.docs.filter((d) => d.status !== 'concept' && ['factuur', 'voorschot', 'creditnota'].includes(d.type) && jaarVan(d.datum) === j).forEach((d) => { const k = d.klant.naam || '?'; per[k] = (per[k] || 0) + (d.type === 'creditnota' ? -1 : 1) * C.totalen(d).ex; });
    const l = Object.entries(per).sort((a, b) => b[1] - a[1]); const tot = l.reduce((s, x) => s + x[1], 0) || 1;
    body = `<div class="c">${l.map(([k, x]) => `<div class="dl"><span>${esc(k)}</span><span class="row"><span class="bar"><i style="width:${Math.max(2, x / tot * 100)}%"></i></span><b class="tab">${eur(x)}</b></span></div>`).join('') || '<p class="mu">Nog geen omzet.</p>'}</div>`;
  }
  if (t === 'openstaand') {
    const nu = today(); const b = { 'niet vervallen': [], '0–30 dagen': [], '31–60 dagen': [], '> 60 dagen': [] };
    S.docs.filter((d) => isFactuur(d) && d.status !== 'concept' && !afgehandeld(d)).forEach((d) => { const dg = Math.round((new Date(nu) - new Date(d.verval || d.datum)) / 864e5); (dg <= 0 ? b['niet vervallen'] : dg <= 30 ? b['0–30 dagen'] : dg <= 60 ? b['31–60 dagen'] : b['> 60 dagen']).push(d); });
    body = Object.entries(b).map(([k, l]) => `<div class="c"><h2>${k} – ${eur(l.reduce((s, d) => s + C.totalen(d).open, 0))}</h2>${l.map((d) => `<div class="dl" style="cursor:pointer" onclick="go('doc','${d.id}')"><span>${esc(d.nr)} · ${esc(d.klant.naam)} · vervalt ${dt(d.verval)}</span><b>${eur(C.totalen(d).open)}</b></div>`).join('') || '<p class="mu">Geen.</p>'}</div>`).join('');
  }
  return `<div class="row wrap" style="margin-bottom:12px"><h1 style="margin:0">Rapporten</h1><span class="sp"></span><select style="width:auto;margin:0" onchange="filt.rj=this.value;R()">${[JAAR(), JAAR() - 1, JAAR() - 2].map((x) => `<option ${x === j ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
  <div class="grid"><div class="c kpi"><h2>Inkomsten</h2><div class="v">${eur(w.omzet)}</div><div class="s">vorig jaar ${eur(wv.omzet)}</div></div><div class="c kpi"><h2>Uitgaven</h2><div class="v">${eur(w.kosten + w.afschr)}</div><div class="s">incl. ${eur(w.afschr)} afschrijvingen</div></div><div class="c kpi"><h2>Resultaat</h2><div class="v">${eur(w.winst)}</div><div class="s">vorig jaar ${eur(wv.winst)}</div></div></div>
  <div class="chips">${tabs.map(([k, l]) => `<button class="chip ${t === k ? 'on' : ''}" onclick="go('rapport',null,'${k}')">${l}</button>`).join('')}</div>${body}`;
}
function rapportCsv(j) {
  const w = winstJaar(j); const rows = [['categorie', 'hoofdcategorie', 'btw-aftrek %', 'berekeningsbasis', 'beroepsmatig %', 'verworpen', 'totaal']];
  rows.push(['Inkomsten', 'Algemene inkomsten', '', w.omzet, '', '', w.omzet]);
  Object.values(w.per).forEach((p) => rows.push([p.c.n, p.c.h, p.c.btw, -p.bb, p.c.beroep, p.verworpen, -p.kost]));
  rows.push(['Afschrijvingen', '', '', '', '', '', -w.afschr]); rows.push(['Resultaat', '', '', '', '', w.verworpen, w.winst]);
  dl('inkomsten-uitgaven-' + j + '.csv', '﻿' + rows.map((r) => r.map((c) => typeof c === 'number' ? String(C.r2(c)).replace('.', ',') : '"' + String(c).replace(/"/g, '""') + '"').join(';')).join('\n'), 'text/csv');
}

/* ---------------- tijdlijn (automatisch per jaar en kwartaal) ---------------- */
function vaData(j) { // uit de regels, of berekend (10/4, 10/7, 10/10, 20/12 – naar de eerstvolgende werkdag)
  if (RL.jaren[j]) return { data: RL.jaren[j].va.data, zeker: true };
  const wd = (d) => { const x = new Date(d + 'T12:00:00'); while (x.getDay() === 0 || x.getDay() === 6) x.setDate(x.getDate() + 1); return x.toISOString().slice(0, 10); };
  return { data: [wd(j + '-04-10'), wd(j + '-07-10'), wd(j + '-10-10'), wd(j + '-12-20')], zeker: false };
}
function tijdlijn() {
  const nu = today(); const ev = []; const add = (d, t, oms, actie, klaar, soort) => ev.push({ d, t, oms, actie, klaar: !!klaar, soort: soort || 'info' });
  for (const j of [JAAR() - 1, JAAR(), JAAR() + 1]) {
    add(j + '-01-01', 'Start fiscaal jaar ' + j, 'In een eenmanszaak begint je fiscaal jaar op 1 januari.', '', 1, 'info');
    const va = vaData(j); const b = belJaar(j);
    va.data.forEach((d, i) => add(d, `Voorafbetaling personenbelasting kwartaal ${i + 1}`, 'Optioneel. Dit is de uiterste datum (ontvangst bij de overheid telt).' + (va.zeker ? '' : ' Datum berekend – controleer.'), "go('belasting',null,'va')", C.num(b.vaQ[i]) > 0, 'va'));
    for (let q = 1; q <= 4; q++) {
      const m = q * 3 + 1; const jj = m > 12 ? j + 1 : j; const mm = String(m > 12 ? 1 : m).padStart(2, '0');
      const a = S.aang[KW(j, q)] || {};
      add(jj + '-' + mm + '-01', `Btw-aangifte kwartaal ${q} ${j} komt eraan`, 'Zowel indienen als betalen in orde brengen.', `filt.bq='${j}-${q}';go('btw')`, a.ingediend, 'info');
      add(jj + '-' + mm + '-' + RL.btwAangifte.dag, `Deadline btw-aangifte kwartaal ${q} ${j}`, 'Indienen en het eventuele saldo betalen op de provisierekening.', `filt.bq='${j}-${q}';go('btw')`, a.ingediend && (a.betaald || !(C.roosters(S.docs, S.uitgaven || [], j, q, a.extra).g['71'] > 0)), 'btw');
      if (icLijst(j, q).length) add(jj + '-' + mm + '-' + RL.btwAangifte.dag, `IC-aangifte kwartaal ${q} ${j}`, 'Intracommunautaire opgave indienen.', `filt.icq='${j}-${q}';go('ic')`, (S.ic[j + '-Q' + q] || {}).ingediend, 'btw');
      const rz = rszRaming(j); if (b.statuut[q - 1] && b.statuut[q - 1] !== 'geen' && rz.tot > 0) add(j + '-' + ['03-31', '06-30', '09-30', '12-31'][q - 1], `Sociale bijdragen kwartaal ${q} (Xerius)`, 'Voorlopige kwartaalbijdrage betalen.', "go('belasting',null,'rsz')", jaarVan(nu) > j || nu > j + '-' + ['03-31', '06-30', '09-30', '12-31'][q - 1], 'rsz');
    }
    add(j + '-10-20', 'Het jaar loopt ten einde', 'Je omzet en kosten tellen mee tot en met 31 december.', '', 0, 'info');
    add(j + '-12-20', 'Voorraad bijhouden', 'Koop je handelsgoederen aan? Noteer de waarde van je voorraad op 31 december.', '', 0, 'info');
    add((j + 1) + '-03-31', `Klantenlisting ${j} indienen`, 'Jaarlijkse lijst van Belgische btw-plichtige klanten (≥ € 250).', `go('btw',null,'listing')`, (S.aang['listing-' + j] || {}).ingediend, 'btw');
    add((j + 1) + '-06-30', `Aangifte personenbelasting inkomsten ${j}`, 'Tax-on-web opent meestal in mei. Voor zelfstandigen ligt de uiterste datum later (rond half oktober) – controleer de officiële datum.', `filt.bj=${j};go('belasting',null,'aangifte')`, 0, 'pb');
  }
  (S.verz || []).filter((x) => x.verval).forEach((x) => add(x.verval, 'Vervaldag verzekering: ' + (x.soort || ''), x.maatschappij || '', "go('verz')", 0, 'info'));
  EXT.jobs.filter((x) => vekaNodig(x)).forEach((x) => add(C.addDays(x.datum, 30), 'VEKA-melding ' + (x.nr || '') + ' (' + ((x.klant || {}).n || '') + ')', 'Melden binnen 30 dagen na het onderhoud.', "go('veka')", 0, 'veka'));
  S.docs.filter((d) => isFactuur(d) && d.status !== 'concept' && status(d) === 'vervallen').forEach((d) => add(d.verval, 'Factuur ' + d.nr + ' vervallen (' + d.klant.naam + ')', 'Stuur een herinnering.', `go('doc','${d.id}')`, 0, 'factuur'));
  const start = S.cfg.startdatum || '2000-01-01';
  return ev.filter((e) => e.d >= start || e.klaar && e.soort === 'info' && e.d >= start.slice(0, 4) + '-01-01').sort((a, b) => a.d.localeCompare(b.d));
}
function evKleur(e) { const nu = today(); if (e.klaar) return 'n'; if (e.d < nu && (e.soort === 'info' || e.soort === 'va' || (S.cfg.dexxter && ['btw', 'rsz', 'pb'].includes(e.soort)))) return 'n'; if (e.d < nu) return 'r'; if (e.d <= C.addDays(nu, 7)) return 'o'; return ''; }
function deadlines() { const nu = today(); return tijdlijn().filter((e) => !e.klaar && e.soort !== 'info' && (e.d >= C.addDays(nu, -60))).filter((e) => e.d >= nu || ['btw', 'veka', 'factuur', 'pb'].includes(e.soort)).slice(0, 8).map((e) => ({ d: e.d, t: e.t, go: e.actie || "go('tijdlijn')", kl: evKleur(e) })); }
function vTijdlijn() {
  const j = +(filt.tj || JAAR()); const l = tijdlijn().filter((e) => jaarVan(e.d) === j); const nu = today();
  return `<div class="row wrap" style="margin-bottom:12px"><h1 style="margin:0">Tijdlijn</h1><span class="sp"></span><select style="width:auto;margin:0" onchange="filt.tj=this.value;R()">${[JAAR() - 1, JAAR(), JAAR() + 1].map((x) => `<option ${x === j ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
  <p class="mu">Fiscale events ${j}, automatisch op basis van je statuut, je startdatum (${dt(S.cfg.startdatum)}), je kwartalen en wat je al indiende of betaalde.${S.cfg.dexxter ? ' In Dexxter-modus kleuren voorbije aangiftes niet rood (je doet ze in Dexxter).' : ''} <span class="tag r">te laat</span> <span class="tag o">binnen 7 dagen</span> <span class="tag n">afgewerkt</span></p>
  <div class="tl">${l.map((e) => `<div class="tli ${e.d < nu ? 'past' : ''}" ${e.actie ? `style="cursor:pointer" onclick="${e.actie}"` : ''}><div class="tld">${dt(e.d)}</div><div><b>${esc(e.t)}</b> ${e.klaar ? '<span class="tag n">✓ in orde</span>' : evKleur(e) === 'r' ? '<span class="tag r">te laat</span>' : evKleur(e) === 'o' ? '<span class="tag o">binnenkort</span>' : ''}<div class="mu">${esc(e.oms)}</div></div></div>`).join('')}</div>`;
}

/* ---------------- VEKA-meldingen (status gedeeld met VET Heat) ---------------- */
const HOOFD = { '2000': 'Antwerpen', '2018': 'Antwerpen', '2020': 'Antwerpen', '2030': 'Antwerpen', '2040': 'Antwerpen', '2050': 'Antwerpen', '2060': 'Antwerpen', '2100': 'Antwerpen', '2140': 'Antwerpen', '2170': 'Antwerpen', '2180': 'Antwerpen', '2600': 'Antwerpen', '2610': 'Antwerpen', '2660': 'Antwerpen' };
function splitAdres(st) { const m = String(st || '').trim().match(/^(.*?)[\s,]+(\d+[A-Za-z]?)(?:\s*(?:bus|bte|b\.?|\/)\s*([\w.-]+))?\s*$/i); return m ? { straat: m[1], nr: m[2], bus: m[3] || '' } : { straat: st || '', nr: '', bus: '' }; }
const vekaSt = (j) => S.veka[j.id] || j.veka || {};
const vekaNodig = (j) => j.status === 'afgewerkt' && !vekaSt(j).ok;
const vekaLeft = (j) => 30 - Math.round((new Date(today()) - new Date(j.datum)) / 864e5);
function vekaFields(j) {
  const c = EXT.heatCfg || { tech: {} }, k = j.km || {}, at = j.at && j.at.anders ? j.at : { straat: (j.klant || {}).straat, pc: (j.klant || {}).pc }, pc = (at.pc || '').match(/^\s*(\d{4})\s*(.*)$/) || [], a = splitAdres(at.straat);
  const gem = HOOFD[pc[1]] || pc[2] || at.pc || '', deel = pc[2] && HOOFD[pc[1]] && pc[2].toLowerCase() !== HOOFD[pc[1]].toLowerCase() ? ' (deelgemeente ' + pc[2] + ')' : '';
  const br = { gas: 'Gas – ' + ({ aardgas: 'aardgas', lpg: 'LPG', andere: k.gasAndereTxt || 'andere' }[k.gassoort] || ''), vloeibaar: 'Stookolie (vloeibaar)', vast: 'Vaste brandstof – ' + ({ pellets: 'houtpellets', blokken: 'houtblokken', andere: k.vastAndereTxt || 'andere' }[k.vastSoort] || '') }[k.brandstof] || '';
  const t = j.toestel || {}, bn = j.brander || {}, v = j.verb || {};
  return [['#', 'Stap 4 – Gegevens activiteit'], ['Type activiteit', v.soort === 'keuring' ? 'Keuring voor eerste ingebruikname' : 'Onderhoud'], ['Datum activiteit', dt(j.datum)],
    ['Type verwarming', { individueel: 'Individueel', collectief: 'Collectief', onbekend: 'Onbekend' }[k.verw || 'individueel']],
    ['Gemeente (hoofdgemeente)', gem, deel], ['Postcode', pc[1] || ''], ['Straatnaam', a.straat], ['Huisnummer', a.nr], ['Busnummer', a.bus],
    ['#', 'Stap 5 – Kenmerken stooktoestel'], ['Brandstof', br.replace(/ – $/, '')], ['Type toestel', k.aansl ? 'Type ' + k.aansl + (k.code ? ' (' + k.code + ')' : '') : ''], ['Merk', t.merk], ['Type / model', t.type], ['Fabricatienummer', t.serie], ['Bouwjaar', t.bouwjaar], ['Nominaal vermogen (kW)', t.vermogen],
    ['Brander merk/type', [bn.merk, bn.type].filter(Boolean).join(' ')],
    ['#', 'Stap 6 – Eindbeoordeling'], ['Het toestel werkt', [{ goed: 'goed', nietgoed: 'niet goed' }[v.werkt], { veilig: 'veilig', nietveilig: 'niet veilig' }[v.veilig]].filter(Boolean).join(' en ')],
    ['Uitvoerder', 'Schuifje naar rechts: ik ben de erkend technicus (' + [(c.tech || {}).gv, (c.tech || {}).tv].filter(Boolean).join(' / ') + ')'], ['Opmerking (optioneel)', 'Volgnummer attest ' + j.nr]].filter((x) => x[0] === '#' || x[1]);
}
function vVeka() {
  const fl = sub || 'open';
  const l = EXT.jobs.filter((j) => j.status === 'afgewerkt' && (fl === 'open' ? vekaNodig(j) : !vekaNodig(j))).sort((a, b) => (a.datum || '').localeCompare(b.datum || ''));
  return `<div class="row wrap" style="margin-bottom:12px"><h1 style="margin:0">VEKA-meldingen</h1><span class="sp"></span>${ext(LK.veka, 'Open VEKA-meldingsportaal')}</div>
  <p class="mu">Melding verplicht binnen 30 dagen na onderhoud of keuring. De status "gemeld" wordt gedeeld met VET Heat (alle toestellen). Klik op een waarde om ze te kopiëren en plak ze in het VEKA-formulier.</p>
  <div class="chips">${[['open', 'Te melden (' + EXT.jobs.filter(vekaNodig).length + ')'], ['gemeld', 'Gemeld']].map(([k, lb]) => `<button class="chip ${fl === k ? 'on' : ''}" onclick="go('veka',null,'${k}')">${lb}</button>`).join('')}</div>
  ${l.map((j) => { const n = vekaLeft(j); const st = vekaSt(j); return `<div class="c"><div class="row wrap"><b style="font-size:16px">${esc(j.nr)} · ${esc((j.klant || {}).n || '')}</b>${fl === 'open' ? `<span class="tag ${n < 0 ? 'r' : n <= 7 ? 'o' : ''}">${n < 0 ? 'te laat (' + (-n) + ' d)' : 'nog ' + n + ' dagen'}</span>` : `<span class="tag g">✓ gemeld ${dt(st.d)}</span>`}<span class="sp"></span>
    ${fl === 'open' ? `<button class="b2 sm" onclick="kopieer(vekaFields(EXT.jobs.find(x=>x.id==='${j.id}')).map(([a,b])=>a=='#'?'\\n'+b:a+': '+b).join('\\n').trim(),this)">Kopieer alles</button>${RO ? '' : `<button class="gr sm" onclick="vekaZet('${j.id}',true)">Gemeld ✓</button>`}` : RO ? '' : `<button class="b2 sm" onclick="if(confirm('Terug op niet gemeld zetten?'))vekaZet('${j.id}',false)">Toch niet gemeld</button>`}</div>
    ${fl === 'open' ? `<details><summary class="mu" style="cursor:pointer;margin-top:6px">Gegevens voor het formulier</summary>${vekaFields(j).map(([a, b, x]) => a === '#' ? `<h3 style="margin:12px 0 2px">${esc(b)}</h3>` : `<div class="dl" style="cursor:pointer" onclick="kopieer(${esc(JSON.stringify(b))},this.querySelector('b'))"><span class="mu">${esc(a)}</span><span><b>${esc(b)}</b>${x ? `<span class="mu">${esc(x)}</span>` : ''}</span></div>`).join('')}</details>` : ''}</div>`; }).join('') || `<div class="c mu">${fl === 'open' ? 'Geen openstaande meldingen 👍' : 'Nog niets gemeld.'}</div>`}`;
}
function vekaZet(id, ok) { S.veka[id] = { ok, d: ok ? today() : '' }; save(); R(); toast(ok ? 'Gemeld – ook zichtbaar in VET Heat' : 'Teruggezet'); }

/* ---------------- dossiers: werkbon + attesten → één factuur ---------------- */
function attestenVan(o) { return EXT.jobs.filter((j) => (o.src && o.src.app === 'heat' && o.src.id === j.id) || (j.wb && j.wb.id === o.id)); }
function teFactureren() {
  return EXT.orders.filter((o) => o.status === 'afgewerkt' && !S.docs.some((d) => d.bron && d.bron.app === 'work' && d.bron.id === o.id) && !(S.cfg.wbNegeer || []).includes(o.id));
}
function losseAttesten() { return EXT.jobs.filter((j) => j.office && j.office.pdf && !EXT.orders.some((o) => attestenVan(o).includes(j)) && !S.docs.some((d) => d.bron && d.bron.app === 'heat' && d.bron.id === j.id) && !(S.cfg.wbNegeer || []).includes(j.id)); }
function vWerkbonnen() {
  const tf = teFactureren(); const la = losseAttesten();
  const kaart = (o) => { const at = attestenVan(o); const uren = (o.t || []).reduce((s, x) => s + Math.max(0, (x.e - x.s) / 3600000), 0); return `<div class="c"><div class="row wrap"><b style="font-size:16px">${esc(o.klant)}</b><span class="mu">${dt(o.datum)}</span><span class="sp"></span>${RO ? '' : `<button onclick="werkbonFactuur('${o.id}')">Factuur maken</button><button class="lnk sm" onclick="(S.cfg.wbNegeer=S.cfg.wbNegeer||[]).push('${o.id}');save();R()">negeren</button>`}</div>
    <div class="mu">${esc(o.omschr || '')}</div>
    <div class="row wrap" style="margin-top:8px"><span class="tag">🔧 Werkbon ${esc(o.nr)}${uren ? ' · ' + uren.toFixed(2).replace('.', ',') + ' u' : ''}</span>${o.pdf ? `<button class="lnk sm" onclick="bestandOpen('${esc(o.pdf)}')">PDF</button>` : '<span class="mu">(PDF volgt bij volgende sync van VET Work)</span>'}
    ${at.map((j) => `<span class="tag g">🔥 Attest ${esc(j.nr)}</span>${j.office && j.office.pdf ? `<button class="lnk sm" onclick="bestandOpen('${esc(j.office.pdf)}')">PDF</button>` : '<span class="mu">(nog niet naar Office gestuurd)</span>'}`).join('')}</div></div>`; };
  return `<h1>Te factureren</h1><p class="mu">Per klantbezoek: de afgewerkte werkbon uit VET Work en de attesten uit VET Heat. "Factuur maken" neemt de lijnen van de werkbon over en voegt werkbon en attesten toe als bijlagen.</p>
  ${tf.map(kaart).join('') || '<div class="c mu">Geen afgewerkte werkbonnen te factureren.</div>'}
  ${la.length ? `<h3>Attesten zonder werkbon</h3>${la.map((j) => `<div class="c"><div class="row wrap"><b>${esc((j.klant || {}).n)}</b><span class="mu">${dt(j.datum)} · attest ${esc(j.nr)}</span><span class="sp"></span><button class="lnk sm" onclick="bestandOpen('${esc(j.office.pdf)}')">PDF</button>${RO ? '' : `<button onclick="attestDoc('${j.id}','factuur')">Factuur maken</button><button class="lnk sm" onclick="(S.cfg.wbNegeer=S.cfg.wbNegeer||[]).push('${j.id}');save();R()">negeren</button>`}</div></div>`).join('')}` : ''}
  <h3>Recent gefactureerd</h3>${S.docs.filter((d) => d.bron && ['work', 'heat'].includes(d.bron.app)).slice(0, 10).map((d) => `<div class="dl" style="cursor:pointer" onclick="go('doc','${d.id}')"><span>${esc(d.nr || 'concept')} · ${esc(d.klant.naam)} · ${esc(d.bron.label || '')}</span>${tagSt(d)}</div>`).join('') || '<p class="mu">Nog niets.</p>'}`;
}
async function bestandOpen(ref) { try { const d = await (window.CLOUD ? CLOUD.file(ref) : ref); const blob = b64Blob(String(d).split(',')[1], String(d).slice(5, String(d).indexOf(';'))); window.open(URL.createObjectURL(blob), '_blank'); } catch (e) { alert('Kon het bestand niet openen: ' + e.message); } }
function bijlagenVoor(o, jobs) {
  const b = []; if (o && o.pdf) b.push({ naam: 'Werkbon ' + o.nr + '.pdf', ref: o.pdf, soort: 'werkbon' });
  (jobs || []).forEach((j) => { if (j.office && j.office.pdf) b.push({ naam: (j.office.nm || ('Attesten ' + j.nr + '.pdf')), ref: j.office.pdf, soort: 'attest' }); });
  return b;
}
const _werkbonFactuurOud = typeof werkbonFactuur === 'function' ? werkbonFactuur : null;
function werkbonFactuur(id) {
  const o = EXT.orders.find((x) => x.id === id); if (!o) return;
  let k = S.klanten.find((c) => (c.n || '').trim().toLowerCase() === (o.klant || '').trim().toLowerCase());
  const btw = o.btw ? String(o.btw) : S.cfg.standaardBtw; const kt = k && (S.klantx[k.id] || {}).type === 'aannemer' ? 'VERL' : btw;
  const lijnen = (o.werk || []).filter((w) => w.n).map((w) => { const a = (S.artikels || []).find((x) => x.n === w.n) || {}; return lijnNieuw({ oms: w.n, det: a.det || '', aantal: C.num(w.q) || 1, eenheid: w.u === 'uur' ? 'uren' : (w.u && w.u !== 'stuk' ? w.u : 'stuks'), prijs: C.num(w.p != null ? w.p : a.p), btw: kt }); });
  const uren = (o.t || []).reduce((s, x) => s + Math.max(0, (x.e - x.s) / 3600000), 0);
  if (uren > 0 && !lijnen.some((l) => l.eenheid === 'uren')) { const u = Math.ceil(uren * 4) / 4; lijnen.push(lijnNieuw({ oms: 'Werkuren', aantal: Math.min(1, u), eenheid: 'uren', prijs: S.cfg.uur1, btw: kt })); if (u > 1) lijnen.push(lijnNieuw({ oms: 'Werkuren (elk volgend uur)', aantal: u - 1, eenheid: 'uren', prijs: S.cfg.uur2, btw: kt })); }
  const klant = k ? klantSnapshot(k) : Object.assign({ naam: o.klant || '' }, (() => { const m = String(o.adres || '').match(/^(.*?)[,\s]+(\d{4})\s+(.+)$/); return m ? { straat: m[1], pc: m[2], gemeente: m[3] } : { straat: o.adres || '' }; })(), { email: o.mail || '', tel: o.tel || '' });
  const jobs = attestenVan(o); const bij = bijlagenVoor(o, jobs);
  nieuwDoc('factuur', { klant, lijnen, bijlagen: bij, opm: [o.omschr ? 'Werkbon ' + o.nr + ': ' + o.omschr : 'Werkbon ' + o.nr, o.opm, jobs.length ? 'Certificaten in bijlage.' : ''].filter(Boolean).join('\n'), bron: { app: 'work', id: o.id, label: 'werkbon ' + o.nr + (jobs.length ? ' + attest ' + jobs.map((j) => j.nr).join(', ') : '') } });
}
function attestDoc(id, type) {
  const j = EXT.jobs.find((x) => x.id === id); const kn = (j.klant || {}); let k = S.klanten.find((c) => c.id === j.cid) || S.klanten.find((c) => (c.n || '').toLowerCase() === (kn.n || '').toLowerCase());
  const art = (S.artikels || []).find((a) => /onderhoud/i.test(a.n)) || { n: 'Onderhoud gasketel', det: 'Onderhoud uitvoeren op een gasketel en het opstellen van de officiële certificaten.', p: 150 };
  nieuwDoc(type, { klant: k ? klantSnapshot(k) : { naam: kn.n, straat: kn.straat, pc: splitPcG(kn.pc).pc, gemeente: splitPcG(kn.pc).gemeente, email: kn.mail }, lijnen: [lijnNieuw({ oms: art.n, det: art.det || '', prijs: C.num(art.p), eenheid: 'stuks' })], bijlagen: type === 'factuur' ? bijlagenVoor(null, [j]) : [], opm: type === 'factuur' ? 'Certificaten in bijlage.' : S.cfg.opm.offerte, bron: { app: 'heat', id: j.id, label: 'attest ' + j.nr } });
}

/* ---------------- instellingen: kostencategorieën ---------------- */
function vKostcats() {
  const l = alleCats(); const groepen = [...new Set(l.map((c) => c.h))].sort();
  return `<div class="c"><h2>Kostencategorieën</h2><p class="mu">Zelfde indeling als Dexxter. Pas het % beroepsmatig gebruik en de btw-aftrek aan naar jouw situatie, of voeg een eigen categorie toe.</p>
  <input placeholder="Zoeken…" oninput="[...document.querySelectorAll('.kcr')].forEach(e=>e.style.display=e.textContent.toLowerCase().includes(this.value.toLowerCase())?'':'none')">
  ${groepen.map((g) => `<h3>${esc(g)}</h3>${l.filter((c) => c.h === g).map((c) => `<div class="kcr dl"><span style="flex:1"><b>${esc(c.n)}</b>${c.eigen ? ' <span class="tag">eigen</span>' : ''}<div class="mu">${esc(c.oms || '')}</div></span><span class="row" style="gap:6px"><label class="mu nw">beroep % <input style="width:62px;margin:0" inputmode="decimal" ${RO ? 'readonly' : ''} value="${c.beroep}" onchange="kcZet('${c.id}','beroep',this.value)"></label><label class="mu nw">btw % <input style="width:62px;margin:0" inputmode="decimal" ${RO ? 'readonly' : ''} value="${c.btw}" onchange="kcZet('${c.id}','btw',this.value)"></label>${c.eigen && !RO ? `<button class="lnk" onclick="kcWeg('${c.id}')">✕</button>` : ''}</span></div>`).join('')}`).join('')}
  ${RO ? '' : `<h3>Eigen categorie toevoegen</h3><div class="cols3"><input id="kcn" placeholder="Naam"><select id="kch">${groepen.map((g) => `<option>${esc(g)}</option>`).join('')}</select><select id="kcr"><option value="82">82 diensten & diverse goederen</option><option value="81">81 handelsgoederen</option><option value="83">83 investering</option></select></div><div class="cols3"><input id="kcb" inputmode="decimal" placeholder="% beroepsmatig (100)"><input id="kca" inputmode="decimal" placeholder="% btw-aftrek (100)"><button onclick="kcNieuw()">Toevoegen</button></div>
  <button class="b2 sm" onclick="if(confirm('Alle aanpassingen aan de standaardcategorieën terugzetten?')){S.cfg.kcAanp={};save();R()}">Standaardpercentages terugzetten</button>`}</div>`;
}
function kcZet(id, k, val) { const eigen = (S.cfg.kcEigen || []).find((c) => c.id === id); if (eigen) eigen[k] = C.num(val); else { S.cfg.kcAanp = S.cfg.kcAanp || {}; S.cfg.kcAanp[id] = Object.assign(S.cfg.kcAanp[id] || {}, { [k]: C.num(val) }); } save(); toast('Opgeslagen'); }
function kcNieuw() { const n = $('#kcn').value.trim(); if (!n) return; S.cfg.kcEigen = S.cfg.kcEigen || []; S.cfg.kcEigen.push({ id: uid('kc'), n, h: $('#kch').value, rooster: $('#kcr').value, beroep: C.num($('#kcb').value || 100), btw: C.num($('#kca').value || 100), eigen: true }); save(); R(); }
function kcWeg(id) { if ((S.uitgaven || []).some((u) => u.kc === id)) return alert('Deze categorie is in gebruik.'); S.cfg.kcEigen = S.cfg.kcEigen.filter((c) => c.id !== id); save(); R(); }
