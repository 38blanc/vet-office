/* VET Office – versie 4: dagboeken, klantdossier, Google-review vragen, offerte online laten aanvaarden */

/* ================= DAGBOEKEN (vereenvoudigde boekhouding) ================= */
function dbPeriode() { const j = +(filt.dbj || JAAR()); const q = +(filt.dbq || 0); return { j, q, in: (d) => d && jaarVan(d) === j && (!q || C.kwartaal(d).q === q), naam: q ? 'Q' + q + ' ' + j : String(j) }; }
function dbVerkoop(P) {
  const rijen = [];
  S.docs.filter((d) => d.status !== 'concept' && d.status !== 'geannuleerd' && ['factuur', 'voorschot', 'creditnota'].includes(d.type) && P.in(d.btwDatum || d.datum)).forEach((d) => {
    const t = C.totalen(d), s = d.type === 'creditnota' ? -1 : 1; const per = {};
    t.groepen.forEach((g) => { const k = (RL.btwCodes[g.code] || {}).label || g.code; per[k] = (per[k] || 0) + s * g.basis; });
    rijen.push({ datum: d.datum, nr: (d.type === 'creditnota' ? 'CN ' : '') + d.nr, naam: d.klant.naam, btwnr: d.klant.btw || '', per, ex: s * t.ex, btw: s * t.btw, inc: s * t.inc, ga: `go('doc','${d.id}')` });
  });
  (S.dagontv || []).filter((x) => P.in(x.datum)).forEach((x) => rijen.push({ datum: x.datum, nr: 'DO', naam: x.oms || 'Dagontvangst', btwnr: '', per: { [x.btw + '%']: C.num(x.ex) }, ex: C.num(x.ex), btw: C.num(x.btwBedrag), inc: C.num(x.inc), ga: "go('dagontv')" }));
  return rijen.sort((a, b) => (a.datum + a.nr).localeCompare(b.datum + b.nr));
}
function dbAankoop(P) {
  const alle = (S.uitgaven || []).filter((u) => !u.privé).slice().sort((a, b) => (a.datum + a.id).localeCompare(b.datum + b.id));
  const nr = {}; const tel = {}; alle.forEach((u) => { const j = jaarVan(u.datum); tel[j] = (tel[j] || 0) + 1; nr[u.id] = 'A' + j + '-' + String(tel[j]).padStart(3, '0'); }); // volgnummer per jaar
  return alle.filter((u) => P.in(u.datum)).map((u) => {
    const s = u.creditnota ? -1 : 1; const ex = (u.tarieven || []).reduce((t, x) => t + C.num(x.basis), 0) * s; const btw = (u.tarieven || []).reduce((t, x) => t + C.num(x.btw), 0) * s;
    const k = kostVan(u); return { volg: nr[u.id], datum: u.datum, nr: u.nr || '', naam: u.leverancier || '', cat: k.c.n, rooster: u.cat || '', regime: u.regime || 'normaal', ex, btw, aftrek: k.btwAftrek, inc: ex + (u.regime && u.regime !== 'normaal' ? 0 : btw), ga: `go('uitgave','${u.id}')` };
  });
}
function dbFinancieel(P) {
  const rijen = [];
  if ((S.bank.tx || []).length) {
    (S.bank.tx || []).filter((t) => P.in(t.datum)).forEach((t) => { const d = t.doc && S.docs.find((x) => x.id === t.doc), u = t.uitgave && (S.uitgaven || []).find((x) => x.id === t.uitgave); rijen.push({ datum: t.datum, rek: 'Bank', oms: [t.tegenpartij, t.mededeling].filter(Boolean).join(' · '), ref: d ? d.nr : u ? (u.leverancier + ' ' + (u.nr || '')) : '', in: t.bedrag > 0 ? t.bedrag : 0, uit: t.bedrag < 0 ? -t.bedrag : 0 }); });
  }
  // kas en betalingen die niet via een bankafschrift binnenkwamen
  S.docs.filter((d) => isFactuur(d) || d.type === 'creditnota').forEach((d) => (d.betalingen || []).filter((b) => !b.cn && P.in(b.datum) && !(S.bank.tx || []).some((t) => t.doc === d.id)).forEach((b) => {
    const kas = /cash|kas|contant/i.test(b.via || ''); const s = d.type === 'creditnota' ? -1 : 1;
    rijen.push({ datum: b.datum, rek: kas ? 'Kas' : 'Bank', oms: (d.type === 'creditnota' ? 'Terugbetaling ' : 'Ontvangst ') + d.klant.naam, ref: d.nr, in: s > 0 ? C.num(b.bedrag) : 0, uit: s < 0 ? C.num(b.bedrag) : 0 });
  }));
  (S.dagontv || []).filter((x) => P.in(x.datum)).forEach((x) => rijen.push({ datum: x.datum, rek: 'Kas', oms: x.oms || 'Dagontvangst', ref: 'DO', in: C.num(x.inc), uit: 0 }));
  if (!(S.bank.tx || []).length) (S.uitgaven || []).filter((u) => u.betaald && !u.privé && P.in(u.datum)).forEach((u) => { const s = u.creditnota ? -1 : 1; const bedrag = (u.tarieven || []).reduce((t, x) => t + C.num(x.basis) + (u.regime && u.regime !== 'normaal' ? 0 : C.num(x.btw)), 0); rijen.push({ datum: u.datum, rek: 'Bank', oms: (s > 0 ? 'Betaling ' : 'Terugbetaling ') + (u.leverancier || ''), ref: u.nr || '', in: s < 0 ? bedrag : 0, uit: s > 0 ? bedrag : 0 }); });
  return rijen.sort((a, b) => a.datum.localeCompare(b.datum));
}
function vDagboeken() {
  const P = dbPeriode(); const t = sub || 'verkoop';
  const tabs = [['verkoop', 'Verkoopdagboek'], ['aankoop', 'Aankoopdagboek'], ['financieel', 'Financieel dagboek']];
  const kies = `<div class="row wrap" style="gap:8px;margin-bottom:10px"><select style="width:auto;margin:0" onchange="filt.dbj=this.value;R()">${[JAAR(), JAAR() - 1].map((x) => `<option ${x === P.j ? 'selected' : ''}>${x}</option>`).join('')}</select><select style="width:auto;margin:0" onchange="filt.dbq=this.value;R()">${[[0, 'Heel het jaar'], [1, 'Kwartaal 1'], [2, 'Kwartaal 2'], [3, 'Kwartaal 3'], [4, 'Kwartaal 4']].map(([k, l]) => `<option value="${k}" ${k === P.q ? 'selected' : ''}>${l}</option>`).join('')}</select><span class="sp"></span><button class="b2" onclick="dbAfdrukken('${t}')">🖨 Afdrukken / PDF</button><button class="b2" onclick="dbCsv('${t}')">⬇ CSV (Excel)</button></div>`;
  return `<h1>Dagboeken</h1><div class="chips">${tabs.map(([k, l]) => `<button class="chip ${t === k ? 'on' : ''}" onclick="go('dagboeken',null,'${k}')">${l}</button>`).join('')}</div>${kies}
  <p class="mu">Vereenvoudigde boekhouding: verkoopdagboek, aankoopdagboek, financieel dagboek (bank en kas) en de inventaris (Voorraad). Ze worden automatisch opgebouwd uit je facturen, kosten, dagontvangsten en betalingen.</p>
  <div class="c" style="padding:0;overflow:auto">${dbTabel(t, P)}</div>`;
}
function dbTabel(t, P, print) {
  const td = (x) => `<td class="r tab nw">${eur(x)}</td>`; const klik = (r) => print ? '' : ` class="cl" onclick="${r.ga}"`;
  if (t === 'verkoop') {
    const r = dbVerkoop(P); const kol = [...new Set(r.flatMap((x) => Object.keys(x.per)))]; const som = (f) => r.reduce((s, x) => s + f(x), 0);
    return `<table class="t"><tr><th>Datum</th><th>Nr</th><th>Klant</th><th>Btw-nr</th>${kol.map((k) => `<th class="r">Excl. ${esc(k)}</th>`).join('')}<th class="r">Btw</th><th class="r">Totaal</th></tr>
    ${r.map((x) => `<tr${klik(x)}><td class="nw">${dt(x.datum)}</td><td class="nw">${esc(x.nr)}</td><td>${esc(x.naam)}</td><td class="nw">${esc(x.btwnr)}</td>${kol.map((k) => x.per[k] ? td(x.per[k]) : '<td></td>').join('')}${td(x.btw)}${td(x.inc)}</tr>`).join('') || `<tr><td colspan="9" class="mu">Geen verkopen in ${P.naam}.</td></tr>`}
    ${r.length ? `<tr><td colspan="4"><b>Totaal ${P.naam}</b></td>${kol.map((k) => `<td class="r tab"><b>${eur(som((x) => x.per[k] || 0))}</b></td>`).join('')}<td class="r tab"><b>${eur(som((x) => x.btw))}</b></td><td class="r tab"><b>${eur(som((x) => x.inc))}</b></td></tr>` : ''}</table>`;
  }
  if (t === 'aankoop') {
    const r = dbAankoop(P); const som = (f) => r.reduce((s, x) => s + f(x), 0);
    return `<table class="t"><tr><th>Volgnr</th><th>Datum</th><th>Leverancier</th><th>Factuurnr</th><th>Categorie</th><th>Rooster</th><th class="r">Excl. btw</th><th class="r">Btw</th><th class="r">Aftrekbaar</th><th class="r">Totaal</th></tr>
    ${r.map((x) => `<tr${klik(x)}><td class="nw">${x.volg}</td><td class="nw">${dt(x.datum)}</td><td>${esc(x.naam)}</td><td>${esc(x.nr)}</td><td>${esc(x.cat)}</td><td>${esc(x.rooster)}${x.regime !== 'normaal' ? ' · ' + esc(x.regime) : ''}</td>${td(x.ex)}${td(x.btw)}${td(x.aftrek)}${td(x.inc)}</tr>`).join('') || `<tr><td colspan="10" class="mu">Geen aankopen in ${P.naam}.</td></tr>`}
    ${r.length ? `<tr><td colspan="6"><b>Totaal ${P.naam}</b></td><td class="r tab"><b>${eur(som((x) => x.ex))}</b></td><td class="r tab"><b>${eur(som((x) => x.btw))}</b></td><td class="r tab"><b>${eur(som((x) => x.aftrek))}</b></td><td class="r tab"><b>${eur(som((x) => x.inc))}</b></td></tr>` : ''}</table>`;
  }
  const r = dbFinancieel(P); const inT = r.reduce((s, x) => s + x.in, 0), uitT = r.reduce((s, x) => s + x.uit, 0);
  return `<table class="t"><tr><th>Datum</th><th>Rekening</th><th>Omschrijving</th><th>Ref.</th><th class="r">In</th><th class="r">Uit</th></tr>
  ${r.map((x) => `<tr><td class="nw">${dt(x.datum)}</td><td>${x.rek}</td><td>${esc(x.oms)}</td><td class="nw">${esc(x.ref)}</td><td class="r tab">${x.in ? eur(x.in) : ''}</td><td class="r tab">${x.uit ? eur(x.uit) : ''}</td></tr>`).join('') || `<tr><td colspan="6" class="mu">Geen bewegingen in ${P.naam}.</td></tr>`}
  ${r.length ? `<tr><td colspan="4"><b>Totaal ${P.naam}</b></td><td class="r tab"><b>${eur(inT)}</b></td><td class="r tab"><b>${eur(uitT)}</b></td></tr>` : ''}</table>
  ${print ? '' : `<p class="mu" style="padding:0 12px 10px">${(S.bank.tx || []).length ? 'Bankbewegingen uit je bankkoppeling of CSV/CODA-import, aangevuld met contante betalingen.' : 'Nog geen bankafschriften geïmporteerd: het financieel dagboek wordt opgebouwd uit je geregistreerde betalingen. Importeer je bankafschriften (Bank) voor een volledig financieel dagboek.'}</p>`}`;
}
function dbAfdrukken(t) {
  const P = dbPeriode(); const titel = { verkoop: 'Verkoopdagboek', aankoop: 'Aankoopdagboek', financieel: 'Financieel dagboek' }[t] + ' ' + P.naam;
  const w = window.open('', '_blank'); if (!w) return alert('Sta pop-ups toe om af te drukken.');
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${titel}</title><style>body{font:11px system-ui,sans-serif;margin:24px;color:#111}h1{font-size:16px;margin:0 0 4px}p{margin:0 0 12px;color:#555}table{border-collapse:collapse;width:100%}th,td{border-bottom:1px solid #ddd;padding:4px 6px;text-align:left}th{background:#f2f4f6}.r{text-align:right}.nw{white-space:nowrap}@page{size:A4 landscape;margin:12mm}</style></head><body><h1>${titel}</h1><p>${esc(S.cfg.bedrijf.naam)} · ${esc(C.fmtBtw(S.cfg.bedrijf.btw))} · afgedrukt op ${dt(today())}</p>${dbTabel(t, P, 1)}</body></html>`);
  w.document.close(); setTimeout(() => w.print(), 300);
}
function dbCsv(t) {
  const P = dbPeriode(); let rows;
  if (t === 'verkoop') { const r = dbVerkoop(P); const kol = [...new Set(r.flatMap((x) => Object.keys(x.per)))]; rows = [['datum', 'nummer', 'klant', 'btw-nr', ...kol.map((k) => 'excl ' + k), 'btw', 'totaal'], ...r.map((x) => [x.datum, x.nr, x.naam, x.btwnr, ...kol.map((k) => C.r2(x.per[k] || 0)), C.r2(x.btw), C.r2(x.inc)])]; }
  else if (t === 'aankoop') rows = [['volgnr', 'datum', 'leverancier', 'factuurnr', 'categorie', 'rooster', 'regime', 'excl', 'btw', 'aftrekbaar', 'totaal'], ...dbAankoop(P).map((x) => [x.volg, x.datum, x.naam, x.nr, x.cat, x.rooster, x.regime, C.r2(x.ex), C.r2(x.btw), C.r2(x.aftrek), C.r2(x.inc)])];
  else rows = [['datum', 'rekening', 'omschrijving', 'referentie', 'in', 'uit'], ...dbFinancieel(P).map((x) => [x.datum, x.rek, x.oms, x.ref, C.r2(x.in), C.r2(x.uit)])];
  const csv = rows.map((x) => x.map((c) => '"' + String(c ?? '').replace(/"/g, '""').replace('.', typeof c === 'number' ? ',' : '.') + '"').join(';')).join('\n');
  dl(t + 'dagboek-' + P.naam.replace(' ', '-') + '.csv', '﻿' + csv, 'text/csv');
}

/* ================= KLANTDOSSIER ================= */
const dosNorm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
function klantDossier(k) {
  const naam = dosNorm(k.n), straat = dosNorm(k.straat), tel = String(k.tel || '').replace(/\D/g, '').slice(-9);
  const zelfde = (n, s) => (naam && dosNorm(n) === naam) || (straat && s && dosNorm(s).startsWith(straat));
  const docs = S.docs.filter((d) => d.klant && (d.klant.id === k.id || dosNorm(d.klant.naam) === naam));
  const jobs = EXT.jobs.filter((j) => j.cid === k.id || (j.klant && zelfde(j.klant.n, j.klant.straat)));
  const orders = EXT.orders.filter((o) => zelfde(o.klant, String(o.adres || '').split(',')[0]));
  const aanvr = EXT.aanvragen.filter((a) => !S.aanvraagWeg[a.id] && ((tel && String(a.tel || '').replace(/\D/g, '').slice(-9) === tel) || dosNorm(a.naam) === naam));
  // toestellen: per merk + type, laatste attest
  const toest = {}; jobs.forEach((j) => { const t = j.toestel || {}; const key = dosNorm((t.merk || '') + (t.type || '')) || 'onbekend'; const x = toest[key]; if (!x || (j.datum || '') > (x.datum || '')) toest[key] = j; });
  const tl = [];
  aanvr.forEach((a) => tl.push({ d: String(a.ontvangen || '').slice(0, 10), i: '📞', t: 'Aanvraag (' + (a.bron || 'secretaris') + ')', s: a.probleem || a.bericht || '', ga: "go('aanvragen',null,'alle')" }));
  orders.forEach((o) => tl.push({ d: o.datum, i: '🔧', t: 'Werkbon ' + (o.nr || ''), s: (o.omschr || '') + (o.status ? ' · ' + o.status : ''), ga: "go('werkbonnen')" }));
  jobs.forEach((j) => tl.push({ d: j.datum, i: '🔥', t: 'Attest ' + (j.nr || ''), s: [j.toestel && j.toestel.merk, j.toestel && j.toestel.type].filter(Boolean).join(' ') + (j.verb && j.verb.veilig ? ' · ' + j.verb.veilig : ''), ga: "go('attesten',null,'alle')" }));
  docs.forEach((d) => { tl.push({ d: d.datum, i: d.type === 'offerte' ? '📝' : d.type === 'creditnota' ? '↩️' : '🧾', t: TYPENAAM[d.type] + ' ' + (d.nr || 'concept'), s: eur(C.totalen(d).inc) + ' · ' + status(d), ga: `go('doc','${d.id}')` }); (d.herinneringen || []).forEach((h) => tl.push({ d: h.datum, i: '⏰', t: (h.niveau === 'herinnering' ? 'Herinnering' : 'Aanmaning') + ' ' + d.nr, s: 'via ' + h.via, ga: `go('doc','${d.id}')` })); });
  if (S.reviewGevraagd && S.reviewGevraagd[k.id]) tl.push({ d: S.reviewGevraagd[k.id], i: '⭐', t: 'Google-review gevraagd', s: '', ga: '' });
  tl.sort((a, b) => String(b.d).localeCompare(String(a.d)));
  const fact = docs.filter((d) => isFactuur(d) && d.status !== 'concept'); const omzet = fact.reduce((s, d) => s + C.totalen(d).ex, 0) - docs.filter((d) => d.type === 'creditnota' && d.status !== 'concept').reduce((s, d) => s + C.totalen(d).ex, 0);
  const open = fact.filter((d) => !afgehandeld(d)).reduce((s, d) => s + C.totalen(d).open, 0);
  return `<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">
    <div class="c kpi"><h2>Gefactureerd (excl.)</h2><div class="v">${eur(omzet)}</div></div><div class="c kpi"><h2>Openstaand</h2><div class="v" style="${open > 0.004 ? 'color:var(--rd)' : ''}">${eur(open)}</div></div>
    <div class="c kpi"><h2>Toestellen</h2><div class="v">${Object.keys(toest).length}</div></div><div class="c kpi"><h2>Klant sinds</h2><div class="v" style="font-size:20px">${tl.length ? dt(tl[tl.length - 1].d) : '—'}</div></div></div>
  ${Object.keys(toest).length ? `<div class="c"><h2>Toestellen</h2><div style="overflow:auto"><table class="t"><tr><th>Toestel</th><th>Brandstof</th><th>Adres</th><th>Laatste onderhoud</th><th>Volgende</th><th>Resultaat</th></tr>${Object.values(toest).map((j) => { const n = volgendeControle(j); return `<tr><td><b>${esc([j.toestel && j.toestel.merk, j.toestel && j.toestel.type].filter(Boolean).join(' ') || 'Onbekend toestel')}</b></td><td>${esc((j.km && (j.km.gassoort || j.km.brandstof)) || '')}</td><td>${esc(j.at && j.at.anders ? [j.at.straat, j.at.pc].filter(Boolean).join(', ') : [j.klant && j.klant.straat, j.klant && j.klant.pc].filter(Boolean).join(', '))}</td><td class="nw">${dt(j.datum)} · ${esc(j.nr)}</td><td class="nw" style="${n && n < today() ? 'color:var(--rd)' : ''}">${n ? dt(n) : '—'}</td><td>${esc((j.verb && j.verb.veilig) || '')}</td></tr>`; }).join('')}</table></div></div>` : ''}
  <div class="c"><h2>Historiek</h2>${tl.map((x) => `<div class="dl" ${x.ga ? `style="cursor:pointer" onclick="${x.ga}"` : ''}><span>${x.i} <b>${esc(x.t)}</b>${x.s ? ` <span class="mu">· ${esc(x.s)}</span>` : ''}</span><span class="tag n">${dt(x.d)}</span></div>`).join('') || '<p class="mu">Nog niets voor deze klant.</p>'}</div>`;
}

/* ================= GOOGLE-REVIEW VRAGEN ================= */
const REVIEW_TEKST = 'Dag {naam},\n\nBedankt om voor Van Eyen Technics te kiezen. Was u tevreden over de werken? Dan zou ik het erg waarderen als u een korte beoordeling achterlaat op Google. Het duurt maar een minuutje en helpt mij enorm:\n\n{link}\n\nAlvast bedankt!\n\nGroetjes,\n{ik}\n{bedrijf}';
function reviewKandidaten() {
  const dagen = C.num(S.cfg.reviewDagen ?? 3); const grens = C.addDays(today(), -dagen); const gedaan = S.reviewGevraagd || {}; const per = {};
  S.docs.filter((d) => isFactuur(d) && d.status !== 'concept' && status(d) === 'betaald' && d.klant && d.klant.id && !gedaan[d.klant.id]).forEach((d) => {
    const betaald = ((d.betalingen || []).map((b) => b.datum).sort().pop()) || d.datum; if (betaald > grens) return;
    if (C.addDays(betaald, 60) < today()) return; // enkel recente klanten
    const k = S.klanten.find((x) => x.id === d.klant.id); const mail = (k && k.mail) || d.klant.email; if (!mail) return;
    if (!per[d.klant.id] || per[d.klant.id].betaald < betaald) per[d.klant.id] = { k, d, betaald, mail };
  });
  return Object.values(per).filter((x) => x.k && !(S.klantx[x.k.id] || {}).geenReview);
}
function reviewTekst(x) { const b = S.cfg.bedrijf; return (S.cfg.reviewTekst || REVIEW_TEKST).replace('{naam}', (x.k.n || '').split(' ')[0]).replace('{link}', S.cfg.reviewLink || '(link naar je Google-pagina)').replace('{ik}', b.persoon || b.naam).replace('{bedrijf}', b.naam); }
async function reviewStuur(ids) {
  if (!S.cfg.reviewLink) return alert('Vul eerst de link naar je Google-reviewpagina in.');
  const l = reviewKandidaten().filter((x) => ids.includes(x.k.id)); if (!l.length) return;
  const onderwerp = 'Bedankt! – ' + S.cfg.bedrijf.naam;
  if (!S.cfg.mailActief) { const x = l[0]; location.href = 'mailto:' + encodeURIComponent(x.mail) + '?subject=' + encodeURIComponent(onderwerp) + '&body=' + encodeURIComponent(reviewTekst(x)); (S.reviewGevraagd = S.reviewGevraagd || {})[x.k.id] = today(); save(); setTimeout(R, 500); return; }
  if (!confirm(l.length + ' klant' + (l.length > 1 ? 'en' : '') + ' om een review vragen?')) return;
  let ok = 0; for (const x of l) { try { const r = await CLOUD.call('vet-mail', { to: x.mail, subject: onderwerp, text: reviewTekst(x) }); if (r.error) throw new Error(r.error); (S.reviewGevraagd = S.reviewGevraagd || {})[x.k.id] = today(); ok++; } catch (e) { alert('Mislukt voor ' + x.k.n + ': ' + e.message); break; } }
  save(); R(); toast(ok + ' verstuurd');
}
function reviewOverslaan(id) { (S.klantx[id] = S.klantx[id] || {}).geenReview = true; save(); R(); }
function vReviews() {
  const l = reviewKandidaten(); const c = S.cfg;
  return `<h1>Google-reviews vragen</h1>
  <div class="c"><p class="mu">Klanten die hun factuur minstens ${esc(c.reviewDagen ?? 3)} dagen geleden betaalden (en niet langer dan 2 maanden), met een e-mailadres en die nog nooit om een review gevraagd werden. Elke klant krijgt maximaal één keer een vraag.</p>
  <div class="cols">${inp('Link naar je Google-reviewpagina', 'S.cfg.reviewLink', { ph: 'https://g.page/r/…/review' })}${inp('Na hoeveel dagen vragen', 'S.cfg.reviewDagen', { num: 1, ph: '3' })}</div>
  <p class="mu" style="font-size:12px">Je link vind je in Google Bedrijfsprofiel › "Vraag om reviews" › link kopiëren. ${ext('https://business.google.com/', 'Google Bedrijfsprofiel')}</p>
  <details><summary class="mu" style="cursor:pointer">Tekst aanpassen</summary>${inp('Tekst ({naam} {link} {ik} {bedrijf})', 'S.cfg.reviewTekst', { area: 1, rows: 9, ph: REVIEW_TEKST })}</details></div>
  ${l.length && !RO ? `<div class="row" style="margin:0 0 10px"><span class="sp"></span><button onclick="reviewStuur([...document.querySelectorAll('.rvw:checked')].map(e=>e.value))">⭐ Vraag review aan geselecteerde</button></div>` : ''}
  <div class="c" style="padding:0;overflow:auto"><table class="t"><tr><th></th><th>Klant</th><th>E-mail</th><th>Factuur</th><th>Betaald</th><th></th></tr>
  ${l.map((x) => `<tr><td><input class="rvw" type="checkbox" value="${x.k.id}" checked style="width:auto;margin:0"></td><td><b>${esc(x.k.n)}</b></td><td>${esc(x.mail)}</td><td class="nw">${esc(x.d.nr)}</td><td class="nw">${dt(x.betaald)}</td><td class="nw">${RO ? '' : `<button class="sm b2" onclick="reviewStuur(['${x.k.id}'])">Vragen</button> <button class="lnk sm" onclick="reviewOverslaan('${x.k.id}')">Niet vragen</button>`}</td></tr>`).join('') || '<tr><td colspan="6" class="mu" style="padding:16px">Op dit moment niemand om een review te vragen.</td></tr>'}</table></div>
  ${Object.keys(S.reviewGevraagd || {}).length ? `<p class="mu">Al gevraagd: ${Object.keys(S.reviewGevraagd).length} klanten.</p>` : ''}`;
}

/* ================= OFFERTE ONLINE LATEN AANVAARDEN ================= */
const OFF_URL = () => location.origin + location.pathname.replace(/[^/]*$/, '') + 'offerte.html';
function offToken() { const a = new Uint8Array(24); crypto.getRandomValues(a); return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join(''); }
async function offerteLink() {
  const d = curDoc(); if (!d || d.type !== 'offerte' || d.status === 'concept') return alert('Rond de offerte eerst af.');
  if (!CLOUD.session()) return alert('Log in bij de cloud om een link te maken.');
  if (d.online && d.online.token && !confirm('Er bestaat al een link voor deze offerte. Een nieuwe link maken? (De oude blijft geldig tot je hem intrekt.)')) return offerteLinkToon();
  toast('Link maken…', 2500);
  const blob = await pdfVan(d); const pdf = await blobB64(blob); const t = C.totalen(d), b = S.cfg.bedrijf;
  const data = { nr: d.nr, datum: d.datum, geldig: d.verval, klant: { naam: d.klant.naam, straat: d.klant.straat, pc: [d.klant.pc, d.klant.gemeente].filter(Boolean).join(' ') }, bedrijf: { naam: b.naam, persoon: b.persoon, straat: b.straat, pc: b.pc + ' ' + b.gemeente, tel: b.tel, email: b.email, btw: C.fmtBtw(b.btw), website: b.website },
    lijnen: d.lijnen.map((l) => ({ oms: l.oms, det: l.det, aantal: l.aantal, eenheid: l.eenheid, prijs: l.prijs, btw: (RL.btwCodes[l.btw] || {}).label || l.btw, totaal: C.r2(C.lijnEx(l)) })), korting: t.korting || 0, ex: t.ex, btw: t.btw, inc: t.inc, groepen: t.groepen.map((g) => ({ label: (RL.btwCodes[g.code] || {}).label, basis: g.basis, btw: g.btw })),
    opm: d.opm || '', pdf, pdfNaam: VET_PDF.naam(d), kleur: '#1b6a8a' };
  const token = offToken();
  try {
    await CLOUD.req('/rest/v1/offerte_link', { method: 'POST', headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify({ token, doc_id: d.id, data, geldig_tot: d.verval || null }) });
  } catch (e) { return alert('Link maken mislukt: ' + e.message); }
  d.online = { token, gemaakt: new Date().toISOString(), status: 'open' }; save(); R(); offerteLinkToon();
}
function offerteLinkToon() {
  const d = curDoc(); const url = OFF_URL() + '#' + d.online.token; const k = d.klant || {};
  const tekst = `Dag ${(k.naam || '').split(' ')[0]},\n\nHierbij mijn offerte ${d.nr}. U kan ze bekijken en meteen online goedkeuren via deze link:\n${url}\n\nGroetjes,\n${S.cfg.bedrijf.persoon || S.cfg.bedrijf.naam}\n${S.cfg.bedrijf.naam}`;
  window._offTekst = tekst; window._offUrl = url;
  modal(`<h2>Offerte ${esc(d.nr)} online</h2><p class="mu">De klant opent de link, bekijkt de offerte (met PDF) en drukt op <b>Akkoord</b> of <b>Weigeren</b>. Het resultaat komt vanzelf in VET Office.</p>
  <input readonly value="${esc(url)}" onclick="this.select()">
  <div class="row wrap" style="gap:8px;margin:8px 0 12px"><button class="b2" onclick="navigator.clipboard.writeText(window._offUrl);toast('Link gekopieerd')">Link kopiëren</button><a target="_blank" href="${esc(url)}"><button class="b2">Bekijken</button></a>
  ${k.email ? `<a href="mailto:${esc(k.email)}?subject=${encodeURIComponent('Offerte ' + d.nr + ' – ' + S.cfg.bedrijf.naam)}&body=${encodeURIComponent(tekst)}"><button class="b2">Mailen</button></a>` : ''}
  ${k.tel ? `<a target="_blank" href="https://wa.me/${esc(String(k.tel).replace(/\D/g, '').replace(/^0/, '32'))}?text=${encodeURIComponent(tekst)}"><button class="b2">WhatsApp</button></a>` : ''}</div>
  <div class="row"><button class="lnk" style="color:var(--rd)" onclick="offerteIntrekken()">Link intrekken</button><span class="sp"></span><button onclick="sluit()">Sluiten</button></div>`);
}
async function offerteIntrekken() {
  const d = curDoc(); if (!d.online || !confirm('Link intrekken? De klant kan de offerte dan niet meer openen.')) return;
  try { await CLOUD.req('/rest/v1/offerte_link?token=eq.' + d.online.token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'ingetrokken', updated_at: new Date().toISOString() }) }); } catch (e) { return alert('Intrekken mislukt: ' + e.message); }
  d.online.status = 'ingetrokken'; save(); sluit(); R();
}
// beslissingen van klanten ophalen (bij elke synchronisatie, max. 1x per minuut)
let OFF_LAATST = 0;
async function offerteBeslissingen() {
  if (RO || typeof CLOUD === 'undefined' || !CLOUD.session() || Date.now() - OFF_LAATST < 55000) return; OFF_LAATST = Date.now();
  const open = S.docs.filter((d) => d.type === 'offerte' && d.online && d.online.status === 'open'); if (!open.length) return;
  try {
    const l = await CLOUD.rest('offerte_link?select=token,doc_id,status,naam,opmerking,beslist_op&status=in.(aanvaard,geweigerd)&token=in.(' + open.map((d) => d.online.token).join(',') + ')');
    let n = 0; l.forEach((x) => { const d = open.find((y) => y.online.token === x.token); if (!d) return; d.online.status = x.status; d.online.naam = x.naam; d.online.opmerking = x.opmerking; d.online.beslist = x.beslist_op; d.status = x.status === 'aanvaard' ? 'aanvaard' : 'geweigerd'; n++; S.log.push({ t: new Date().toISOString(), w: 'offerte-' + x.status, id: d.id, nr: d.nr, door: x.naam });
      toast('Offerte ' + d.nr + ' ' + (x.status === 'aanvaard' ? 'AANVAARD' : 'geweigerd') + ' door ' + x.naam, 6000); });
    if (n) { save(); R(); }
  } catch (e) { console.warn('offertes', e); }
}
setInterval(offerteBeslissingen, 60000); setTimeout(offerteBeslissingen, 5000);

function vOnline(d) {
  if (d.type !== 'offerte' || !d.online) return '';
  const o = d.online; const kl = { open: 'b', aanvaard: 'g', geweigerd: 'r', ingetrokken: 'n' }[o.status] || 'b';
  return `<div class="ban ${kl === 'g' ? 'g' : kl === 'r' ? 'o' : 'b'}">🔗 Online offerte: <b>${o.status === 'open' ? 'wacht op antwoord van de klant' : o.status === 'aanvaard' ? 'AANVAARD door ' + esc(o.naam || '') + ' op ' + esc(String(o.beslist || '').replace('T', ' ').slice(0, 16)) : o.status === 'geweigerd' ? 'geweigerd door ' + esc(o.naam || '') : 'link ingetrokken'}</b>${o.opmerking ? '<br>Opmerking klant: ' + esc(o.opmerking) : ''}
  ${!RO && o.status !== 'ingetrokken' ? ` <button class="sm b2" onclick="offerteLinkToon()">Link tonen</button>` : ''}${!RO && o.status === 'aanvaard' ? ` <button class="sm" onclick="offerteNaar('voorschot')">→ Voorschotfactuur</button> <button class="sm b2" onclick="offerteNaar('factuur')">→ Factuur</button>` : ''}</div>`;
}
