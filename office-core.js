/* VET Office – rekenkern: totalen, gestructureerde mededeling, betaal-QR, btw-roosters,
 * Intervat-XML (btw-aangifte en klantenlisting), Peppol UBL (BIS Billing 3.0), inlezen van ontvangen UBL,
 * bankbestanden (CSV/CODA) en de belastingraming. Geen schermcode hier. */
(function (root) {
  const R = root.VET_RULES;
  const C = {};
  const r2 = (x) => Math.round((Number(x) + Number.EPSILON) * 100) / 100;
  C.r2 = r2;
  C.num = (v) => { if (typeof v === 'number') return v; const s = String(v ?? '').trim().replace(/\s|€/g, ''); if (!s) return 0; const t = /,\d{1,2}$/.test(s) ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, ''); const n = parseFloat(t); return isNaN(n) ? 0 : n; };
  C.eur = (x) => '€ ' + (Number(x) || 0).toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  C.eurPlain = (x) => (Number(x) || 0).toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  C.dt = (d) => { if (!d) return ''; const [y, m, dd] = String(d).slice(0, 10).split('-'); return dd + '-' + m + '-' + y; };
  C.today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  C.addDays = (d, n) => { const x = new Date(d + 'T12:00:00'); x.setDate(x.getDate() + Number(n || 0)); return x.toISOString().slice(0, 10); };
  C.kwartaal = (d) => ({ j: +String(d).slice(0, 4), q: Math.floor((+String(d).slice(5, 7) - 1) / 3) + 1 });
  C.inKwartaal = (d, j, q) => { if (!d) return false; const k = C.kwartaal(d); return k.j === +j && k.q === +q; };
  C.btwDigits = (v) => String(v || '').replace(/[^0-9]/g, '');
  C.isBEbtw = (v) => /^BE/i.test(String(v || '').replace(/\s/g, '')) || (C.btwDigits(v).length === 10 && !/^[A-Z]{2}/i.test(String(v || '').trim()) );
  C.fmtBtw = (v) => { const s = String(v || '').replace(/[\s.]/g, '').toUpperCase(); if (!s) return ''; const cc = /^[A-Z]{2}/.test(s) ? s.slice(0, 2) : 'BE'; const d = s.replace(/^[A-Z]{2}/, ''); return cc + ' ' + d; };
  // controle Belgisch ondernemingsnummer (mod 97)
  C.checkBEbtw = (v) => { const d = C.btwDigits(v); if (d.length !== 10) return false; return 97 - (Number(d.slice(0, 8)) % 97) === Number(d.slice(8)); };

  /* ---------- totalen ----------
   * lijn: {oms, det, aantal, eenheid, prijs, btw:'21'|'6'|..., korting (% op lijn)}
   * doc.korting: % korting op de hele factuur (zoals Dexxter: "Korting op de factuur (x%)") */
  C.lijnEx = (l) => r2(C.num(l.aantal) * C.num(l.prijs) * (1 - C.num(l.korting) / 100));
  C.code = (l) => R.btwCodes[String(l.btw)] || R.btwCodes['21'];
  C.totalen = (doc) => {
    const lijnen = doc.lijnen || [];
    const bruto = r2(lijnen.reduce((s, l) => s + C.lijnEx(l), 0));
    const kpct = C.num(doc.korting);
    const groepen = {};
    lijnen.forEach((l) => { const k = String(l.btw); groepen[k] = groepen[k] || { code: k, basisBruto: 0 }; groepen[k].basisBruto = r2(groepen[k].basisBruto + C.lijnEx(l)); });
    let kortingTot = 0;
    Object.values(groepen).forEach((g) => {
      g.korting = r2(g.basisBruto * kpct / 100); kortingTot = r2(kortingTot + g.korting);
      g.basis = r2(g.basisBruto - g.korting);
      g.pct = (R.btwCodes[g.code] || {}).pct || 0;
      g.btw = r2(g.basis * g.pct / 100);
    });
    const ex = r2(bruto - kortingTot);
    const btw = r2(Object.values(groepen).reduce((s, g) => s + g.btw, 0));
    const inc = r2(ex + btw);
    const betaald = r2((doc.betalingen || []).reduce((s, b) => s + C.num(b.bedrag), 0));
    return { bruto, kortingPct: kpct, korting: kortingTot, ex, btw, inc, groepen: Object.values(groepen), betaald, open: r2(inc - betaald) };
  };
  C.lijnInc = (l) => r2(C.lijnEx(l) * (1 + C.code(l).pct / 100));

  /* ---------- gestructureerde mededeling (OGM) ---------- */
  C.ogm = (seed) => {
    let base = String(seed).replace(/\D/g, '');
    if (base.length < 10) base = (base + String(Math.floor(Math.random() * 1e10)).padStart(10, '0')).slice(0, 10); else base = base.slice(-10);
    let c = Number(BigInt(base) % 97n); if (c === 0) c = 97;
    const s = base + String(c).padStart(2, '0');
    return '+++' + s.slice(0, 3) + '/' + s.slice(3, 7) + '/' + s.slice(7) + '+++';
  };
  C.ogmGeldig = (o) => { const s = String(o || '').replace(/\D/g, ''); if (s.length !== 12) return false; let c = Number(BigInt(s.slice(0, 10)) % 97n); if (c === 0) c = 97; return c === Number(s.slice(10)); };
  C.ogmDigits = (o) => String(o || '').replace(/\D/g, '');

  /* ---------- betaal-QR (EPC069-12, SEPA) ---------- */
  C.epc = ({ naam, iban, bic, bedrag, ogm, tekst }) => ['BCD', '002', '1', 'SCT', (bic || '').replace(/\s/g, ''), String(naam || '').slice(0, 70), String(iban || '').replace(/\s/g, ''), 'EUR' + Number(bedrag).toFixed(2), '', '', (ogm || tekst || '').slice(0, 140)].join('\n');
  C.qrMatrix = (text) => { const q = root.qrcode(0, 'M'); q.addData(unescape(encodeURIComponent(text))); q.make(); const n = q.getModuleCount(); const m = []; for (let r = 0; r < n; r++) { m.push([]); for (let c = 0; c < n; c++) m[r].push(q.isDark(r, c)); } return m; };

  /* ---------- btw-aangifte: roosters ---------- */
  // docs: alle documenten; uitgaven: alle uitgaven; j/q: periode
  C.roosters = (docs, uitgaven, j, q, extra = {}) => {
    const g = {}; const add = (k, v) => { g[k] = r2((g[k] || 0) + v); };
    const details = { verkopen: [], aankopen: [] };
    docs.filter((d) => d.status !== 'concept' && d.status !== 'geannuleerd' && (d.type === 'factuur' || d.type === 'voorschot' || d.type === 'creditnota') && C.inKwartaal(d.btwDatum || d.datum, j, q)).forEach((d) => {
      const t = C.totalen(d); details.verkopen.push(d);
      t.groepen.forEach((gr) => {
        const code = R.btwCodes[gr.code] || R.btwCodes['21'];
        if (d.type === 'creditnota') {
          if (code.rooster === null) return;
          add(code.rooster === '44' || code.rooster === '46' ? '48' : '49', Math.abs(gr.basis));
          if (gr.btw) add('64', Math.abs(gr.btw));
        } else {
          if (code.rooster === null) return; // kleine onderneming: niets aangeven
          // negatieve lijnen (verrekening voorschot) verminderen de maatstaf
          add(code.rooster, gr.basis);
          if (['01', '02', '03'].includes(code.rooster)) add('54', gr.btw);
        }
      });
    });
    (C.dagontv || []).filter((x) => C.inKwartaal(x.datum, j, q)).forEach((x) => { const code = R.btwCodes[String(x.btw)] || R.btwCodes['21']; if (code.rooster) { add(code.rooster, C.num(x.ex)); if (['01', '02', '03'].includes(code.rooster)) add('54', C.num(x.btwBedrag)); } });
    uitgaven.filter((u) => !u.privé && C.inKwartaal(u.datum, j, q)).forEach((u) => {
      details.aankopen.push(u);
      const cat = u.cat || '82';
      const aftrek = (u.aftrek == null ? 100 : C.num(u.aftrek)) / 100;
      const beroep = (u.beroep == null || u.beroep === '' ? 100 : C.num(u.beroep)) / 100;
      const regime = u.regime || 'normaal';
      (u.tarieven || []).forEach((t) => {
        const basis = C.num(t.basis); const btw = regime === 'normaal' ? C.num(t.btw) : r2(basis * C.num(t.pct) / 100);
        // zoals Dexxter: enkel het beroepsdeel; niet-aftrekbare btw van het beroepsdeel hoort bij de maatstaf
        const maat = r2(basis * beroep + (regime === 'normaal' ? btw * Math.max(0, beroep - aftrek) : 0));
        // ontvangen creditnota: rooster 85 + btw terug in 63, en het oorspronkelijke rooster (81/82/83) verminderen
        if (u.creditnota) { add('85', basis); add(cat, -maat); if (regime === 'normaal') add('63', r2(btw * aftrek)); return; }
        add(cat, maat);
        if (regime === 'verlegd') { add('87', basis); add('56', btw); add('59', r2(btw * aftrek)); }
        else if (regime === 'icdienst') { add('88', basis); add('55', btw); add('59', r2(btw * aftrek)); }
        else if (regime === 'icgoed') { add('86', basis); add('55', btw); add('59', r2(btw * aftrek)); }
        else add('59', r2(btw * aftrek));
      });
    });
    Object.entries(extra || {}).forEach(([k, v]) => { if (C.num(v)) add(k, C.num(v)); });
    // negatieve maatstaven zijn niet toegelaten in de aangifte
    Object.keys(g).forEach((k) => { if (g[k] < 0) g[k] = 0; });
    const XX = ['54', '55', '56', '57', '61', '63'].reduce((s, k) => s + (g[k] || 0), 0);
    const YY = ['59', '62', '64'].reduce((s, k) => s + (g[k] || 0), 0);
    delete g['71']; delete g['72'];
    if (XX - YY >= 0) g['71'] = r2(XX - YY); else g['72'] = r2(YY - XX);
    return { g, XX: r2(XX), YY: r2(YY), details };
  };

  const xe = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  C.xe = xe;
  const declarant = (b) => {
    const tel = String(b.tel || '').replace(/[^0-9+]/g, '');
    return `<ns2:Declarant><VATNumber>${C.btwDigits(b.btw)}</VATNumber><Name>${xe(b.naam)}</Name><Street>${xe(b.straat)}</Street><PostCode>${xe(b.pc)}</PostCode><City>${xe(b.gemeente)}</City><CountryCode>BE</CountryCode>${b.email ? `<EmailAddress>${xe(b.email)}</EmailAddress>` : ''}${tel ? `<Phone>${tel}</Phone>` : ''}</ns2:Declarant>`;
  };
  // Periodieke btw-aangifte (Intervat VATConsignment)
  C.intervatXml = (cfg, j, q, g, opt = {}) => {
    const b = cfg.bedrijf || {};
    const order = ['00', '01', '02', '03', '44', '45', '46', '47', '48', '49', '54', '55', '56', '57', '59', '61', '62', '63', '64', '71', '72', '81', '82', '83', '84', '85', '86', '87', '88', '91'];
    const amounts = order.filter((k) => g[k] != null && (g[k] > 0 || k === '71' || k === '72')).filter((k) => !(k === '72' && !g['72']) && !(k === '71' && g['72'] > 0))
      .map((k) => `<ns2:Amount GridNumber="${Number(k)}">${Number(g[k]).toFixed(2)}</ns2:Amount>`).join('');
    const periode = opt.maand ? `<ns2:Month>${opt.maand}</ns2:Month>` : `<ns2:Quarter>${q}</ns2:Quarter>`;
    return `<?xml version="1.0" encoding="UTF-8"?>
<ns2:VATConsignment xmlns="http://www.minfin.fgov.be/InputCommon" xmlns:ns2="http://www.minfin.fgov.be/VATConsignment" VATDeclarationsNbr="1">
<ns2:VATDeclaration SequenceNumber="1" DeclarantReference="${xe(('VO' + j + 'Q' + q + String(Date.now()).slice(-6)).slice(0, 14))}">
${declarant(b)}
<ns2:Period>${periode}<ns2:Year>${j}</ns2:Year></ns2:Period>
<ns2:Data>${amounts}</ns2:Data>
<ns2:ClientListingNihil>${opt.listingNihil ? 'YES' : 'NO'}</ns2:ClientListingNihil>
<ns2:Ask Restitution="${opt.terug ? 'YES' : 'NO'}" Payment="NO"/>
</ns2:VATDeclaration>
</ns2:VATConsignment>
`;
  };
  // jaarlijkse klantenlisting: Belgische btw-plichtige klanten met ≥ € 250 omzet (excl. btw)
  C.klantenlisting = (docs, j) => {
    const per = {};
    docs.filter((d) => d.status !== 'concept' && d.status !== 'geannuleerd' && ['factuur', 'voorschot', 'creditnota'].includes(d.type) && String(d.datum).startsWith(String(j)) && d.klant && C.isBEbtw(d.klant.btw)).forEach((d) => {
      const k = C.btwDigits(d.klant.btw); const t = C.totalen(d); const s = d.type === 'creditnota' ? -1 : 1;
      per[k] = per[k] || { btw: k, naam: d.klant.naam, omzet: 0, btwBedrag: 0 };
      per[k].omzet = r2(per[k].omzet + s * Math.abs(t.ex)); per[k].btwBedrag = r2(per[k].btwBedrag + s * Math.abs(t.btw));
    });
    return Object.values(per).filter((k) => k.omzet >= 250);
  };
  C.klantenlistingXml = (cfg, j, klanten) => {
    const b = cfg.bedrijf || {};
    const ts = r2(klanten.reduce((s, k) => s + k.omzet, 0)), vs = r2(klanten.reduce((s, k) => s + k.btwBedrag, 0));
    return `<?xml version="1.0" encoding="UTF-8"?>
<ns2:ClientListingConsignment xmlns="http://www.minfin.fgov.be/InputCommon" xmlns:ns2="http://www.minfin.fgov.be/ClientListingConsignment" ClientListingsNbr="1">
<ns2:ClientListing SequenceNumber="1" ClientsNbr="${klanten.length}" DeclarantReference="${xe(('VOKL' + j + String(Date.now()).slice(-6)).slice(0, 14))}" TurnOverSum="${ts.toFixed(2)}" VATAmountSum="${vs.toFixed(2)}">
${declarant(b)}
<ns2:Period>${j}</ns2:Period>
${klanten.map((k, i) => `<ns2:Client SequenceNumber="${i + 1}"><ns2:CompanyVATNumber issuedBy="BE">${k.btw}</ns2:CompanyVATNumber><ns2:TurnOver>${k.omzet.toFixed(2)}</ns2:TurnOver><ns2:VATAmount>${k.btwBedrag.toFixed(2)}</ns2:VATAmount></ns2:Client>`).join('\n')}
</ns2:ClientListing>
</ns2:ClientListingConsignment>
`;
  };

  /* ---------- Peppol UBL (BIS Billing 3.0) ---------- */
  const unit = (e) => ({ uren: 'HUR', uur: 'HUR', u: 'HUR', stuks: 'H87', stuk: 'H87', st: 'H87', m: 'MTR', meter: 'MTR', forfait: 'C62', km: 'KMT', kg: 'KGM', l: 'LTR', liter: 'LTR' }[String(e || '').trim().toLowerCase()] || 'C62');
  C.peppolId = (btw) => { const d = C.btwDigits(btw); return /^BE/i.test(String(btw || '').trim()) || (d.length === 10 && !/^[A-Z]{2}/i.test(String(btw || ''))) ? R.peppol.schemeKBO + ':' + d : ''; };
  const party = (p, isSeller) => {
    const btwRaw = String(p.btw || '').replace(/[\s.]/g, '').toUpperCase();
    const vat = btwRaw ? (/^[A-Z]{2}/.test(btwRaw) ? btwRaw : 'BE' + btwRaw) : '';
    const pid = (p.peppol || C.peppolId(p.btw) || '').split(':');
    const kbo = vat.startsWith('BE') ? vat.slice(2) : '';
    return `<cac:Party>${pid.length === 2 ? `<cbc:EndpointID schemeID="${pid[0]}">${xe(pid[1])}</cbc:EndpointID>` : ''}
${kbo ? `<cac:PartyIdentification><cbc:ID schemeID="0208">${kbo}</cbc:ID></cac:PartyIdentification>` : ''}
<cac:PartyName><cbc:Name>${xe(p.naam)}</cbc:Name></cac:PartyName>
<cac:PostalAddress><cbc:StreetName>${xe(p.straat || '')}</cbc:StreetName><cbc:CityName>${xe(p.gemeente || '')}</cbc:CityName><cbc:PostalZone>${xe(p.pc || '')}</cbc:PostalZone><cac:Country><cbc:IdentificationCode>${xe(p.land || 'BE')}</cbc:IdentificationCode></cac:Country></cac:PostalAddress>
${vat ? `<cac:PartyTaxScheme><cbc:CompanyID>${vat}</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme>` : ''}
<cac:PartyLegalEntity><cbc:RegistrationName>${xe(p.legal || p.naam)}</cbc:RegistrationName>${kbo ? `<cbc:CompanyID schemeID="0208">${kbo}</cbc:CompanyID>` : ''}</cac:PartyLegalEntity>
${isSeller && (p.email || p.tel) ? `<cac:Contact>${p.tel ? `<cbc:Telephone>${xe(p.tel)}</cbc:Telephone>` : ''}${p.email ? `<cbc:ElectronicMail>${xe(p.email)}</cbc:ElectronicMail>` : ''}</cac:Contact>` : ''}</cac:Party>`;
  };
  const taxCat = (code, pct, tag = 'cac:ClassifiedTaxCategory') => {
    const c = R.btwCodes[code] || R.btwCodes['21'];
    return `<${tag}><cbc:ID>${c.peppol}</cbc:ID><cbc:Percent>${pct}</cbc:Percent>${tag === 'cac:TaxCategory' && (c.vatex || c.reden) ? `${c.vatex ? `<cbc:TaxExemptionReasonCode>${c.vatex}</cbc:TaxExemptionReasonCode>` : ''}<cbc:TaxExemptionReason>${xe(c.reden || '')}</cbc:TaxExemptionReason>` : ''}<cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></${tag}>`;
  };
  const a = (v) => r2(v).toFixed(2);
  // pdf: base64 van de PDF (wordt als bijlage meegestuurd, zoals Dexxter)
  C.ubl = (doc, cfg, pdfB64, extra = []) => {
    const b = cfg.bedrijf || {}; const k = doc.klant || {};
    const cn = doc.type === 'creditnota';
    const t = C.totalen(doc); const s = 1; // creditnota: bedragen staan positief op de creditnota (UBL CreditNote)
    const root = cn ? 'CreditNote' : 'Invoice';
    const seller = Object.assign({}, b, { naam: b.naam + ((R.rechtsvormen[cfg.rechtsvorm] || {}).afkorting ? ' ' + R.rechtsvormen[cfg.rechtsvorm].afkorting : ''), legal: b.legal || b.naam, peppol: b.peppol || C.peppolId(b.btw) });
    const notes = [doc.opm, ...(doc.vermeldingen || [])].filter(Boolean).join('\n');
    const lines = (doc.lijnen || []).map((l, i) => {
      const ex = C.lijnEx(l) * s; const pct = C.code(l).pct;
      const qty = C.num(l.aantal) * s;
      const price = r2(C.num(l.prijs) * (1 - C.num(l.korting) / 100));
      const line = cn ? 'cac:CreditNoteLine' : 'cac:InvoiceLine'; const qtag = cn ? 'cbc:CreditedQuantity' : 'cbc:InvoicedQuantity';
      return `<${line}><cbc:ID>${i + 1}</cbc:ID><${qtag} unitCode="${unit(l.eenheid)}">${qty}</${qtag}><cbc:LineExtensionAmount currencyID="EUR">${a(ex)}</cbc:LineExtensionAmount>
<cac:Item>${l.det ? `<cbc:Description>${xe(l.det)}</cbc:Description>` : ''}<cbc:Name>${xe((l.oms || 'Artikel').slice(0, 200))}</cbc:Name>${taxCat(String(l.btw), pct)}</cac:Item>
<cac:Price><cbc:PriceAmount currencyID="EUR">${a(Math.abs(price) === 0 ? 0 : (qty === 0 ? 0 : ex / qty))}</cbc:PriceAmount></cac:Price></${line}>`;
    }).join('\n');
    const allowances = t.korting ? t.groepen.filter((g) => g.korting).map((g) => `<cac:AllowanceCharge><cbc:ChargeIndicator>false</cbc:ChargeIndicator><cbc:AllowanceChargeReason>Korting op de factuur (${t.kortingPct}%)</cbc:AllowanceChargeReason><cbc:Amount currencyID="EUR">${a(g.korting * s)}</cbc:Amount>${taxCat(g.code, g.pct, 'cac:TaxCategory').replace(/<cbc:TaxExemptionReason(Code)?>.*?<\/cbc:TaxExemptionReason(Code)?>/g, '')}</cac:AllowanceCharge>`).join('\n') : '';
    const subt = t.groepen.map((g) => `<cac:TaxSubtotal><cbc:TaxableAmount currencyID="EUR">${a(g.basis * s)}</cbc:TaxableAmount><cbc:TaxAmount currencyID="EUR">${a(g.btw * s)}</cbc:TaxAmount>${taxCat(g.code, g.pct, 'cac:TaxCategory')}</cac:TaxSubtotal>`).join('\n');
    const prepaid = cn ? 0 : r2(t.betaald > 0 && doc.status === 'betaald' ? 0 : 0);
    return `<?xml version="1.0" encoding="UTF-8"?>
<${root} xmlns="urn:oasis:names:specification:ubl:schema:xsd:${root}-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
<cbc:CustomizationID>${R.peppol.customization}</cbc:CustomizationID>
<cbc:ProfileID>${R.peppol.profile}</cbc:ProfileID>
<cbc:ID>${xe(doc.nr)}</cbc:ID>
<cbc:IssueDate>${doc.datum}</cbc:IssueDate>
${!cn && doc.verval ? `<cbc:DueDate>${doc.verval}</cbc:DueDate>` : ''}
<cbc:${cn ? 'CreditNoteTypeCode' : 'InvoiceTypeCode'}>${cn ? 381 : (doc.type === 'voorschot' ? 386 : 380)}</cbc:${cn ? 'CreditNoteTypeCode' : 'InvoiceTypeCode'}>
${notes ? `<cbc:Note>${xe(notes.slice(0, 4000))}</cbc:Note>` : ''}
<cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>
<cbc:BuyerReference>${xe(doc.klantRef || doc.nr)}</cbc:BuyerReference>
${cn && doc.ref ? `<cac:BillingReference><cac:InvoiceDocumentReference><cbc:ID>${xe(doc.ref.nr)}</cbc:ID>${doc.ref.datum ? `<cbc:IssueDate>${doc.ref.datum}</cbc:IssueDate>` : ''}</cac:InvoiceDocumentReference></cac:BillingReference>` : ''}
${pdfB64 ? `<cac:AdditionalDocumentReference><cbc:ID>${xe(doc.nr)}</cbc:ID><cac:Attachment><cbc:EmbeddedDocumentBinaryObject mimeCode="application/pdf" filename="${xe((cn ? 'Creditnota-' : 'Factuur-') + doc.nr)}.pdf">${pdfB64}</cbc:EmbeddedDocumentBinaryObject></cac:Attachment></cac:AdditionalDocumentReference>` : ''}
${(extra || []).map((x, i) => `<cac:AdditionalDocumentReference><cbc:ID>${xe(doc.nr + '-B' + (i + 1))}</cbc:ID><cbc:DocumentDescription>${xe(x.naam)}</cbc:DocumentDescription><cac:Attachment><cbc:EmbeddedDocumentBinaryObject mimeCode="${xe(x.mime || 'application/pdf')}" filename="${xe(x.naam)}">${x.b64}</cbc:EmbeddedDocumentBinaryObject></cac:Attachment></cac:AdditionalDocumentReference>`).join('')}
<cac:AccountingSupplierParty>${party(seller, true)}</cac:AccountingSupplierParty>
<cac:AccountingCustomerParty>${party(k, false)}</cac:AccountingCustomerParty>
${!cn && b.iban ? `<cac:PaymentMeans><cbc:PaymentMeansCode>30</cbc:PaymentMeansCode><cbc:PaymentID>${xe(doc.ogm || doc.nr)}</cbc:PaymentID><cac:PayeeFinancialAccount><cbc:ID>${String(b.iban).replace(/\s/g, '')}</cbc:ID>${b.bic ? `<cac:FinancialInstitutionBranch><cbc:ID>${xe(b.bic)}</cbc:ID></cac:FinancialInstitutionBranch>` : ''}</cac:PayeeFinancialAccount></cac:PaymentMeans>
<cac:PaymentTerms><cbc:Note>Te betalen vóór ${C.dt(doc.verval)}</cbc:Note></cac:PaymentTerms>` : ''}
${allowances}
<cac:TaxTotal><cbc:TaxAmount currencyID="EUR">${a(t.btw * s)}</cbc:TaxAmount>
${subt}</cac:TaxTotal>
<cac:LegalMonetaryTotal><cbc:LineExtensionAmount currencyID="EUR">${a(t.bruto * s)}</cbc:LineExtensionAmount><cbc:TaxExclusiveAmount currencyID="EUR">${a(t.ex * s)}</cbc:TaxExclusiveAmount><cbc:TaxInclusiveAmount currencyID="EUR">${a(t.inc * s)}</cbc:TaxInclusiveAmount>${t.korting ? `<cbc:AllowanceTotalAmount currencyID="EUR">${a(t.korting * s)}</cbc:AllowanceTotalAmount>` : ''}${prepaid ? `<cbc:PrepaidAmount currencyID="EUR">${a(prepaid)}</cbc:PrepaidAmount>` : ''}<cbc:PayableAmount currencyID="EUR">${a((t.inc - prepaid) * s)}</cbc:PayableAmount></cac:LegalMonetaryTotal>
${lines}
</${root}>
`.replace(/\n\s*\n/g, '\n');
  };

  /* ---------- ontvangen Peppol-document (UBL) inlezen als uitgave ---------- */
  C.leesUbl = (xml) => {
    const d = new DOMParser().parseFromString(xml, 'application/xml');
    const q = (el, path) => { let cur = [el]; for (const p of path.split('/')) { cur = cur.flatMap((c) => Array.from(c.children || []).filter((x) => x.localName === p)); } return cur; };
    const tx = (el, path) => { const r = q(el, path)[0]; return r ? r.textContent.trim() : ''; };
    const rootEl = d.documentElement; const cn = rootEl.localName === 'CreditNote';
    const sup = q(rootEl, 'AccountingSupplierParty/Party')[0] || rootEl;
    const subs = q(rootEl, 'TaxTotal/TaxSubtotal').map((s) => ({ basis: C.num(tx(s, 'TaxableAmount')), btw: C.num(tx(s, 'TaxAmount')), pct: C.num(tx(s, 'TaxCategory/Percent')), cat: tx(s, 'TaxCategory/ID') }));
    const att = q(rootEl, 'AdditionalDocumentReference/Attachment/EmbeddedDocumentBinaryObject').find((e) => /pdf/i.test(e.getAttribute('mimeCode') || ''));
    const regime = subs.some((s) => s.cat === 'AE') ? 'verlegd' : 'normaal';
    return {
      leverancier: tx(sup, 'PartyName/Name') || tx(sup, 'PartyLegalEntity/RegistrationName'),
      btwLev: tx(sup, 'PartyTaxScheme/CompanyID'),
      nr: tx(rootEl, 'ID'), datum: tx(rootEl, 'IssueDate'), verval: tx(rootEl, 'DueDate') || tx(rootEl, 'PaymentMeans/PaymentDueDate'),
      totaal: C.num(tx(rootEl, 'LegalMonetaryTotal/PayableAmount')) || C.num(tx(rootEl, 'LegalMonetaryTotal/TaxInclusiveAmount')),
      tarieven: subs.map((s) => ({ pct: s.pct || (regime === 'verlegd' ? 21 : 0), basis: s.basis, btw: s.btw })),
      regime, creditnota: cn,
      ogm: tx(rootEl, 'PaymentMeans/PaymentID'), iban: tx(rootEl, 'PaymentMeans/PayeeFinancialAccount/ID'),
      lijnen: q(rootEl, cn ? 'CreditNoteLine' : 'InvoiceLine').map((l) => tx(l, 'Item/Name')).slice(0, 20),
      pdf: att ? att.textContent.replace(/\s/g, '') : ''
    };
  };

  /* ---------- bankbestanden ---------- */
  C.parseCsv = (text) => {
    const first = text.split(/\r?\n/)[0] || ''; const sep = (first.match(/;/g) || []).length >= (first.match(/,/g) || []).length ? ';' : ',';
    const rows = []; let row = [], cur = '', inq = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inq) { if (ch === '"' && text[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') inq = false; else cur += ch; }
      else if (ch === '"') inq = true; else if (ch === sep) { row.push(cur); cur = ''; } else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; } else cur += ch;
    }
    if (cur || row.length) { row.push(cur); rows.push(row); }
    return rows.filter((r) => r.some((c) => c.trim()));
  };
  const toIso = (s) => { s = String(s || '').trim(); let m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/); if (m) return m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0'); m = s.match(/^(\d{4})-(\d{2})-(\d{2})/); if (m) return m[0]; return ''; };
  // herkent de kolommen van ING, BNP Paribas Fortis, KBC, Belfius, Argenta (CSV-export)
  C.bankCsv = (text) => {
    const rows = C.parseCsv(text); if (rows.length < 2) return [];
    const hi = rows.findIndex((r) => r.some((c) => /datum|date/i.test(c)) && r.some((c) => /bedrag|amount|montant/i.test(c)));
    const h = (hi > -1 ? rows[hi] : rows[0]).map((c) => c.trim().toLowerCase());
    const col = (...re) => h.findIndex((c) => re.some((r) => r.test(c)));
    const iD = col(/^boekingsdatum/, /^uitvoeringsdatum/, /^datum/, /date/), iB = col(/^bedrag/, /amount/, /montant/),
      iT = col(/naam tegenpartij/, /tegenpartij bevat/, /naam van de tegenpartij/, /^tegenpartij$/, /naam/), iI = col(/rekening tegenpartij/, /rekeningnummer tegenpartij/, /tegenrekening/, /iban/),
      iM = col(/gestructureerde mededeling/, /mededeling/, /omschrijving/, /details/, /communication/), iV = col(/vrije mededeling/, /^details/);
    return rows.slice((hi > -1 ? hi : 0) + 1).map((r, n) => {
      const datum = toIso(r[iD]); const bedrag = C.num(r[iB]);
      const med = [r[iM], iV > -1 && iV !== iM ? r[iV] : ''].filter(Boolean).join(' ').trim();
      return { id: 'csv' + (datum + bedrag + (r[iT] || '') + med + n).replace(/\W/g, '').slice(0, 60), datum, bedrag, tegenpartij: (r[iT] || '').trim(), iban: (r[iI] || '').replace(/\s/g, ''), mededeling: med };
    }).filter((t) => t.datum && t.bedrag);
  };
  // CODA (Belgisch bankformaat .cod)
  C.bankCoda = (text) => {
    const out = []; let cur = null;
    text.split(/\r?\n/).forEach((l, n) => {
      if (l[0] === '2' && l[1] === '1') {
        const sign = l[31] === '1' ? -1 : 1; const bedrag = sign * Number(l.slice(32, 47)) / 1000;
        const d = l.slice(47, 53); const datum = '20' + d.slice(4, 6) + '-' + d.slice(2, 4) + '-' + d.slice(0, 2);
        const gestr = l[61] === '1'; const med = gestr ? l.slice(65, 77) : l.slice(62, 115).trim();
        cur = { id: 'coda' + datum + l.slice(2, 10) + n, datum, bedrag, tegenpartij: '', iban: '', mededeling: gestr && /^\d{12}$/.test(med) ? '+++' + med.slice(0, 3) + '/' + med.slice(3, 7) + '/' + med.slice(7) + '+++' : med };
        out.push(cur);
      } else if (l[0] === '2' && l[1] === '3' && cur) { cur.iban = l.slice(10, 47).trim().split(' ')[0]; cur.tegenpartij = l.slice(47, 82).trim(); }
      else if (l[0] === '2' && l[1] === '2' && cur && !/^\+\+\+/.test(cur.mededeling)) { cur.mededeling = (cur.mededeling + ' ' + l.slice(10, 63).trim()).trim(); }
    });
    return out;
  };
  // koppel een banktransactie aan een openstaande factuur (OGM, dan nummer, dan bedrag)
  C.match = (tr, docs) => {
    if (tr.bedrag <= 0) return null;
    const open = docs.filter((d) => ['factuur', 'voorschot'].includes(d.type) && d.status !== 'concept' && d.status !== 'betaald' && d.status !== 'geannuleerd');
    const og = C.ogmDigits(tr.mededeling);
    let m = open.find((d) => d.ogm && og && og.includes(C.ogmDigits(d.ogm)));
    if (!m) m = open.find((d) => d.nr && new RegExp('(^|\\D)' + String(d.nr).replace(/[^0-9A-Za-z]/g, '.?') + '(\\D|$)').test(tr.mededeling));
    if (!m) { const c = open.filter((d) => Math.abs(C.totalen(d).open - tr.bedrag) < 0.005); if (c.length === 1) m = c[0]; }
    return m || null;
  };

  /* ---------- belastingen ---------- */
  C.schijven = (inkomen, p) => { let t = 0, vorige = 0; for (const [grens, pct] of p.schijven) { if (inkomen > vorige) t += (Math.min(inkomen, grens) - vorige) * pct; vorige = grens; } return t; };
  C.vrijeSomVoordeel = (p, extra = 0) => C.schijven(Math.max(0, p.vrijeSom + extra), p) ;
  // raming personenbelasting (eenmanszaak of bedrijfsleider)
  C.ramingPB = ({ jaar, winst, socBijdr, loon, bv, va, gemeente, kinderenVrij = 0, rszDeelAftrek = true }) => {
    const P = R.jaar(jaar); const p = Object.assign({}, P.pb, gemeente != null ? { gemeente } : {});
    const beroep = Math.max(0, winst - (rszDeelAftrek ? socBijdr : 0));
    const belastbaar = r2(beroep + (loon || 0));
    const basis = C.schijven(belastbaar, p);
    const vrij = C.vrijeSomVoordeel(p, kinderenVrij);
    const fed = Math.max(0, basis - vrij);
    const gem = fed * p.gemeente;
    const totaal = r2(fed + gem);
    // zonder zelfstandige activiteit (om het deel van de zaak te tonen)
    const zonder = loon ? r2(Math.max(0, C.schijven(loon, p) - vrij) * (1 + p.gemeente)) : 0;
    const vaTot = r2((va || []).reduce((s, x) => s + C.num(x.bedrag), 0));
    // bonificatie per voorafbetaling
    const bonPct = P.va.pb.bonificatie;
    const bon = r2((va || []).reduce((s, x) => { const i = P.va.data.findIndex((d) => !x.datum || x.datum <= d); return s + (i > -1 ? C.num(x.bedrag) * bonPct[i] : 0); }, 0));
    // vermeerdering (benadering zoals FOD: 106% van de belasting op beroepsinkomsten × percentage × 90%)
    const aandeel = belastbaar ? fed * (beroep / belastbaar) : 0;
    const verm = r2(Math.max(0, aandeel * 1.06 * P.va.pb.vermeerdering * 0.9));
    const vermNa = r2(Math.max(0, verm - bon));
    const vermDef = (vermNa < 0.005 * totaal || vermNa <= 100) ? 0 : vermNa;
    const nog = r2(totaal + vermDef - (bv || 0) - vaTot - Math.max(0, bon - verm));
    return { belastbaar, basis: r2(basis), vrij: r2(vrij), fed: r2(fed), gem: r2(gem), totaal, zonder, deelZaak: r2(totaal - zonder), vaTot, bon, verm: vermDef, nog };
  };
  // raming sociale bijdragen (definitief, op netto beroepsinkomen van dat jaar)
  C.ramingRSZ = ({ jaar, inkomen, statuut }) => {
    const p = R.jaar(jaar).rsz;
    // het RSVZ rekent op het "bruto" inkomen: netto + de betaalde bijdragen; hier benaderd door netto / (1 - 0.205)
    const herw = Math.max(0, inkomen);
    let jaarBedrag = Math.min(herw, p.grens1) * p.pct1 + Math.max(0, Math.min(herw, p.grens2) - p.grens1) * p.pct2;
    let kw = jaarBedrag / 4;
    if (statuut === 'bijberoep') kw = herw < p.drempelBij ? 0 : Math.max(p.minBij, kw);
    else kw = Math.max(p.minHoofd, kw);
    kw = Math.min(kw, p.maxKwartaal);
    kw = kw * (1 + p.beheer);
    return { kwartaal: r2(kw), jaar: r2(kw * 4) };
  };
  // raming vennootschapsbelasting
  C.ramingVB = ({ jaar, winst, loonBedrijfsleider, va }) => {
    const P = R.jaar(jaar); const v = P.vb;
    const kmo = loonBedrijfsleider >= Math.min(v.kmoMinLoon, Math.max(0, winst));
    const w = Math.max(0, winst);
    const vb = kmo ? Math.min(w, v.kmoGrens) * v.kmoTarief + Math.max(0, w - v.kmoGrens) * v.tarief : w * v.tarief;
    const vaTot = r2((va || []).reduce((s, x) => s + C.num(x.bedrag), 0));
    const voordeel = r2((va || []).reduce((s, x) => { const i = P.va.data.findIndex((d) => !x.datum || x.datum <= d); return s + (i > -1 ? C.num(x.bedrag) * P.va.vb.voordeel[i] : 0); }, 0));
    const verm = r2(Math.max(0, vb * P.va.vb.vermeerdering - voordeel));
    return { vb: r2(vb), kmo, vaTot, verm, nog: r2(vb + verm - vaTot) };
  };

  root.VET_CORE = C;
})(window);
