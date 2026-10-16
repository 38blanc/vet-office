/* VET Office – overnemen uit Dexxter (alleen lezen in Dexxter).
 * Leest het exportbestand dexxter-export.json en zet klanten, artikels, facturen, offertes, creditnota's,
 * kosten, investeringen en leveranciers in VET Office. Opnieuw importeren werkt bij (zelfde id's met "dx").
 * Er wordt NIETS verwijderd: klanten, documenten en kosten die alleen in VET Office staan, blijven staan. */

// Dexxter-grootboeknummer → kostencategorie in VET Office
const DX_LED = {
  230001: 'investering', 603001: 'onderaannemingen', 604010: 'handelsgoederen-verbruiksmaterialen', 610310: 'kosten-boekhoudsoftware',
  610401: 'opstartkosten', 611001: 'klein-materiaal-elektrisch-handmateriaal', 611002: 'klein-materiaal-handmateriaal',
  611010: 'kleine-aankopen-allerlei-schrijfgerief-p', 611020: 'boeken-opleidingen-vak-tijdschriften', 611091: 'onderhoud-herstelling-materiaal',
  611610: 'kosten-sociale-media-advertising', 611620: 'marketing-reclame-allerlei', 613010: 'verzekering-burgerlijke-aansprakelijkhei',
  618020: 'sociale-bijdragen-kwartaalbijdragen'
};
const DX_TPL = { Handelsgoederen: 'handelsgoederen-verbruiksmaterialen', Onderaannemingen: 'onderaannemingen', Investeringen: 'investering', SocialeBijdragen: 'sociale-bijdragen-kwartaalbijdragen', Verzekeringen: 'verzekeringen-overig', KostenSoftware: 'kosten-software-informatica', Opstartkosten: 'opstartkosten', PubliciteitMarketing: 'marketing-reclame-allerlei', AlgemeneKosten: 'kleine-aankopen-allerlei-schrijfgerief-p' };
const dxNorm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
const dxEenheid = (u) => { const x = dxNorm(u); return x.startsWith('uur') ? 'uren' : x.startsWith('km') || x.startsWith('kilometer') ? 'km' : 'stuks'; };
const dxArtEenheid = (u) => { const x = dxEenheid(u); return x === 'uren' ? 'uur' : x === 'km' ? 'km' : 'stuk'; };
const dxBtwNr = (nr) => (nr ? 'BE' + String(nr).replace(/\D/g, '').padStart(10, '0') : '');

function dexxterVoorbeeld(x) {
  const n = (a) => (a || []).length;
  return { klanten: n(x.klanten), artikels: n(x.art), facturen: n(x.inv), offertes: n(x.off), creditnotas: n(x.cn), kosten: n(x.exp), investeringen: n(x.investments), leveranciers: n(x.lev) };
}

function dexxterImport(x) {
  const log = { klantenNieuw: 0, klantenBij: 0, artikels: 0, docs: 0, kosten: 0, invest: 0 };
  S.klantx = S.klantx || {}; S.artikels = S.artikels || []; S.uitgaven = S.uitgaven || []; S.invest = S.invest || [];

  /* klanten: samenvoegen op naam (of e-mail + straat), nooit verwijderen */
  const dxKlant = {}; // dexxter customerId → VET-klant
  (x.klanten || []).forEach((c) => {
    const ci = c.companyInfo || {}, a = c.address || {};
    const naam = String(ci.companyName || '').trim(); if (!naam) return;
    const straat = [a.street, a.number].filter(Boolean).join(' ') + (a.busNumber ? ' bus ' + a.busNumber : '');
    const pc = [a.zipCode, a.city].filter(Boolean).join(' ');
    const tel = String(ci.phone || '').replace(/[​-‏‪-‮⁠-⁯﻿]/g, '');
    let k = S.klanten.find((y) => dxNorm(y.n) === dxNorm(naam)) || (ci.email && S.klanten.find((y) => dxNorm(y.mail) === dxNorm(ci.email) && dxNorm(y.straat) === dxNorm(straat)));
    if (!k) { k = { id: uid('c'), n: naam, straat, pc, adres: [straat, pc].filter(Boolean).join(', '), tel, mail: ci.email || '' }; S.klanten.push(k); log.klantenNieuw++; }
    else { if (!k.straat && straat) { k.straat = straat; k.pc = pc; k.adres = [straat, pc].filter(Boolean).join(', '); } if (!k.tel && tel) k.tel = tel; if (!k.mail && ci.email) k.mail = ci.email; log.klantenBij++; }
    const kx = S.klantx[k.id] = S.klantx[k.id] || {};
    if (ci.companyNumber && !kx.btw) kx.btw = dxBtwNr(ci.companyNumber);
    if (!kx.type) kx.type = c.customerType === 'PRIVATE' ? 'particulier' : 'bedrijf';
    if (a.country && a.country !== 'BE') { kx.land = a.country; }
    kx.dx = [...new Set([...(kx.dx || []), c.customerId])];
    dxKlant[c.customerId] = k;
  });

  /* artikels: Dexxter is de bron (prijs, omschrijving, btw); eigen artikels blijven staan */
  (x.art || []).forEach((a) => {
    let y = S.artikels.find((z) => dxNorm(z.n) === dxNorm(a.n));
    if (!y) { y = { id: uid('a'), n: a.n }; S.artikels.push(y); }
    Object.assign(y, { p: a.p ?? 0, u: dxArtEenheid(a.u), det: a.det || '', btw: String(a.btw ?? 21) }); log.artikels++;
  });
  S.artikelsKlaar = true;
  const artDet = {}; (x.art || []).forEach((a) => { artDet[dxNorm(a.n)] = a.det || ''; });

  /* documenten */
  const docVan = (o, type) => {
    const k = dxKlant[o.cid]; const ka = (o.k && o.k.a) || {};
    if (k && o.verl) S.klantx[k.id].type = 'aannemer';
    const snap = k ? klantSnapshot(k) : { naam: (o.k || {}).n || '' };
    Object.assign(snap, { naam: (o.k || {}).n || snap.naam, straat: [ka.s, ka.nr].filter(Boolean).join(' ') + (ka.bus ? ' bus ' + ka.bus : '') || snap.straat, pc: ka.pc || snap.pc, gemeente: ka.g || snap.gemeente, btw: (o.k && o.k.btw) ? dxBtwNr(o.k.btw) : snap.btw, email: (o.k || {}).mail || snap.email });
    if (snap.btw && !snap.peppol) snap.peppol = C.peppolId(snap.btw);
    const lijnen = (o.it || []).map((i) => {
      const bruto = (i.q || 0) * (i.p || 0);
      const korting = i.disc ? (i.discP ? i.disc : bruto ? C.r2(i.disc / bruto * 100) : 0) : 0;
      return { id: uid('l'), oms: i.n || '', det: i.det ?? artDet[dxNorm(i.n)] ?? '', aantal: i.q ?? 1, eenheid: dxEenheid(i.u), prijs: i.p ?? 0, btw: o.verl ? 'VERL' : String(i.btw ?? 21), korting };
    });
    const d = {
      id: 'dx' + o.id, type, nr: o.nr || '', datum: o.d, verval: o.due || o.d, klant: snap, lijnen, opm: o.opm || '', klantRef: o.ref || '',
      korting: o.disc ? (o.discP ? o.disc : 0) : 0, ogm: o.ogm || '', betalingen: [], bron: { app: 'dexxter', id: o.id, label: 'Dexxter' }, aangemaakt: o.d
    };
    if (o.disc && !o.discP) { const t = C.totalen(Object.assign({}, d, { korting: 0 })); d.korting = t.ex ? C.r2(o.disc / t.ex * 100) : 0; }
    if (o.sent) d.verzonden = o.d + 'T12:00:00';
    if (o.peppol) d.peppol = { status: 'verzonden via Dexxter', datum: o.d };
    if (o.att && o.att.length) d.dxBijlagen = o.att;
    if (type === 'offerte') d.status = o.draft ? 'concept' : ({ INVOICED: 'gefactureerd', ACCEPTED: 'aanvaard', DECLINED: 'geweigerd', REJECTED: 'geweigerd' }[o.st] || 'verzonden');
    else d.status = o.draft ? 'concept' : 'open';
    return d;
  };
  const zet = (d) => { const i = S.docs.findIndex((y) => y.id === d.id); if (i > -1) { // bestaande import: betalingen uit VET Office behouden
      const oud = S.docs[i]; const eigen = (oud.betalingen || []).filter((b) => !b.dx); d.betalingen = d.betalingen.concat(eigen); S.docs[i] = d; } else S.docs.push(d); log.docs++; };
  const facturen = (x.inv || []).map((o) => docVan(o, 'factuur'));
  const offertes = (x.off || []).map((o) => docVan(o, 'offerte'));
  const cns = (x.cn || []).map((o) => { const d = docVan(o, 'creditnota'); const f = facturen.find((y) => y.nr === o.inv); if (f) d.ref = { id: f.id, nr: f.nr }; d.status = 'definitief'; if (o.paidBack) d.status = 'betaald'; return d; });
  // betalingen: gecrediteerd via creditnota, of betaald in Dexxter
  facturen.forEach((f) => {
    const src = x.inv.find((o) => 'dx' + o.id === f.id);
    cns.filter((c) => c.ref && c.ref.id === f.id).forEach((c) => f.betalingen.push({ datum: c.datum, bedrag: C.r2(C.totalen(c).inc), via: 'creditnota ' + c.nr, cn: c.id, dx: 1 }));
    const open = C.totalen(f).open;
    if (src.paid && open > 0.004) f.betalingen.push({ datum: f.datum, bedrag: C.r2(open), via: 'betaald (Dexxter)', dx: 1 });
  });
  [...facturen, ...offertes, ...cns].forEach(zet);

  /* nummering gelijk aan Dexxter */
  S.cfg.nummer = Object.assign({}, S.cfg.nummer, { factuur: '{J}-{N}', offerte: '{J}-{N}', creditnota: '{J}-{N}' });
  [['factuur', x.inv], ['offerte', x.off], ['creditnota', x.cn]].forEach(([r, l]) => {
    (l || []).forEach((o) => { const m = String(o.nr || '').match(/^(\d{4})-(\d+)$/); if (!m) return; S.seq[r] = S.seq[r] || {}; S.seq[r][m[1]] = Math.max(S.seq[r][m[1]] || 0, +m[2]); });
  });

  /* kosten: één kost per boeking */
  const cats = alleCats();
  (x.exp || []).forEach((e) => {
    (e.b || [{}]).forEach((b, i) => {
      const id = 'dx' + e.id + (i ? '-' + i : '');
      const kc = DX_LED[b.led] || DX_TPL[b.ledT] || 'overige-diensten'; const c = cats.find((y) => y.id === kc) || cats[0];
      const ex = C.r2(b.ex || 0), inc = C.r2(b.inc ?? ex), pct = b.btw != null ? b.btw : ex ? Math.round((inc - ex) / ex * 100) : 0;
      const eu = /EU/.test(e.levType || '') && !/OUTSIDE/.test(e.levType || '');
      const regime = (b.verl || b.med) ? (eu ? 'icdienst' : 'verlegd') : 'normaal';
      const btw = regime === 'normaal' ? C.r2(inc - ex) : C.r2(ex * pct / 100);
      const u = {
        id, datum: e.d, leverancier: e.lev || '', nr: e.nr || '', oms: e.omschr || (b.ledN || ''), kc: c.id, cat: c.rooster, regime,
        tarieven: [{ pct, basis: Math.abs(ex), btw: Math.abs(btw) }], aftrek: b.aftrek ?? c.btw, beroep: b.beroep ?? c.beroep,
        betaald: !!e.paid, creditnota: !!e.cn, bron: { app: 'dexxter', id: e.id }, dxBestand: e.file || '', peppol: e.via === 'PEPPOL'
      };
      if (b.vat === false) u.nietInAangifte = true;
      const j = S.uitgaven.findIndex((y) => y.id === id); if (j > -1) { u.bijlage = S.uitgaven[j].bijlage || ''; u.thumb = S.uitgaven[j].thumb; S.uitgaven[j] = u; } else S.uitgaven.push(u); log.kosten++;
    });
  });

  /* investeringen (afschrijving zoals in Dexxter: bedrag = beroepsdeel) */
  (x.investments || []).forEach((v) => {
    const id = 'dx' + v.investmentId; const jaren = Math.max(1, Math.round((new Date(v.endDate) - new Date(v.startDate)) / (365.25 * 864e5)));
    const inv = { id, uitgave: 'dx' + v.expenseId, oms: v.description || 'Investering', datum: v.startDate, waarde: v.totalDepreciationAmount, jaren, beroep: 100, cat: 'Overige', bron: { app: 'dexxter', id: v.investmentId } };
    if (v.soldDate) inv.verkocht = v.soldDate;
    const j = S.invest.findIndex((y) => y.id === id); if (j > -1) S.invest[j] = inv; else S.invest.push(inv); log.invest++;
  });

  /* leveranciers (met standaardcategorie, voor nieuwe kosten) */
  S.leveranciers = S.leveranciers || [];
  (x.lev || []).forEach((l) => {
    const kc = l.led ? (DX_LED[l.led.number] || DX_TPL[l.led.templateId] || '') : '';
    const y = S.leveranciers.find((z) => z.dx === l.id || dxNorm(z.n) === dxNorm(l.n));
    const a = l.a || {}; const rec = { n: l.n, btw: dxBtwNr(l.nr), type: l.type, kc, mail: l.mail || '', adres: [[a.street, a.number].filter(Boolean).join(' '), [a.zipCode, a.city].filter(Boolean).join(' ')].filter(Boolean).join(', '), dx: l.id };
    if (y) Object.assign(y, rec); else S.leveranciers.push(Object.assign({ id: uid('v') }, rec));
  });

  S.dexxterImport = { datum: new Date().toISOString(), aantallen: dexxterVoorbeeld(x) };
  S.log.push({ t: new Date().toISOString(), w: 'dexxter-import', n: log });
  return log;
}

async function dexxterBestand(f) {
  if (!f) return;
  let x; try { x = JSON.parse(await f.text()); } catch (e) { return alert('Dit is geen geldig Dexxter-exportbestand.'); }
  if (!x || !Array.isArray(x.inv)) return alert('Dit is geen geldig Dexxter-exportbestand.');
  const v = dexxterVoorbeeld(x);
  if (!confirm('Overnemen uit Dexxter:\n' + Object.entries(v).map(([k, n]) => '• ' + n + ' ' + k).join('\n') + '\n\nBestaande gegevens in VET Office blijven staan (niets wordt verwijderd). Doorgaan?')) return;
  const log = dexxterImport(x); await save(); R();
  alert('Klaar.\n• ' + log.klantenNieuw + ' nieuwe klanten, ' + log.klantenBij + ' bijgewerkt\n• ' + log.artikels + ' artikels\n• ' + log.docs + ' documenten\n• ' + log.kosten + ' kosten\n• ' + log.invest + ' investeringen');
}
function vDexxterImport() {
  const i = S.dexxterImport;
  return `<div class="c"><h2>Overnemen uit Dexxter</h2><p class="mu">Kies het bestand <b>dexxter-export.json</b>. Klanten, artikels, facturen, offertes, creditnota's, kosten, investeringen en leveranciers komen in VET Office. Opnieuw importeren werkt alles bij. Wat alleen in VET Office staat, blijft staan.</p>
  ${i ? `<p class="mu">Laatste import: ${esc(String(i.datum).replace('T', ' ').slice(0, 16))} – ${Object.entries(i.aantallen).map(([k, n]) => n + ' ' + k).join(', ')}</p>` : ''}
  ${RO ? '' : `<label class="b2" style="display:inline-block;padding:9px 14px;border-radius:8px;background:var(--ac2);color:var(--ac);font-weight:600;cursor:pointer">Exportbestand kiezen<input type="file" accept=".json,application/json" style="display:none" onchange="dexxterBestand(this.files[0])"></label>`}</div>`;
}
