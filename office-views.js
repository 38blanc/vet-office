/* VET Office – overige schermen: overzicht, uitgaven, Peppol-inbox, bank, btw-aangifte, belastingen, werkbonnen, attesten, aanvragen, instellingen */

/* ---------------- hulp ---------------- */
const volgendeControle = (j) => [j.volgT, j.volgK, j.volgV].filter(Boolean).sort()[0] || '';
const KW = (j, q) => j + '-Q' + q;
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
    ${tf.length + losseAttesten().length ? `<div class="dl" style="cursor:pointer" onclick="go('werkbonnen')"><span>🔧 Te factureren (werkbonnen / attesten)</span><b>${tf.length + losseAttesten().length}</b></div>` : ''}
    ${verv.length ? `<div class="dl" style="cursor:pointer" onclick="filt.st='vervallen';go('facturen')"><span>⏰ Vervallen facturen (herinnering sturen)</span><b>${verv.length}</b></div>` : ''}
    ${(S.peppolIn || []).filter((p) => !p.verwerkt).length ? `<div class="dl" style="cursor:pointer" onclick="go('peppol')"><span>📥 Nieuwe Peppol-facturen</span><b>${S.peppolIn.filter((p) => !p.verwerkt).length}</b></div>` : ''}
    ${nieuweA.length ? `<div class="dl" style="cursor:pointer" onclick="go('aanvragen')"><span>📞 Nieuwe aanvragen</span><b>${nieuweA.length}</b></div>` : ''}
    ${EXT.jobs.filter(vekaNodig).length ? `<div class="dl" style="cursor:pointer" onclick="go('veka')"><span>📨 VEKA-meldingen te doen</span><b>${EXT.jobs.filter(vekaNodig).length}</b></div>` : ''}
    ${(S.uitgaven || []).filter((u) => u.bron === 'peppol' && !u.gezien).length ? `<div class="dl" style="cursor:pointer" onclick="go('uitgaven')"><span>📥 Nieuwe Peppol-facturen bij je kosten</span><b>${S.uitgaven.filter((u) => u.bron === 'peppol' && !u.gezien).length}</b></div>` : ''}
    ${binnenkort.length ? `<div class="dl" style="cursor:pointer" onclick="go('attesten')"><span>🔥 Onderhoud binnenkort (VET Heat)</span><b>${binnenkort.length}</b></div>` : ''}
    ${(S.bank.tx || []).filter((t) => !t.doc && !t.uitgave && !t.genegeerd).length ? `<div class="dl" style="cursor:pointer" onclick="go('bank')"><span>🏦 Banktransacties te koppelen</span><b>${S.bank.tx.filter((t) => !t.doc && !t.uitgave && !t.genegeerd).length}</b></div>` : ''}
    ${!tf.length && !verv.length && !nieuweA.length ? '<p class="mu">Alles bijgewerkt 👍</p>' : ''}
  </div><div class="c"><h2>Tijdlijn</h2>${deadlines().map((x) => `<div class="dl" style="cursor:pointer" onclick="${x.go}"><span>${esc(x.t)}</span><span class="tag nw ${x.kl}">${dt(x.d)}</span></div>`).join('') || '<p class="mu">Niets dringend.</p>'}<button class="lnk" onclick="go('tijdlijn')">Volledige tijdlijn ›</button></div></div>`;
}

/* ---------------- uitgaven ---------------- */
const bestandData = (f) => new Promise((res) => { if (!/^image\//.test(f.type)) { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(f); return; } const img = new Image(); img.onload = () => { const m = 1600, s = Math.min(1, m / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = img.width * s; c.height = img.height * s; c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', 0.8)); }; img.src = URL.createObjectURL(f); });
function tarSet(i, k, val, manual) { const u = curUitgave(); const t = u.tarieven[i]; t[k] = C.num(val); if (!manual && (k === 'basis' || k === 'pct')) { t.btw = C.r2(C.num(t.basis) * C.num(t.pct) / 100); const e = document.getElementById('tb' + i); if (e) e.value = t.btw; } save(); }
function uitgaveWeg() { if (!confirm('Uitgave verwijderen?')) return; const u = curUitgave(); S.uitgaven = S.uitgaven.filter((x) => x !== u); window.CLOUD && CLOUD.markDeleted('office', 'uitgave', u.id); save(); go('uitgaven'); }
async function bijlageOpen() { const u = curUitgave(); const data = await (window.CLOUD ? CLOUD.file(u.bijlage) : u.bijlage); const w = window.open(); if (w) w.document.write(`<iframe src="${data}" style="border:0;width:100%;height:100%"></iframe>`); }

/* ---------------- Peppol-inbox ---------------- */
function vPeppol() {
  const l = (S.peppolIn || []).slice().sort((a, b) => (b.datum || '').localeCompare(a.datum || ''));
  return `<div class="row wrap" style="margin-bottom:12px"><h1 style="margin:0">Peppol-inbox</h1><span class="sp"></span>${RO ? '' : `<button onclick="peppolOphalen()">Nu ophalen</button><label class="b2" style="padding:9px 14px;border-radius:8px;background:var(--ac2);color:var(--ac);font-weight:600;cursor:pointer">UBL-bestand inlezen<input type="file" accept=".xml" style="display:none" onchange="ublBestand(this.files[0])"></label>`}</div>
  ${!S.cfg.peppolActief ? `<div class="ban b">Peppol is nog niet gekoppeld in VET Office (zolang Dexxter je Peppol-adres heeft, komen je aankoopfacturen daar binnen). Zie Instellingen › Peppol. Intussen kan je een UBL-bestand (.xml) manueel inlezen. ${ext(LK.recommand, 'Recommand')}</div>` : '<p class="mu">Nieuwe Peppol-facturen worden automatisch als kost ingeboekt; controleer de categorie.</p>'}
  <div class="c" style="padding:0;overflow:auto"><table class="t"><tr><th>Ontvangen</th><th>Leverancier</th><th>Nummer</th><th class="r">Totaal</th><th></th></tr>
  ${l.map((p, i) => `<tr><td class="nw">${dt(p.datum)}</td><td><b>${esc(p.leverancier)}</b>${p.creditnota ? ' <span class="tag o">creditnota</span>' : ''}${p.regime === 'verlegd' ? ' <span class="tag">verlegd</span>' : ''}</td><td>${esc(p.nr)}</td><td class="r tab">${eur(p.totaal)}</td><td class="nw">${p.verwerkt ? `<button class="lnk" onclick="go('uitgave','${p.uitgave}')">uitgave ›</button>` : RO ? '' : `<button class="sm" onclick="peppolNaarUitgave('${p.id}')">→ Uitgave</button>`} ${p.pdf ? `<button class="lnk" onclick="peppolPdf('${p.id}')">PDF</button>` : ''}</td></tr>`).join('') || '<tr><td colspan="5" class="mu" style="padding:16px">Nog niets ontvangen.</td></tr>'}</table></div>`;
}
async function ublBestand(f) { if (!f) return; const xml = await f.text(); peppolToevoegen({ id: uid('p'), xml, bron: 'bestand' }); }
function peppolToevoegen(p) {
  try { const r = C.leesUbl(p.xml); Object.assign(p, r, { pdf: r.pdf ? 'data:application/pdf;base64,' + r.pdf : '', xml: 'data:application/xml;base64,' + btoa(unescape(encodeURIComponent(p.xml))) }); }
  catch (e) { return toast('Kon dit document niet lezen: ' + e.message); }
  S.peppolIn = S.peppolIn || []; if (S.peppolIn.some((x) => x.extId && x.extId === p.extId)) return; S.peppolIn.unshift(p); save(); R(); toast('Document toegevoegd aan de inbox');
}
async function peppolNaarUitgave(id, stil) {
  const p = S.peppolIn.find((x) => x.id === id); if (!p || p.verwerkt) return;
  if (!p.tarieven && p.xml) { try { const x = await (window.CLOUD ? CLOUD.file(p.xml) : p.xml); Object.assign(p, C.leesUbl(decodeURIComponent(escape(atob(String(x).split(',')[1])))), { pdf: p.pdf }); } catch (e) { console.warn(e); } }
  // categorie raden: vorige kost bij dezelfde leverancier, anders materiaal of overige diensten
  const vorige = (S.uitgaven || []).find((u) => u.leverancier && p.leverancier && u.leverancier.toLowerCase() === p.leverancier.toLowerCase());
  const kc = vorige ? vorige.kc : /verw|ketel|viessmann|vaillant|bulex|buderus|wolf|facq|vandenborre|sanitair|cebeo|desco|thermo|install|brico|elektramat/i.test(p.leverancier + ' ' + (p.lijnen || []).join(' ')) ? 'handelsgoederen-verbruiksmaterialen' : 'overige-diensten';
  const c = alleCats().find((x) => x.id === kc) || alleCats()[0];
  const u = { id: uid('u'), datum: p.datum, leverancier: p.leverancier, nr: p.nr, oms: (p.lijnen || []).slice(0, 3).join(', '), kc: c.id, cat: c.rooster, regime: p.regime || 'normaal', creditnota: p.creditnota, tarieven: (p.tarieven || []).length ? p.tarieven : [{ pct: 21, basis: p.totaal || 0, btw: 0 }], aftrek: c.btw, beroep: c.beroep, betaald: false, bijlage: p.pdf || '', bron: 'peppol', ogm: p.ogm, iban: p.iban, verval: p.verval };
  S.uitgaven = S.uitgaven || []; S.uitgaven.unshift(u); p.verwerkt = true; p.uitgave = u.id; save(); if (!stil) go('uitgave', u.id);
}
async function peppolAuto() { if (RO) return; for (const p of (S.peppolIn || []).filter((x) => !x.verwerkt)) await peppolNaarUitgave(p.id, true); }
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
/* ---------------- werkbonnen (VET Work) ---------------- */
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
  const tabs = [['bedrijf', 'Bedrijf'], ['vorm', 'Rechtsvorm & btw'], ['dexxter', 'Dexxter'], ['docs', 'Documenten'], ['artikels', 'Artikels'], ['kostcats', 'Kostencategorieën'], ['peppol', 'Peppol'], ['mail', 'Mail'], ['bank', 'Bank'], ['boekhouder', 'Boekhouder'], ['regels', 'Regels'], ['cloud', 'Cloud & back-up']];
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
    ${inp('Statuut', 'S.cfg.statuut', { sel: [['bijberoep', 'Zelfstandige in bijberoep'], ['hoofdberoep', 'Zelfstandige in hoofdberoep']], re: 1 })}${inp('Startdatum als zelfstandige', 'S.cfg.startdatum', { type: 'date' })}
    <p class="mu">${ext(LK.kbo(S.cfg.bedrijf.btw), 'Jouw gegevens in de KBO')} ${ext(LK.xerius, 'MyXerius')}</p></div>
    <div class="c"><h2>Btw</h2>${inp('Btw-regime', 'S.cfg.btwRegime', { sel: [['normaal', 'Normaal btw-plichtig (btw aanrekenen, periodieke aangifte)'], ['kleine', 'Vrijstellingsregeling kleine ondernemingen (geen btw)']], re: 1 })}
    ${inp('Aangifte', 'S.cfg.aangifte', { sel: [['kwartaal', 'Kwartaalaangever'], ['maand', 'Maandaangever']] })}
    ${inp('Standaard btw-tarief voor nieuwe lijnen', 'S.cfg.standaardBtw', { sel: [['21', '21%'], ['6', '6% (renovatie woning > 10 jaar)'], ['VERL', 'Verlegd']] })}
    ${inp('Gestructureerde mededeling btw-provisierekening (MyMinfin)', 'S.cfg.btwProvisieOgm', { ph: '+++xxx/xxxx/xxxxx+++' })}<p class="mu">${ext(LK.myminfin, 'Opzoeken in MyMinfin')} ${ext(LK.intervat, 'Intervat')}</p></div>`;
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
  if (t === 'artikels') body = `<div class="c"><h2>Artikels</h2><p class="mu">Deze lijst wordt gedeeld met VET Work: toevoegen, wijzigen of verwijderen gebeurt in beide apps.</p>
    ${(S.artikels || []).map((a, i) => `<div class="lijn" style="grid-template-columns:2fr 2fr 90px 90px 90px 34px"><input value="${esc(a.n)}" placeholder="Naam" oninput="S.artikels[${i}].n=this.value;save()"><input value="${esc(a.det || '')}" placeholder="Details" oninput="S.artikels[${i}].det=this.value;save()"><input inputmode="decimal" value="${esc(a.p ?? '')}" placeholder="Prijs" oninput="S.artikels[${i}].p=C.num(this.value);save()"><select onchange="S.artikels[${i}].u=this.value;save()">${['stuks', 'uren', 'forfait', 'm'].map((u) => `<option ${a.u === u ? 'selected' : ''}>${u}</option>`).join('')}</select><select onchange="S.artikels[${i}].btw=this.value;save()"><option value="">btw std</option>${['21', '6', 'VERL'].map((x) => `<option ${a.btw === x ? 'selected' : ''}>${x}</option>`).join('')}</select><button class="lnk" onclick="S.artikels.splice(${i},1);save();R()">✕</button></div>`).join('')}
    ${RO ? '' : `<button class="b2" style="margin-top:8px" onclick="(S.artikels=S.artikels||[]).push({n:'',p:0,u:'stuks'});save();R()">+ Artikel</button>`}</div>`;
  if (t === 'peppol') body = `<div class="c"><h2>Peppol</h2>${inp('Jouw Peppol-ID', 'S.cfg.bedrijf.peppol', { ph: C.peppolId(b.btw) })}
    <p class="mu">Peppol gaat via een erkend toegangspunt (access point). VET Office is voorbereid op <b>Recommand</b> (gratis tot 25 documenten/maand). Je Peppol-ID kan maar bij één toegangspunt tegelijk geregistreerd staan: zolang Dexxter je facturen verstuurt en ontvangt, blijft de registratie daar.</p>
    <ol class="mu" style="margin:0 0 10px 18px;padding:0;line-height:1.8"><li>Maak een account op Recommand en voeg je bedrijf toe (bij overstap: verhuis je Peppol-registratie van Dexxter met een migratiesleutel). ${ext(LK.recommand, 'Recommand')}</li><li>Maak een API-sleutel (type basic). ${ext(LK.recommandKeys, 'API-sleutels')}</li><li>Zet in Supabase de secrets RECOMMAND_KEY, RECOMMAND_SECRET en RECOMMAND_COMPANY. ${ext(LK.supabaseSecrets, 'Supabase Secrets')}</li><li>Webhook voor automatische ontvangst + mailmelding: voeg in Recommand een webhook toe met URL <code style="user-select:all">https://pfxxzzdyzitcuhfrxaiq.supabase.co/functions/v1/vet-peppol-hook?k=JOUW_GEHEIM</code> en zet hetzelfde geheim als secret PEPPOL_HOOK_KEY. ${ext(LK.recommandWebhooks, 'Webhooks')}</li><li>Klik hieronder op "Test verbinding".</li></ol>
    <p class="mu">Controleer of een klant op Peppol staat: ${ext(LK.peppolDir(S.cfg.bedrijf.peppol), 'Peppol-directory')}</p>
    <div class="row wrap"><button onclick="peppolTest()">Test verbinding</button><span class="mu" id="ppst">${c.peppolActief ? '✓ actief' : ''}</span></div></div>`;
  if (t === 'bank') body = `<div class="c"><h2>Bankrekening koppelen</h2><p class="mu">Via <b>Enable Banking</b> (PSD2, door de bank goedgekeurde alleen-lezen toegang, geldig 180 dagen – daarna opnieuw bevestigen in je bankapp). Werkt ook zonder koppeling: importeer een CSV- of CODA-bestand uit je bankapp op de pagina Bank.</p>
    ${S.bank.koppeling ? `<div class="dl"><span>Gekoppeld</span><b>${esc(S.bank.koppeling.bank || '')} · geldig tot ${dt(S.bank.koppeling.tot)}</b></div><button class="b2" onclick="bankStart()">Opnieuw koppelen</button>` : `<div class="row wrap"><select id="bnk" style="max-width:280px;margin:0"><option>ING</option><option>BNP Paribas Fortis</option><option>KBC</option><option>Belfius</option><option>Argenta</option><option>Crelan</option><option>AXA Bank</option><option>Beobank</option><option>vdk bank</option></select><button onclick="bankStart()">Koppelen</button></div>`}
    <ol class="mu" style="margin:10px 0 0 18px;padding:0;line-height:1.8"><li>Eenmalig: account op Enable Banking › Production-app registreren met redirect-URL <code style="user-select:all">${esc(location.origin + location.pathname)}</code>. ${ext(LK.enablebanking, 'Enable Banking')}</li><li>Link in Enable Banking je eigen rekening (gratis voor je eigen rekeningen).</li><li>Zet de secrets EB_APP_ID en EB_PRIVATE_KEY (inhoud van het .pem-bestand). ${ext(LK.supabaseSecrets, 'Supabase Secrets')}</li></ol></div>`;
  if (t === 'boekhouder') body = vBoekhouder();
  if (t === 'kostcats') body = vKostcats();
  if (t === 'mail') body = vMailInst();
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

