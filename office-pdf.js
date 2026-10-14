/* VET Office – PDF van factuur, offerte, voorschotfactuur en creditnota
 * Zelfde opmaak als de Dexxter-documenten: PT Sans, blauwe hoek rechtsboven, logo, tabel, QR-code, opmerkingen, algemene voorwaarden. */
(function (root) {
  const C = root.VET_CORE, R = root.VET_RULES;
  const BLAUW = [54, 123, 176], GRIJS = [120, 120, 120], LIJN = [205, 205, 205], ZWART = [20, 20, 20];
  let fontsLaden = null;
  const laadFonts = () => fontsLaden || (fontsLaden = new Promise((res, rej) => { if (root.VET_FONTS) return res(); const s = document.createElement('script'); s.src = 'fonts.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s); }));
  let logoData = null;
  const laadLogo = async (src) => {
    if (logoData && logoData.src === src) return logoData;
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; c.getContext('2d').drawImage(img, 0, 0);
    logoData = { src, data: c.toDataURL('image/png'), w: img.naturalWidth, h: img.naturalHeight }; return logoData;
  };
  const TITELS = { factuur: 'Factuur', offerte: 'Offerte', voorschot: 'Factuur', creditnota: 'Creditnota' };
  const DATUMLABEL = { factuur: 'Factuurdatum', offerte: 'Offertedatum', voorschot: 'Factuurdatum', creditnota: 'Datum' };

  /* doc: document, cfg: instellingen, opt: { kopie:true (Dexxter-modus), betaaldStempel:true } -> Promise<Blob> */
  async function maak(doc, cfg, opt = {}) {
    await laadFonts();
    const { jsPDF } = root.jspdf;
    const pdf = new jsPDF({ unit: 'pt', format: 'a4', compress: true });
    // onzichtbare tekens (bv. bij een gsm-nummer gekopieerd uit Contacten: +32 …) weglaten
    const INV = /[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g, schoon = (x) => typeof x === 'string' ? x.replace(INV, '') : Array.isArray(x) ? x.map(schoon) : x;
    const _text = pdf.text.bind(pdf), _split = pdf.splitTextToSize.bind(pdf);
    pdf.text = (t, ...a) => _text(schoon(t), ...a); pdf.splitTextToSize = (t, ...a) => _split(schoon(t), ...a);
    pdf.addFileToVFS('PTSans-Regular.ttf', root.VET_FONTS.regular); pdf.addFont('PTSans-Regular.ttf', 'PT', 'normal');
    pdf.addFileToVFS('PTSans-Bold.ttf', root.VET_FONTS.bold); pdf.addFont('PTSans-Bold.ttf', 'PT', 'bold');
    const W = 595.28, H = 841.89, L = 35.8, RE = W - 35.8;
    const b = cfg.bedrijf || {}; const k = doc.klant || {};
    const rv = R.rechtsvormen[cfg.rechtsvorm] || R.rechtsvormen.eenmanszaak;
    const t = C.totalen(doc);
    const f = (st, sz, col) => { pdf.setFont('PT', st); pdf.setFontSize(sz); pdf.setTextColor(...(col || ZWART)); };
    const txt = (s, x, y, o) => pdf.text(Array.isArray(s) ? s : String(s ?? ''), x, y, Object.assign({ lineHeightFactor: 1.2 }, o || {}));

    const hoek = () => { pdf.setFillColor(...BLAUW); pdf.triangle(413, 0, W, 0, W, 121, 'F'); };
    hoek();
    // logo
    try { const lg = await laadLogo(cfg.logo || 'logo-factuur.png'); const lw = 72, lh = lw * lg.h / lg.w; pdf.addImage(lg.data, 'PNG', L - 1, 30, lw, lh); } catch (e) {}
    // afzender
    let y = 124;
    f('bold', 14.5); txt(String(b.naam || '').toUpperCase() + (rv.afkorting ? ' ' + rv.afkorting : ''), L, y);
    f('normal', 9.6, GRIJS); y += 20;
    const afz = [rv.natuurlijk ? b.persoon : '', b.straat, [b.pc, b.gemeente].filter(Boolean).join(' '), b.land || 'België', b.email, b.tel, b.iban ? 'IBAN: ' + String(b.iban).replace(/\s/g, '') : '', b.btw ? String(b.btw).replace(/\s/g, '') : '',
      !rv.natuurlijk && b.rpr ? 'RPR ' + b.rpr : '', !rv.natuurlijk && b.zetelTekst ? b.zetelTekst : ''].filter(Boolean);
    afz.forEach((l) => { txt(l, L, y); y += 15.7; });
    // titel + nummer
    const top = Math.max(y + 18, 300);
    f('normal', 30, BLAUW); txt(TITELS[doc.type] || 'Document', L, top);
    f('normal', 14.5); txt('# ' + (doc.nr || 'CONCEPT'), L, top + 39);
    f('normal', 9.6);
    let dy = top + 59;
    const rij = (a, v) => { f('normal', 9.6); const al = pdf.splitTextToSize(a, 85); al.forEach((x, i) => txt(x, L, dy + i * 11.3)); txt(v, 130.2, dy); dy += 12 * Math.max(1, al.length); };
    rij(DATUMLABEL[doc.type] || 'Datum', C.dt(doc.datum));
    if (doc.type !== 'creditnota') rij('Vervaldatum', C.dt(doc.verval));
    if ((doc.type === 'factuur' || doc.type === 'voorschot') && doc.ogm && !doc.verlegdZonderBetaling) rij('Gestructureerde mededeling', doc.ogm);
    if (doc.type === 'creditnota' && doc.ref) rij('Betreft factuur', doc.ref.nr + (doc.ref.datum ? ' van ' + C.dt(doc.ref.datum) : ''));
    if (doc.klantRef) rij('Uw referentie', doc.klantRef);
    // klant
    let ky = top + 5;
    f('bold', 14.5); pdf.splitTextToSize(k.naam || '', 210).forEach((l) => { txt(l, 350.6, ky); ky += 18; });
    f('normal', 9.6); ky += 2;
    [k.tav ? 't.a.v. ' + k.tav : '', k.straat, [k.pc, k.gemeente].filter(Boolean).join(' '), k.landNaam || 'België', k.btw ? C.fmtBtw(k.btw) : ''].filter(Boolean).forEach((l) => { txt(l, 350.6, ky); ky += 15.7; });

    // tabel
    let ty = Math.max(dy, ky) + 34;
    const kol = { oms: L, aantal: 193.2, prijs: 245.6, btw: 347.4, ex: 490.5, tot: RE };
    const kop = () => {
      f('bold', 9.6);
      txt('Beschrijving', kol.oms, ty); txt('Aantal', kol.aantal, ty); txt('Prijs excl. btw', kol.prijs, ty); txt('Btw', kol.btw, ty);
      txt('Totaal excl. btw', kol.ex, ty, { align: 'right' }); txt('Totaal', kol.tot, ty, { align: 'right' });
      ty += 8; pdf.setDrawColor(...ZWART); pdf.setLineWidth(0.8); pdf.line(L, ty, RE, ty); ty += 17;
    };
    const nieuwePagina = () => { pdf.addPage(); ty = 50; };
    kop();
    const lijnen = doc.lijnen || [];
    lijnen.forEach((l, i) => {
      f('normal', 9.6);
      const oms = pdf.splitTextToSize(l.oms || '', 150);
      const det = l.det ? pdf.splitTextToSize(l.det, 140) : [];
      const h = oms.length * 12 + det.length * 11.5 + 14;
      if (ty + h > H - 60) { nieuwePagina(); kop(); }
      f('normal', 9.6); txt(oms, kol.oms, ty);
      const c = R.btwCodes[String(l.btw)] || R.btwCodes['21'];
      const aantal = C.num(l.aantal);
      txt((Number.isInteger(aantal) ? aantal : String(aantal).replace('.', ',')) + ' ' + (l.eenheid || 'stuks'), kol.aantal, ty);
      txt(C.eur(C.num(l.prijs) * (1 - C.num(l.korting) / 100)), kol.prijs, ty);
      txt(c.pct ? c.pct + '%' : (String(l.btw) === '0' ? '0%' : '0%'), kol.btw, ty);
      txt(C.eur(C.lijnEx(l)), kol.ex, ty, { align: 'right' }); txt(C.eur(C.lijnInc(l)), kol.tot, ty, { align: 'right' });
      let yy = ty + oms.length * 12;
      if (det.length) { f('normal', 9.6); txt(det, kol.oms + 11.2, yy - 0.5); yy += det.length * 11.5; }
      ty = yy + 2;
      if (i < lijnen.length - 1) { pdf.setDrawColor(...LIJN); pdf.setLineWidth(0.6); pdf.line(L, ty, RE, ty); ty += 16; }
      else { pdf.setDrawColor(...LIJN); pdf.setLineWidth(0.6); pdf.line(L, ty, RE, ty); }
    });
    // totalen
    let sy = ty + 34;
    if (sy + 110 > H - 40) { nieuwePagina(); sy = 60; }
    const qrY = sy;
    const totRij = (lbl, val, opts = {}) => { f('bold', opts.big ? 11.5 : 9.6, opts.blauw ? BLAUW : ZWART); txt(lbl, 350.6, sy); f(opts.big ? 'bold' : 'normal', opts.big ? 13 : 9.6, ZWART); txt(val, RE, sy, { align: 'right' }); sy += opts.gap || 23.2; };
    if (t.korting) totRij('Korting op de factuur (' + String(t.kortingPct).replace('.', ',') + '%)', C.eur(t.korting));
    totRij('Totaal excl. btw', C.eur(t.ex));
    totRij('Totaal btw', C.eur(t.btw), { gap: 10 });
    pdf.setDrawColor(...ZWART); pdf.setLineWidth(0.8); pdf.line(350.6, sy, RE, sy); sy += 21;
    totRij(doc.type === 'creditnota' ? 'TE CREDITEREN' : 'TOTAAL', C.eur(t.inc), { big: true, blauw: true });
    // betaal-QR (enkel factuur met openstaand bedrag)
    if ((doc.type === 'factuur' || doc.type === 'voorschot') && b.iban && t.inc > 0 && !opt.betaaldStempel) {
      const m = C.qrMatrix(C.epc({ naam: b.naam, iban: b.iban, bic: b.bic, bedrag: t.open > 0 ? t.open : t.inc, ogm: doc.ogm || doc.nr }));
      const size = 62, cell = size / m.length; pdf.setFillColor(0, 0, 0);
      m.forEach((r, ri) => r.forEach((d, ci) => { if (d) pdf.rect(L + ci * cell, qrY - 9 + ri * cell, cell + 0.05, cell + 0.05, 'F'); }));
      f('normal', 9.6, BLAUW); txt('Deze QR-code werkt enkel via een banking app', 122.8, qrY + 23.2);
    }
    // opmerkingen + verplichte vermeldingen
    let oy = Math.max(sy, qrY + 80) + 22;
    const opm = [doc.opm, ...(doc.vermeldingen || [])].filter((x) => x && String(x).trim());
    const blok = (titel, regels, size) => {
      if (!regels.length) return;
      f('bold', 9.6); if (oy > H - 60) { nieuwePagina(); oy = 50; } txt(titel, L, oy); oy += 15;
      regels.forEach((r) => { f('normal', size); pdf.splitTextToSize(r, RE - L).forEach((l) => { if (oy > H - 40) { nieuwePagina(); oy = 50; } txt(l, L, oy); oy += size * 1.25; }); });
      oy += 6;
    };
    blok('Opmerkingen', opm, 9.6);
    // algemene voorwaarden (genummerd, klein, zoals Dexxter)
    const vw = String(cfg.voorwaarden || '').split(/\n+/).map((s) => s.trim()).filter(Boolean);
    if (vw.length && doc.type !== 'creditnota') {
      if (oy > H - 120) { nieuwePagina(); oy = 45; }
      f('bold', 8.6); txt('Algemene voorwaarden', L, oy); oy += 14;
      vw.forEach((r, i) => {
        f('normal', 6.4); const nr = (i + 1) + '. '; const lines = pdf.splitTextToSize(r.replace(/^\d+\.\s*/, ''), RE - L - 14);
        lines.forEach((l, li) => { if (oy > H - 30) { nieuwePagina(); oy = 45; } if (li === 0) txt(nr, L + 12 - pdf.getTextWidth(nr) + 2, oy); txt(l, L + 12, oy); oy += 7.2; });
        oy += 1.8;
      });
    }
    // stempels
    const n = pdf.getNumberOfPages();
    const stempel = (regel1, regel2, kleur) => {
      for (let p = 1; p <= n; p++) {
        pdf.setPage(p); pdf.saveGraphicsState(); pdf.setGState(new pdf.GState({ opacity: 0.35 }));
        f('normal', 58, kleur); txt(regel1, 175, 600, { angle: 55 }); txt(regel2, 235, 640, { angle: 55 }); pdf.restoreGraphicsState();
      }
    };
    if (opt.betaaldStempel) stempel('FACTUUR IS', 'AL BETAALD', [80, 170, 80]);
    if (opt.kopie) stempel('KOPIE', 'zie Dexxter', [200, 120, 40]);
    if (!doc.nr || doc.status === 'concept') stempel('CONCEPT', '', [170, 170, 170]);
    // paginanummers bij meerdere pagina's
    if (n > 1) for (let p = 1; p <= n; p++) { pdf.setPage(p); f('normal', 7.5, GRIJS); txt((TITELS[doc.type] || '') + ' ' + (doc.nr || '') + ' – pagina ' + p + '/' + n, RE, H - 18, { align: 'right' }); }
    pdf.setProperties({ title: (TITELS[doc.type] || 'Document') + ' ' + (doc.nr || ''), author: b.naam || '', creator: 'VET Office' });
    return pdf.output('blob');
  }
  const naam = (doc) => ((TITELS[doc.type] || 'Document') + (doc.type === 'voorschot' ? '-voorschot' : '') + '-' + (doc.nr || 'concept')).replace(/[^\w.-]+/g, '-') + '.pdf';
  root.VET_PDF = { maak, naam, laadFonts };
})(window);
