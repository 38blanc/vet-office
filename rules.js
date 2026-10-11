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
    'ICL': { label: 'Intracom. levering', pct: 0, peppol: 'K', rooster: '46', vatex: 'VATEX-EU-IC', reden: 'Vrijgestelde intracommunautaire levering – art. 39bis WBTW' },
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
    if ((codes.includes('ICD') || codes.includes('ICL')) && !(doc.klant && doc.klant.btw)) f.push('Bij een intracommunautaire handeling is het btw-nummer van de klant verplicht (controleer het in VIES).');
    if (doc.type === 'creditnota' && !doc.ref) f.push('Een creditnota moet verwijzen naar de oorspronkelijke factuur (nummer en datum).');
    return f;
  };


  /* ---------- kostencategorieën (zelfde indeling als Dexxter, standaard voor zelfstandige in bijberoep) ----------
   * beroep = % beroepsmatig gebruik, btw = % btw-aftrek, verworpen = % verworpen uitgave (personenbelasting),
   * soort: wagen | vracht | moto (voertuig), resto, rsz (sociale bijdragen), invest (wordt afgeschreven).
   * Percentages zijn aanpasbaar per categorie (Instellingen › Kostencategorieën); eigen categorieën kunnen erbij. */
  R.kostencats = [{"id": "aflossing-financiele-leasing-motor-fiets", "n": "Aflossing financiële leasing (motor)fiets", "h": "Kosten motorvoertuig", "beroep": 20, "btw": 20, "rooster": "82", "soort": "moto", "oms": "De maandelijkse kapitaalaflossing van een financiële leasing voor een motorfiets of fiets."}, {"id": "aflossing-financiele-leasing-lichte-vrac", "n": "Aflossing financiële leasing lichte vracht", "h": "Kosten lichte vracht", "beroep": 75, "btw": 75, "rooster": "82", "soort": "vracht", "oms": "De maandelijkse kapitaalaflossing van een financiële leasing voor lichte vracht."}, {"id": "aflossing-financiele-leasing-personenwag", "n": "Aflossing financiële leasing personenwagen", "h": "Kosten personenwagen", "beroep": 20, "btw": 20, "rooster": "82", "soort": "wagen", "oms": "De maandelijkse kapitaalaflossing van een financiële leasing voor een personenwagen."}, {"id": "algemene-kosten-onderhoud-motor-fiets", "n": "Algemene kosten & onderhoud (motor)fiets", "h": "Kosten motorvoertuig", "beroep": 20, "btw": 20, "rooster": "82", "soort": "moto", "oms": "Onderhoud en algemene (kleine) kosten van een motorfiets."}, {"id": "algemene-kosten-onderhoud-lichte-vracht", "n": "Algemene kosten & onderhoud lichte vracht", "h": "Kosten lichte vracht", "beroep": 75, "btw": 75, "rooster": "82", "soort": "vracht", "oms": "Onderhoud en algemene (kleine) kosten van een lichte vracht."}, {"id": "algemene-kosten-onderhoud-personenwagen", "n": "Algemene kosten & onderhoud personenwagen", "h": "Kosten personenwagen", "beroep": 20, "btw": 20, "rooster": "82", "soort": "wagen", "oms": "Onderhoud en algemene (kleine) kosten van een personenwagen."}, {"id": "boeken-opleidingen-vak-tijdschriften", "n": "Boeken, opleidingen, (vak)tijdschriften, ...", "h": "Algemene kosten", "beroep": 100, "btw": 100, "rooster": "82", "oms": "Zakelijke literatuur, opleidingen, cursussen."}, {"id": "brandstof-lichte-vracht", "n": "Brandstof lichte vracht", "h": "Kosten lichte vracht", "beroep": 75, "btw": 75, "rooster": "82", "soort": "vracht", "oms": "Brandstof of elektriciteit voor een lichte vracht."}, {"id": "brandstof-motorfiets", "n": "Brandstof motorfiets", "h": "Kosten motorvoertuig", "beroep": 20, "btw": 20, "rooster": "82", "soort": "moto", "oms": "Brandstof of elektriciteit voor een motorfiets."}, {"id": "brandstof-personenwagen-benzine-diesel-l", "n": "Brandstof personenwagen (benzine, diesel, lpg, …)", "h": "Kosten personenwagen", "beroep": 20, "btw": 20, "rooster": "82", "soort": "wagen", "oms": "Fossiele brandstof voor een personenwagen."}, {"id": "brandstof-personenwagen-elektriciteit", "n": "Brandstof personenwagen (elektriciteit)", "h": "Kosten personenwagen", "beroep": 20, "btw": 20, "rooster": "82", "soort": "wagen", "oms": "Elektriciteit voor een personenwagen."}, {"id": "brandverzekering", "n": "Brandverzekering", "h": "Kosten woning", "beroep": 20, "btw": 0, "rooster": "82", "oms": "Brandverzekering van je bureau/kantoor thuis (beroepsdeel)."}, {"id": "diverse-financiele-kosten-en-bankkosten", "n": "Diverse financiële kosten en bankkosten", "h": "Algemene kosten", "beroep": 100, "btw": 100, "rooster": "82", "oms": "Bankkosten, administratieve kosten bank/leasing."}, {"id": "diverse-kosten-belastingen", "n": "Diverse kosten & belastingen", "h": "Algemene kosten", "beroep": 100, "btw": 100, "rooster": "82", "oms": "Provinciebelasting, gemeentebelasting op bedrijven, …"}, {"id": "door-te-rekenen-kosten", "n": "Door te rekenen kosten", "h": "Algemene kosten", "beroep": 100, "btw": 100, "rooster": "82", "oms": "Kosten die je voor rekening van je klant maakt en doorrekent."}, {"id": "elektriciteit-gas", "n": "Elektriciteit & gas", "h": "Kosten woning", "beroep": 20, "btw": 20, "rooster": "82", "oms": "Verbruik elektriciteit en gas in zakelijke context."}, {"id": "erelonen-consultancy-diversen", "n": "Erelonen & consultancy diversen", "h": "Erelonen & consultancy", "beroep": 100, "btw": 100, "rooster": "82", "oms": "Professioneel advies en diensten van een ander bedrijf."}, {"id": "erelonen-advocaat", "n": "Erelonen advocaat", "h": "Erelonen & consultancy", "beroep": 100, "btw": 100, "rooster": "82", "oms": "Advocaat, jurist."}, {"id": "erelonen-boekhouder", "n": "Erelonen boekhouder", "h": "Erelonen & consultancy", "beroep": 100, "btw": 100, "rooster": "82", "oms": "Boekhouder, accountant, adviseur."}, {"id": "erelonen-notaris", "n": "Erelonen notaris", "h": "Erelonen & consultancy", "beroep": 100, "btw": 100, "rooster": "82", "oms": "Notaris, aktes."}, {"id": "gsm-internetkosten", "n": "Gsm- & internetkosten", "h": "Algemene kosten", "beroep": 20, "btw": 20, "rooster": "82", "oms": "Gsm-abonnement, internet, toestel (duur toestel = investering)."}, {"id": "handelsgoederen-verbruiksmaterialen", "n": "Handelsgoederen & verbruiksmaterialen", "h": "Handelsgoederen", "beroep": 100, "btw": 100, "rooster": "81", "oms": "Materiaal dat je opgebruikt bij of doorverkoopt aan klanten."}, {"id": "huur-beroepsruimte", "n": "Huur beroepsruimte", "h": "Huur", "beroep": 100, "btw": 100, "rooster": "82", "oms": "Kantoor, berging, loods, garage."}, {"id": "huur-lichte-vracht", "n": "Huur lichte vracht", "h": "Huur", "beroep": 75, "btw": 75, "rooster": "82", "soort": "vracht", "oms": "Huur van een lichte vracht."}, {"id": "huur-machines-materiaal", "n": "Huur machines & materiaal", "h": "Huur", "beroep": 100, "btw": 100, "rooster": "82", "oms": "Huur van materiaal of machines."}, {"id": "huur-personenwagen", "n": "Huur personenwagen", "h": "Kosten personenwagen", "beroep": 20, "btw": 20, "rooster": "82", "soort": "wagen", "oms": "Huur van een personenwagen."}, {"id": "huurprijs-operationele-leasing-motor-fie", "n": "Huurprijs operationele leasing (motor)fiets", "h": "Kosten motorvoertuig", "beroep": 20, "btw": 20, "rooster": "82", "soort": "moto", "oms": "Operationele leasing motorfiets of fiets."}, {"id": "huurprijs-operationele-leasing-lichte-vr", "n": "Huurprijs operationele leasing lichte vracht", "h": "Kosten lichte vracht", "beroep": 75, "btw": 75, "rooster": "82", "soort": "vracht", "oms": "Operationele leasing lichte vracht."}, {"id": "huurprijs-operationele-leasing-personenw", "n": "Huurprijs operationele leasing personenwagen", "h": "Kosten personenwagen", "beroep": 20, "btw": 20, "rooster": "82", "soort": "wagen", "oms": "Operationele leasing personenwagen."}, {"id": "import-btw", "n": "Import btw", "h": "Algemene kosten", "beroep": 100, "btw": 100, "rooster": "82", "oms": "Btw op invoer van buiten de EU."}, {"id": "interest-personenwagen", "n": "Interest personenwagen", "h": "Kosten personenwagen", "beroep": 20, "btw": 0, "rooster": "82", "soort": "wagen", "oms": "Interesten krediet of leasing personenwagen."}, {"id": "investering", "n": "Investering", "h": "Investeringen", "beroep": 100, "btw": 100, "rooster": "83", "soort": "invest", "oms": "Grote uitgaven (250 euro of meer per item) die meerdere jaren meegaan – wordt afgeschreven."}, {"id": "klein-materiaal-elektrisch-handmateriaal", "n": "Klein materiaal (elektrisch handmateriaal)", "h": "Algemene kosten", "beroep": 100, "btw": 100, "rooster": "82", "oms": "Elektrisch handgereedschap."}, {"id": "klein-materiaal-handmateriaal", "n": "Klein materiaal (handmateriaal)", "h": "Algemene kosten", "beroep": 100, "btw": 100, "rooster": "82", "oms": "Handgereedschap."}, {"id": "kleine-aankopen-allerlei-schrijfgerief-p", "n": "Kleine aankopen allerlei (schrijfgerief, papier, toetsenbord, ...)", "h": "Algemene kosten", "beroep": 100, "btw": 100, "rooster": "82", "oms": "Kleine kosten voor je zelfstandige activiteit."}, {"id": "kosten-boekhoudsoftware", "n": "Kosten boekhoudsoftware", "h": "Kosten software", "beroep": 100, "btw": 100, "rooster": "82", "oms": "Boekhoudsoftware (bv. Dexxter)."}, {"id": "kosten-sociale-media-advertising", "n": "Kosten sociale media & advertising", "h": "Publiciteit & marketing", "beroep": 100, "btw": 100, "rooster": "82", "oms": "Advertentiebudget, beheer sociale media."}, {"id": "kosten-software-informatica", "n": "Kosten software & informatica", "h": "Kosten software", "beroep": 100, "btw": 100, "rooster": "82", "oms": "Software, hardware en aanverwanten."}, {"id": "lidgeld-beroepsbijdragen", "n": "Lidgeld & beroepsbijdragen", "h": "Algemene kosten", "beroep": 100, "btw": 100, "rooster": "82", "oms": "Unizo, beroepsverenigingen, …"}, {"id": "marketing-reclame-allerlei", "n": "Marketing & reclame allerlei", "h": "Publiciteit & marketing", "beroep": 100, "btw": 100, "rooster": "82", "oms": "Bekendheid van je bedrijf."}, {"id": "onderaannemingen", "n": "Onderaannemingen", "h": "Onderaannemingen", "beroep": 100, "btw": 100, "rooster": "81", "oms": "Diensten van onderaannemers die je doorverkoopt aan klanten."}, {"id": "onderhoud-herstelling-materiaal", "n": "Onderhoud & herstelling materiaal", "h": "Algemene kosten", "beroep": 100, "btw": 100, "rooster": "82", "oms": "Onderhoud en herstelling van machines en gereedschap."}, {"id": "onderhoud-woning-100-betrekking-op-je-be", "n": "Onderhoud woning, 100% betrekking op je beroep", "h": "Kosten woning", "beroep": 100, "btw": 100, "rooster": "82", "oms": "Locatie volledig voor je onderneming."}, {"id": "onderhoud-woning-gedeeltelijk-betrekking", "n": "Onderhoud woning, gedeeltelijk betrekking op je beroep", "h": "Kosten woning", "beroep": 20, "btw": 20, "rooster": "82", "oms": "Locatie gedeeltelijk voor je onderneming."}, {"id": "onroerende-voorheffing", "n": "Onroerende voorheffing", "h": "Kosten woning", "beroep": 20, "btw": 0, "rooster": "82", "oms": "Beroepsdeel van de onroerende voorheffing."}, {"id": "onthaalkosten", "n": "Onthaalkosten", "h": "Algemene kosten", "beroep": 100, "btw": 0, "rooster": "82", "verworpen": 50, "oms": "Drank, versnaperingen, bloemen voor bezoekers (50% verworpen)."}, {"id": "openbaar-vervoer", "n": "Openbaar vervoer", "h": "Algemene kosten", "beroep": 100, "btw": 100, "rooster": "82", "oms": "Trein, bus, tram in zakelijke context."}, {"id": "opstartkosten", "n": "Opstartkosten", "h": "Opstartkosten", "beroep": 100, "btw": 100, "rooster": "82", "oms": "Ondernemingsnummer, btw-nummer, …"}, {"id": "overige-diensten", "n": "Overige diensten", "h": "Overige diensten", "beroep": 100, "btw": 100, "rooster": "82", "oms": "Restcategorie."}, {"id": "parkeergeld-tolgeld-parkeerboetes-motor-", "n": "Parkeergeld, tolgeld, parkeerboetes, … (motor)fiets", "h": "Kosten motorvoertuig", "beroep": 20, "btw": 0, "rooster": "82", "soort": "moto", "oms": "Snelheidsboetes zijn niet aftrekbaar."}, {"id": "parkeergeld-tolgeld-parkeerboetes-lichte", "n": "Parkeergeld, tolgeld, parkeerboetes, … lichte vracht", "h": "Kosten lichte vracht", "beroep": 75, "btw": 0, "rooster": "82", "soort": "vracht", "oms": "Snelheidsboetes zijn niet aftrekbaar."}, {"id": "parkeergeld-tolgeld-parkeerboetes-person", "n": "Parkeergeld, tolgeld, parkeerboetes, … personenwagen", "h": "Kosten personenwagen", "beroep": 20, "btw": 0, "rooster": "82", "soort": "wagen", "oms": "Snelheidsboetes zijn niet aftrekbaar."}, {"id": "reis-en-verblijfkosten", "n": "Reis- en verblijfkosten", "h": "Algemene kosten", "beroep": 100, "btw": 0, "rooster": "82", "oms": "Vliegtickets, hotel bij opleidingen of klantbezoeken."}, {"id": "relatiegeschenken-50-euro-excl-btw-per-g", "n": "Relatiegeschenken (< 50 euro excl. btw per geschenk per ontvanger)", "h": "Algemene kosten", "beroep": 100, "btw": 100, "rooster": "82", "verworpen": 50, "oms": "Btw recupereerbaar (50% verworpen)."}, {"id": "relatiegeschenken-50-euro-excl-btw-rookw", "n": "Relatiegeschenken (> 50 euro excl. btw, rookwaren of sterke drank)", "h": "Algemene kosten", "beroep": 100, "btw": 0, "rooster": "82", "verworpen": 50, "oms": "Geen btw-recuperatie (50% verworpen)."}, {"id": "restaurantkosten", "n": "Restaurantkosten", "h": "Algemene kosten", "beroep": 100, "btw": 0, "rooster": "82", "soort": "resto", "verworpen": 31, "oms": "Eten of drinken ter plaatse (31% verworpen, btw niet aftrekbaar)."}, {"id": "sociale-bijdragen-eindafrekening", "n": "Sociale bijdragen - eindafrekening", "h": "Sociale bijdragen", "beroep": 100, "btw": 0, "rooster": "82", "soort": "rsz", "oms": "Regularisatie van sociale bijdragen uit het verleden."}, {"id": "sociale-bijdragen-kwartaalbijdragen", "n": "Sociale bijdragen - kwartaalbijdragen", "h": "Sociale bijdragen", "beroep": 100, "btw": 0, "rooster": "82", "soort": "rsz", "oms": "Kwartaalbijdragen sociaal verzekeringsfonds."}, {"id": "taxikosten", "n": "Taxikosten", "h": "Algemene kosten", "beroep": 100, "btw": 100, "rooster": "82", "oms": "Uber, Bolt, taxi."}, {"id": "transportkosten-handelsgoederen", "n": "Transportkosten handelsgoederen", "h": "Handelsgoederen", "beroep": 100, "btw": 100, "rooster": "81", "oms": "Transportfirma, postkosten."}, {"id": "uitzendkrachten", "n": "Uitzendkrachten", "h": "Algemene kosten", "beroep": 100, "btw": 100, "rooster": "82", "oms": "Tijdelijk personeel via uitzendbureau."}, {"id": "vapz-vrij-aanvullend-pensioen-voor-zelfs", "n": "VAPZ - Vrij Aanvullend Pensioen voor Zelfstandigen", "h": "Sociale bijdragen", "beroep": 100, "btw": 0, "rooster": "82", "soort": "rsz", "oms": "Stortingen VAPZ."}, {"id": "verkeersbelasting-lichte-vracht", "n": "Verkeersbelasting lichte vracht", "h": "Kosten lichte vracht", "beroep": 75, "btw": 0, "rooster": "82", "soort": "vracht", "oms": "Verkeersbelasting lichte vracht."}, {"id": "verkeersbelasting-motorfiets", "n": "Verkeersbelasting motorfiets", "h": "Kosten motorvoertuig", "beroep": 20, "btw": 0, "rooster": "82", "soort": "moto", "oms": "Verkeersbelasting motorfiets."}, {"id": "verkeersbelasting-personenwagen", "n": "Verkeersbelasting personenwagen", "h": "Kosten personenwagen", "beroep": 20, "btw": 0, "rooster": "82", "soort": "wagen", "oms": "Verkeersbelasting personenwagen."}, {"id": "verpakkingsmateriaal-handelsgoederen", "n": "Verpakkingsmateriaal handelsgoederen", "h": "Handelsgoederen", "beroep": 100, "btw": 100, "rooster": "81", "oms": "Dozen, verpakkingen."}, {"id": "verzekering-motor-fiets", "n": "Verzekering (motor)fiets", "h": "Verzekeringen", "beroep": 20, "btw": 0, "rooster": "82", "soort": "moto", "oms": "Verzekering motorfiets."}, {"id": "verzekering-burgerlijke-aansprakelijkhei", "n": "Verzekering burgerlijke aansprakelijkheid & bedrijfsrisico's", "h": "Verzekeringen", "beroep": 100, "btw": 0, "rooster": "82", "oms": "Verzekering voor je professionele activiteiten."}, {"id": "verzekering-lichte-vracht", "n": "Verzekering lichte vracht", "h": "Verzekeringen", "beroep": 75, "btw": 0, "rooster": "82", "soort": "vracht", "oms": "Verzekering lichte vracht."}, {"id": "verzekering-personenwagen", "n": "Verzekering personenwagen", "h": "Kosten personenwagen", "beroep": 20, "btw": 0, "rooster": "82", "soort": "wagen", "oms": "Verzekering personenwagen."}, {"id": "verzekeringen-overig", "n": "Verzekeringen overig", "h": "Verzekeringen", "beroep": 100, "btw": 0, "rooster": "82", "oms": "Overige verzekeringen."}, {"id": "water", "n": "Water", "h": "Kosten woning", "beroep": 20, "btw": 20, "rooster": "82", "oms": "Waterverbruik in zakelijke context."}];

  /* ---------- voertuigen: fiscale aftrekbaarheid personenwagen (personenbelasting) ----------
   * Bron: Wolters Kluwer "Aftrekbare autokosten" (25/06/2026), wet van 18/12/2025. Nagekeken 2026-10-11.
   * aj = aanslagjaar (inkomstenjaar + 1). */
  R.autoAftrek = (w, inkomstenjaar) => {
    if (!w) return 100;
    if (w.soort === 'vracht' || w.soort === 'moto') return 100;
    const aj = inkomstenjaar + 1, d = w.aankoop || '2000-01-01', co2 = Number(w.co2) || 0;
    const coef = { diesel: 1, cng: 0.9 }[w.brandstof] ?? 0.95;
    const formule = (min) => Math.max(min, Math.min(100, 120 - 0.5 * coef * co2));
    if (w.brandstof === 'elektrisch') {
      if (d < '2026-01-01') return 100;
      const j = +d.slice(0, 4); return { 2026: 100, 2027: 95, 2028: 90, 2029: 82.5, 2030: 75 }[j] ?? 67.5;
    }
    if (w.brandstof === 'pluginhybride' && d >= '2026-01-01') {
      const j = +d.slice(0, 4), laag = co2 <= 50;
      return { 2026: laag ? 100 : 75, 2027: laag ? 95 : 75, 2028: 65, 2029: 57.5 }[j] ?? 0;
    }
    if (d >= '2026-01-01') return 0; // fossiel aangekocht vanaf 2026: niet meer aftrekbaar
    if (d >= '2023-07-01') return Math.min(formule(0), { 2026: 75, 2027: 50, 2028: 25 }[aj] ?? (aj < 2026 ? 100 : 0));
    if (d < '2018-01-01') { const min = co2 >= 200 ? 40 : Math.max(50, 75 - 5 * Math.max(0, aj - 2026)); return formule(min); }
    return formule(co2 >= 200 ? 40 : 50);
  };
  R.autoBtw = (w) => (w && w.soort === 'wagen' ? 50 : 100); // btw-aftrek personenwagen max. 50% (en nooit meer dan het beroepsgebruik)

  /* ---------- afschrijvingen: eerste jaar pro rata per dag (zoals Dexxter), daarna volledige annuïteiten ---------- */
  R.afschrijvingTabel = (inv) => {
    const waarde = Number(inv.waarde) || 0, n = Math.max(1, Number(inv.jaren) || 3), start = inv.datum || '2026-01-01';
    const jaar0 = +start.slice(0, 4); const ann = waarde / n; const out = []; let rest = waarde;
    const d0 = Math.round((new Date(jaar0 + '-12-31T12:00:00') - new Date(start + 'T12:00:00')) / 864e5) + 1;
    let j = jaar0;
    while (rest > 0.004 && j < jaar0 + n + 2) {
      if (inv.verkocht && inv.verkocht.slice(0, 4) < String(j)) break;
      let a = j === jaar0 ? ann * d0 / 365 : ann; a = Math.round(Math.min(rest, a) * 100) / 100;
      if (inv.verkocht && inv.verkocht.slice(0, 4) === String(j)) a = Math.round(rest * 100) / 100; // bij verkoop: restwaarde ten laste van dat jaar
      out.push({ jaar: j, begin: Math.round(rest * 100) / 100, afschrijving: a, eind: Math.round((rest - a) * 100) / 100 }); rest = Math.round((rest - a) * 100) / 100; j++;
    }
    return out;
  };

  /* ---------- personenbelasting: codes in Tax-on-web (deel 2, vak XVII) ----------
   * Bron: Dexxter-blog "codes personenbelasting", Securex/Partena (aj. 2026). Controleer elk jaar het nieuwe aangiftemodel. */
  R.pbCodes = [
    ['1600', 'Brutomarge: omzet min aankopen handelsgoederen en onderaanneming', 'brutomarge'],
    ['1606', 'Andere beroepskosten (na beroepsgebruik en zonder verworpen uitgaven, incl. afschrijvingen)', 'kosten'],
    ['1632', 'Betaalde sociale bijdragen en VAPZ (volgens fiscaal attest van Xerius)', 'sociale'],
    ['1617', 'Bevestiging brutomarge zelfstandige in bijberoep (enkel statistisch)', 'bijberoep'],
    ['1627', 'Startdatum (enkel in je eerste jaar als zelfstandige)', 'start']
  ];
  R.pbVoorafbetalingCode = ['1570', 'Voorafbetalingen (deel 1, vak X – staat meestal al vooraf ingevuld)'];
  // Dexxter-manier: belasting op de winst = winst × marginaal tarief van je loonschijf als werknemer (+ gemeentebelasting)
  R.loonschijven = [['0', 'Geen ander inkomen (enkel zelfstandige)'], ['1', 'Loon tot € 16.720 (25%)'], ['2', 'Loon € 16.720 – € 29.510 (40%)'], ['3', 'Loon € 29.510 – € 51.070 (45%)'], ['4', 'Loon boven € 51.070 (50%)']];

  /* ---------- externe links ---------- */
  R.links = {
    myminfin: 'https://eservices.minfin.fgov.be/myminfin-web/',
    intervat: 'https://eservices.minfin.fgov.be/intervat/',
    taxonweb: 'https://eservices.minfin.fgov.be/myminfin-web/',
    voorafbetaling: 'https://financien.belgium.be/nl/particulieren/belastingaangifte/voorafbetalingen',
    xerius: 'https://www.xerius.be/nl-be/zelfstandigen/my-xerius',
    supabaseSecrets: 'https://supabase.com/dashboard/project/pfxxzzdyzitcuhfrxaiq/functions/secrets',
    supabaseUsers: 'https://supabase.com/dashboard/project/pfxxzzdyzitcuhfrxaiq/auth/users',
    supabaseFuncties: 'https://supabase.com/dashboard/project/pfxxzzdyzitcuhfrxaiq/functions',
    recommand: 'https://app.recommand.eu', recommandKeys: 'https://app.recommand.eu/api-keys', recommandWebhooks: 'https://app.recommand.eu/webhooks', recommandDocs: 'https://docs.recommand.eu/',
    enablebanking: 'https://enablebanking.com/cp/applications',
    resend: 'https://resend.com/signup', resendDomains: 'https://resend.com/domains', resendKeys: 'https://resend.com/api-keys',
    githubActions: 'https://github.com/38blanc/vet-office/actions',
    kbo: (nr) => 'https://kbopub.economie.fgov.be/kbopub/zoeknummerform.html?nummer=' + String(nr || '').replace(/\D/g, '') + '&actionLu=Zoek',
    vies: 'https://ec.europa.eu/taxation_customs/vies/#/vat-validation',
    peppolDir: (id) => 'https://directory.peppol.eu/public/search?q=' + encodeURIComponent(id || ''),
    veka: 'https://melding.veka.vlaanderen.be/'
  };

  root.VET_RULES = R;
})(window);
