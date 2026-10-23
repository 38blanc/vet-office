/* VET Office – werkwijze 1:1 zoals Dexxter, deel 3: dashboard, btw-aangifte, verkoopartikelen */

/* ================= dashboard ================= */
dashboardBoven = function () {}; // vervangen door het volledige dashboard hieronder
vHome = function () {
  const j = +filt.jaar; const w = winstJaar(j);
  const uit = C.r2(w.kosten + w.afschr - w.verworpen - (w.voorraadW || 0));
  const teOntv = S.docs.filter((d) => isFactuur(d) && d.status !== 'concept' && !afgehandeld(d)).reduce((s, d) => s + C.totalen(d).open, 0);
  const teBet = (S.uitgaven || []).filter((u) => !u.betaald && !u.privé).reduce((s, u) => s + uInc(u), 0);
  const m = Array.from({ length: 12 }, () => ({ in: 0, uit: 0 }));
  S.docs.filter((d) => d.status !== 'concept' && d.status !== 'geannuleerd' && ['factuur', 'voorschot', 'creditnota'].includes(d.type) && jaarVan(d.datum) === j).forEach((d) => { m[+d.datum.slice(5, 7) - 1].in += (d.type === 'creditnota' ? -1 : 1) * C.totalen(d).ex; });
  (S.dagontv || []).filter((x) => jaarVan(x.datum) === j).forEach((x) => { m[+x.datum.slice(5, 7) - 1].in += C.num(x.ex); });
  (S.uitgaven || []).filter((u) => !u.privé && jaarVan(u.datum) === j).forEach((u) => { const k = kostVan(u, j); if (k.c.soort !== 'invest') m[+u.datum.slice(5, 7) - 1].uit += k.kost; });
  window._gData = { d: m, mn: ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'], j };
  const kpi = [['Resultaat', w.winst, "go('rapport',null,'resultaat')", 'Inkomsten min uitgaven (beroepsmatig) dit boekjaar'], ['Inkomsten', w.omzet, "go('facturen')", 'Omzet excl. btw'], ['Uitgaven', uit, "go('uitgaven')", 'Beroepskosten + afschrijvingen'], ['Te ontvangen van klanten', teOntv, "go('facturen');DXF.st=['vervallen','open','verzonden','deels betaald'];R()", 'Openstaande verkoopfacturen'], ['Te betalen aan leveranciers', teBet, "DXK.st='open';go('uitgaven')", 'Kosten nog niet betaald']];
  // te doen (eigen VET-functies)
  const tf = teFactureren().length + losseAttesten().length; const verv = S.docs.filter((d) => isFactuur(d) && status(d) === 'vervallen');
  const nieuweA = EXT.aanvragen.filter((a) => !(S.aanvraagSt[a.id] || {}).st && !S.aanvraagWeg[a.id]);
  const todo = [
    tf && ['🔧', 'Te factureren (werkbonnen / attesten)', tf, "go('werkbonnen')"],
    verv.length && ['⏰', 'Vervallen facturen (herinnering sturen)', verv.length, "go('facturen');DXF.st=['vervallen'];R()"],
    (S.peppolIn || []).filter((p) => !p.verwerkt).length && ['📥', 'Nieuwe Peppol-facturen', S.peppolIn.filter((p) => !p.verwerkt).length, "go('peppol')"],
    nieuweA.length && ['📞', 'Nieuwe aanvragen (VET Secretaris)', nieuweA.length, "go('aanvragen')"],
    window.reviewKandidaten && S.cfg.reviewLink && reviewKandidaten().length && ['⭐', 'Klanten om een Google-review vragen', reviewKandidaten().length, "go('reviews')"],
    window.ondhOpen && ondhOpen().length && ['🔥', 'Onderhoud binnenkort (nog niet herinnerd)', ondhOpen().length, "go('attesten',null,'binnenkort')"],
    EXT.jobs.filter(vekaNodig).length && ['📨', 'VEKA-meldingen te doen', EXT.jobs.filter(vekaNodig).length, "go('veka')"],
    (S.uitgaven || []).filter((u) => !uKlaar(u)).length && ['✏️', 'Kosten nog aan te vullen', S.uitgaven.filter((u) => !uKlaar(u)).length, "DXK.st='aanvullen';go('uitgaven')"],
    (S.bank.tx || []).filter((t) => !t.doc && !t.uitgave && !t.genegeerd).length && ['🏦', 'Banktransacties te koppelen', S.bank.tx.filter((t) => !t.doc && !t.uitgave && !t.genegeerd).length, "go('bank')"]
  ].filter(Boolean);
  const k = C.kwartaal(today()); const rb = C.roosters(S.docs, S.uitgaven || [], k.j, k.q, (S.aang[KW(k.j, k.q)] || {}).extra); const bel = belastingRaming(j);
  const ev = deadlines().slice(0, 4); const nu = today();
  const links = [['KBO', 'https://kbopub.economie.fgov.be/kbopub/zoeknummerform.html', 'Gegevens van klanten of leveranciers opzoeken'], ['Intervat', 'https://eservices.minfin.fgov.be/intervat/', 'Btw-aangifte, IC-aangifte en klantenlisting indienen'], ['VIES', 'https://ec.europa.eu/taxation_customs/vies/', 'Een Europees btw-nummer controleren'], ['MyMinfin', 'https://eservices.minfin.fgov.be/myminfin-web/', 'Voorafbetalingen, btw-provisierekening, aanslagen'], ['VEKA – meldingen', 'https://www.vlaanderen.be/veka', 'Onderhoud en keuring van stookinstallaties melden']];
  return `<div class="dxkpis">${kpi.map(([t, x, kk, tip]) => `<div class="c dxkpi" onclick="${kk}" title="${esc(tip)}"><div class="t">${t} <span class="mu" title="${esc(tip)}">ⓘ</span></div><div class="v tab">${eur(x)}</div></div>`).join('')}</div>
  <div class="dxdash"><div>
    <div class="c dxcard"><h2 class="dxh2">${j} in kleur</h2>${grafiek(m, ['jan.', 'feb.', 'mrt.', 'apr.', 'mei', 'jun.', 'jul.', 'aug.', 'sep.', 'okt.', 'nov.', 'dec.'])}</div>
    <div class="c dxcard"><h2 class="dxh2">Te doen</h2>${todo.map(([i, t, n, kk]) => `<div class="dl" style="cursor:pointer" onclick="${kk}"><span>${i} ${t}</span><b class="tag">${n}</b></div>`).join('') || '<p class="mu" style="margin:0">Alles bijgewerkt 👍</p>'}</div>
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr))">
      <div class="c dxkpi" onclick="go('btw')"><div class="t">Btw kwartaal ${k.q} ${k.j} (tot nu)</div><div class="v tab">${rb.g['72'] ? '+ ' + eur(rb.g['72']) : eur(rb.g['71'] || 0)}</div><div class="mu">${rb.g['72'] ? 'terug te krijgen' : 'te betalen'}</div></div>
      <div class="c dxkpi" onclick="go('belasting')"><div class="t">Belastingen ${j} (raming)</div><div class="v tab">${bel.nog >= 0 ? eur(bel.nog) : '+ ' + eur(-bel.nog)}</div><div class="mu">${bel.nog >= 0 ? 'nog te betalen' : 'terug'} · personenbelasting + sociale bijdragen</div></div></div>
  </div><div>
    <div class="c dxcard"><h2 class="dxh2">Fiscale events <span class="mu" style="font-size:inherit">${JAAR()}</span></h2><p class="mu" style="margin-top:-4px">De tijdlijn wordt bepaald op basis van je btw-statuut en je startdatum.</p>
      <div class="dxev">${ev.map((e) => `<div class="it" ${e.go ? `onclick="${e.go}" style="cursor:pointer"` : ''}><span class="ic">${e.d < nu ? '⚠️' : '📅'}</span><div><div class="mu">${dt(e.d)}</div><b>${esc(e.t)}</b></div></div>`).join('') || '<p class="mu">Niets dringend.</p>'}</div>
      <div style="text-align:center;margin-top:8px"><a class="lnk" onclick="go('tijdlijn')">Bekijk de volledige tijdlijn →</a></div></div>
    <div class="c dxcard"><h2 class="dxh2">Handige links</h2>${links.map(([t, u, s]) => `<div class="dxlink"><a href="${u}" target="_blank" rel="noopener">${t}</a><div>${s}</div></div>`).join('')}</div>
  </div></div>`;
};

/* ================= btw-aangifte (zoals Dexxter: kwartaal-tabs, tijdelijk resultaat, roosterweergave) ================= */
const _vBtw0 = vBtw;
vBtw = function () {
  if (sub === 'listing' || S.cfg.btwRegime === 'kleine') return _vBtw0();
  const j = +filt.jaar; const k0 = C.kwartaal(today());
  let q = filt.bq && +String(filt.bq).split('-')[0] === j ? +String(filt.bq).split('-')[1] : (j === k0.j ? k0.q : 4);
  const key = KW(j, q); S.aang[key] = S.aang[key] || {}; const a = S.aang[key]; a.extra = a.extra || {};
  const rb = C.roosters(S.docs, S.uitgaven || [], j, q, a.extra); const g = rb.g; const G = (x) => C.num(g[x]);
  const omzet = C.r2(['00', '01', '02', '03', '44', '45', '46', '47'].reduce((s, x) => s + G(x), 0) - G('48') - G('49'));
  const btwOmzet = G('54'); const aank = C.r2(G('81') + G('82') + G('83') - G('85')); const verschuldigd = C.r2(['54', '55', '56', '57', '61', '63'].reduce((s, x) => s + G(x), 0));
  const recup = C.r2(G('59') + G('62') + G('64')); const res = G('71') ? G('71') : -G('72');
  const kwEind = j + '-' + String(q * 3).padStart(2, '0') + '-' + (q === 1 || q === 4 ? '31' : '30'); const tijdelijk = today() <= kwEind;
  const deadline = (q === 4 ? j + 1 : j) + '-' + String(q === 4 ? 1 : q * 3 + 1).padStart(2, '0') + '-' + RL.btwAangifte.dag;
  const listingNihil = q === 4 && !C.klantenlisting(S.docs, j).length;
  const st = a.ingediend ? (G('71') && !a.betaald ? ['Ingediend', '', 'Ingediend op ' + dt(a.ingediend) + ' · nog te betalen'] : ['Voltooid', 'g', 'Ingediend op ' + dt(a.ingediend) + (a.betaald ? ' · betaald' : '')]) : ['Te doen', 'o', 'Btw-aangifte nog niet ingediend · uiterlijk ' + dt(deadline)];
  const rooster = !!filt.bRooster;
  const secties = [['Verkopen (exclusief btw)', ['00', '01', '02', '03']], ['Verkopen (medecontractant)', ['45']], ['Verkopen (bijzondere handelingen en positieve correcties)', ['44', '46', '47']], ['Creditnota\'s op verkopen', ['48', '49']], ['Aankopen', ['81', '82', '83', '84', '85', '86', '87', '88']], ['Verschuldigde btw', ['54', '55', '56', '57', '61', '63']], ['Aftrekbare btw', ['59', '62', '64']], ['Saldo', ['71', '72']]];
  const detV = rb.details.verkopen, detA = rb.details.aankopen;
  return `<div class="dxhead"><div><h1>Btw-aangifte</h1><div class="mu" style="margin-top:4px">Kwartaalaangifte ${j} – zelfde berekening als Dexxter (enkel het beroepsmatige deel, boekingsdatum bepaalt het kwartaal).</div></div><span class="sp"></span><button class="b2o" onclick="go('btw',null,'listing')">Klantenlisting</button></div>
  <div class="dxtabs">${[1, 2, 3, 4].map((x) => `<button class="${x === q ? 'on' : ''}" onclick="filt.bq='${j}-${x}';R()">KWARTAAL ${x}</button>`).join('')}</div>
  <div class="dxbtw"><div class="c dxcard">
    <label class="row dxsw"><input type="checkbox" ${rooster ? 'checked' : ''} onchange="filt.bRooster=this.checked;R()"><span class="sl"></span> Roosterweergave</label>
    ${rooster ? `<table class="t dxt" style="min-width:0"><tr><th>Rooster</th><th class="r">Bedrag</th></tr>${secties.map(([t, ks]) => { const rij = ks.filter((x) => G(x) || ['01', '03', '54', '59', '81', '82'].includes(x)); return rij.length ? `<tr class="dxgrp"><td colspan="2"><b>${t}</b></td></tr>` + rij.map((x) => `<tr><td>Rooster [${x}] <span class="mu">${esc(RL.roosters[x] || '')}</span></td><td class="r tab" style="color:var(--ac)">${eur(G(x))}</td></tr>`).join('') : ''; }).join('')}</table>
      <h3>Correcties (optioneel)</h3><div class="cols">${inp('61 – regularisaties in het voordeel van de Staat', `S.aang.${key}.extra.61`, { num: 1, re: 1 })}${inp('62 – regularisaties in jouw voordeel', `S.aang.${key}.extra.62`, { num: 1, re: 1 })}</div>`
    : `<h2 class="dxh2" style="margin-top:6px">${tijdelijk ? 'Tijdelijk resultaat' : 'Resultaat'} kwartaal ${q}</h2>
      <h3>Inkomsten</h3><p>Je omzet bedraagt <b>${eur(omzet)}</b> (excl. btw) waarop <b>${eur(btwOmzet)}</b> btw is doorgerekend aan klanten.</p>
      <details class="dxopen"><summary class="lnk" style="padding:0">Toon details (${detV.length})</summary>${detV.map((d) => `<div class="dl" style="cursor:pointer" onclick="go('doc','${d.id}')"><span>${TYPENAAM[d.type]} ${esc(d.nr)} · ${esc(d.klant.naam)} · ${dt(d.datum)}</span><span class="tab">${eur((d.type === 'creditnota' ? -1 : 1) * C.totalen(d).ex)} + ${eur((d.type === 'creditnota' ? -1 : 1) * C.totalen(d).btw)}</span></div>`).join('') || '<p class="mu">Geen</p>'}${(S.dagontv || []).filter((x) => C.inKwartaal(x.datum, j, q)).length ? `<div class="dl"><span>Dagontvangsten</span><span class="tab">${eur((S.dagontv || []).filter((x) => C.inKwartaal(x.datum, j, q)).reduce((s, x) => s + C.num(x.ex), 0))}</span></div>` : ''}</details>
      <h3>Uitgaven</h3><p>Er zijn voor <b>${eur(aank)}</b> (excl. btw) aan aankopen en/of creditnota's. Deze documenten zorgen voor <b>${eur(recup)}</b> aan recupereerbare btw.</p>
      <details class="dxopen"><summary class="lnk" style="padding:0">Toon details (${detA.length})</summary>${detA.map((u) => `<div class="dl" style="cursor:pointer" onclick="dxUitOpen('${u.id}')"><span>${esc(u.leverancier || '—')} ${esc(u.nr || '')} · ${dt(u.datum)} · rooster ${esc(u.cat)}</span><span class="tab">${eur((u.tarieven || []).reduce((s, t) => s + C.num(t.basis), 0))} + ${eur((u.tarieven || []).reduce((s, t) => s + C.num(t.btw), 0))}</span></div>`).join('') || '<p class="mu">Geen</p>'}</details>
      <h3>Conclusie</h3><div class="dxconc"><div>${eur(verschuldigd)} aangerekende btw op je omzet${G('55') || G('56') || G('57') ? ' (incl. verlegde btw)' : ''}</div><div>${eur(recup)} recupereerbare btw op aankopen</div><div class="som"><b>${eur(Math.abs(res))} ${res >= 0 ? 'te betalen btw' : 'terug te krijgen btw'}</b></div></div>`}
  </div><div>
    <div class="c dxcard"><div class="row"><h2 class="dxh2" style="margin:0">Status btw-aangifte</h2><span class="sp"></span><span class="tag ${st[1]}">${st[0]}</span></div><p style="margin:10px 0 0">${st[2]}</p></div>
    <div class="c dxcard"><h2 class="dxh2">Acties</h2>
      <button style="width:100%" onclick="btwXml(${j},${q},${listingNihil})">⬇ XML voor Intervat</button>
      ${RO ? '' : a.ingediend ? `${!a.betaald && G('71') ? `<button class="gr" style="width:100%;margin-top:8px" onclick="set('S.aang.${key}.betaald',true);R()">Markeer betaald</button>` : ''}<button class="b2o" style="width:100%;margin-top:8px" onclick="set('S.aang.${key}.ingediend','');set('S.aang.${key}.betaald',false);R()">Indienen ongedaan maken</button>` : `<button class="b2o" style="width:100%;margin-top:8px" onclick="dxBtwIngediend('${key}',${j},${q})">Markeer als ingediend</button>`}
      ${G('72') && !RO ? `<label class="row dxchk"><input type="checkbox" ${a.terug ? 'checked' : ''} onchange="set('S.aang.${key}.terug',this.checked)"> Terugbetaling vragen</label>` : ''}
      ${a.snapshot && a.snapshot !== JSON.stringify(g) ? '<p class="mu" style="color:var(--rd)">⚠ De cijfers zijn gewijzigd sinds je de aangifte als ingediend markeerde. Dien eventueel een verbeterende aangifte in.</p>' : ''}
      <details class="dxopen" style="margin-top:8px"><summary class="mu">Hoe indienen?</summary><ol style="margin:6px 0 0 18px;padding:0;line-height:1.7;font-size:14px"><li>Download het XML-bestand.</li><li>MyMinfin › Intervat › "Periodieke btw-aangifte › XML-bestand opladen".</li><li>Controleer, onderteken en verstuur.</li>${G('71') ? `<li>Betaal <b>${eur(G('71'))}</b> op <b>${RL.btwAangifte.rekening}</b>${S.cfg.btwProvisieOgm ? ' met mededeling <b>' + esc(S.cfg.btwProvisieOgm) + '</b>' : ''}.</li>` : ''}</ol></details>
      ${S.cfg.dexxter ? '<p class="mu" style="margin-bottom:0">Dexxter-modus: vergelijk met de aangifte in Dexxter.</p>' : ''}</div>
  </div></div>`;
};
function dxBtwIngediend(key, j, q) { const a = S.aang[key]; const rb = C.roosters(S.docs, S.uitgaven || [], j, q, a.extra); a.ingediend = today(); a.snapshot = JSON.stringify(rb.g); save(); R(); }

/* ================= verkoopartikelen (eigen scherm zoals Dexxter; gedeeld met VET Work) ================= */
function vArtikelsDx() {
  const q = (filt.q || '').toLowerCase(); const l = (S.artikels || []).map((a, i) => ({ a, i })).filter(({ a }) => a.n && (!q || [a.n, a.det].join(' ').toLowerCase().includes(q))).sort((x, y) => x.a.n.localeCompare(y.a.n));
  const pct = (a) => (RL.btwCodes[a.btw || S.cfg.standaardBtw || '21'] || {}).pct || 0;
  return `<div class="dxhead"><h1>Verkoopartikelen</h1><span class="sp"></span>${RO ? '' : `<button onclick="dxArtForm(-1)">＋ Verkoopartikel toevoegen</button>`}</div>
  <div class="c dxcard"><div class="row" style="margin-bottom:12px"><div class="dxzoek"><span>🔍</span><input placeholder="Zoeken" value="${esc(filt.q || '')}" oninput="filt.q=this.value;clearTimeout(window._ft);window._ft=setTimeout(R,250)"></div></div>
  <div class="dxt-d" style="overflow:auto"><table class="t dxt"><tr><th>Naam</th><th class="r">Prijs excl. btw</th><th class="r">Btw %</th><th class="r">Prijs incl. btw</th><th>Eenheid</th><th class="c0"></th></tr>
  ${l.map(({ a, i }) => `<tr class="cl" onclick="dxArtForm(${i})"><td><b>${esc(a.n)}</b>${a.det ? `<div class="mu">${esc(a.det)}</div>` : ''}</td><td class="r tab nw">${eur(a.p)}</td><td class="r">${pct(a)}%</td><td class="r tab nw">${eur(C.r2(C.num(a.p) * (1 + pct(a) / 100)))}</td><td>${esc(a.u || 'stuks')}</td><td class="c0">${RO ? '' : `<button class="dxdots" onclick="event.stopPropagation();dxMenu(event,[['Bewerken','dxArtForm(${i})'],['Dupliceren','dxArtDup(${i})'],['Verwijderen','dxArtWeg(${i})',{red:1}]])">⋮</button>`}</td></tr>`).join('') || '<tr><td colspan="6" class="mu" style="padding:16px">Nog geen verkoopartikelen.</td></tr>'}</table></div>
  <div class="dxt-m">${l.map(({ a, i }) => `<div class="dxrm" onclick="dxArtForm(${i})"><div class="a"><b>${esc(a.n)}</b><b class="tab">${eur(a.p)}</b></div><div class="b"><span class="mu">${esc(a.u || 'stuks')} · ${pct(a)}% btw</span></div></div>`).join('')}</div>
  <p class="mu" style="margin:10px 0 0">Deze lijst wordt gedeeld met VET Work: toevoegen, wijzigen of verwijderen gebeurt in beide apps.</p></div>`;
}
function dxArtForm(i) {
  if (RO) return; const a = i >= 0 ? S.artikels[i] : { n: '', p: 0, u: 'stuks', det: '', btw: S.cfg.standaardBtw || '21' }; window._ar = { i, a: JSON.parse(JSON.stringify(a)) };
  const btwOpts = Object.entries(RL.btwCodes).filter(([k]) => k !== 'KO');
  modal(`<h2 style="color:var(--tx);font-size:17px">${i >= 0 ? 'Verkoopartikel bewerken' : 'Verkoopartikel toevoegen'}</h2>
  <label class="f"><span>Naam (verplicht)</span><input value="${esc(a.n)}" oninput="_ar.a.n=this.value"></label>
  <div class="cols3"><label class="f"><span>Prijs excl. btw</span><input inputmode="decimal" value="${esc(String(a.p ?? '').replace('.', ','))}" oninput="_ar.a.p=C.num(this.value)"></label><label class="f"><span>Btw-tarief</span><select onchange="_ar.a.btw=this.value">${btwOpts.map(([k, c]) => `<option value="${k}" ${String(a.btw || S.cfg.standaardBtw || '21') === k ? 'selected' : ''}>${esc(c.label)}</option>`).join('')}</select></label><label class="f"><span>Eenheid</span><input list="dxeenh2" value="${esc(a.u || 'stuks')}" oninput="_ar.a.u=this.value"><datalist id="dxeenh2">${['stuks', 'uren', 'm', 'forfait', 'km', 'kg', 'l'].map((x) => `<option value="${x}">`).join('')}</datalist></label></div>
  <label class="f"><span>Beschrijving</span><textarea rows="3" oninput="_ar.a.det=this.value">${esc(a.det || '')}</textarea></label>
  <div class="row"><span class="sp"></span><button class="b2o" onclick="sluit()">Annuleren</button><button onclick="dxArtFormOk()">Opslaan</button></div>`);
}
function dxArtFormOk() { const x = window._ar; if (!(x.a.n || '').trim()) return alert('Vul een naam in.'); S.artikels = S.artikels || []; if (x.i >= 0) S.artikels[x.i] = Object.assign(S.artikels[x.i], x.a); else S.artikels.push(Object.assign({ id: uid('a') }, x.a)); S.artikelsKlaar = true; sluit(); save(); R(); }
function dxArtDup(i) { const a = JSON.parse(JSON.stringify(S.artikels[i])); a.id = uid('a'); a.n += ' (kopie)'; S.artikels.push(a); save(); R(); }
function dxArtWeg(i) { if (!confirm('Verkoopartikel "' + S.artikels[i].n + '" verwijderen (ook in VET Work)?')) return; S.artikels.splice(i, 1); S.artikelsKlaar = true; save(); R(); }

DXNAV.forEach((n) => { if (n && n.k === 'art') { delete n.v; delete n.s; } });
DXV.art = vArtikelsDx;
DXFAB.art = [['Verkoopartikel toevoegen', 'dxArtForm(-1)', '📦']];
