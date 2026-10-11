/* VET Office – REGELS
 * Alle wettelijke teksten, tarieven, roosters en jaarparameters staan in DIT bestand.
 * Verandert de wetgeving? Pas enkel dit bestand aan (of de waarden in Instellingen › Regels, die dit bestand overschrijven).
 * Bij elk getal staat de bron en de datum waarop het werd nagekeken.
 */
(function (root) {
  const R = {};
  R.versie = '2026-10-11';

  /* ---------- rechtsvormen ---------- */
  // pb = personenbelasting (natuurlijk persoon), vb = vennootschapsbelasting
  R.rechtsvormen = {
    eenmanszaak: { label: 'Eenmanszaak', natuurlijk: true, belasting: 'pb', afkorting: '', boekhouding: 'Vereenvoudigde boekhouding toegestaan (omzet < € 500.000 excl. btw) – je mag ze zelf doen.' },
    bv: { label: 'Besloten vennootschap (BV)', natuurlijk: false, belasting: 'vb', afkorting: 'BV', boekhouding: 'Dubbele boekhouding + jaarrekening (NBB) + aangifte vennootschapsbelasting. Zelf doen mag, een boekhouder is aangeraden.' },
    nv: { label: 'Naamloze vennootschap (NV)', natuurlijk: false, belasting: 'vb', afkorting: 'NV', boekhouding: 'Dubbele boekhouding + jaarrekening (NBB) + aangifte vennootschapsbelasting.' },
    cv: { label: 'Coöperatieve vennootschap (CV)', natuurlijk: false, belasting: 'vb', afkorting: 'CV', boekhouding: 'Dubbele boekhouding + jaarrekening (NBB) + aangifte vennootschapsbelasting.' },
    vof: { label: 'Vennootschap onder firma (VOF)', natuurlijk: false, belasting: 'vb', afkorting: 'VOF', boekhouding: 'Dubbele boekhouding; vennoten hoofdelijk aansprakelijk.' },
    commv: { label: 'Commanditaire vennootschap (CommV)', natuurlijk: false, belasting: 'vb', afkorting: 'CommV', boekhouding: 'Dubbele boekhouding; beherende vennoten hoofdelijk aansprakelijk.' }
  };

  /* ---------- btw-codes per factuurlijn ----------
   * pct = tarief, peppol = UNCL5305-categorie, rooster = rooster van de btw-aangifte voor de maatstaf */
  R.btwCodes = {
    '21': { label: '21%', pct: 21, peppol: 'S', rooster: '03' },
    '12': { label: '12%', pct: 12, peppol: 'S', rooster: '02' },
    '6': { label: '6%', pct: 6, peppol: 'S', rooster: '01' },
    '0': { label: '0%', pct: 0, peppol: 'Z', rooster: '00' },
    'VERL': { label: 'Verlegd', pct: 0, peppol: 'AE', rooster: '45', vatex: 'VATEX-EU-AE', reden: 'Verlegging van heffing' },
    'ICD': { label: 'Intracom. dienst', pct: 0, peppol: 'AE', rooster: '44', vatex: 'VATEX-EU-AE', reden: 'Btw verlegd – art. 196 Richtlijn 2006/112/EG' },
    'VRIJ': { label: 'Vrijgesteld', pct: 0, peppol: 'E', rooster: '00', vatex: 'VATEX-EU-132', reden: 'Vrijgesteld van btw' },
    'KO': { label: 'Kleine ondern.', pct: 0, peppol: 'E', rooster: null, vatex: '', reden: 'Bijzondere vrijstellingsregeling kleine ondernemingen' }
  };

  /* ---------- verplichte en standaardteksten (overgenomen uit jouw Dexxter-facturen) ---------- */
  R.teksten = {
    verlegd: 'Verlegging van heffing. Bij gebrek aan schriftelijke betwisting binnen een termijn van één maand na de ontvangst van de factuur, wordt de afnemer geacht te erkennen dat hij een belastingplichtige is gehouden tot de indiening van periodieke aangiften. Als die voorwaarde niet vervuld is, is de afnemer ten aanzien van die voorwaarde aansprakelijk voor de betaling van de verschuldigde belasting, interesten en geldboeten.',
    btw6: 'BTW 6%: Bij gebrek aan schriftelijke betwisting binnen één maand na ontvangst van deze factuur, wordt de klant geacht te erkennen dat aan de wettelijke voorwaarden voor toepassing van het verlaagde btw-tarief van 6% is voldaan. Indien niet aan deze voorwaarden is voldaan, is 21% btw verschuldigd en wordt de bijkomende btw aan de klant doorgerekend.',
    voorschotOfferte: 'Voorschot: Na goedkeuring van de offerte wordt een voorschotfactuur bezorgd. De bestelling van materialen en de planning van de werken gebeuren pas na ontvangst van het voorschot op onze rekening.',
    voorschotFactuur: 'Deze voorschotfactuur werd opgemaakt conform de door de klant goedgekeurde offerte per mail. De bestelling van materialen en de planning van de werken worden pas uitgevoerd na ontvangst van het volledige voorschot. Dit voorschot wordt verrekend op de eindfactuur.',
    kleineOnderneming: 'Bijzondere vrijstellingsregeling kleine ondernemingen.',
    creditnotaBtw: 'Btw terug te storten aan de Staat in de mate waarin ze oorspronkelijk in aftrek werd gebracht.',
    intracom: 'Btw verlegd – art. 196 Richtlijn 2006/112/EG.'
  };

  /* ---------- btw-aangifte (Intervat) ----------
   * Bron: XSD Intervat NewTVA-in (VATConsignment), FOD Financiën. Nagekeken 2026-10-11.
   * Kwartaalaangevers: indienen uiterlijk de 25ste van de maand na het kwartaal (btw-ketting, vanaf 2026, geen verschuiving bij weekend).
   * Betaling naar de provisierekening BE41 6792 0036 4210 (verplicht vanaf 1 mei 2026). */
  R.btwAangifte = { dag: 25, rekening: 'BE41 6792 0036 4210', bic: 'PCHQBEBB' };
  R.roosters = {
    '00': 'Handelingen aan 0% / vrijgesteld', '01': 'Handelingen aan 6%', '02': 'Handelingen aan 12%', '03': 'Handelingen aan 21%',
    '44': 'Diensten intracommunautair (verlegd)', '45': 'Handelingen met verlegging (medecontractant)', '46': 'Intracommunautaire leveringen', '47': 'Andere vrijgestelde handelingen',
    '48': 'Creditnota’s m.b.t. 44 en 46', '49': 'Creditnota’s m.b.t. andere handelingen',
    '54': 'Verschuldigde btw op 01-02-03', '55': 'Btw intracom. verwervingen', '56': 'Btw verschuldigd door jou als medecontractant', '57': 'Btw invoer', '61': 'Diverse regularisaties in het voordeel van de Staat', '63': 'Btw terug te storten op ontvangen creditnota’s',
    '59': 'Aftrekbare btw', '62': 'Diverse regularisaties in jouw voordeel', '64': 'Btw te recupereren op uitgereikte creditnota’s',
    '71': 'Te betalen aan de Staat', '72': 'Terug te krijgen van de Staat',
    '81': 'Aankopen handelsgoederen, grond- en hulpstoffen', '82': 'Aankopen diensten en diverse goederen', '83': 'Aankopen bedrijfsmiddelen (investeringen)',
    '84': 'Creditnota’s ontvangen m.b.t. 86 en 88', '85': 'Andere ontvangen creditnota’s', '86': 'Intracom. verwervingen goederen', '87': 'Andere aankopen waarop jij de btw verschuldigd bent (verlegd)', '88': 'Intracom. diensten ontvangen',
    '91': 'Voorschot december (enkel maandaangevers)'
  };
  R.uitgaveCategorieen = {
    '81': 'Handelsgoederen / materiaal voor klanten',
    '82': 'Diensten en diverse goederen (gsm, verzekering, brandstof, gereedschap < € 1.000…)',
    '83': 'Investeringen (bedrijfsmiddelen, bv. analyser, wagen)'
  };

  /* ---------- jaarparameters (belastingen en sociale bijdragen) ----------
   * Alle bedragen per inkomstenjaar. Waarden met 'controleer' zijn nog niet officieel bevestigd. */
  R.jaren = {
    2026: {
      bronnen: 'Belastingschijven en belastingvrije som: inkomsten 2026 (aj. 2027). Sociale bijdragen 2026: RSVZ / bijdragennota 2026. Voorafbetalingen 2026: FOD Financiën.',
      pb: {
        schijven: [[16720, 0.25], [29510, 0.40], [51070, 0.45], [Infinity, 0.50]],
        vrijeSom: 11550,
        gemeente: 0.07, // aanvullende gemeentebelasting – pas aan naar jouw gemeente (Instellingen › Regels)
      },
      rsz: {
        pct1: 0.205, grens1: 75024.54, pct2: 0.1416, grens2: 110562.42,
        minHoofd: 890.42, maxKwartaal: 5103.05, minBij: 98.51, drempelBij: 1922.16,
        beheer: 0.0305 // beheerskosten sociaal verzekeringsfonds (± 3 à 4 %) – controleer bij jouw fonds
      },
      va: {
        data: ['2026-04-10', '2026-07-10', '2026-10-12', '2026-12-21'],
        pb: { bonificatie: [0.06, 0.05, 0.04, 0.03], vermeerdering: 0.045, controleer: 'Volgens sommige bronnen wordt de vermeerdering voor zelfstandigen vanaf inkomstenjaar 2026 afgeschaft. Controleer op MyMinfin.' },
        vb: { voordeel: [0.09, 0.075, 0.06, 0.045], vermeerdering: 0.0675, va5: '2027-02-20' }
      },
      vb: { tarief: 0.25, kmoTarief: 0.20, kmoGrens: 100000, kmoMinLoon: 45000 }
    }
  };
  R.jaar = (j) => R.jaren[j] || R.jaren[Math.max(...Object.keys(R.jaren).map(Number))];

  /* ---------- Peppol ---------- */
  R.peppol = {
    customization: 'urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0',
    profile: 'urn:fdc:peppol.eu:2017:poacc:billing:01:1.0',
    schemeKBO: '0208', schemeBTW: '9925'
  };

  /* ---------- verplichte vermeldingen op een factuur (art. 5 KB nr. 1, WVV art. 2:20) – voor de controle vóór definitief maken ---------- */
  R.factuurControle = (doc, cfg) => {
    const f = [];
    const b = cfg.bedrijf || {};
    if (!b.naam) f.push('Je bedrijfsnaam ontbreekt (Instellingen › Bedrijf).');
    if (!b.straat || !b.pc) f.push('Je adres ontbreekt (Instellingen › Bedrijf).');
    if (!b.btw) f.push('Je btw-nummer ontbreekt (Instellingen › Bedrijf).');
    const rv = R.rechtsvormen[cfg.rechtsvorm] || R.rechtsvormen.eenmanszaak;
    if (!rv.natuurlijk && !b.rpr) f.push('Bij een vennootschap moet "RPR" + de bevoegde ondernemingsrechtbank op de factuur (Instellingen › Bedrijf).');
    if (!doc.klant || !doc.klant.naam) f.push('Klantnaam ontbreekt.');
    if (!doc.klant || !doc.klant.straat) f.push('Adres van de klant ontbreekt.');
    if (!(doc.lijnen || []).length) f.push('Er staan geen lijnen op het document.');
    const codes = (doc.lijnen || []).map((l) => String(l.btw));
    if (codes.includes('VERL') && !(doc.klant && doc.klant.btw)) f.push('Bij verlegging van heffing is het btw-nummer van de klant verplicht.');
    if (codes.includes('ICD') && !(doc.klant && doc.klant.btw)) f.push('Bij een intracommunautaire dienst is het btw-nummer van de klant verplicht.');
    if (doc.type === 'creditnota' && !doc.ref) f.push('Een creditnota moet verwijzen naar de oorspronkelijke factuur (nummer en datum).');
    return f;
  };

  root.VET_RULES = R;
})(window);
