/* VET Office – overige schermen: overzicht, uitgaven, Peppol-inbox, bank, btw-aangifte, belastingen, werkbonnen, attesten, aanvragen, instellingen */

/* ---------------- hulp ---------------- */
const volgendeControle = (j) => [j.volgT, j.volgK, j.volgV].filter(Boolean).sort()[0] || '';
function teFactureren() { return EXT.orders.filter((o) => o.status === 'afgewerkt' && !S.docs.some((d) => d.bron && d.bron.app === 'work' && d.bron.id === o.id) && !(S.cfg.wbNegeer || []).includes(o.id)); }
const KW = (j, q) => j + '-Q' + q;
function deadlines() {
  const out = []; const nu = today(); const j = JAAR();
  for (const jj of [j, j + 1]) for (let q = 1; q <= 4; q++) {
    const m = q * 3 + 1; const jaarD = m > 12 ? jj + 1 : jj; const d = jaarD + '-' + String(m > 12 ? 1 : m).padStart(2, '0') + '-' + String(RL.btwAangifte.dag).padStart(2, '0');
    if (d >= nu && !(S.aang[KW(jj, q)] || {}).ingediend) out.push({ d, t: `Btw-aangifte Q${q} ${jj} indienen + betalen`, go: `filt.bq='${jj}-${q}';go('btw')` });
  }
  const P = RL.jaar(j); P.va.data.forEach((d, i) => { if (d >= nu) out.push({ d, t: `Voorafbetaling VA${i + 1} (${(P.va.pb.bonificatie[i] * 100).toFixed(1).replace('.0', '')}% bonificatie)`, go: "go('belasting')" }); });
  [['03-31', 1], ['06-30', 2], ['09-30', 3], ['12-31', 4]].forEach(([md, q]) => { const d = j + '-' + md; if (d >= nu) out.push({ d, t: `Sociale bijdragen Q${q} betalen (uiterlijk einde kwartaal)`, go: "go('belasting')" }); });
  const kl = (j + 1) + '-03-31'; out.push({ d: kl, t: `Klantenlisting ${j} indienen (Intervat)`, go: `go('btw',null,'listing')` });
  return out.sort((a, b) => a.d.localeCompare(b.d)).slice(0, 7);
}
function winstJaar(j) {
  const omzet = S.docs.filter((d) => d.status !== 'concept' && ['factuur', 'voorschot', 'creditnota'].includes(d.type) && String(d.datum).startsWith(String(j))).reduce((s, d) => s + (d.type === 'creditnota' ? -1 : 1) * C.totalen(d).ex, 0);
  let kosten = 0, invest = 0;
  (S.uitgaven || []).filter((u) => !u.privé).forEach((u) => {
    const ex = (u.tarieven || []).reduce((s, t) => s + C.num(t.basis) + (u.regime === 'normaal' || !u.regime ? C.num(t.btw) * (1 - (u.aftrek == null ? 100 : C.num(u.aftrek)) / 100) : 0), 0) * (u.creditnota ? -1 : 1) * ((u.beroep == null ? 100 : C.num(u.beroep)) / 100);
    if (u.cat === '83') { const jr = +String(u.datum).slice(0, 4); const n = C.num(u.afschrijving || S.cfg.afschrijving || 3); if (j >= jr && j < jr + n) invest += ex / n; }
    else if (String(u.datum).startsWith(String(j))) kosten += ex;
  });
  return { omzet: C.r2(omzet), kosten: C.r2(kosten), afschr: C.r2(invest), winst: C.r2(omzet - kosten - invest) };
}

/* ---------------- overzicht ---------------- */
function vHome() {
  const j = JAAR(); const k = C.kwartaal(today());
  const w = winstJaar(j);
  const omzetQ = S.docs.filter((d) => d.status !== 'concept' && ['factuur', 'voorschot', 'creditnota'].includes(d.type) && C.inKwartaal(d.datum, k.j, k.q)).reduce((s, d) => s + (d.type === 'creditnota' ? -1 : 1) * C.totalen(d).ex, 0);
  const open = S.docs.filter((d) => isFactuur(d) && d.status !== 'concept' && !afgehandeld(d));
  const verv = open.filter((d) => status(d) === 'vervallen');
  const rb = C.roosters(S.docs, S.uitgaven || [], k.j, k.q, (S.aang[KW(k.j, k.q)] || {}).extra);
  const bel = belastingRaming(j);
  const tf = teFactureren(); const nieuweA = EXT.aanvragen.filter((a) => !(S.aanvraagSt[a.id] || {}).st);
  const binnenkort = EXT.jobs.filter((x) => { const n = volgendeControle(x); return n && n <= C.addDays(today(), 45) && n >= C.addDays(today(), -60); });
  return `<h1>Overzicht</h1>
  <div class="grid">
    <div class="c kpi"><h2>Omzet ${j}</h2><div class="v">${eur(w.omzet)}</div><div class="s">dit kwartaal ${eur(omzetQ)} · excl. btw</div></div>
    <div class="c kpi" style="cursor:pointer" onclick="filt.st='';go('facturen')"><h2>Openstaand</h2><div class="v">${eur(open.reduce((s, d) => s + C.totalen(d).open, 0))}</div><div class="s">${open.length} facturen${verv.length ? ` · <b style="color:var(--rd)">${verv.length} vervallen</b>` : ''}</div></div>
    <div class="c kpi" style="cursor:pointer" onclick="go('btw')"><h2>Btw Q${k.q} ${k.j}</h2><div class="v">${rb.g['72'] ? '+ ' + eur(rb.g['72']) : eur(rb.g['71'] || 0)}</div><div class="s">${rb.g['72'] ? 'terug te krijgen' : 'te betalen'} (tot nu)</div></div>
    <div class="c kpi" style="cursor:pointer" onclick="go('belasting')"><h2>Belastingen ${j}</h2><div class="v">${bel.nog >= 0 ? eur(bel.nog) : '+ ' + eur(-bel.nog)}</div><div class="s">${bel.nog >= 0 ? 'nog te betalen (raming)' : 'terug (raming)'} · winst ${eur(w.winst)}</div></div>
  </div>
  <div class="cols"><div class="c"><h2>Te doen</h2>
    ${tf.length ? `<div class="dl" style="cursor:pointer" onclick="go('werkbonnen')"><span>🔧 Afgewerkte werkbonnen te factureren</span><b>${tf.length}</b></div>` : ''}
    ${verv.length ? `<div class="dl" style="cursor:pointer" onclick="filt.st='vervallen';go('facturen')"><span>⏰ Vervallen facturen (herinnering sturen)</span><b>${verv.length}</b></div>` : ''}
    ${(S.peppolIn || []).filter((p) => !p.verwerkt).length ? `<div class="dl" style="cursor:pointer" onclick="go('peppol')"><span>📥 Nieuwe Peppol-facturen</span><b>${S.peppolIn.filter((p) => !p.verwerkt).length}</b></div>` : ''}
    ${nieuweA.length ? `<div class="dl" style="cursor:pointer" onclick="go('aanvragen')"><span>📞 Nieuwe aanvragen</span><b>${nieuweA.length}</b></div>` : ''}
    ${binnenkort.length ? `<div class="dl" style="cursor:pointer" onclick="go('attesten')"><span>🔥 Onderhoud binnenkort (VET Heat)</span><b>${binnenkort.length}</b></div>` : ''}
    ${(S.bank.tx || []).filter((t) => !t.doc && !t.uitgave && !t.genegeerd).length ? `<div class="dl" style="cursor:pointer" onclick="go('bank')"><span>🏦 Banktransacties te koppelen</span><b>${S.bank.tx.filter((t) => !t.doc && !t.uitgave && !t.genegeerd).length}</b></div>` : ''}
    ${!tf.length && !verv.length && !nieuweA.length ? '<p class="mu">Alles bijgewerkt 👍</p>' : ''}
  </div><div class="c"><h2>Deadlines</h2>${deadlines().map((x) => `<div class="dl" style="cursor:pointer" onclick="${x.go}"><span>${esc(x.t)}</span><b class="nw">${dt(x.d)}</b></div>`).join('')}</div></div>`;
}

/* ---------------- uitgaven ---------------- */
function vUitgaven() {
  const j = +filt.jaar || JAAR(); const q = filt.q.toLowerCase();
  const l = (S.uitgaven || []).filter((u) => String(u.datum).startsWith(String(j)) && (!q || [u.leverancier, u.nr, u.oms].join(' ').toLowerCase().includes(q))).sort((a, b) => (b.datum || '').localeCompare(a.datum || ''));
  const tot = l.reduce((s, u) => { (u.tarieven || []).forEach((t) => { s.ex += C.num(t.basis) * (u.creditnota ? -1 : 1); s.btw += C.num(t.btw) * (u.creditnota ? -1 : 1); }); return s; }, { ex: 0, btw: 0 });
  return `<div class="row wrap" style="margin-bottom:12px"><h1 style="margin:0">Uitgaven</h1><span class="sp"></span>${RO ? '' : `<button onclick="uitgaveNieuw()">+ Uitgave</button><label class="b2" style="padding:9px 14px;border-radius:8px;background:var(--ac2);color:var(--ac);font-weight:600;cursor:pointer">📷 Foto/PDF<input type="file" accept="image/*,application/pdf" capture="environment" style="display:none" onchange="uitgaveFoto(this.files[0])"></label>`}</div>
  <div class="row wrap" style="margin-bottom:10px"><input style="max-width:280px" placeholder="Zoeken…" value="${esc(filt.q)}" oninput="filt.q=this.value;clearTimeout(window._ft);window._ft=setTimeout(R,250)"><select style="max-width:110px" onchange="filt.jaar=this.value;R()">${[JAAR(), JAAR() - 1, JAAR() - 2].map((x) => `<option ${j === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
  <div class="c" style="padding:0;overflow:auto"><table class="t"><tr><th>Datum</th><th>Leverancier</th><th>Soort</th><th class="r">Excl. btw</th><th class="r">Btw</th><th></th></tr>
  ${l.map((u) => { const ex = (u.tarieven || []).reduce((s, t) => s + C.num(t.basis), 0), b = (u.tarieven || []).reduce((s, t) => s + C.num(t.btw), 0); return `<tr class="cl" onclick="go('uitgave','${u.id}')"><td class="nw">${dt(u.datum)}</td><td><b>${esc(u.leverancier || '?')}</b> <span class="mu">${esc(u.nr || '')}</span>${u.creditnota ? ' <span class="tag o">creditnota</span>' : ''}${u.bron === 'peppol' ? ' <span class="tag">Peppol</span>' : ''}</td><td class="mu">${esc(u.cat || '82')}${u.regime && u.regime !== 'normaal' ? ' · ' + esc(u.regime) : ''}</td><td class="r tab">${eur(ex)}</td><td class="r tab">${eur(b)}</td><td>${u.betaald ? '<span class="tag g">betaald</span>' : '<span class="tag o">open</span>'}${u.bijlage ? ' 📎' : ''}</td></tr>`; }).join('') || '<tr><td colspan="6" class="mu" style="padding:16px">Nog geen uitgaven in ' + j + '.</td></tr>'}</table></div>
  <p class="mu">${l.length} uitgaven · ${eur(tot.ex)} excl. btw · ${eur(tot.btw)} btw</p>`;
}
function uitgaveNieuw(o = {}) { if (RO) return; const u = Object.assign({ id: uid('u'), datum: today(), leverancier: '', nr: '', oms: '', cat: '82', regime: 'normaal', tarieven: [{ pct: 21, basis: 0, btw: 0 }], aftrek: 100, beroep: 100, betaald: false, bijlage: '' }, o); S.uitgaven = S.uitgaven || []; S.uitgaven.unshift(u); save(); go('uitgave', u.id); }
async function uitgaveFoto(f) { if (!f) return; const data = await bestandData(f); uitgaveNieuw({ bijlage: data, oms: f.name }); }
const bestandData = (f) => new Promise((res) => { if (!/^image\//.test(f.type)) { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(f); return; } const img = new Image(); img.onload = () => { const m = 1600, s = Math.min(1, m / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = img.width * s; c.height = img.height * s; c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', 0.8)); }; img.src = URL.createObjectURL(f); });
function vUitgave() {
  const u = curUitgave(); if (!u) return 'Niet gevonden';
  const ro = RO;
  return `<div class="row" style="margin-bottom:10px"><button class="lnk" onclick="go('uitgaven')">‹ Uitgaven</button><span class="sp"></span>${ro ? '' : `<button class="red" onclick="uitgaveWeg()">Verwijderen</button>`}</div>
  <h1>${esc(u.leverancier || 'Nieuwe uitgave')}</h1>
  <div class="cols"><div class="c"><h2>Factuur</h2>
    ${inp('Leverancier', 'U.leverancier')}<div class="cols">${inp('Factuurnummer', 'U.nr')}${inp('Factuurdatum', 'U.datum', { type: 'date' })}</div>
    ${inp('Omschrijving', 'U.oms')}
    ${inp('Soort (btw-rooster)', 'U.cat', { sel: Object.entries(RL.uitgaveCategorieen).map(([k, l]) => [k, k + ' – ' + l]), re: 1 })}
    ${u.cat === '83' ? inp('Afschrijven over (jaren)', 'U.afschrijving', { num: 1, ph: String(S.cfg.afschrijving || 3) }) : ''}
    ${inp('Btw-regime', 'U.regime', { sel: [['normaal', 'Normaal (leverancier rekent btw aan)'], ['verlegd', 'Verlegd – jij bent btw verschuldigd (onderaannemer → rooster 87/56)'], ['icdienst', 'Dienst uit ander EU-land (bv. Google, Meta) → 88/55'], ['icgoed', 'Goederen uit ander EU-land → 86/55']], re: 1 })}
    <label class="row" style="gap:8px;margin-bottom:8px"><input type="checkbox" style="width:auto;margin:0" ${u.creditnota ? 'checked' : ''} ${ro ? 'disabled' : ''} onchange="set('U.creditnota',this.checked);R()"> Dit is een creditnota van de leverancier</label>
  </div><div class="c"><h2>Bedragen</h2>
    ${(u.tarieven || []).map((t, i) => `<div class="cols3"><label class="f"><span>Btw %</span><select ${ro ? 'disabled' : ''} onchange="tarSet(${i},'pct',this.value)">${[21, 12, 6, 0].map((p) => `<option ${C.num(t.pct) === p ? 'selected' : ''}>${p}</option>`).join('')}</select></label><label class="f"><span>Bedrag excl. btw</span><input ${ro ? 'readonly' : ''} inputmode="decimal" value="${esc(t.basis)}" oninput="tarSet(${i},'basis',this.value)"></label><label class="f"><span>Btw${u.regime !== 'normaal' ? ' (zelf te voldoen)' : ''}</span><input ${ro ? 'readonly' : ''} inputmode="decimal" id="tb${i}" value="${esc(t.btw)}" oninput="tarSet(${i},'btw',this.value,1)"></label></div>`).join('')}
    ${ro ? '' : `<button class="b2 sm" onclick="curUitgave().tarieven.push({pct:6,basis:0,btw:0});save();R()">+ ander btw-tarief</button>`}
    <div class="cols" style="margin-top:10px">${inp('Btw aftrekbaar %', 'U.aftrek', { num: 1 })}${inp('Beroepsmatig gebruik %', 'U.beroep', { num: 1 })}</div>
    <p class="mu">Bv. wagen: btw max. 50% aftrekbaar; gsm/internet: deel privé. Maaltijden en relatiegeschenken: btw niet aftrekbaar.</p>
    <label class="row" style="gap:8px"><input type="checkbox" style="width:auto;margin:0" ${u.betaald ? 'checked' : ''} ${ro ? 'disabled' : ''} onchange="set('U.betaald',this.checked)"> Betaald</label>
    <label class="row" style="gap:8px;margin-top:6px"><input type="checkbox" style="width:auto;margin:0" ${u.privé ? 'checked' : ''} ${ro ? 'disabled' : ''} onchange="set('U.privé',this.checked)"> Privé (niet meetellen)</label>
  </div></div>
  <div class="c"><h2>Bijlage</h2>${u.bijlage ? (String(u.bijlage).startsWith('data:image') || String(u.bijlage).startsWith('vf:') && !/\.pdf$/.test(u.bijlage) ? `<img src="${String(u.bijlage).startsWith('vf:') ? '' : u.bijlage}" id="ubij" style="max-width:100%;max-height:520px;border-radius:8px">` : `<button class="b2" onclick="bijlageOpen()">PDF openen</button>`) : '<p class="mu">Geen bijlage. Bewaar je aankoopfacturen 10 jaar.</p>'}
  ${ro ? '' : `<label class="b2" style="display:inline-block;margin-top:8px;padding:8px 12px;border-radius:8px;background:var(--ac2);color:var(--ac);font-weight:600;cursor:pointer">${u.bijlage ? 'Vervangen' : 'Foto / PDF toevoegen'}<input type="file" accept="image/*,application/pdf" style="display:none" onchange="bestandData(this.files[0]).then(x=>{curUitgave().bijlage=x;save();R()})"></label>`}</div>`;
}
function tarSet(i, k, val, manual) { const u = curUitgave(); const t = u.tarieven[i]; t[k] = C.num(val); if (!manual && (k === 'basis' || k === 'pct')) { t.btw = C.r2(C.num(t.basis) * C.num(t.pct) / 100); const e = document.getElementById('tb' + i); if (e) e.value = t.btw; } save(); }
function uitgaveWeg() { if (!confirm('Uitgave verwijderen?')) return; const u = curUitgave(); S.uitgaven = S.uitgaven.filter((x) => x !== u); window.CLOUD && CLOUD.markDeleted('office', 'uitgave', u.id); save(); go('uitgaven'); }
async function bijlageOpen() { const u = curUitgave(); const data = await (window.CLOUD ? CLOUD.file(u.bijlage) : u.bijlage); const w = window.open(); if (w) w.document.write(`<iframe src="${data}" style="border:0;width:100%;height:100%"></iframe>`); }

/* ---------------- Peppol-inbox ---------------- */
function vPeppol() {
  const l = (S.peppolIn || []).slice().sort((a, b) => (b.datum || '').localeCompare(a.datum || ''));
  return `<div class="row wrap" style="margin-bottom:12px"><h1 style="margin:0">Peppol-inbox</h1><span class="sp"></span>${RO ? '' : `<button onclick="peppolOphalen()">Nu ophalen</button><label class="b2" style="padding:9px 14px;border-radius:8px;background:var(--ac2);color:var(--ac);font-weight:600;cursor:pointer">UBL-bestand inlezen<input type="file" accept=".xml" style="display:none" onchange="ublBestand(this.files[0])"></label>`}</div>
  ${!S.cfg.peppolActief ? `<div class="ban b">Peppol is nog niet gekoppeld. Zie Instellingen › Peppol. Intussen kan je een UBL-bestand (.xml) dat je ontving manueel inlezen.</div>` : ''}
  <div class="c" style="padding:0;overflow:auto"><table class="t"><tr><th>Ontvangen</th><th>Leverancier</th><th>Nummer</th><th class="r">Totaal</th><th></th></tr>
  ${l.map((p, i) => `<tr><td class="nw">${dt(p.datum)}</td><td><b>${esc(p.leverancier)}</b>${p.creditnota ? ' <span class="tag o">creditnota</span>' : ''}${p.regime === 'verlegd' ? ' <span class="tag">verlegd</span>' : ''}</td><td>${esc(p.nr)}</td><td class="r tab">${eur(p.totaal)}</td><td class="nw">${p.verwerkt ? `<button class="lnk" onclick="go('uitgave','${p.uitgave}')">uitgave ›</button>` : RO ? '' : `<button class="sm" onclick="peppolNaarUitgave('${p.id}')">→ Uitgave</button>`} ${p.pdf ? `<button class="lnk" onclick="peppolPdf('${p.id}')">PDF</button>` : ''}</td></tr>`).join('') || '<tr><td colspan="5" class="mu" style="padding:16px">Nog niets ontvangen.</td></tr>'}</table></div>`;
}
async function ublBestand(f) { if (!f) return; const xml = await f.text(); peppolToevoegen({ id: uid('p'), xml, bron: 'bestand' }); }
function peppolToevoegen(p) {
  try { const r = C.leesUbl(p.xml); Object.assign(p, r, { pdf: r.pdf ? 'data:application/pdf;base64,' + r.pdf : '', xml: 'data:application/xml;base64,' + btoa(unescape(encodeURIComponent(p.xml))) }); }
  catch (e) { return toast('Kon dit document niet lezen: ' + e.message); }
  S.peppolIn = S.peppolIn || []; if (S.peppolIn.some((x) => x.extId && x.extId === p.extId)) return; S.peppolIn.unshift(p); save(); R(); toast('Document toegevoegd aan de inbox');
}
function peppolNaarUitgave(id) {
  const p = S.peppolIn.find((x) => x.id === id);
  const cat = /verw|ketel|viessmann|vaillant|bulex|buderus|wolf|facq|vandenborre|sanitair|cebeo|desco|thermo|technics|install/i.test(p.leverancier + ' ' + (p.lijnen || []).join(' ')) ? '81' : '82';
  const u = { id: uid('u'), datum: p.datum, leverancier: p.leverancier, nr: p.nr, oms: (p.lijnen || []).slice(0, 3).join(', '), cat, regime: p.regime, creditnota: p.creditnota, tarieven: p.tarieven.length ? p.tarieven : [{ pct: 21, basis: p.totaal, btw: 0 }], aftrek: 100, beroep: 100, betaald: false, bijlage: p.pdf || '', bron: 'peppol', ogm: p.ogm, iban: p.iban };
  S.uitgaven = S.uitgaven || []; S.uitgaven.unshift(u); p.verwerkt = true; p.uitgave = u.id; save(); go('uitgave', u.id);
}
async function peppolPdf(id) { const p = S.peppolIn.find((x) => x.id === id); const data = await (window.CLOUD ? CLOUD.file(p.pdf) : p.pdf); const w = window.open(); if (w) w.document.write(`<iframe src="${data}" style="border:0;width:100%;height:100%"></iframe>`); }

/* ---------------- bank ---------------- */
function vBank() {
  const tx = (S.bank.tx || []).slice().sort((a, b) => (b.datum || '').localeCompare(a.datum || ''));
  const fl = sub || 'open'; const l = tx.filter((t) => fl === 'alle' || (fl === 'open' ? !t.doc && !t.uitgave && !t.genegeerd : fl === 'in' ? t.bedrag > 0 : t.bedrag < 0)).slice(0, 400);
  const saldo = (S.bank.rek || []).map((r) => `<div class="c kpi"><h2>${esc(r.naam || r.iban)}</h2><div class="v">${r.saldo != null ? eur(r.saldo) : '—'}</div><div class="s">${esc(r.iban || '')} · ${r.sync ? 'bijgewerkt ' + esc(String(r.sync).slice(0, 16).replace('T', ' ')) : ''}</div></div>`).join('');
  return `<div class="row wrap" style="margin-bottom:12px"><h1 style="margin:0">Bank</h1><span class="sp"></span>${RO ? '' : `${S.bank.koppeling ? `<button onclick="bankSync()">Nu bijwerken</button>` : `<button onclick="go('instellingen',null,'bank')">Bank koppelen</button>`}<label class="b2" style="padding:9px 14px;border-radius:8px;background:var(--ac2);color:var(--ac);font-weight:600;cursor:pointer">CSV / CODA importeren<input type="file" accept=".csv,.txt,.cod,.coda" style="display:none" onchange="bankImport(this.files[0])"></label>`}</div>
  ${saldo ? `<div class="grid">${saldo}</div>` : ''}
  <div class="chips">${[['open', 'Te koppelen'], ['in', 'Inkomsten'], ['uit', 'Uitgaven'], ['alle', 'Alles']].map(([k, lb]) => `<button class="chip ${fl === k ? 'on' : ''}" onclick="go('bank',null,'${k}')">${lb}</button>`).join('')}</div>
  <div class="c" style="padding:0;overflow:auto"><table class="t"><tr><th>Datum</th><th>Tegenpartij / mededeling</th><th class="r">Bedrag</th><th>Koppeling</th></tr>
  ${l.map((t) => { const m = !t.doc && !t.uitgave && t.bedrag > 0 ? C.match(t, S.docs) : null; const dd = t.doc && S.docs.find((d) => d.id === t.doc); const uu = t.uitgave && (S.uitgaven || []).find((u) => u.id === t.uitgave); return `<tr><td class="nw">${dt(t.datum)}</td><td><b>${esc(t.tegenpartij || '')}</b><div class="mu">${esc(t.mededeling || '')}</div></td><td class="r tab nw" style="color:${t.bedrag < 0 ? 'var(--rd)' : 'var(--ok)'}">${eur(t.bedrag)}</td><td>${dd ? `<a style="cursor:pointer;color:var(--ac)" onclick="go('doc','${dd.id}')">${esc(dd.nr)}</a>` : uu ? `<a style="cursor:pointer;color:var(--ac)" onclick="go('uitgave','${uu.id}')">${esc(uu.leverancier)}</a>` : t.genegeerd ? '<span class="mu">genegeerd</span>' : RO ? '' : `${m ? `<button class="sm gr" onclick="txKoppel('${t.id}','${m.id}')">${esc(m.nr)} ✓</button> ` : ''}<button class="sm b2" onclick="txKies('${t.id}')">Koppelen…</button> <button class="lnk sm" onclick="txNegeer('${t.id}')">negeren</button>`}</td></tr>`; }).join('') || '<tr><td colspan="4" class="mu" style="padding:16px">Geen transacties. Koppel je bank of importeer een CSV/CODA-export uit je bankapp.</td></tr>'}</table></div>`;
}
async function bankImport(f) {
  if (!f) return; const txt = await f.text();
  const l = /^0000/.test(txt) ? C.bankCoda(txt) : C.bankCsv(txt);
  const n = bankToevoegen(l); toast(n + ' nieuwe transacties');
}
function bankToevoegen(l) {
  S.bank.tx = S.bank.tx || []; const ids = new Set(S.bank.tx.map((t) => t.id)); let n = 0;
  l.forEach((t) => { if (ids.has(t.id)) return; S.bank.tx.push(t); n++; const m = t.bedrag > 0 ? C.match(t, S.docs) : null; if (m && C.ogmDigits(t.mededeling).includes(C.ogmDigits(m.ogm || 'x'))) txKoppel(t.id, m.id, true); });
  save(); R(); return n;
}
function txKoppel(tid, did, stil) {
  const t = S.bank.tx.find((x) => x.id === tid); const d = S.docs.find((x) => x.id === did); if (!t || !d) return;
  t.doc = d.id; d.betalingen = d.betalingen || []; d.betalingen.push({ datum: t.datum, bedrag: t.bedrag, via: 'bank', tx: t.id });
  if (C.totalen(d).open <= 0.004) d.status = 'betaald'; save(); if (!stil) { R(); toast(d.nr + ' gekoppeld'); }
}
function txNegeer(id) { const t = S.bank.tx.find((x) => x.id === id); t.genegeerd = true; save(); R(); }
function txKies(id) {
  const t = S.bank.tx.find((x) => x.id === id);
  const docs = t.bedrag > 0 ? S.docs.filter((d) => isFactuur(d) && d.status !== 'concept' && !afgehandeld(d)) : [];
  const uit = t.bedrag < 0 ? (S.uitgaven || []).filter((u) => !u.betaald) : [];
  modal(`<h2>${eur(t.bedrag)} · ${esc(t.tegenpartij || '')}</h2><p class="mu">${esc(t.mededeling || '')}</p><div style="max-height:50vh;overflow:auto">
  ${docs.map((d) => `<div class="dl" style="cursor:pointer" onclick="sluit();txKoppel('${id}','${d.id}')"><span><b>${esc(d.nr)}</b> ${esc(d.klant.naam)}</span><span class="tab">${eur(C.totalen(d).open)}</span></div>`).join('')}
  ${uit.map((u) => `<div class="dl" style="cursor:pointer" onclick="sluit();txUitgave('${id}','${u.id}')"><span><b>${esc(u.leverancier)}</b> ${esc(u.nr || '')} ${dt(u.datum)}</span><span class="tab">${eur((u.tarieven || []).reduce((s, x) => s + C.num(x.basis) + C.num(x.btw), 0))}</span></div>`).join('')}
  ${t.bedrag < 0 ? `<div class="dl" style="cursor:pointer" onclick="sluit();txNieuweUitgave('${id}')"><span style="color:var(--ac)">+ Nieuwe uitgave van deze betaling</span></div>` : ''}</div>`);
}
function txUitgave(tid, uidd) { const t = S.bank.tx.find((x) => x.id === tid); const u = S.uitgaven.find((x) => x.id === uidd); t.uitgave = u.id; u.betaald = true; save(); R(); }
function txNieuweUitgave(tid) { const t = S.bank.tx.find((x) => x.id === tid); const tot = -t.bedrag; const basis = C.r2(tot / 1.21); uitgaveNieuw({ datum: t.datum, leverancier: t.tegenpartij, oms: t.mededeling, betaald: true, tarieven: [{ pct: 21, basis, btw: C.r2(tot - basis) }] }); t.uitgave = S.uitgaven[0].id; save(); }

/* ---------------- btw-aangifte ---------------- */
function vBtw() {
  if (sub === 'listing') return vListing();
  const k0 = C.kwartaal(today()); const vor = k0.q === 1 ? { j: k0.j - 1, q: 4 } : { j: k0.j, q: k0.q - 1 };
  const [j, q] = (filt.bq || vor.j + '-' + vor.q).split('-').map(Number);
  const key = KW(j, q); S.aang[key] = S.aang[key] || {}; const a = S.aang[key]; a.extra = a.extra || {};
  if (S.cfg.btwRegime === 'kleine') return `<h1>Btw-aangifte</h1><div class="ban b">Je staat in de vrijstellingsregeling voor kleine ondernemingen: geen periodieke btw-aangifte. Wel een jaarlijkse klantenlisting (meestal nihil).</div><button onclick="go('btw',null,'listing')">Klantenlisting</button>`;
  const rb = C.roosters(S.docs, S.uitgaven || [], j, q, a.extra);
  const g = rb.g; const opties = []; for (let jj = JAAR(); jj >= JAAR() - 2; jj--) for (let qq = 4; qq >= 1; qq--) opties.push(jj + '-' + qq);
  const rij = (k) => `<div class="dl"><span><b>${k}</b> ${esc(RL.roosters[k] || '')}</span><b class="tab">${eur(g[k] || 0)}</b></div>`;
  const deadline = (q === 4 ? j + 1 : j) + '-' + String(q === 4 ? 1 : q * 3 + 1).padStart(2, '0') + '-' + RL.btwAangifte.dag;
  const listingNihil = q === 4 && !C.klantenlisting(S.docs, j).length;
  return `<div class="row wrap" style="margin-bottom:12px"><h1 style="margin:0">Btw-aangifte</h1><span class="sp"></span><select style="width:auto;margin:0" onchange="filt.bq=this.value;R()">${opties.map((o) => `<option value="${o}" ${o === j + '-' + q ? 'selected' : ''}>Q${o.split('-')[1]} ${o.split('-')[0]}</option>`).join('')}</select><button class="b2" onclick="go('btw',null,'listing')">Klantenlisting</button></div>
  <div class="ban ${a.ingediend ? 'b' : 'o'}">${a.ingediend ? `✓ Ingediend op ${dt(a.ingediend)}${a.betaald ? ' · betaald' : ''}` : `Uiterlijk indienen en betalen op <b>${dt(deadline)}</b> (kwartaalaangever).`}</div>
  <div class="cols"><div class="c"><h2>Uitgaande handelingen</h2>${['00', '01', '02', '03', '44', '45', '46', '47', '48', '49'].filter((k) => g[k] || ['01', '03'].includes(k)).map(rij).join('')}
    <h3>Verschuldigde btw</h3>${['54', '55', '56', '57', '61', '63'].filter((k) => g[k] || k === '54').map(rij).join('')}</div>
  <div class="c"><h2>Inkomende handelingen</h2>${['81', '82', '83', '84', '85', '86', '87', '88'].filter((k) => g[k] || ['81', '82', '83'].includes(k)).map(rij).join('')}
    <h3>Aftrekbare btw</h3>${['59', '62', '64'].filter((k) => g[k] || k === '59').map(rij).join('')}
    <div class="dl" style="font-size:17px;margin-top:8px"><span><b>${g['72'] ? '72 Terug te krijgen' : '71 Te betalen'}</b></span><b class="tab" style="color:var(--ac)">${eur(g['72'] || g['71'] || 0)}</b></div></div></div>
  <div class="c"><h2>Correcties (optioneel)</h2><div class="cols">${inp('61 – regularisaties in het voordeel van de Staat', `S.aang.${key}.extra.61`, { num: 1, re: 1 })}${inp('62 – regularisaties in jouw voordeel', `S.aang.${key}.extra.62`, { num: 1, re: 1 })}</div></div>
  <div class="c"><h2>Indienen</h2>
    <ol style="margin:0 0 10px 18px;padding:0;line-height:1.7"><li>Download het XML-bestand.</li><li>Log in op <b>MyMinfin › Intervat</b> en kies "Periodieke btw-aangifte › XML-bestand opladen".</li><li>Controleer, onderteken en verstuur.</li>${g['71'] ? `<li>Betaal <b>${eur(g['71'])}</b> op de btw-provisierekening <b>${RL.btwAangifte.rekening}</b>${S.cfg.btwProvisieOgm ? ' met mededeling <b>' + esc(S.cfg.btwProvisieOgm) + '</b>' : ' met je gestructureerde mededeling (zie MyMinfin › Btw-provisierekening; zet ze in Instellingen)'}.</li>` : ''}</ol>
    ${g['72'] ? `<label class="row" style="gap:8px;margin-bottom:10px"><input type="checkbox" style="width:auto;margin:0" ${a.terug ? 'checked' : ''} onchange="set('S.aang.${key}.terug',this.checked)"> Terugbetaling vragen (anders blijft het tegoed op je provisierekening)</label>` : ''}
    <div class="row wrap"><button onclick="btwXml(${j},${q},${listingNihil})">⬇ XML voor Intervat</button><button class="b2" onclick="btwDetail(${j},${q})">Details (welke documenten)</button>${RO ? '' : a.ingediend ? `<button class="b2" onclick="set('S.aang.${key}.ingediend','');R()">Ingediend ongedaan maken</button>${!a.betaald && g['71'] ? `<button class="gr" onclick="set('S.aang.${key}.betaald',true);R()">Markeer betaald</button>` : ''}` : `<button class="gr" onclick="set('S.aang.${key}.ingediend',today());set('S.aang.${key}.snapshot',${JSON.stringify(JSON.stringify(g)).replace(/"/g, '&quot;')});R()">Markeer als ingediend</button>`}</div>
    ${a.snapshot && a.snapshot !== JSON.stringify(g) ? '<p class="mu" style="color:var(--rd)">⚠ De cijfers zijn gewijzigd sinds je de aangifte als ingediend markeerde. Dien eventueel een verbeterende aangifte in.</p>' : ''}
    ${S.cfg.dexxter ? '<p class="mu">Dexxter-modus: vergelijk deze cijfers met de aangifte in Dexxter. Kloppen ze een kwartaal lang, dan kan je overstappen.</p>' : ''}
  </div>`;
}
function dl(name, text, type) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); }
function btwXml(j, q, nihil) {
  const b = S.cfg.bedrijf; if (!C.checkBEbtw(b.btw)) return alert('Je btw-nummer in Instellingen › Bedrijf klopt niet.');
  const a = S.aang[KW(j, q)] || {}; const rb = C.roosters(S.docs, S.uitgaven || [], j, q, a.extra);
  dl(`btw-aangifte-${j}-Q${q}.xml`, C.intervatXml(S.cfg, j, q, rb.g, { listingNihil: nihil, terug: !!a.terug }), 'application/xml');
}
function btwDetail(j, q) {
  const rb = C.roosters(S.docs, S.uitgaven || [], j, q, {});
  modal(`<h2>Q${q} ${j} – gebruikte documenten</h2><h3>Verkopen (${rb.details.verkopen.length})</h3>${rb.details.verkopen.map((d) => `<div class="dl"><span>${TYPENAAM[d.type]} ${esc(d.nr)} · ${esc(d.klant.naam)}</span><span class="tab">${eur(C.totalen(d).ex)} + ${eur(C.totalen(d).btw)}</span></div>`).join('') || '<p class="mu">Geen</p>'}
  <h3>Aankopen (${rb.details.aankopen.length})</h3>${rb.details.aankopen.map((u) => `<div class="dl"><span>${esc(u.leverancier)} ${esc(u.nr || '')} · rooster ${esc(u.cat)}</span><span class="tab">${eur((u.tarieven || []).reduce((s, t) => s + C.num(t.basis), 0))} + ${eur((u.tarieven || []).reduce((s, t) => s + C.num(t.btw), 0))}</span></div>`).join('') || '<p class="mu">Geen</p>'}
  <div class="row" style="margin-top:10px"><span class="sp"></span><button onclick="sluit()">Sluiten</button></div>`);
}
function vListing() {
  const j = +(filt.lj || JAAR() - 1 + (new Date().getMonth() >= 3 ? 1 : 0)); const l = C.klantenlisting(S.docs, j);
  return `<div class="row" style="margin-bottom:10px"><button class="lnk" onclick="go('btw')">‹ Btw-aangifte</button></div><h1>Klantenlisting ${j}</h1>
  <p class="mu">Jaarlijks vóór 31 maart: alle Belgische btw-plichtige klanten aan wie je in ${j} minstens € 250 (excl. btw) factureerde.</p>
  <select style="max-width:120px" onchange="filt.lj=this.value;R()">${[JAAR(), JAAR() - 1, JAAR() - 2].map((x) => `<option ${x === j ? 'selected' : ''}>${x}</option>`).join('')}</select>
  <div class="c">${l.map((k) => `<div class="dl"><span>${esc(k.naam)} · BE ${esc(k.btw)}</span><span class="tab">${eur(k.omzet)} · btw ${eur(k.btwBedrag)}</span></div>`).join('') || '<p class="mu">Geen klanten boven € 250: je dient een <b>nihil-listing</b> in (vink "nihil" aan in de aangifte van Q4).</p>'}</div>
  ${l.length ? `<button onclick="dl('klantenlisting-${j}.xml',C.klantenlistingXml(S.cfg,${j},C.klantenlisting(S.docs,${j})),'application/xml')">⬇ XML voor Intervat</button>` : ''}`;
}

/* ---------------- belastingen ---------------- */
function belJaar(j) { S.bel[j] = S.bel[j] || { rsz: [{}, {}, {}, {}], va: [], loon: 0, bv: 0, gemeente: null, bedrijfsleider: 0, vbVa: [] }; return S.bel[j]; }
function belastingRaming(j) {
  const b = belJaar(j); const w = winstJaar(j); const P = RL.jaar(j);
  const rszBetaald = (b.rsz || []).reduce((s, x) => s + C.num(x.bedrag), 0);
  const natuurlijk = (RL.rechtsvormen[S.cfg.rechtsvorm] || {}).natuurlijk !== false;
  if (natuurlijk) {
    const rsz = C.ramingRSZ({ jaar: j, inkomen: Math.max(0, w.winst - rszBetaald), statuut: S.cfg.statuut });
    const pb = C.ramingPB({ jaar: j, winst: w.winst, socBijdr: rszBetaald, loon: C.num(b.loon), bv: C.num(b.bv), va: b.va, gemeente: b.gemeente != null && b.gemeente !== '' ? C.num(b.gemeente) / 100 : P.pb.gemeente });
    return Object.assign({ type: 'pb', w, rsz, rszBetaald, rszRegul: C.r2(rsz.jaar - rszBetaald) }, pb);
  }
  const loonBL = C.num(b.bedrijfsleider);
  const vb = C.ramingVB({ jaar: j, winst: w.winst - loonBL - rszBetaald, loonBedrijfsleider: loonBL, va: b.vbVa });
  const pb = C.ramingPB({ jaar: j, winst: loonBL, socBijdr: rszBetaald, loon: C.num(b.loon), bv: C.num(b.bv), va: b.va, gemeente: b.gemeente != null && b.gemeente !== '' ? C.num(b.gemeente) / 100 : P.pb.gemeente });
  return Object.assign({ type: 'vb', w, vb, rszBetaald, pbBL: pb }, { nog: C.r2(vb.nog + pb.nog) });
}
function vBelasting() {
  const j = +(filt.bj || JAAR()); const b = belJaar(j); const P = RL.jaar(j); const r = belastingRaming(j);
  const natuurlijk = r.type === 'pb';
  const vaRij = (arr, key) => `${(b[key] || []).map((x, i) => `<div class="cols3"><label class="f"><span>Datum</span><input type="date" ${RO ? 'readonly' : ''} value="${esc(x.datum || '')}" onchange="set('S.bel.${j}.${key}.${i}.datum',this.value);R()"></label><label class="f"><span>Bedrag</span><input inputmode="decimal" ${RO ? 'readonly' : ''} value="${esc(x.bedrag || '')}" oninput="set('S.bel.${j}.${key}.${i}.bedrag',this.value,1)" onchange="R()"></label><div style="padding-top:22px">${RO ? '' : `<button class="lnk" onclick="S.bel[${j}].${key}.splice(${i},1);save();R()">✕</button>`}</div></div>`).join('')}${RO ? '' : `<button class="b2 sm" onclick="belJaar(${j}).${key}.push({datum:today(),bedrag:0});save();R()">+ Voorafbetaling</button>`}`;
  return `<div class="row wrap" style="margin-bottom:12px"><h1 style="margin:0">Belastingen & sociale bijdragen</h1><span class="sp"></span><select style="width:auto;margin:0" onchange="filt.bj=this.value;R()">${[JAAR() + 1, JAAR(), JAAR() - 1, JAAR() - 2].map((x) => `<option ${x === j ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
  <p class="mu">${esc((RL.rechtsvormen[S.cfg.rechtsvorm] || {}).label)} · ${S.cfg.statuut === 'bijberoep' ? 'zelfstandige in bijberoep' : 'zelfstandige in hoofdberoep'} · Raming op basis van je facturen en uitgaven in VET Office. ${S.cfg.dexxter ? 'Vergelijk met Rapporten › Overzicht in Dexxter.' : ''}</p>
  <div class="grid">
    <div class="c kpi"><h2>Omzet ${j}</h2><div class="v">${eur(r.w.omzet)}</div><div class="s">excl. btw</div></div>
    <div class="c kpi"><h2>Kosten</h2><div class="v">${eur(r.w.kosten + r.w.afschr)}</div><div class="s">waarvan afschrijvingen ${eur(r.w.afschr)}</div></div>
    <div class="c kpi"><h2>Winst vóór belastingen</h2><div class="v">${eur(r.w.winst)}</div><div class="s">vóór sociale bijdragen</div></div>
    <div class="c kpi" style="border-color:var(--ac)"><h2>${r.nog >= 0 ? 'Nog te betalen' : 'Terug te krijgen'}</h2><div class="v" style="color:var(--ac)">${eur(Math.abs(r.nog))}</div><div class="s">raming ${natuurlijk ? 'personenbelasting' : 'vennootschaps- + personenbelasting'}</div></div>
  </div>
  <div class="cols"><div class="c"><h2>Sociale bijdragen (RSZ / sociaal verzekeringsfonds)</h2>
    ${[0, 1, 2, 3].map((i) => `<div class="cols3"><div style="padding-top:22px"><b>Q${i + 1}</b></div><label class="f"><span>Bedrag kwartaal</span><input inputmode="decimal" ${RO ? 'readonly' : ''} value="${esc((b.rsz[i] || {}).bedrag || '')}" oninput="set('S.bel.${j}.rsz.${i}.bedrag',this.value,1)" onchange="R()"></label><label class="row" style="gap:6px;padding-top:20px"><input type="checkbox" style="width:auto;margin:0" ${(b.rsz[i] || {}).betaald ? 'checked' : ''} ${RO ? 'disabled' : ''} onchange="set('S.bel.${j}.rsz.${i}.betaald',this.checked)"> betaald</label></div>`).join('')}
    ${natuurlijk ? `<div class="dl"><span>Betaald (voorlopig) ${j}</span><b>${eur(r.rszBetaald)}</b></div><div class="dl"><span>Raming definitieve bijdragen op winst ${j}</span><b>${eur(r.rsz.jaar)}</b></div>
    <div class="dl"><span>${r.rszRegul > 0 ? 'Waarschijnlijke regularisatie (later bij te betalen)' : 'Waarschijnlijk terug te krijgen'}</span><b style="color:${r.rszRegul > 0 ? 'var(--rd)' : 'var(--ok)'}">${eur(Math.abs(r.rszRegul))}</b></div>
    <p class="mu">Voorlopige bijdragen worden berekend op je inkomen van 3 jaar geleden. Tip: verhoog vrijwillig je voorlopige bijdragen als je winst stijgt, dan vermijd je een grote regularisatie (en ze zijn meteen aftrekbaar).</p>` : '<p class="mu">Bij een vennootschap betaal je sociale bijdragen als bedrijfsleider op je bezoldiging.</p>'}
  </div>
  <div class="c"><h2>${natuurlijk ? 'Personenbelasting' : 'Personenbelasting (bedrijfsleider)'}</h2>
    ${S.cfg.statuut === 'bijberoep' || !natuurlijk ? `<div class="cols">${inp('Belastbaar loon uit je job (loonfiche)', `S.bel.${j}.loon`, { num: 1, re: 1 })}${inp('Ingehouden bedrijfsvoorheffing', `S.bel.${j}.bv`, { num: 1, re: 1 })}</div>` : ''}
    ${!natuurlijk ? inp('Bezoldiging bedrijfsleider (bruto per jaar)', `S.bel.${j}.bedrijfsleider`, { num: 1, re: 1 }) : ''}
    ${inp('Aanvullende gemeentebelasting %', `S.bel.${j}.gemeente`, { num: 1, re: 1, ph: String(P.pb.gemeente * 100) })}
    <h3>Voorafbetalingen ${natuurlijk ? '' : '(persoonlijk)'}</h3>${vaRij(b.va, 'va')}
    <p class="mu">VA1 ${dt(P.va.data[0])} · VA2 ${dt(P.va.data[1])} · VA3 ${dt(P.va.data[2])} · VA4 ${dt(P.va.data[3])}. Hoe vroeger, hoe groter de bonificatie (${P.va.pb.bonificatie.map((x) => (x * 100).toFixed(0) + '%').join(' / ')}).</p>
    ${(() => { const p = natuurlijk ? r : r.pbBL; return `<div class="dl"><span>Belastbaar inkomen</span><b>${eur(p.belastbaar)}</b></div><div class="dl"><span>Federale belasting (na belastingvrije som)</span><b>${eur(p.fed)}</b></div><div class="dl"><span>Gemeentebelasting</span><b>${eur(p.gem)}</b></div>${p.zonder ? `<div class="dl"><span>Waarvan door je zelfstandige activiteit</span><b>${eur(p.deelZaak)}</b></div>` : ''}<div class="dl"><span>− Bedrijfsvoorheffing</span><b>${eur(C.num(b.bv))}</b></div><div class="dl"><span>− Voorafbetalingen</span><b>${eur(p.vaTot)}</b></div><div class="dl"><span>Bonificatie</span><b>${eur(p.bon)}</b></div>${p.verm ? `<div class="dl"><span>Vermeerdering (te weinig voorafbetaald)</span><b style="color:var(--rd)">${eur(p.verm)}</b></div>` : ''}<div class="dl" style="font-size:16px"><span><b>${p.nog >= 0 ? 'Nog te betalen' : 'Terug'}</b></span><b style="color:var(--ac)">${eur(Math.abs(p.nog))}</b></div>`; })()}
    <p class="mu">${esc(P.va.pb.controleer || '')}</p>
  </div></div>
  ${!natuurlijk ? `<div class="c"><h2>Vennootschapsbelasting</h2><div class="dl"><span>Belastbare winst (na bezoldiging)</span><b>${eur(r.w.winst - C.num(b.bedrijfsleider) - r.rszBetaald)}</b></div><div class="dl"><span>Tarief</span><b>${r.vb.kmo ? '20% op eerste € 100.000 (kmo)' : '25%'}</b></div><div class="dl"><span>Vennootschapsbelasting</span><b>${eur(r.vb.vb)}</b></div>
    <h3>Voorafbetalingen vennootschap</h3>${vaRij(b.vbVa, 'vbVa')}<div class="dl"><span>Vermeerdering</span><b>${eur(r.vb.verm)}</b></div><div class="dl"><span><b>Nog te betalen</b></span><b>${eur(r.vb.nog)}</b></div>
    <p class="mu">Kmo-tarief enkel als de bedrijfsleider minstens ${eur(P.vb.kmoMinLoon)} bezoldiging krijgt (of evenveel als de winst). Je boekhouder doet de officiële aangifte.</p></div>` : ''}
  <p class="mu">Dit is een raming, geen officiële berekening. Tarieven en grenzen: Instellingen › Regels (${esc(P.bronnen)}).</p>`;
}

/* ---------------- werkbonnen (VET Work) ---------------- */
function vWerkbonnen() {
  const tf = teFactureren(); const rest = EXT.orders.filter((o) => !tf.includes(o)).slice(0, 60);
  const rij = (o, knop) => { const uren = (o.t || []).reduce((s, x) => s + Math.max(0, (x.e - x.s) / 3600000), 0); const f = S.docs.find((d) => d.bron && d.bron.id === o.id); return `<tr><td class="nw"><b>${esc(o.nr || '')}</b></td><td>${esc(o.klant)}<div class="mu">${esc(o.omschr || '')}</div></td><td class="nw">${dt(o.datum)}</td><td class="nw">${uren ? uren.toFixed(2).replace('.', ',') + ' u' : ''}</td><td class="nw">${knop && !RO ? `<button class="sm" onclick="werkbonFactuur('${o.id}')">Maak factuur</button> <button class="lnk sm" onclick="(S.cfg.wbNegeer=S.cfg.wbNegeer||[]).push('${o.id}');save();R()">negeren</button>` : f ? `<a style="cursor:pointer;color:var(--ac)" onclick="go('doc','${f.id}')">${esc(f.nr || 'concept')}</a>` : `<span class="tag n">${esc(o.status)}</span>`}</td></tr>`; };
  return `<h1>Werkbonnen (VET Work)</h1>
  <div class="c" style="padding:0;overflow:auto"><table class="t"><tr><th colspan="5" style="font-size:14px;color:var(--tx)">Afgewerkt – nog te factureren (${tf.length})</th></tr>${tf.map((o) => rij(o, 1)).join('') || '<tr><td colspan="5" class="mu">Niets te factureren.</td></tr>'}</table></div>
  <div class="c" style="padding:0;overflow:auto"><table class="t"><tr><th colspan="5" style="font-size:14px;color:var(--tx)">Overige werkbonnen</th></tr>${rest.map((o) => rij(o, 0)).join('') || '<tr><td colspan="5" class="mu">Geen werkbonnen gevonden. Log in VET Work in bij Cloud met hetzelfde account.</td></tr>'}</table></div>`;
}
function werkbonFactuur(id) {
  const o = EXT.orders.find((x) => x.id === id); if (!o) return;
  let k = S.klanten.find((c) => (c.n || '').trim().toLowerCase() === (o.klant || '').trim().toLowerCase());
  const btw = o.btw ? String(o.btw) : S.cfg.standaardBtw; const kt = k && (S.klantx[k.id] || {}).type === 'aannemer' ? 'VERL' : btw;
  const lijnen = (o.werk || []).filter((w) => w.n).map((w) => lijnNieuw({ oms: w.n, aantal: C.num(w.q) || 1, eenheid: w.u === 'uur' ? 'uren' : (w.u && w.u !== 'stuk' ? w.u : 'stuks'), prijs: C.num(w.p), btw: kt }));
  const uren = (o.t || []).reduce((s, x) => s + Math.max(0, (x.e - x.s) / 3600000), 0);
  if (uren > 0 && !lijnen.some((l) => l.eenheid === 'uren')) { const u = Math.ceil(uren * 4) / 4; lijnen.push(lijnNieuw({ oms: 'Werkuren', aantal: Math.min(1, u), eenheid: 'uren', prijs: S.cfg.uur1, btw: kt })); if (u > 1) lijnen.push(lijnNieuw({ oms: 'Werkuren (elk volgend uur)', aantal: u - 1, eenheid: 'uren', prijs: S.cfg.uur2, btw: kt })); }
  const klant = k ? klantSnapshot(k) : Object.assign({ naam: o.klant || '' }, (() => { const m = String(o.adres || '').match(/^(.*?)[,\s]+(\d{4})\s+(.+)$/); return m ? { straat: m[1], pc: m[2], gemeente: m[3] } : { straat: o.adres || '' }; })(), { email: o.mail || '', tel: o.tel || '' });
  nieuwDoc('factuur', { klant, lijnen, opm: [o.omschr ? 'Werkbon ' + o.nr + ': ' + o.omschr : 'Werkbon ' + o.nr, o.opm].filter(Boolean).join('\n'), bron: { app: 'work', id: o.id, label: 'werkbon ' + o.nr } });
}

/* ---------------- attesten (VET Heat) ---------------- */
function vAttesten() {
  const fl = sub || 'binnenkort'; const nu = today();
  let l = EXT.jobs.slice();
  if (fl === 'binnenkort') l = l.filter((j) => { const n = volgendeControle(j); return n && n <= C.addDays(nu, 60); });
  l.sort((a, b) => fl === 'binnenkort' ? (volgendeControle(a) || '').localeCompare(volgendeControle(b) || '') : (b.datum || '').localeCompare(a.datum || ''));
  return `<h1>Onderhoudsattesten (VET Heat)</h1>
  <div class="chips">${[['binnenkort', 'Onderhoud binnenkort'], ['alle', 'Alle attesten']].map(([k, lb]) => `<button class="chip ${fl === k ? 'on' : ''}" onclick="go('attesten',null,'${k}')">${lb}</button>`).join('')}</div>
  <div class="c" style="padding:0;overflow:auto"><table class="t"><tr><th>Attest</th><th>Klant</th><th>Toestel</th><th>Datum</th><th>Volgende</th><th></th></tr>
  ${l.map((j) => { const n = volgendeControle(j); const f = S.docs.some((d) => d.bron && d.bron.app === 'heat' && d.bron.id === j.id); return `<tr><td class="nw"><b>${esc(j.nr)}</b></td><td>${esc(j.klant && j.klant.n)}<div class="mu">${esc([j.klant && j.klant.straat, j.klant && j.klant.pc].filter(Boolean).join(', '))}</div></td><td>${esc([j.toestel && j.toestel.merk, j.toestel && j.toestel.type].filter(Boolean).join(' '))}</td><td class="nw">${dt(j.datum)}</td><td class="nw" style="color:${n && n < nu ? 'var(--rd)' : ''}">${dt(n)}</td><td class="nw">${RO ? '' : f ? '<span class="tag g">gefactureerd</span>' : `<button class="sm b2" onclick="attestDoc('${j.id}','factuur')">Factuur</button> <button class="sm b2" onclick="attestDoc('${j.id}','offerte')">Offerte</button>`}</td></tr>`; }).join('') || '<tr><td colspan="6" class="mu" style="padding:16px">Niets gevonden. Log in VET Heat in bij Cloud met hetzelfde account.</td></tr>'}</table></div>`;
}
function attestDoc(id, type) {
  const j = EXT.jobs.find((x) => x.id === id); let k = S.klanten.find((c) => c.id === j.cid) || S.klanten.find((c) => (c.n || '').toLowerCase() === (j.klant.n || '').toLowerCase());
  const art = (S.artikels || []).find((a) => /onderhoud/i.test(a.n)) || { n: 'Onderhoud gasketel', det: 'Onderhoud uitvoeren op een gasketel en het opstellen van de officiële certificaten.', p: 150 };
  nieuwDoc(type, { klant: k ? klantSnapshot(k) : { naam: j.klant.n, straat: j.klant.straat, pc: splitPcG(j.klant.pc).pc, gemeente: splitPcG(j.klant.pc).gemeente, email: j.klant.mail }, lijnen: [lijnNieuw({ oms: art.n, det: art.det || '', prijs: C.num(art.p), eenheid: 'stuks' })], opm: type === 'factuur' ? 'Certificaten in bijlage.' : S.cfg.opm.offerte, bron: { app: 'heat', id: j.id, label: 'attest ' + j.nr } });
}

/* ---------------- aanvragen (VET Secretaris) ---------------- */
function vAanvragen() {
  const fl = sub || 'nieuw'; const st = (a) => (S.aanvraagSt[a.id] || {}).st || 'nieuw';
  const l = EXT.aanvragen.filter((a) => fl === 'alle' || st(a) === fl).sort((a, b) => String(b.ontvangen || '').localeCompare(String(a.ontvangen || '')));
  const sts = ['nieuw', 'gebeld', 'ingepland', 'offerte', 'klant', 'afgewezen'];
  return `<h1>Aanvragen (VET Secretaris)</h1>
  <div class="chips">${[...sts, 'alle'].map((k) => `<button class="chip ${fl === k ? 'on' : ''}" onclick="go('aanvragen',null,'${k}')">${k} ${k !== 'alle' ? '(' + EXT.aanvragen.filter((a) => st(a) === k).length + ')' : ''}</button>`).join('')}</div>
  ${l.map((a) => `<div class="c"><div class="row wrap"><b>${esc(a.naam || a.tel || 'Onbekend')}</b><span class="tag n">${esc(a.bron || '')}</span><span class="mu">${esc(String(a.ontvangen || '').replace('T', ' ').slice(0, 16))}</span><span class="sp"></span>${RO ? '' : `<select style="width:auto;margin:0" onchange="(S.aanvraagSt['${a.id}']=S.aanvraagSt['${a.id}']||{}).st=this.value;save();R()">${sts.map((s) => `<option ${st(a) === s ? 'selected' : ''}>${s}</option>`).join('')}</select>`}</div>
    <div class="mu" style="margin-top:6px">${esc([a.tel, a.adres, a.toestel].filter(Boolean).join(' · '))}</div><p style="margin:6px 0">${esc(a.probleem || a.bericht || '')}</p>
    ${RO ? '' : `<div class="row wrap">${a.tel ? `<a href="tel:${esc(a.tel)}"><button class="sm b2">Bellen</button></a>` : ''}<button class="sm b2" onclick="aanvraagKlant('${a.id}')">Maak klant + offerte</button></div>`}</div>`).join('') || `<div class="c mu">Geen aanvragen${fl !== 'alle' ? ' met status "' + fl + '"' : ''}. Zodra VET Secretaris aanvragen in de cloud zet, verschijnen ze hier.</div>`}`;
}
function aanvraagKlant(id) {
  const a = EXT.aanvragen.find((x) => x.id === id); const m = String(a.adres || '').match(/^(.*?)[,\s]+(\d{4}\s+.+)$/);
  let k = S.klanten.find((c) => c.tel && a.tel && c.tel.replace(/\D/g, '').slice(-9) === a.tel.replace(/\D/g, '').slice(-9));
  if (!k) { k = { id: uid('c'), n: a.naam || a.tel, straat: m ? m[1] : (a.adres || ''), pc: m ? m[2] : '', adres: a.adres || '', tel: a.tel || '', mail: a.mail || '' }; S.klanten.push(k); }
  (S.aanvraagSt[id] = S.aanvraagSt[id] || {}).st = 'offerte';
  nieuwDoc('offerte', { klant: klantSnapshot(k), opm: [S.cfg.opm.offerte, a.probleem ? 'Aanvraag: ' + a.probleem : ''].filter(Boolean).join('\n'), bron: { app: 'secretaris', id, label: 'aanvraag' } });
}

/* ---------------- instellingen ---------------- */
function vInstellingen() {
  const tabs = [['bedrijf', 'Bedrijf'], ['vorm', 'Rechtsvorm & btw'], ['dexxter', 'Dexxter'], ['docs', 'Documenten'], ['artikels', 'Artikels'], ['peppol', 'Peppol'], ['bank', 'Bank'], ['boekhouder', 'Boekhouder'], ['regels', 'Regels'], ['cloud', 'Cloud & back-up']];
  const t = sub || 'bedrijf'; const c = S.cfg; const b = c.bedrijf; const rv = RL.rechtsvormen[c.rechtsvorm] || RL.rechtsvormen.eenmanszaak;
  let body = '';
  if (t === 'bedrijf') body = `<div class="c"><h2>Bedrijfsgegevens (komen op elk document)</h2><div class="cols">
    ${inp('Naam', 'S.cfg.bedrijf.naam')}${rv.natuurlijk ? inp('Jouw naam (zaakvoerder)', 'S.cfg.bedrijf.persoon') : inp('Juridische naam (indien anders)', 'S.cfg.bedrijf.legal')}
    ${inp('Straat + nr', 'S.cfg.bedrijf.straat')}<div class="cols">${inp('Postcode', 'S.cfg.bedrijf.pc')}${inp('Gemeente', 'S.cfg.bedrijf.gemeente')}</div>
    ${inp('E-mail', 'S.cfg.bedrijf.email')}${inp('Telefoon', 'S.cfg.bedrijf.tel')}${inp('IBAN', 'S.cfg.bedrijf.iban')}${inp('BIC', 'S.cfg.bedrijf.bic')}
    ${inp('Btw-nummer', 'S.cfg.bedrijf.btw', { re: 1 })}${inp('Website', 'S.cfg.bedrijf.website')}
    ${!rv.natuurlijk ? inp('RPR + rechtbank (bv. "Antwerpen, afdeling Antwerpen")', 'S.cfg.bedrijf.rpr') + inp('Zetel-vermelding (optioneel)', 'S.cfg.bedrijf.zetelTekst') : ''}
  </div>${b.btw && !C.checkBEbtw(b.btw) ? '<p style="color:var(--rd)">⚠ Btw-nummer klopt niet.</p>' : ''}
  <h3>Logo op documenten</h3><div class="row wrap"><img src="${esc(c.logo || 'logo-factuur.png')}" style="height:60px;background:#fff;border-radius:6px;padding:4px">${RO ? '' : `<label class="b2" style="padding:8px 12px;border-radius:8px;background:var(--ac2);color:var(--ac);font-weight:600;cursor:pointer">Ander logo<input type="file" accept="image/png,image/jpeg" style="display:none" onchange="bestandData(this.files[0]).then(x=>{S.cfg.logo=x;save();R()})"></label>${c.logo ? `<button class="b2" onclick="S.cfg.logo='';save();R()">Standaard</button>` : ''}`}</div></div>`;
  if (t === 'vorm') body = `<div class="c"><h2>Rechtsvorm</h2>${inp('Rechtsvorm', 'S.cfg.rechtsvorm', { sel: Object.entries(RL.rechtsvormen).map(([k, x]) => [k, x.label]), re: 1 })}
    <p class="mu">${esc(rv.boekhouding)}</p>
    <ul class="mu" style="margin:0 0 8px 18px;padding:0">${rv.natuurlijk ? '<li>Documenten: je naam + handelsnaam, adres, btw-nummer.</li><li>Belastingen: personenbelasting op je winst + sociale bijdragen.</li>' : '<li>Documenten: naam + rechtsvorm, zetel, ondernemingsnummer, "RPR" + rechtbank (WVV art. 2:20).</li><li>Belastingen: vennootschapsbelasting + personenbelasting op je bezoldiging als bedrijfsleider.</li><li>Gebruik "Boekhouder" om je boekhouder toegang te geven.</li>'}</ul>
    ${inp('Statuut', 'S.cfg.statuut', { sel: [['bijberoep', 'Zelfstandige in bijberoep'], ['hoofdberoep', 'Zelfstandige in hoofdberoep']], re: 1 })}</div>
    <div class="c"><h2>Btw</h2>${inp('Btw-regime', 'S.cfg.btwRegime', { sel: [['normaal', 'Normaal btw-plichtig (btw aanrekenen, periodieke aangifte)'], ['kleine', 'Vrijstellingsregeling kleine ondernemingen (geen btw)']], re: 1 })}
    ${inp('Aangifte', 'S.cfg.aangifte', { sel: [['kwartaal', 'Kwartaalaangever'], ['maand', 'Maandaangever']] })}
    ${inp('Standaard btw-tarief voor nieuwe lijnen', 'S.cfg.standaardBtw', { sel: [['21', '21%'], ['6', '6% (renovatie woning > 10 jaar)'], ['VERL', 'Verlegd']] })}
    ${inp('Gestructureerde mededeling btw-provisierekening (MyMinfin)', 'S.cfg.btwProvisieOgm', { ph: '+++xxx/xxxx/xxxxx+++' })}</div>`;
  if (t === 'dexxter') body = `<div class="c"><h2>Samenwerking met Dexxter</h2>
    <label class="row" style="gap:10px;font-size:16px;margin-bottom:8px"><input type="checkbox" style="width:22px;height:22px;margin:0" ${c.dexxter ? 'checked' : ''} ${RO ? 'disabled' : ''} onchange="dexxterSchakel(this.checked)"> <b>Ik werk nog met Dexxter</b></label>
    <p class="mu">Aan: Dexxter blijft je officiële facturatie en Peppol. In VET Office vul je het nummer uit Dexxter in, PDF's krijgen "KOPIE" en Peppol staat uit. Zo kan je de btw-aangifte en belastingraming naast elkaar vergelijken.</p>
    <p class="mu">Uit: VET Office wordt je officiële facturatie. Je nummering loopt verder vanaf je laatste Dexxter-nummer (wettelijk verplicht: één doorlopende reeks).</p></div>`;
  if (t === 'docs') body = `<div class="c"><h2>Nummering</h2><div class="cols3">${inp('Facturen', 'S.cfg.nummer.factuur')}${inp('Offertes', 'S.cfg.nummer.offerte')}${inp("Creditnota's", 'S.cfg.nummer.creditnota')}</div>
    <p class="mu">{J} = jaar, {N} = volgnummer. Volgende nummers: ${['factuur', 'offerte', 'creditnota'].map((r) => `${r} <b>${esc(volgNr(r).nr)}</b>`).join(' · ')}</p>
    ${RO ? '' : `<div class="cols3">${['factuur', 'offerte', 'creditnota'].map((r) => `<label class="f"><span>Laatst gebruikt nr ${r} ${JAAR()}</span><input inputmode="numeric" value="${esc((S.seq[r] || {})[JAAR()] || 0)}" onchange="(S.seq['${r}']=S.seq['${r}']||{})[JAAR()]=C.num(this.value);save();R()"></label>`).join('')}</div>`}</div>
    <div class="c"><h2>Standaarden</h2><div class="cols3">${inp('Betaaltermijn (dagen)', 'S.cfg.betaaltermijn', { num: 1 })}${inp('Offerte geldig (dagen)', 'S.cfg.offerteGeldig', { num: 1 })}${inp('Afschrijving investeringen (jaar)', 'S.cfg.afschrijving', { num: 1 })}${inp('Werkuur: eerste uur', 'S.cfg.uur1', { num: 1 })}${inp('Werkuur: elk volgend uur', 'S.cfg.uur2', { num: 1 })}</div></div>
    <div class="c"><h2>Standaardopmerkingen</h2>${inp('Factuur', 'S.cfg.opm.factuur', { area: 1 })}${inp('Offerte', 'S.cfg.opm.offerte', { area: 1 })}${inp('Voorschotfactuur', 'S.cfg.opm.voorschot', { area: 1 })}${inp('Creditnota', 'S.cfg.opm.creditnota', { area: 1 })}${inp('Mailtekst ({klant} {document} {nr} {bedrag} {betaling})', 'S.cfg.mailTekst', { area: 1, rows: 7 })}</div>
    <div class="c"><h2>Algemene voorwaarden (één per regel)</h2>${inp('', 'S.cfg.voorwaarden', { area: 1, rows: 14 })}</div>
    <div class="c"><h2>Wettelijke teksten (automatisch)</h2>${Object.entries(RL.teksten).map(([k, x]) => `<div class="dl"><span class="mu">${esc(k)}</span><span style="max-width:75%">${esc(x)}</span></div>`).join('')}<p class="mu">Deze staan in rules.js en worden automatisch toegevoegd waar nodig.</p></div>`;
  if (t === 'artikels') body = `<div class="c"><h2>Artikels</h2><p class="mu">Ook de artikels uit VET Work zijn beschikbaar (${(EXT.workArt || []).length}).</p>
    ${(S.artikels || []).map((a, i) => `<div class="lijn" style="grid-template-columns:2fr 2fr 90px 90px 90px 34px"><input value="${esc(a.n)}" placeholder="Naam" oninput="S.artikels[${i}].n=this.value;save()"><input value="${esc(a.det || '')}" placeholder="Details" oninput="S.artikels[${i}].det=this.value;save()"><input inputmode="decimal" value="${esc(a.p ?? '')}" placeholder="Prijs" oninput="S.artikels[${i}].p=C.num(this.value);save()"><select onchange="S.artikels[${i}].u=this.value;save()">${['stuks', 'uren', 'forfait', 'm'].map((u) => `<option ${a.u === u ? 'selected' : ''}>${u}</option>`).join('')}</select><select onchange="S.artikels[${i}].btw=this.value;save()"><option value="">btw std</option>${['21', '6', 'VERL'].map((x) => `<option ${a.btw === x ? 'selected' : ''}>${x}</option>`).join('')}</select><button class="lnk" onclick="S.artikels.splice(${i},1);save();R()">✕</button></div>`).join('')}
    ${RO ? '' : `<button class="b2" style="margin-top:8px" onclick="(S.artikels=S.artikels||[]).push({n:'',p:0,u:'stuks'});save();R()">+ Artikel</button>`}</div>`;
  if (t === 'peppol') body = `<div class="c"><h2>Peppol</h2>${inp('Jouw Peppol-ID', 'S.cfg.bedrijf.peppol', { ph: C.peppolId(b.btw) })}
    <p class="mu">Peppol gaat via een erkend toegangspunt (access point). VET Office is voorbereid op <b>Recommand</b> (gratis tot 25 documenten/maand). Je Peppol-ID kan maar bij één toegangspunt tegelijk geregistreerd staan: zolang Dexxter je facturen verstuurt en ontvangt, blijft de registratie daar.</p>
    <ol class="mu" style="margin:0 0 10px 18px;padding:0;line-height:1.7"><li>Maak een account op recommand.eu en voeg je bedrijf toe (bij overstap: verhuis je Peppol-registratie van Dexxter met een migratiesleutel).</li><li>Maak een API-sleutel (type basic).</li><li>Zet de sleutel in Supabase › Edge Functions › Secrets: RECOMMAND_KEY, RECOMMAND_SECRET en RECOMMAND_COMPANY.</li><li>Klik hieronder op "Test verbinding".</li></ol>
    <div class="row wrap"><button onclick="peppolTest()">Test verbinding</button><span class="mu" id="ppst">${c.peppolActief ? '✓ actief' : ''}</span></div></div>`;
  if (t === 'bank') body = `<div class="c"><h2>Bankrekening koppelen</h2><p class="mu">Via <b>Enable Banking</b> (PSD2, door de bank goedgekeurde alleen-lezen toegang, geldig 180 dagen – daarna opnieuw bevestigen in je bankapp). Werkt ook zonder koppeling: importeer een CSV- of CODA-bestand uit je bankapp op de pagina Bank.</p>
    ${S.bank.koppeling ? `<div class="dl"><span>Gekoppeld</span><b>${esc(S.bank.koppeling.bank || '')} · geldig tot ${dt(S.bank.koppeling.tot)}</b></div><button class="b2" onclick="bankStart()">Opnieuw koppelen</button>` : `<div class="row wrap"><select id="bnk" style="max-width:280px;margin:0"><option>ING</option><option>BNP Paribas Fortis</option><option>KBC</option><option>Belfius</option><option>Argenta</option><option>Crelan</option><option>AXA Bank</option><option>Beobank</option><option>vdk bank</option></select><button onclick="bankStart()">Koppelen</button></div>`}
    <ol class="mu" style="margin:10px 0 0 18px;padding:0;line-height:1.7"><li>Eenmalig: account op enablebanking.com › Production-app registreren met redirect-URL <code>${esc(location.origin + location.pathname)}</code>.</li><li>Link in Enable Banking je eigen rekening (gratis voor je eigen rekeningen).</li><li>Zet in Supabase › Edge Functions › Secrets: EB_APP_ID en EB_PRIVATE_KEY (de inhoud van het .pem-bestand).</li></ol></div>`;
  if (t === 'boekhouder') body = vBoekhouder();
  if (t === 'regels') { const j = JAAR(); const P = RL.jaar(j); body = `<div class="c"><h2>Regels ${j}</h2><p class="mu">Alle wettelijke parameters staan in <code>rules.js</code> (versie ${RL.versie}). Hier kan je ze overschrijven als er iets verandert, zonder de app te updaten.</p>
    <div class="cols3">${[['pb', 'gemeente', 'Gemeentebelasting (bv. 0.07)'], ['pb', 'vrijeSom', 'Belastingvrije som'], ['rsz', 'beheer', 'Beheerskosten fonds (bv. 0.0305)'], ['rsz', 'minBij', 'Min. bijdrage bijberoep/kw'], ['rsz', 'minHoofd', 'Min. bijdrage hoofdberoep/kw'], ['rsz', 'drempelBij', 'Drempel bijberoep/jaar']].map(([g, k, l]) => `<label class="f"><span>${l}</span><input inputmode="decimal" value="${esc(((S.cfg.regels[j] || {})[g] || {})[k] ?? P[g][k])}" onchange="regelSet(${j},'${g}','${k}',this.value)"></label>`).join('')}
    <label class="f"><span>Vermeerdering VA zelfstandigen (bv. 0.045 of 0)</span><input inputmode="decimal" value="${esc(P.va.pb.vermeerdering)}" onchange="regelSet(${j},'va','vermeerdering',this.value)"></label></div>
    <div class="dl"><span>Belastingschijven</span><span>${P.pb.schijven.map(([g, p]) => (g === Infinity ? '> ' : '≤ ') + (g === Infinity ? eur(P.pb.schijven[P.pb.schijven.length - 2][0]) : eur(g)) + ': ' + (p * 100) + '%').join(' · ')}</span></div>
    <div class="dl"><span>Sociale bijdragen</span><span>${(P.rsz.pct1 * 100).toFixed(2)}% tot ${eur(P.rsz.grens1)} · ${(P.rsz.pct2 * 100).toFixed(2)}% tot ${eur(P.rsz.grens2)}</span></div>
    <div class="dl"><span>Btw-aangifte</span><span>uiterlijk de ${RL.btwAangifte.dag}ste · provisierekening ${RL.btwAangifte.rekening}</span></div>
    <p class="mu">Bronnen: ${esc(P.bronnen)}</p>${RO ? '' : `<button class="b2" onclick="S.cfg.regels={};save();location.reload()">Eigen aanpassingen wissen</button>`}</div>`; }
  if (t === 'cloud') body = `${window.CLOUDCARD ? CLOUDCARD() : ''}<div class="c"><h2>Back-up & export</h2><div class="row wrap"><button class="b2" onclick="exportJson()">Volledige back-up (JSON)</button><button class="b2" onclick="exportBoekhouder()">Export voor boekhouder (zip)</button>${RO ? '' : `<label class="b2" style="padding:9px 14px;border-radius:8px;background:var(--ac2);color:var(--ac);font-weight:600;cursor:pointer">Back-up terugzetten<input type="file" accept=".json" style="display:none" onchange="importJson(this.files[0])"></label>`}</div>
    <p class="mu">De export voor je boekhouder bevat alle facturen (PDF + UBL), aankoopfacturen met bijlagen en een overzicht (CSV) per kwartaal.</p></div>
    <div class="c"><h2>Thema</h2>${inp('Weergave', 'S.cfg.thema', { sel: [['', 'Automatisch'], ['light', 'Licht'], ['dark', 'Donker']], re: 1 })}</div>`;
  if (c.thema) document.documentElement.dataset.theme = c.thema; else delete document.documentElement.dataset.theme;
  return `<h1>Instellingen</h1><div class="chips">${tabs.map(([k, l]) => `<button class="chip ${t === k ? 'on' : ''}" onclick="go('instellingen',null,'${k}')">${l}</button>`).join('')}</div>${body}`;
}
function regelSet(j, g, k, val) { S.cfg.regels[j] = S.cfg.regels[j] || {}; S.cfg.regels[j][g] = S.cfg.regels[j][g] || {}; S.cfg.regels[j][g][k] = C.num(val); regelsToepassen(); save(); toast('Regel aangepast'); }
function dexxterSchakel(aan) {
  if (aan) { S.cfg.dexxter = true; save(); R(); return; }
  const j = JAAR();
  modal(`<h2>Overstappen van Dexxter naar VET Office</h2><p>Vanaf nu maakt VET Office je officiële facturen. Je nummering moet doorlopen vanaf Dexxter.</p>
  <div class="cols3"><label class="f"><span>Laatste factuurnr in Dexxter (${j})</span><input id="dx1" inputmode="numeric" value="${esc((S.seq.factuur || {})[j] || '')}"></label><label class="f"><span>Laatste offertenr (${j})</span><input id="dx2" inputmode="numeric" value="${esc((S.seq.offerte || {})[j] || '')}"></label><label class="f"><span>Laatste creditnotanr (${j})</span><input id="dx3" inputmode="numeric" value="${esc((S.seq.creditnota || {})[j] || '')}"></label></div>
  <ul class="mu" style="margin:0 0 10px 18px;padding:0"><li>Verhuis je Peppol-registratie van Dexxter naar je nieuwe toegangspunt (Instellingen › Peppol).</li><li>Download je Dexxter-archief (facturen + aankopen) en bewaar het 10 jaar.</li><li>Zeg je Dexxter-abonnement pas op na de laatste btw-aangifte die nog via Dexxter loopt.</li></ul>
  <div class="row"><span class="sp"></span><button class="b2" onclick="sluit();R()">Annuleren</button><button onclick="dexxterUit()">Overstappen</button></div>`);
}
function dexxterUit() { const j = String(JAAR()); [['factuur', 'dx1'], ['offerte', 'dx2'], ['creditnota', 'dx3']].forEach(([r, id]) => { const n = C.num($('#' + id).value); if (n) (S.seq[r] = S.seq[r] || {})[j] = n; }); S.cfg.dexxter = false; S.log.push({ t: new Date().toISOString(), w: 'dexxter-uit', seq: JSON.parse(JSON.stringify(S.seq)) }); sluit(); save(); R(); toast('VET Office is nu je officiële facturatie'); }
function exportJson() { dl('vet-office-backup-' + today() + '.json', JSON.stringify(S), 'application/json'); }
async function importJson(f) { if (!f || !confirm('Alles vervangen door deze back-up?')) return; const d = JSON.parse(await f.text()); S = Object.assign(S, d); await save(); location.reload(); }
async function exportBoekhouder() {
  const zip = new JSZip(); const j = +(prompt('Welk jaar?', String(JAAR())) || 0); if (!j) return; toast('Export maken…', 4000);
  const rows = [['type', 'nummer', 'datum', 'klant', 'btw-nr', 'excl', 'btw', 'incl', 'status']];
  for (const d of S.docs.filter((x) => x.status !== 'concept' && x.type !== 'offerte' && String(x.datum).startsWith(String(j)))) {
    const t = C.totalen(d); rows.push([d.type, d.nr, d.datum, d.klant.naam, d.klant.btw || '', t.ex, t.btw, t.inc, status(d)]);
    const q = 'Q' + C.kwartaal(d.datum).q; const pdf = await pdfVan(d); zip.file(`${j}/${q}/verkopen/${VET_PDF.naam(d)}`, pdf);
    zip.file(`${j}/${q}/verkopen/${VET_PDF.naam(d).replace('.pdf', '.xml')}`, C.ubl(d, S.cfg, ''));
  }
  const rowsA = [['datum', 'leverancier', 'nummer', 'rooster', 'regime', 'excl', 'btw', 'aftrek%', 'betaald']];
  for (const u of (S.uitgaven || []).filter((x) => String(x.datum).startsWith(String(j)))) {
    const ex = (u.tarieven || []).reduce((s, t) => s + C.num(t.basis), 0), b = (u.tarieven || []).reduce((s, t) => s + C.num(t.btw), 0);
    rowsA.push([u.datum, u.leverancier, u.nr, u.cat, u.regime, ex, b, u.aftrek, u.betaald ? 'ja' : 'nee']);
    if (u.bijlage) { try { const data = await (window.CLOUD ? CLOUD.file(u.bijlage) : u.bijlage); const m = String(data).match(/^data:([^;]+);base64,(.*)$/); if (m) zip.file(`${j}/Q${C.kwartaal(u.datum).q}/aankopen/${(u.datum + '-' + (u.leverancier || 'uitgave')).replace(/[^\w.-]+/g, '-')}.${m[1].includes('pdf') ? 'pdf' : 'jpg'}`, m[2], { base64: true }); } catch (e) {} }
  }
  const csv = (r) => r.map((x) => x.map((c) => '"' + String(c ?? '').replace(/"/g, '""') + '"').join(';')).join('\n');
  zip.file(`${j}/verkopen.csv`, csv(rows)); zip.file(`${j}/aankopen.csv`, csv(rowsA));
  for (let q = 1; q <= 4; q++) { const rb = C.roosters(S.docs, S.uitgaven || [], j, q, (S.aang[KW(j, q)] || {}).extra); zip.file(`${j}/Q${q}/btw-roosters.csv`, csv([['rooster', 'omschrijving', 'bedrag'], ...Object.entries(rb.g).map(([k, x]) => [k, RL.roosters[k], x])])); }
  const blob = await zip.generateAsync({ type: 'blob' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `boekhouding-${S.cfg.bedrijf.naam.replace(/\W+/g, '-')}-${j}.zip`; a.click();
}

/* ---------------- start ---------------- */
(async () => {
  await load();
  if (S.cfg.thema) document.documentElement.dataset.theme = S.cfg.thema;
  const p = new URLSearchParams(location.search);
  R();
  if (p.get('code') && p.get('state') && window.bankTerug) bankTerug(p.get('code'), p.get('state'));
})();
