/* VET Office – toestand, opslag, navigatie, documenten (facturen, offertes, voorschotten, creditnota's) en klanten */
const C = VET_CORE, RL = VET_RULES;
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = (p = '') => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const eur = C.eur, dt = C.dt, today = C.today;
const JAAR = () => new Date().getFullYear();

const VOORWAARDEN_STANDAARD = `Deze Algemene voorwaarden zijn van toepassing op zowel diensten als goederen.
Door het invullen van de bestelbon of het geven van een opdracht aanvaardt de klant deze Algemene Voorwaarden.
Voor zakelijke klanten met een Belgisch btw-nummer worden facturen standaard elektronisch verstuurd via het Peppol-netwerk, conform de Belgische wetgeving. Deze klant zorgt voor een actieve Peppol-registratie. Alle overige klanten ontvangen hun factuur per e-mail of per post, tenzij anders overeengekomen. Een factuur verzonden via Peppol geldt als ontvangen op de datum van verzending.
Hoewel het Peppol-netwerk de veiligheid verhoogt, dient de klant zelf de gegevens op de factuur te verifiëren voor betaling. De leverancier is niet aansprakelijk voor schade door fraude of technische fouten bij de Peppol-toegangspunten van de klant of derden.
Bij volledige of gedeeltelijke niet-betaling door de klant binnen de 14 kalenderdagen (+ drie werkdagen indien niet via elektronische weg) na verzending van de eerste betalingsherinnering is er van rechtswege en zonder ingebrekestelling een schadevergoeding verschuldigd van: € 20 als het verschuldigde bedrag lager dan of gelijk is aan € 150; € 30 vermeerderd met 10% van het verschuldigde bedrag boven de € 150; € 65 vermeerderd met 5% van het verschuldigde bedrag boven de € 500, met een totaallimiet van € 2.000.
Bij volledige of gedeeltelijke niet-betaling door de klant binnen de 14 kalenderdagen (+ drie werkdagen indien niet via elektronische weg) na verzending van de eerste betalingsherinnering is de klant van rechtswege en zonder ingebrekestelling een interest verschuldigd ten belope van de wettelijke rentevoet voor betalingsachterstand bij handelstransactie, overeenkomstig artikel 5, lid 2 van de wet van 2 augustus 2002 betreffende de bestrijding van de betalingsachterstand bij handelstransacties. Deze interesten worden berekend op de nog te betalen som.
De klant controleert de factuur onmiddellijk. Elke betwisting moet binnen de 8 kalenderdagen na factuurdatum schriftelijk en gemotiveerd gebeuren. Na deze termijn worden de factuur en de levering als definitief aanvaard beschouwd.
Geleverde goederen en diensten blijven eigendom van de leverancier tot volledige betaling. Niettemin gaan alle risico's over op de koper vanaf het ogenblik van levering.
Abonnementen worden automatisch verlengd, tenzij het abonnement op tijd schriftelijk wordt opgezegd, zijnde tenminste één (1) maand voor de afloop van de termijn.
Indien de klant zijn verplichtingen, onder meer betalingsverplichting, niet tijdig nakomt, zijn wij gerechtigd om verdere leveringen en diensten stop te zetten en de overeenkomst van rechtswege en zonder ingebrekestelling als ontbonden te beschouwen.
Ingeval van betwisting zijn alleen de daartoe bevoegde rechtbanken van het rechtsgebied bevoegd.
Alle werken die niet uitdrukkelijk in de offerte zijn opgenomen, worden beschouwd als meerwerken en worden afzonderlijk aangerekend aan de geldende tarieven.
Offertes zijn geldig gedurende 14 kalenderdagen, tenzij anders vermeld. De leverancier behoudt zich het recht voor de overeengekomen prijs aan te passen indien vóór de uitvoering van de werken de prijzen van materialen, grondstoffen, transport, energie of lonen aanzienlijk wijzigen. De klant wordt hiervan vooraf in kennis gesteld.
Leverings- en uitvoeringstermijnen worden louter indicatief meegedeeld. Vertragingen ten gevolge van leveranciers, fabrikanten, transportproblemen, overmacht of onvoorziene omstandigheden geven de klant geen recht op schadevergoeding, prijsvermindering of ontbinding van de overeenkomst.
Bij annulering van een bestelling of opdracht na aanvaarding van de offerte zijn alle reeds uitgevoerde prestaties, bestelde materialen en gemaakte kosten volledig verschuldigd. Speciaal bestelde of op maat gemaakte goederen worden integraal aangerekend.
De klant zorgt ervoor dat de installatie veilig, bereikbaar en vrij toegankelijk is op het afgesproken tijdstip. Indien de werken hierdoor niet kunnen worden uitgevoerd, kunnen een vergeefse verplaatsing, wachttijd en eventuele bijkomende kosten worden aangerekend.
De leverancier is uitsluitend verantwoordelijk voor de door hem uitgevoerde werken. Hij kan niet aansprakelijk worden gesteld voor gebreken, defecten of schade die voortvloeien uit de bestaande installatie, verborgen gebreken of eerder uitgevoerde werken door derden.
De garantie op geleverde toestellen en onderdelen is beperkt tot de fabrieksgarantie van de fabrikant. Op de uitgevoerde werkzaamheden geldt de wettelijke garantie voor zover aan alle onderhouds- en gebruiksvoorschriften is voldaan. Garantie vervalt wanneer zonder toestemming van de leverancier wijzigingen of herstellingen door derden worden uitgevoerd.
De leverancier is niet aansprakelijk voor vertragingen of het niet uitvoeren van de overeenkomst als gevolg van overmacht, waaronder stakingen, ziekte, extreme weersomstandigheden, leveringsproblemen, transportproblemen, overheidsmaatregelen of andere omstandigheden buiten zijn redelijke controle.
De leverancier is niet aansprakelijk voor schade veroorzaakt door storm, blikseminslag, overstroming, vorst, spanningspieken, vandalisme, onoordeelkundig gebruik of andere externe invloeden.
De klant blijft verantwoordelijk voor het tijdig laten uitvoeren van de wettelijk verplichte onderhoudsbeurten, keuringen en inspecties. De leverancier kan niet aansprakelijk worden gesteld voor schade of defecten die voortvloeien uit het niet naleven van deze verplichtingen.
Facturen zijn betaalbaar binnen de op de factuur vermelde betalingstermijn, zonder korting of verrekening.
Annuleringen dienen minstens 24 uur vóór het afgesproken tijdstip telefonisch of per e-mail te worden doorgegeven. Bij laattijdige annulering, afwezigheid van de klant of wanneer de uitvoering van de werken onmogelijk is om een aan de klant toe te rekenen reden, behoudt Van Eyen Technics zich het recht voor een forfaitaire vergoeding van € 75,00 exclusief btw aan te rekenen. Deze vergoeding is niet verschuldigd in geval van overmacht, mits de klant hiervan het bewijs levert.
Van Eyen Technics behoudt zich het recht voor de bestelling van materialen en de uitvoering van de werken op te schorten totdat het overeengekomen voorschot volledig is ontvangen. Eventuele leverings- en uitvoeringstermijnen gaan pas in vanaf de ontvangst van dit voorschot.
Het toepasselijke btw-tarief wordt bepaald volgens de geldende wettelijke bepalingen. Indien achteraf blijkt dat een hoger btw-tarief verschuldigd is, is de bijkomende btw ten laste van de klant en wordt deze aan de klant doorgerekend.`;

/* ---------------- toestand ---------------- */
const nieuweCfg = () => ({
  bedrijf: { naam: 'Van Eyen Technics', persoon: 'Jordy Van Eyen', straat: 'Ilfeldlaan 34', pc: '2610', gemeente: 'Antwerpen', land: 'België', email: 'info@vaneyentechnics.be', tel: '0479687892', iban: 'BE84 3632 7236 8259', bic: 'BBRUBEBB', btw: 'BE1034973271', website: 'vaneyentechnics.be', rpr: '', zetelTekst: '', peppol: '0208:1034973271' },
  rechtsvorm: 'eenmanszaak', statuut: 'bijberoep', btwRegime: 'normaal', aangifte: 'kwartaal',
  dexxter: true, betaaltermijn: 14, offerteGeldig: 14,
  nummer: { factuur: '{J}-{N}', offerte: '{J}-{N}', creditnota: 'CN{J}-{N}' },
  uur1: 60, uur2: 55, standaardBtw: '21',
  opm: { factuur: '', offerte: RL.teksten.voorschotOfferte, voorschot: RL.teksten.voorschotFactuur, creditnota: '' },
  voorwaarden: VOORWAARDEN_STANDAARD,
  mailTekst: 'Dag {klant},\n\nIn bijlage vind je {document} {nr} van {bedrag}.\n{betaling}\n\nGroetjes,\nJordy\nVan Eyen Technics',
  btwProvisieOgm: '', regels: {}, thema: '', afschrijving: 3
});
let S = {
  docs: [], klanten: [], klantx: {}, uitgaven: [], bank: { tx: [], rek: [], koppeling: null }, bel: {}, aang: {}, aanvraagSt: {}, aanvraagWeg: {}, aanvraagUit: {}, onderhoudMail: {}, werkUit: [],
  seq: { factuur: {}, offerte: {}, creditnota: {} }, artikels: [], cfg: nieuweCfg(), peppolIn: [], log: []
};
const EXT = { jobs: [], orders: [], aanvragen: [], workArt: [] }; // gegevens uit VET Heat, VET Work en VET Secretaris (alleen lezen)
let v = 'home', cur = null, sub = '', filt = { q: '', st: '', jaar: JAAR() }, RO = false; // RO = alleen lezen (boekhouder)

/* ---------------- opslag (IndexedDB) ---------------- */
let dbp = null;
const db = () => dbp || (dbp = new Promise((res, rej) => { const r = indexedDB.open('vetoffice', 1); r.onupgradeneeded = () => r.result.createObjectStore('s'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }));
async function idbGet(k) { try { const d = await db(); return await new Promise((res) => { const t = d.transaction('s').objectStore('s').get(k); t.onsuccess = () => res(t.result); t.onerror = () => res(null); }); } catch (e) { try { return JSON.parse(localStorage.getItem('vetoffice_' + k) || 'null'); } catch (x) { return null; } } }
async function idbSet(k, val) { try { const d = await db(); await new Promise((res, rej) => { const t = d.transaction('s', 'readwrite'); t.objectStore('s').put(val, k); t.oncomplete = res; t.onerror = () => rej(t.error); }); } catch (e) { try { localStorage.setItem('vetoffice_' + k, JSON.stringify(val)); } catch (x) {} } }
async function save(fromCloud) { if (RO && !fromCloud) return; if (!fromCloud && window.CLOUD) CLOUD.soon(); await idbSet(RO ? 'ro' : 'main', S); await idbSet('ext', EXT); }
async function load() {
  const d = await idbGet('main'); if (d) S = Object.assign(S, d);
  S.cfg = Object.assign(nieuweCfg(), S.cfg || {}); S.cfg.bedrijf = Object.assign(nieuweCfg().bedrijf, S.cfg.bedrijf || {}); S.cfg.nummer = Object.assign(nieuweCfg().nummer, S.cfg.nummer || {}); S.cfg.opm = Object.assign(nieuweCfg().opm, S.cfg.opm || {});
  const e = await idbGet('ext'); if (e) Object.assign(EXT, e);
  regelsToepassen(); if (window.migreer) migreer();
}
function regelsToepassen() { // eigen aanpassingen van de regels (Instellingen › Regels) over rules.js leggen
  const o = S.cfg.regels || {};
  Object.entries(o).forEach(([jaar, p]) => { const base = RL.jaren[jaar]; if (!base) return; ['pb', 'rsz', 'vb'].forEach((k) => { if (p[k]) Object.assign(base[k], p[k]); }); if (p.va) Object.assign(base.va.pb, p.va); });
}

/* ---------------- UI-hulp ---------------- */
function toast(t, ms = 2600) { const e = document.createElement('div'); e.className = 'toast'; e.textContent = t; document.body.appendChild(e); setTimeout(() => e.remove(), ms); }
function modal(html) { const m = document.createElement('div'); m.className = 'mod'; m.innerHTML = `<div class="c">${html}</div>`; m.onclick = (e) => { if (e.target === m) m.remove(); }; document.body.appendChild(m); return m; }
const sluit = () => document.querySelectorAll('.mod').forEach((m) => m.remove());
function menu(o) { $('#side').classList.toggle('open', !!o); }
function inp(label, path, o = {}) {
  const val = get(path); const ro = RO || o.ro;
  if (o.area) return `<label class="f"><span>${label}</span><textarea ${ro ? 'readonly' : ''} oninput="set('${path}',this.value${o.num ? ',1' : ''})" ${o.rows ? `rows="${o.rows}"` : ''} placeholder="${esc(o.ph || '')}">${esc(val)}</textarea></label>`;
  if (o.sel) return `<label class="f"><span>${label}</span><select ${ro ? 'disabled' : ''} onchange="set('${path}',this.value);${o.re ? 'R()' : ''}">${o.sel.map(([k, l]) => `<option value="${esc(k)}" ${String(val) === String(k) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`;
  return `<label class="f"><span>${label}</span><input ${ro ? 'readonly' : ''} type="${o.type || 'text'}" ${o.num ? 'inputmode="decimal"' : ''} value="${esc(val)}" placeholder="${esc(o.ph || '')}" oninput="set('${path}',this.value${o.num ? ',1' : ''})" ${o.re ? 'onchange="R()"' : ''}></label>`;
}
function get(path) { return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), { S, D: curDoc(), U: curUitgave() }) ?? ''; }
function set(path, val, num) {
  if (RO) return;
  const ks = path.split('.'); let o = { S, D: curDoc(), U: curUitgave() }; for (let i = 0; i < ks.length - 1; i++) { if (o[ks[i]] == null) o[ks[i]] = {}; o = o[ks[i]]; }
  o[ks[ks.length - 1]] = num ? C.num(val) : val; save(); if (v === 'doc') totalenTonen();
}
const nav = [
  ['home', '🏠', 'Overzicht'], ['tijdlijn', '🗓', 'Tijdlijn'],
  'Verkoop', ['werkbonnen', '🔧', 'Te factureren'], ['facturen', '🧾', 'Facturen'], ['offertes', '📝', 'Offertes'], ['creditnotas', '↩️', "Creditnota's"], ['klanten', '👥', 'Klanten'],
  'Aankoop', ['uitgaven', '💸', 'Kosten'], ['peppol', '📥', 'Peppol-inbox'], ['invest', '🛠', 'Afschrijvingen'], ['wagens', '🚐', "Auto's"], ['bank', '🏦', 'Bank'],
  'Aangiftes', ['btw', '📊', 'Btw-aangifte'], ['ic', '🇪🇺', 'IC-aangifte'], ['belasting', '🧮', 'Personenbelasting & RSZ'], ['rapport', '📈', 'Rapporten'],
  'VET-apps', ['veka', '📨', 'VEKA-meldingen'], ['attesten', '🔥', 'Attesten'], ['aanvragen', '📞', 'Aanvragen'],
  'Beheer', ['verz', '🛡', 'Verzekeringen'], ['instellingen', '⚙️', 'Instellingen']
];
function telling(k) {
  if (k === 'werkbonnen') return teFactureren().length + losseAttesten().length;
  if (k === 'veka') return EXT.jobs.filter(vekaNodig).length;
  if (k === 'peppol') return (S.peppolIn || []).filter((p) => !p.verwerkt).length;
  if (k === 'aanvragen') return EXT.aanvragen.filter((a) => !(S.aanvraagSt[a.id] || {}).st && !(S.aanvraagWeg || {})[a.id]).length;
  if (k === 'facturen') return S.docs.filter((d) => isFactuur(d) && status(d) === 'vervallen').length;
  return 0;
}
function sideR() {
  const actief = { doc: cur && (curDoc() || {}).type, klant: 'klanten', uitgave: 'uitgaven' };
  let on = v; if (v === 'doc') { const t = (curDoc() || {}).type; on = t === 'offerte' ? 'offertes' : t === 'creditnota' ? 'creditnotas' : 'facturen'; } else if (actief[v] && v !== 'doc') on = actief[v];
  $('#side').innerHTML = `<div class="brand"><img src="logo-app.png" alt="Van Eyen Technics" class="blogo"><span>VET Office</span></div>` + nav.map((n) => {
    if (n === null) return '<div style="height:8px"></div>';
    if (typeof n === 'string') return `<div class="grp">${n}</div>`;
    const c = telling(n[0]);
    return `<a class="${on === n[0] ? 'on' : ''}" onclick="go('${n[0]}')"><span>${n[1]}</span>${n[2]}${c ? `<span class="cnt">${c}</span>` : ''}</a>`;
  }).join('') + `<div style="padding:14px 10px 0;font-size:12px;opacity:.7" id="cloudst">${window.CLOUDST ? CLOUDST() : ''}</div>`;
}
function go(nv, id, s) { v = nv; cur = id ?? null; sub = s || ''; menu(0); R(); scrollTo(0, 0); }
function R() {
  sideR();
  const views = { home: vHome, facturen: () => vDocs('factuur'), offertes: () => vDocs('offerte'), creditnotas: () => vDocs('creditnota'), doc: vDoc, klanten: vKlanten, klant: vKlant, uitgaven: vUitgaven, uitgave: vUitgave, peppol: vPeppol, invest: vInvest, wagens: vWagens, verz: vVerz, ic: vIc, rapport: vRapport, tijdlijn: vTijdlijn, veka: vVeka, bank: vBank, btw: vBtw, belasting: vBelasting, werkbonnen: vWerkbonnen, attesten: vAttesten, aanvragen: vAanvragen, instellingen: vInstellingen };
  const ban = [];
  if (RO) ban.push(`<div class="ban b">👁 Je bekijkt de administratie van <b>${esc(S.cfg.bedrijf.naam)}</b> als boekhouder (alleen lezen). <button class="sm b2" onclick="boekhouderStop()">Terug naar mijn eigen account</button></div>`);
  else if (S.cfg.dexxter && ['home', 'facturen', 'doc', 'btw'].includes(v)) ban.push(`<div class="ban o">Dexxter-modus: Dexxter blijft je officiële facturatie. VET Office werkt hiernaast ter controle (PDF's krijgen "KOPIE", Peppol staat uit). Uitschakelen kan in <a onclick="go('instellingen',null,'dexxter')" style="cursor:pointer;text-decoration:underline">Instellingen › Dexxter</a>.</div>`);
  $('#app').innerHTML = ban.join('') + (views[v] || vHome)();
  const c2 = $('#cloudst2'); if (c2 && window.CLOUDST) c2.innerHTML = CLOUDST();
  if (v === 'doc') totalenTonen();
  if (v === 'uitgave') bijlageVoorbeeld();
}

/* ---------------- documenten ---------------- */
const isFactuur = (d) => d.type === 'factuur' || d.type === 'voorschot';
const curDoc = () => S.docs.find((d) => d.id === cur) || null;
const curUitgave = () => (S.uitgaven || []).find((u) => u.id === cur) || null;
const TYPENAAM = { factuur: 'Factuur', voorschot: 'Voorschotfactuur', offerte: 'Offerte', creditnota: 'Creditnota' };
function status(d) {
  if (d.status === 'concept') return 'concept';
  if (d.type === 'offerte') return d.status || 'verzonden';
  if (d.status === 'geannuleerd') return 'geannuleerd';
  if (d.type === 'creditnota') return d.status === 'betaald' ? 'terugbetaald' : 'definitief';
  const t = C.totalen(d);
  if (t.inc > 0 && t.open <= 0.004 && (d.betalingen || []).length && d.betalingen.every((b) => b.cn)) return 'gecrediteerd';
  if (t.inc <= 0 || t.open <= 0.004 || d.status === 'betaald') return 'betaald';
  if (t.betaald > 0) return 'deels betaald';
  if (d.verval && d.verval < today()) return 'vervallen';
  return d.peppol && d.peppol.id ? 'verzonden' : (d.verzonden ? 'verzonden' : 'open');
}
const STATUSKLEUR = { concept: 'n', open: '', verzonden: '', betaald: 'g', 'deels betaald': 'o', vervallen: 'r', geannuleerd: 'n', definitief: '', terugbetaald: 'g', aanvaard: 'g', geweigerd: 'n', gefactureerd: 'g', gecrediteerd: 'n' };
const afgehandeld = (d) => ['betaald', 'gecrediteerd', 'geannuleerd'].includes(status(d));
const tagSt = (d) => { const s = status(d); return `<span class="tag ${STATUSKLEUR[s] || ''}">${s}</span>`; };
function volgNr(type) {
  const reeks = type === 'voorschot' ? 'factuur' : type; const j = String(JAAR());
  S.seq[reeks] = S.seq[reeks] || {}; const n = (S.seq[reeks][j] || 0) + 1;
  return { reeks, j, n, nr: (S.cfg.nummer[reeks] || '{J}-{N}').replace('{J}', j).replace('{N}', String(n)) };
}
function splitPcG(pc) { const m = String(pc || '').trim().match(/^(\d{4,5})\s+(.+)$/); return m ? { pc: m[1], gemeente: m[2] } : { pc: String(pc || ''), gemeente: '' }; }
function klantSnapshot(k) {
  if (!k) return { naam: '' };
  const x = S.klantx[k.id] || {}; const sp = splitPcG(k.pc);
  return { id: k.id, naam: k.n || '', tav: x.tav || '', straat: k.straat || '', pc: sp.pc, gemeente: sp.gemeente, land: x.land || 'BE', landNaam: x.landNaam || 'België', btw: x.btw || '', peppol: x.peppol || (x.btw ? C.peppolId(x.btw) : ''), email: x.email || k.mail || '', tel: k.tel || '' };
}
function nieuwDoc(type, uit = {}) {
  if (RO) return;
  const d = Object.assign({
    id: uid('d'), type, nr: '', datum: today(), verval: C.addDays(today(), type === 'offerte' ? S.cfg.offerteGeldig : S.cfg.betaaltermijn), status: 'concept',
    klant: { naam: '' }, lijnen: [], korting: 0, opm: S.cfg.opm[type] || '', betalingen: [], aangemaakt: new Date().toISOString()
  }, uit);
  S.docs.unshift(d); save(); go('doc', d.id);
}
function lijnNieuw(o = {}) { o = Object.fromEntries(Object.entries(o).filter(([, x]) => x !== undefined)); const d = curDoc(); const aannemer = d && d.klant && d.klant.id && (S.klantx[d.klant.id] || {}).type === 'aannemer'; const l = Object.assign({ id: uid('l'), oms: '', det: '', aantal: 1, eenheid: 'stuks', prijs: 0, btw: S.cfg.btwRegime === 'kleine' ? 'KO' : aannemer ? 'VERL' : (S.cfg.standaardBtw || '21'), korting: 0 }, o); if (l.btw == null) l.btw = S.cfg.standaardBtw || '21'; return l; }
function vermeldingen(d) {
  const out = []; const codes = (d.lijnen || []).map((l) => String(l.btw));
  if (codes.includes('6') && d.type !== 'creditnota' && !(d.opm || '').includes('BTW 6%')) out.push(RL.teksten.btw6);
  if (codes.includes('VERL') && !(d.opm || '').includes('Verlegging van heffing')) out.push(RL.teksten.verlegd);
  if (codes.includes('ICD')) out.push(RL.teksten.intracom);
  if (codes.includes('KO') || S.cfg.btwRegime === 'kleine') out.push(RL.teksten.kleineOnderneming);
  if (d.type === 'creditnota' && C.totalen(d).btw > 0) out.push(RL.teksten.creditnotaBtw);
  return out;
}
const locked = (d) => RO || (d.status !== 'concept' && d.type !== 'offerte');

function vDocs(type) {
  const types = type === 'factuur' ? ['factuur', 'voorschot'] : [type];
  const q = filt.q.toLowerCase();
  let list = S.docs.filter((d) => types.includes(d.type) && String(d.datum || '').startsWith(String(filt.jaar)) && (!q || [d.nr, d.klant && d.klant.naam, ...(d.lijnen || []).map((l) => l.oms)].join(' ').toLowerCase().includes(q)));
  const sts = [...new Set(list.map(status))];
  if (filt.st) list = list.filter((d) => status(d) === filt.st);
  list.sort((a, b) => (b.datum || '').localeCompare(a.datum || '') || String(b.nr).localeCompare(String(a.nr), 'nl', { numeric: true }));
  const sum = list.reduce((s, d) => { const t = C.totalen(d); return { ex: s.ex + t.ex, inc: s.inc + t.inc, open: s.open + (isFactuur(d) && d.status !== 'concept' && !afgehandeld(d) ? t.open : 0) }; }, { ex: 0, inc: 0, open: 0 });
  const jaren = [...new Set([JAAR(), ...S.docs.map((d) => +String(d.datum).slice(0, 4)).filter(Boolean)])].sort((a, b) => b - a);
  const titel = { factuur: 'Facturen', offerte: 'Offertes', creditnota: "Creditnota's" }[type];
  return `<div class="row wrap" style="margin-bottom:12px"><h1 style="margin:0">${titel}</h1><span class="sp"></span>
  ${RO ? '' : type === 'factuur' ? `<button onclick="nieuwDoc('factuur')">+ Factuur</button><button class="b2" onclick="nieuwDoc('voorschot')">+ Voorschotfactuur</button>` : type === 'offerte' ? `<button onclick="nieuwDoc('offerte')">+ Offerte</button>` : `<button onclick="creditnotaKies()">+ Creditnota</button>`}</div>
  <div class="row wrap" style="margin-bottom:10px"><input style="max-width:280px" placeholder="Zoeken…" value="${esc(filt.q)}" oninput="filt.q=this.value;clearTimeout(window._ft);window._ft=setTimeout(R,250)"><select style="max-width:110px" onchange="filt.jaar=this.value;R()">${jaren.map((j) => `<option ${+filt.jaar === j ? 'selected' : ''}>${j}</option>`).join('')}</select></div>
  <div class="chips"><button class="chip ${!filt.st ? 'on' : ''}" onclick="filt.st='';R()">Alle</button>${sts.map((s) => `<button class="chip ${filt.st === s ? 'on' : ''}" onclick="filt.st='${s}';R()">${s}</button>`).join('')}</div>
  <div class="c" style="padding:0;overflow:auto"><table class="t"><tr><th>Nummer</th><th>Klant</th><th>Datum</th><th class="r">Excl. btw</th><th class="r">Totaal</th><th>Status</th></tr>
  ${list.map((d) => { const t = C.totalen(d); return `<tr class="cl" onclick="go('doc','${d.id}')"><td class="nw"><b>${esc(d.nr || 'concept')}</b>${d.type === 'voorschot' ? ' <span class="tag n">voorschot</span>' : ''}${d.peppol && d.peppol.id ? ' <span class="tag">Peppol</span>' : ''}</td><td>${esc(d.klant && d.klant.naam)}</td><td class="nw">${dt(d.datum)}</td><td class="r tab nw">${eur(t.ex)}</td><td class="r tab nw">${eur(t.inc)}</td><td>${tagSt(d)}</td></tr>`; }).join('') || `<tr><td colspan="6" class="mu" style="padding:18px">Nog niets in ${filt.jaar}.</td></tr>`}
  </table></div>
  <p class="mu">${list.length} documenten · ${eur(sum.ex)} excl. btw · ${eur(sum.inc)} incl. btw${type === 'factuur' ? ` · openstaand ${eur(sum.open)}` : ''}</p>`;
}

function klantOpties(q) {
  q = String(q || '').toLowerCase();
  return S.klanten.filter((k) => !q || [k.n, k.straat, k.pc, (S.klantx[k.id] || {}).btw].join(' ').toLowerCase().includes(q)).slice(0, 30);
}
function klantZoek(el) {
  const box = el.parentElement.querySelector('.lst'); const l = klantOpties(el.value);
  box.innerHTML = l.map((k) => `<div onmousedown="klantKies('${k.id}')"><b>${esc(k.n)}</b> <span class="mu">${esc([k.straat, k.pc].filter(Boolean).join(', '))}</span></div>`).join('') + `<div onmousedown="klantNieuwUitDoc()" style="color:var(--ac)">+ Nieuwe klant${el.value ? ' "' + esc(el.value) + '"' : ''}</div>`;
  box.style.display = 'block';
}
function klantKies(id) { const d = curDoc(); const k = S.klanten.find((x) => x.id === id); d.klant = klantSnapshot(k); if ((S.klantx[id] || {}).type === 'aannemer') d.lijnen.forEach((l) => { l.btw = 'VERL'; }); save(); R(); }
function klantNieuwUitDoc() { const d = curDoc(); const naam = ($('#kz') || {}).value || ''; const k = { id: uid('c'), n: naam, straat: '', pc: '', adres: '', tel: '', mail: '' }; S.klanten.push(k); d.klant = klantSnapshot(k); save(); go('klant', k.id, 'terug:' + d.id); }

function vDoc() {
  const d = curDoc(); if (!d) return '<p>Niet gevonden.</p>';
  const lk = locked(d); const t = C.totalen(d);
  const btwOpts = Object.entries(RL.btwCodes).filter(([k]) => S.cfg.btwRegime === 'kleine' ? k === 'KO' : k !== 'KO').map(([k, c]) => [k, c.label]);
  const eenh = ['stuks', 'uren', 'm', 'forfait', 'km', 'kg', 'l'];
  const lijnen = (d.lijnen || []).map((l, i) => `<div class="lijn">
    <div><input ${lk ? 'readonly' : ''} value="${esc(l.oms)}" placeholder="Omschrijving" oninput="lijnSet(${i},'oms',this.value)" list="artlist" onchange="artikelVul(${i},this.value)"><textarea ${lk ? 'readonly' : ''} placeholder="Details (optioneel)" oninput="lijnSet(${i},'det',this.value)">${esc(l.det)}</textarea></div>
    <input ${lk ? 'readonly' : ''} inputmode="decimal" value="${esc(l.aantal)}" oninput="lijnSet(${i},'aantal',this.value,1)" title="Aantal">
    <select ${lk ? 'disabled' : ''} onchange="lijnSet(${i},'eenheid',this.value)">${[...new Set([l.eenheid, ...eenh])].map((u) => `<option ${u === l.eenheid ? 'selected' : ''}>${esc(u)}</option>`).join('')}</select>
    <input ${lk ? 'readonly' : ''} inputmode="decimal" value="${esc(l.prijs)}" oninput="lijnSet(${i},'prijs',this.value,1)" title="Prijs excl. btw">
    <select ${lk ? 'disabled' : ''} onchange="lijnSet(${i},'btw',this.value);R()">${btwOpts.map(([k, lb]) => `<option value="${k}" ${String(l.btw) === k ? 'selected' : ''}>${lb}</option>`).join('')}</select>
    <input ${lk ? 'readonly' : ''} inputmode="decimal" value="${esc(l.korting || '')}" placeholder="0" oninput="lijnSet(${i},'korting',this.value,1)" title="Korting % op deze lijn">
    <div class="r tab" style="padding-top:8px" id="lt${i}">${eur(C.lijnEx(l))}</div>
    ${lk ? '<span></span>' : `<button class="lnk" title="Lijn verwijderen" onclick="lijnWeg(${i})">✕</button>`}</div>`).join('');
  const opties = (S.artikels || []).filter((a) => a.n);
  const k = d.klant || {};
  const akties = [];
  if (!RO) {
    if (d.status === 'concept') akties.push(`<button onclick="definitief()">${d.type === 'offerte' ? 'Offerte afronden' : 'Definitief maken'}</button>`);
    akties.push(`<button class="b2" onclick="toonPdf()">PDF bekijken</button>`);
    if (d.status !== 'concept') akties.push(`<button class="b2" onclick="verstuur()">Versturen…</button>`);
    if (isFactuur(d) && d.status !== 'concept' && !afgehandeld(d)) akties.push(`<button class="gr" onclick="betaling()">Betaling registreren</button>`);
    if (window.herinnerKan && herinnerKan(d)) akties.push(`<button class="b2" onclick="herinnering()">⏰ ${(d.herinneringen || []).length ? 'Aanmaning' : 'Herinnering'}</button>`);
    if (d.type === 'offerte' && d.status !== 'concept' && window.offerteLink && !(d.online && d.online.status === 'open')) akties.push(`<button onclick="offerteLink()">🔗 Online laten goedkeuren</button>`);
    if (d.type === 'offerte' && d.status !== 'concept') akties.push(`<button class="b2" onclick="offerteNaar('factuur')">→ Factuur</button><button class="b2" onclick="offerteNaar('voorschot')">→ Voorschotfactuur</button><select style="width:auto;margin:0" onchange="set('D.status',this.value);R()">${['verzonden', 'aanvaard', 'geweigerd', 'gefactureerd'].map((s) => `<option ${d.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select>`);
    if (isFactuur(d) && d.status !== 'concept') akties.push(`<button class="b2" onclick="maakCreditnota('${d.id}')">Creditnota</button>`);
    if (d.type === 'factuur' && d.status === 'concept') akties.push(`<button class="b2" onclick="voorschotVerrekenen()">Voorschot verrekenen</button>`);
    akties.push(`<button class="b2" onclick="dupliceer()">Dupliceren</button>`);
    if (d.status === 'concept') akties.push(`<button class="red" onclick="docWeg()">Verwijderen</button>`);
  } else akties.push(`<button class="b2" onclick="toonPdf()">PDF bekijken</button>`);
  const kTxt = [k.straat, [k.pc, k.gemeente].filter(Boolean).join(' '), k.btw ? C.fmtBtw(k.btw) : ''].filter(Boolean).join(' · ');
  const verm = vermeldingen(d);
  return `<div class="row wrap np" style="margin-bottom:10px"><button class="lnk" onclick="go('${d.type === 'offerte' ? 'offertes' : d.type === 'creditnota' ? 'creditnotas' : 'facturen'}')">‹ Terug</button><span class="sp"></span>${akties.join('')}</div>
  <h1>${TYPENAAM[d.type]} ${esc(d.nr || '(concept)')} ${tagSt(d)}</h1>
  ${lk && !RO ? `<div class="ban b">Dit document is definitief en kan niet meer gewijzigd worden (wettelijk). Fout? Maak een creditnota.</div>` : ''}
  <div class="cols"><div class="c"><h2>Klant</h2>
    ${lk ? `<b>${esc(k.naam)}</b><div class="mu">${esc(kTxt)}</div>` : `<div class="ac"><input id="kz" autocomplete="off" placeholder="Zoek of typ een klant…" value="${esc(k.naam)}" oninput="klantZoek(this)" onfocus="klantZoek(this)" onblur="setTimeout(()=>{const l=this.parentElement.querySelector('.lst');if(l)l.style.display='none'},150)"><div class="lst" style="display:none"></div></div>
    ${k.id ? `<div class="mu">${esc(kTxt) || 'Geen adres'} · <a style="cursor:pointer;color:var(--ac)" onclick="go('klant','${k.id}','terug:${d.id}')">klant bewerken</a></div>` : ''}`}
    ${k.btw ? `<div class="mu" style="margin-top:6px">Peppol: ${esc(k.peppol || C.peppolId(k.btw) || '—')}</div>` : ''}
    ${!lk ? inp('Uw referentie (optioneel)', 'D.klantRef') : ''}
  </div><div class="c"><h2>Gegevens</h2><div class="cols">
    ${S.cfg.dexxter && d.type !== 'offerte' ? inp('Nummer (zoals in Dexxter)', 'D.nr', { ro: RO }) : ''}
    ${inp(d.type === 'offerte' ? 'Offertedatum' : 'Datum', 'D.datum', { type: 'date', ro: lk, re: 1 })}
    ${d.type !== 'creditnota' ? inp(d.type === 'offerte' ? 'Geldig tot' : 'Vervaldatum', 'D.verval', { type: 'date', ro: lk }) : ''}
    ${d.type === 'creditnota' ? `<label class="f"><span>Betreft factuur</span><select ${lk ? 'disabled' : ''} onchange="cnRef(this.value)"><option value="">— kies —</option>${S.docs.filter((x) => isFactuur(x) && x.status !== 'concept' && (!k.id || !x.klant || x.klant.id === k.id || x.klant.naam === k.naam)).map((x) => `<option value="${x.id}" ${d.ref && d.ref.id === x.id ? 'selected' : ''}>${esc(x.nr)} – ${esc(x.klant && x.klant.naam)} – ${dt(x.datum)}</option>`).join('')}</select></label>` : ''}
    ${isFactuur(d) && d.ogm ? `<label class="f"><span>Gestructureerde mededeling</span><input readonly value="${esc(d.ogm)}"></label>` : ''}
  </div></div></div>
  <div class="c"><h2>Lijnen</h2>
    <div class="lijn h"><span>Omschrijving</span><span>Aantal</span><span>Eenheid</span><span>Prijs excl.</span><span>Btw</span><span>Korting %</span><span class="r">Totaal excl.</span><span></span></div>
    ${lijnen || '<p class="mu">Nog geen lijnen.</p>'}
    <datalist id="artlist">${opties.map((a) => `<option value="${esc(a.n)}">${a.p != null ? eur(a.p) : ''}</option>`).join('')}</datalist>
    ${lk ? '' : `<div class="row wrap" style="margin-top:10px"><button class="b2 sm" onclick="lijnAdd()">+ Lijn</button><button class="b2 sm" onclick="werkurenAdd()">+ Werkuren</button><button class="b2 sm" onclick="artikelKies()">+ Uit artikellijst</button><span class="sp"></span><label class="row" style="gap:6px"><span class="mu nw">Korting op factuur %</span><input style="width:70px" inputmode="decimal" value="${esc(d.korting || '')}" placeholder="0" oninput="set('D.korting',this.value,1)"></label></div>`}
    <div class="tot" id="totbox" style="margin-top:12px"></div>
  </div>
  <div class="c"><h2>Opmerkingen</h2>${inp('Opmerkingen op het document', 'D.opm', { area: 1, ro: lk, rows: 3 })}
    ${verm.length ? `<div class="mu">Wordt automatisch toegevoegd (wettelijke vermeldingen):<ul style="margin:4px 0 0 18px;padding:0">${verm.map((x) => `<li>${esc(x.slice(0, 140))}${x.length > 140 ? '…' : ''}</li>`).join('')}</ul></div>` : ''}
  </div>
  ${isFactuur(d) && (d.betalingen || []).length ? `<div class="c"><h2>Betalingen</h2>${d.betalingen.map((b, i) => `<div class="dl"><span>${dt(b.datum)} · ${esc(b.via || 'overschrijving')}</span><span class="row"><b class="tab">${eur(b.bedrag)}</b>${RO ? '' : `<button class="lnk" onclick="betalingWeg(${i})">✕</button>`}</span></div>`).join('')}<div class="dl"><span>Nog open</span><b>${eur(t.open)}</b></div></div>` : ''}
  ${window.vHerHist ? vHerHist(d) : ''}${window.vOnline ? vOnline(d) : ''}
  ${d.peppol ? `<div class="c"><h2>Peppol</h2><div class="dl"><span>Status</span><b>${esc(d.peppol.status || '')}</b></div><div class="dl"><span>Verzonden</span><span>${esc((d.peppol.datum || '').replace('T', ' ').slice(0, 16))}</span></div><div class="dl"><span>Ontvanger</span><span>${esc(d.peppol.naar || '')}</span></div></div>` : ''}
  <div class="c"><h2>Bijlagen (gaan mee met de factuur)</h2>${(d.bijlagen || []).map((b, i) => `<div class="dl"><span>${b.soort === 'werkbon' ? '🔧' : b.soort === 'attest' ? '🔥' : '📎'} ${esc(b.naam)}</span><span class="row"><button class="lnk sm" onclick="bestandOpen(curDoc().bijlagen[${i}].ref)">Openen</button>${RO ? '' : `<button class="lnk sm" onclick="curDoc().bijlagen.splice(${i},1);save();R()">✕</button>`}</span></div>`).join('') || '<p class="mu">Geen bijlagen.</p>'}${RO ? '' : `<label class="btnl b2l" style="margin-top:6px">+ Bijlage (PDF)<input type="file" accept="application/pdf,image/*" style="display:none" onchange="bijlageDoc(this.files[0])"></label>`}</div>
  ${d.archief ? `<div class="c"><h2>Archief (10 jaar bewaren)</h2><div class="row wrap"><button class="b2 sm" onclick="archiefOpen('pdf')">Origineel PDF</button><button class="b2 sm" onclick="archiefOpen('ubl')">UBL (Peppol-XML)</button><span class="mu">vastgelegd op ${esc(String(d.archief.datum || '').slice(0, 10))}</span></div></div>` : ''}
  ${d.bron ? `<p class="mu">Gemaakt van ${esc(d.bron.label || d.bron.app)}.</p>` : ''}`;
}
function totalenTonen() {
  const d = curDoc(); const box = $('#totbox'); if (!d || !box) return; const t = C.totalen(d);
  (d.lijnen || []).forEach((l, i) => { const e = document.getElementById('lt' + i); if (e) e.textContent = eur(C.lijnEx(l)); });
  box.innerHTML = `${t.korting ? `<div><span>Korting op de factuur (${t.kortingPct}%)</span><span class="tab">− ${eur(t.korting)}</span></div>` : ''}<div><span>Totaal excl. btw</span><b class="tab">${eur(t.ex)}</b></div>${t.groepen.map((g) => `<div class="mu"><span>Btw ${esc((RL.btwCodes[g.code] || {}).label)} op ${eur(g.basis)}</span><span class="tab">${eur(g.btw)}</span></div>`).join('')}<div><span>Totaal btw</span><b class="tab">${eur(t.btw)}</b></div><div class="big"><span>${d.type === 'creditnota' ? 'Te crediteren' : 'TOTAAL'}</span><span class="tab">${eur(t.inc)}</span></div>`;
}
function lijnSet(i, k, val, num) { const d = curDoc(); if (locked(d)) return; d.lijnen[i][k] = num ? C.num(val) : val; save(); totalenTonen(); }
function lijnAdd(o) { const d = curDoc(); d.lijnen.push(lijnNieuw(o)); save(); R(); setTimeout(() => { const els = document.querySelectorAll('.lijn input'); const e = [...els].reverse().find((x) => x.placeholder === 'Omschrijving'); if (e && !o) e.focus(); }, 30); }
function lijnWeg(i) { const d = curDoc(); d.lijnen.splice(i, 1); save(); R(); }
function werkurenAdd() {
  const u = C.num(prompt('Aantal werkuren?', '1') || 0); if (!u) return;
  lijnAdd({ oms: 'Werkuren', aantal: Math.min(1, u), eenheid: 'uren', prijs: S.cfg.uur1 });
  if (u > 1) lijnAdd({ oms: 'Werkuren (elk volgend uur)', aantal: C.r2(u - 1), eenheid: 'uren', prijs: S.cfg.uur2 });
}
function artikelVul(i, naam) {
  const a = (S.artikels || []).find((x) => x.n === naam); if (!a) return;
  const l = curDoc().lijnen[i]; if (a.p != null && !C.num(l.prijs)) l.prijs = C.num(a.p); if (a.u) l.eenheid = a.u === 'stuk' ? 'stuks' : a.u === 'uur' ? 'uren' : a.u; if (a.det && !l.det) l.det = a.det; if (a.btw) l.btw = a.btw; save(); R();
}
function artikelKies() {
  const l = (S.artikels || []).filter((a) => a.n);
  const m = modal(`<h2>Artikel kiezen</h2><input placeholder="Zoeken…" oninput="[...this.parentElement.querySelectorAll('.item')].forEach(e=>e.style.display=e.textContent.toLowerCase().includes(this.value.toLowerCase())?'':'none')">
  <div style="max-height:55vh;overflow:auto">${l.map((a, i) => `<div class="item dl" style="cursor:pointer" onclick="artikelNeem(${i})"><span>${esc(a.n)}${a.det ? `<div class="mu">${esc(a.det)}</div>` : ''}</span><span class="tab">${a.p != null ? eur(a.p) : ''}</span></div>`).join('') || '<p class="mu">Nog geen artikels. Voeg ze toe in Instellingen › Artikels (of in VET Work).</p>'}</div>`);
  window._artl = l; return m;
}
function artikelNeem(i) { const a = window._artl[i]; sluit(); lijnAdd({ oms: a.n, det: a.det || '', prijs: C.num(a.p), eenheid: a.u === 'stuk' || !a.u ? 'stuks' : a.u === 'uur' ? 'uren' : a.u, btw: a.btw || undefined }); }
function docWeg() { const d = curDoc(); if (d.status !== 'concept') return; if (!confirm('Concept verwijderen?')) return; S.docs = S.docs.filter((x) => x !== d); window.CLOUD && CLOUD.markDeleted('office', 'doc', d.id); save(); go(d.type === 'offerte' ? 'offertes' : 'facturen'); }
function dupliceer() { const d = curDoc(); const n = JSON.parse(JSON.stringify(d)); Object.assign(n, { id: uid('d'), nr: '', status: 'concept', datum: today(), verval: C.addDays(today(), d.type === 'offerte' ? S.cfg.offerteGeldig : S.cfg.betaaltermijn), betalingen: [], peppol: null, archief: null, ogm: '', verzonden: null, bron: null }); n.lijnen.forEach((l) => l.id = uid('l')); S.docs.unshift(n); save(); go('doc', n.id); }
function cnRef(id) { const d = curDoc(); const f = S.docs.find((x) => x.id === id); d.ref = f ? { id: f.id, nr: f.nr, datum: f.datum } : null; if (f && !d.lijnen.length) d.lijnen = JSON.parse(JSON.stringify(f.lijnen)); if (f && !d.klant.naam) d.klant = JSON.parse(JSON.stringify(f.klant)); save(); R(); }
function creditnotaKies() {
  const l = S.docs.filter((x) => isFactuur(x) && x.status !== 'concept').slice(0, 200);
  modal(`<h2>Creditnota voor welke factuur?</h2><div style="max-height:60vh;overflow:auto">${l.map((x) => `<div class="dl" style="cursor:pointer" onclick="sluit();maakCreditnota('${x.id}')"><span><b>${esc(x.nr)}</b> ${esc(x.klant && x.klant.naam)}</span><span class="tab">${eur(C.totalen(x).inc)}</span></div>`).join('') || '<p class="mu">Nog geen definitieve facturen.</p>'}</div>`);
}
function maakCreditnota(id) {
  const f = S.docs.find((x) => x.id === id); if (!f) return;
  nieuwDoc('creditnota', { klant: JSON.parse(JSON.stringify(f.klant)), lijnen: JSON.parse(JSON.stringify(f.lijnen)).map((l) => Object.assign(l, { id: uid('l') })), korting: f.korting || 0, ref: { id: f.id, nr: f.nr, datum: f.datum }, opm: 'Creditnota op factuur ' + f.nr + ' van ' + dt(f.datum) + '.' });
}
function offerteNaar(type) {
  const o = curDoc();
  const extra = type === 'voorschot' ? { lijnen: [lijnNieuw({ oms: 'Voorschot volgens offerte ' + o.nr, det: '', aantal: 1, eenheid: 'forfait', prijs: C.r2(C.totalen(o).ex * 0.3) })] } : { lijnen: JSON.parse(JSON.stringify(o.lijnen)).map((l) => Object.assign(l, { id: uid('l') })) };
  if (type === 'voorschot') { const pct = C.num(prompt('Voorschot: hoeveel procent van de offerte (excl. btw)?', '30') || 0); if (!pct) return; extra.lijnen[0].prijs = C.r2(C.totalen(o).ex * pct / 100); extra.lijnen[0].btw = (o.lijnen[0] || {}).btw || S.cfg.standaardBtw; extra.lijnen[0].oms = 'Voorschot ' + pct + '% volgens offerte ' + o.nr; }
  if (o.status !== 'gefactureerd' && type === 'factuur') o.status = 'gefactureerd'; else if (o.status === 'verzonden') o.status = 'aanvaard';
  nieuwDoc(type, Object.assign({ klant: JSON.parse(JSON.stringify(o.klant)), korting: type === 'factuur' ? o.korting : 0, bron: { app: 'office', id: o.id, label: 'offerte ' + o.nr } }, extra));
}
function voorschotVerrekenen() {
  const d = curDoc(); const l = S.docs.filter((x) => x.type === 'voorschot' && x.status !== 'concept' && x.klant && (x.klant.id === d.klant.id || x.klant.naam === d.klant.naam) && !S.docs.some((y) => y.id !== d.id && (y.lijnen || []).some((ll) => ll.voorschotId === x.id)));
  if (!l.length) return alert('Geen voorschotfacturen gevonden voor deze klant.');
  modal(`<h2>Welke voorschotfactuur verrekenen?</h2>${l.map((x) => `<div class="dl" style="cursor:pointer" onclick="sluit();vsNeem('${x.id}')"><span><b>${esc(x.nr)}</b> ${dt(x.datum)}</span><span class="tab">${eur(C.totalen(x).inc)}</span></div>`).join('')}`);
}
function vsNeem(id) { const d = curDoc(); const x = S.docs.find((y) => y.id === id); C.totalen(x).groepen.forEach((g) => d.lijnen.push(lijnNieuw({ oms: 'Verrekening voorschotfactuur ' + x.nr + ' van ' + dt(x.datum), aantal: -1, eenheid: 'forfait', prijs: g.basis, btw: g.code, voorschotId: x.id }))); save(); R(); }
function betalingWeg(i) { const d = curDoc(); d.betalingen.splice(i, 1); if (d.status === 'betaald') d.status = 'open'; save(); R(); }
function betaling() {
  const d = curDoc(); const t = C.totalen(d);
  modal(`<h2>Betaling registreren</h2><div class="cols"><label class="f"><span>Datum</span><input id="bd" type="date" value="${today()}"></label><label class="f"><span>Bedrag</span><input id="bb" inputmode="decimal" value="${t.open.toFixed(2).replace('.', ',')}"></label></div>
  <label class="f"><span>Via</span><select id="bv"><option>overschrijving</option><option>bancontact / payconiq</option><option>cash</option><option>verrekening</option></select></label>
  <div class="row"><span class="sp"></span><button class="b2" onclick="sluit()">Annuleren</button><button class="gr" onclick="betalingOk()">Opslaan</button></div>`);
}
function betalingOk() { const d = curDoc(); d.betalingen = d.betalingen || []; d.betalingen.push({ datum: $('#bd').value, bedrag: C.num($('#bb').value), via: $('#bv').value }); if (C.totalen(d).open <= 0.004) d.status = 'betaald'; sluit(); save(); R(); toast('Betaling opgeslagen'); }

/* definitief maken: nummer, gestructureerde mededeling, archief (PDF + UBL) */
async function definitief() {
  const d = curDoc(); if (d.status !== 'concept') return;
  if (d.type !== 'offerte') {
    const f = RL.factuurControle(Object.assign({}, d, { vermeldingen: vermeldingen(d) }), S.cfg);
    if (f.length) return alert('Nog niet in orde:\n\n• ' + f.join('\n• '));
    // datum mag niet vóór de laatste definitieve factuur in dezelfde reeks liggen (chronologische nummering)
    const reeks = d.type === 'voorschot' ? 'factuur' : d.type;
    const laatste = S.docs.filter((x) => x.id !== d.id && x.status !== 'concept' && (x.type === d.type || (reeks === 'factuur' && isFactuur(x)))).sort((a, b) => (b.datum || '').localeCompare(a.datum || ''))[0];
    if (!S.cfg.dexxter && laatste && d.datum < laatste.datum && !confirm('Let op: de datum ligt vóór je laatste ' + reeks + ' (' + dt(laatste.datum) + '). Facturen moeten chronologisch genummerd zijn. Toch doorgaan?')) return;
  } else if (!d.klant.naam) return alert('Kies eerst een klant.');
  if (!confirm(d.type === 'offerte' ? 'Offerte afronden en een nummer geven?' : 'Definitief maken? Daarna kan de ' + TYPENAAM[d.type].toLowerCase() + ' niet meer gewijzigd worden.')) return;
  if (!d.nr || !S.cfg.dexxter || d.type === 'offerte') {
    const n = volgNr(d.type); d.nr = n.nr; S.seq[n.reeks][n.j] = n.n;
  }
  if (isFactuur(d) && !d.ogm) d.ogm = C.ogm(String(d.nr).replace(/\D/g, '').padStart(6, '0') + String(Date.now()).slice(-4));
  d.vermeldingen = vermeldingen(d);
  d.status = d.type === 'offerte' ? 'verzonden' : 'open';
  d.definitief = new Date().toISOString();
  if (d.type !== 'offerte') {
    try {
      const pdf = await VET_PDF.maak(d, S.cfg, { kopie: S.cfg.dexxter });
      const b64 = await blobB64(pdf);
      d.archief = { datum: new Date().toISOString(), pdf: 'data:application/pdf;base64,' + b64, ubl: 'data:application/xml;base64,' + btoa(unescape(encodeURIComponent(C.ubl(d, S.cfg, b64)))) };
    } catch (e) { console.error(e); toast('Archief kon niet gemaakt worden: ' + e.message); }
  }
  if (d.type === 'creditnota' && d.ref) { const f = S.docs.find((x) => x.id === d.ref.id); if (f) { f.betalingen = f.betalingen || []; f.betalingen.push({ datum: d.datum, bedrag: Math.min(C.totalen(d).inc, Math.max(0, C.totalen(f).open)), via: 'creditnota ' + d.nr, cn: d.id }); if (C.totalen(f).open <= 0.004) f.status = 'betaald'; } }
  S.log.push({ t: new Date().toISOString(), w: 'definitief', id: d.id, nr: d.nr });
  await save(); R(); toast(TYPENAAM[d.type] + ' ' + d.nr + ' is klaar');
}
const blobB64 = (blob) => new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(',')[1]); fr.readAsDataURL(blob); });
const b64Blob = (b64, type) => { const bin = atob(b64); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new Blob([u], { type }); };
async function pdfVan(d) {
  if (d.archief && d.archief.pdf && !(d.type !== 'offerte' && status(d) === 'betaald')) { const data = await (window.CLOUD ? CLOUD.file(d.archief.pdf) : d.archief.pdf); return b64Blob(String(data).split(',')[1], 'application/pdf'); }
  return VET_PDF.maak(Object.assign({}, d, { vermeldingen: d.vermeldingen || vermeldingen(d) }), S.cfg, { kopie: S.cfg.dexxter && d.type !== 'offerte', betaaldStempel: isFactuur(d) && d.status !== 'concept' && status(d) === 'betaald' });
}
async function toonPdf() {
  const d = curDoc(); toast('PDF maken…', 1200);
  const blob = await pdfVan(d); const url = URL.createObjectURL(blob);
  modal(`<div class="row" style="margin-bottom:8px"><b>${esc(VET_PDF.naam(d))}</b><span class="sp"></span><a href="${url}" download="${esc(VET_PDF.naam(d))}"><button class="b2 sm">Downloaden</button></a><button class="sm" onclick="sluit()">Sluiten</button></div><iframe class="pv" src="${url}"></iframe>`).querySelector('.c').style.maxWidth = '900px';
}
async function archiefOpen(w) {
  const d = curDoc(); const data = await (window.CLOUD ? CLOUD.file(d.archief[w]) : d.archief[w]);
  const blob = b64Blob(String(data).split(',')[1], w === 'pdf' ? 'application/pdf' : 'application/xml');
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = (w === 'pdf' ? VET_PDF.naam(d) : VET_PDF.naam(d).replace('.pdf', '.xml')); a.click();
}
function mailTekst(d) {
  const t = C.totalen(d);
  return S.cfg.mailTekst.replace('{klant}', (d.klant.naam || '').split(' ')[0]).replace('{document}', d.type === 'offerte' ? 'de offerte' : d.type === 'creditnota' ? 'de creditnota' : 'factuur').replace('{nr}', d.nr).replace('{bedrag}', eur(t.inc))
    .replace('{betaling}', isFactuur(d) ? `Graag te betalen vóór ${dt(d.verval)} op ${S.cfg.bedrijf.iban} met mededeling ${d.ogm}.` : d.type === 'offerte' ? `Deze offerte is geldig tot ${dt(d.verval)}.` : '');
}
function verstuur() {
  const d = curDoc(); const k = d.klant || {};
  const peppolKan = d.type !== 'offerte' && !!(k.peppol || C.peppolId(k.btw));
  modal(`<h2>${TYPENAAM[d.type]} ${esc(d.nr)} versturen</h2>
  ${d.type !== 'offerte' ? `<div class="c" style="background:var(--bg)"><b>Via Peppol</b> ${peppolKan ? `<span class="tag">${esc(k.peppol || C.peppolId(k.btw))}</span>` : ''}
    <p class="mu" style="margin:6px 0">${S.cfg.dexxter ? 'Uitgeschakeld in Dexxter-modus: verstuur via Dexxter.' : peppolKan ? 'Verplicht voor Belgische btw-plichtige klanten. De PDF gaat als bijlage mee.' : 'Deze klant heeft geen btw-nummer of Peppol-ID (particulier): verstuur per mail.'}</p>
    <button ${S.cfg.dexxter || !peppolKan ? 'disabled' : ''} onclick="peppolVerstuur()">Versturen via Peppol</button></div>` : ''}
  <div class="c" style="background:var(--bg)"><b>Per e-mail</b><p class="mu" style="margin:6px 0">De PDF wordt gedownload (of gedeeld op gsm); daarna opent je mailprogramma met de tekst.</p>
  <label class="f"><span>Aan</span><input id="mto" value="${esc(k.email || '')}"></label><label class="f"><span>Tekst</span><textarea id="mtx" rows="7">${esc(mailTekst(d))}</textarea></label>
  ${(d.bijlagen || []).length ? `<p class="mu">Bijlagen die meegaan: ${(d.bijlagen || []).map((b) => esc(b.naam)).join(', ')}</p>` : ''}
  ${S.cfg.mailActief ? `<label class="row" style="gap:8px;margin-bottom:8px"><input id="mdirect" type="checkbox" checked style="width:auto;margin:0"> Rechtstreeks versturen vanaf ${esc(S.cfg.mailVan || S.cfg.bedrijf.email)} (met alle bijlagen)</label>` : `<p class="mu">Tip: stel "Mail" in bij Instellingen om rechtstreeks te mailen met alle bijlagen.</p>`}
  <button class="b2" onclick="mailVerstuur()">Mail versturen / klaarzetten</button></div>
  <div class="row"><span class="sp"></span><button class="b2" onclick="markVerzonden()">Markeer als verzonden</button><button onclick="sluit()">Sluiten</button></div>`);
}
function markVerzonden() { const d = curDoc(); d.verzonden = new Date().toISOString(); save(); sluit(); R(); }
async function bijlageDoc(f) { if (!f) return; const d = curDoc(); d.bijlagen = d.bijlagen || []; d.bijlagen.push({ naam: f.name, ref: await bestandData(f), soort: 'bijlage' }); save(); R(); }
async function bijlageBestanden(d) { const out = []; for (const b of (d.bijlagen || [])) { try { const data = await (window.CLOUD ? CLOUD.file(b.ref) : b.ref); const mime = String(data).slice(5, String(data).indexOf(';')); out.push({ naam: b.naam, b64: String(data).split(',')[1], mime, file: new File([b64Blob(String(data).split(',')[1], mime)], b.naam, { type: mime }) }); } catch (e) { console.warn(e); } } return out; }
async function mailVerstuur() {
  const d = curDoc(); const blob = await pdfVan(d); const file = new File([blob], VET_PDF.naam(d), { type: 'application/pdf' }); const extra = await bijlageBestanden(d); const files = [file, ...extra.map((x) => x.file)];
  const to = $('#mto').value, tx = $('#mtx').value, onderwerp = TYPENAAM[d.type] + ' ' + d.nr + ' – ' + S.cfg.bedrijf.naam;
  if (S.cfg.mailActief && $('#mdirect') && $('#mdirect').checked) {
    try { toast('Mail versturen…', 3000); const r = await CLOUD.call('vet-mail', { to, subject: onderwerp, text: tx, attachments: [{ filename: file.name, content: await blobB64(blob) }, ...extra.map((x) => ({ filename: x.naam, content: x.b64 }))] }); if (r.error) throw new Error(r.error); d.verzonden = new Date().toISOString(); d.mail = { naar: to, datum: d.verzonden, id: r.id || '' }; save(); sluit(); R(); toast('Mail verstuurd ✓'); return; } catch (e) { return alert('Mail versturen mislukt: ' + e.message); }
  }
  try { if (navigator.canShare && navigator.canShare({ files }) && /Android|iPhone|iPad/i.test(navigator.userAgent)) { await navigator.share({ files, title: onderwerp, text: tx }); d.verzonden = new Date().toISOString(); save(); sluit(); R(); return; } } catch (e) { if (e.name === 'AbortError') return; }
  files.forEach((f, i) => setTimeout(() => { const a = document.createElement('a'); a.href = URL.createObjectURL(f); a.download = f.name; a.click(); }, i * 400));
  setTimeout(() => { location.href = 'mailto:' + encodeURIComponent(to) + '?subject=' + encodeURIComponent(onderwerp) + '&body=' + encodeURIComponent(tx + '\n\n(In bijlage: ' + files.map((f) => f.name).join(', ') + ')'); }, 600 + files.length * 400);
  d.verzonden = new Date().toISOString(); save(); sluit(); R();
}

/* ---------------- klanten ---------------- */
function vKlanten() {
  const q = filt.q.toLowerCase();
  const l = S.klanten.filter((k) => !q || [k.n, k.straat, k.pc, k.tel, k.mail, (S.klantx[k.id] || {}).btw].join(' ').toLowerCase().includes(q)).sort((a, b) => (a.n || '').localeCompare(b.n || ''));
  return `<div class="row wrap" style="margin-bottom:12px"><h1 style="margin:0">Klanten</h1><span class="sp"></span>${RO ? '' : `<button onclick="klantNieuw()">+ Klant</button>`}</div>
  <input style="max-width:320px" placeholder="Zoeken…" value="${esc(filt.q)}" oninput="filt.q=this.value;clearTimeout(window._ft);window._ft=setTimeout(R,250)">
  <p class="mu">Klanten worden gedeeld met VET Heat en VET Work.</p>
  <div class="c" style="padding:0;overflow:auto"><table class="t"><tr><th>Naam</th><th>Adres</th><th>Btw</th><th class="r">Gefactureerd</th></tr>
  ${l.map((k) => { const x = S.klantx[k.id] || {}; const om = S.docs.filter((d) => d.klant && d.klant.id === k.id && isFactuur(d) && d.status !== 'concept').reduce((s, d) => s + C.totalen(d).ex, 0); return `<tr class="cl" onclick="go('klant','${k.id}')"><td><b>${esc(k.n)}</b></td><td>${esc([k.straat, k.pc].filter(Boolean).join(', '))}</td><td class="nw">${esc(x.btw ? C.fmtBtw(x.btw) : '')}</td><td class="r tab">${om ? eur(om) : ''}</td></tr>`; }).join('') || '<tr><td colspan="4" class="mu">Nog geen klanten.</td></tr>'}</table></div>`;
}
function klantNieuw() { const k = { id: uid('c'), n: '', straat: '', pc: '', adres: '', tel: '', mail: '' }; S.klanten.push(k); save(); go('klant', k.id); }
function vKlant() {
  const k = S.klanten.find((x) => x.id === cur); if (!k) return 'Niet gevonden';
  const i = S.klanten.indexOf(k); S.klantx[k.id] = S.klantx[k.id] || {}; const x = S.klantx[k.id];
  const terug = sub.startsWith('terug:') ? sub.slice(6) : '';
  const docs = S.docs.filter((d) => d.klant && d.klant.id === k.id);
  const jobs = EXT.jobs.filter((j) => j.cid === k.id || (j.klant && j.klant.n === k.n));
  return `<div class="row" style="margin-bottom:10px"><button class="lnk" onclick="${terug ? `klantTerug('${terug}')` : `go('klanten')`}">‹ ${terug ? 'Terug naar document' : 'Klanten'}</button><span class="sp"></span>${RO ? '' : `<button class="b2" onclick="nieuwDoc('offerte',{klant:klantSnapshot(S.klanten.find(x=>x.id==='${k.id}'))})">+ Offerte</button><button onclick="nieuwDoc('factuur',{klant:klantSnapshot(S.klanten.find(x=>x.id==='${k.id}'))})">+ Factuur</button>`}</div>
  <h1>${esc(k.n || 'Nieuwe klant')}</h1>
  <div class="cols"><div class="c"><h2>Contact</h2>
    ${inp('Naam / bedrijfsnaam', `S.klanten.${i}.n`)}${inp('t.a.v. (optioneel)', `S.klantx.${k.id}.tav`)}${inp('Straat + nr', `S.klanten.${i}.straat`)}${inp('Postcode + gemeente (bv. 2000 Antwerpen)', `S.klanten.${i}.pc`)}
    <div class="cols">${inp('Telefoon', `S.klanten.${i}.tel`)}${inp('E-mail', `S.klanten.${i}.mail`)}</div></div>
  <div class="c"><h2>Facturatie</h2>
    ${inp('Soort klant', `S.klantx.${k.id}.type`, { sel: [['particulier', 'Particulier'], ['bedrijf', 'Bedrijf (btw-plichtig)'], ['aannemer', 'Aannemer – btw verleggen (onderaanneming)']], re: 1 })}
    ${inp('Btw-nummer', `S.klantx.${k.id}.btw`, { ph: 'BE0123456789' })}
    ${x.btw && C.isBEbtw(x.btw) && !C.checkBEbtw(x.btw) ? '<p class="mu" style="color:var(--rd)">⚠ Dit Belgisch btw-nummer klopt niet (controlegetal).</p>' : ''}
    ${inp('Peppol-ID', `S.klantx.${k.id}.peppol`, { ph: x.btw ? C.peppolId(x.btw) : '0208:0123456789' })}
    <div class="row" style="margin-bottom:8px"><button class="b2 sm" onclick="peppolCheck('${k.id}')">Controleer Peppol</button><span class="mu" id="pc_${k.id}">${esc(x.peppolOk || '')}</span></div>
    ${inp('Factuur-e-mail (indien anders)', `S.klantx.${k.id}.email`)}
    ${x.type === 'aannemer' ? '<p class="mu">Nieuwe lijnen voor deze klant krijgen automatisch "Verlegd". Peppol is verplicht.</p>' : ''}
  </div></div>
  ${window.klantDossier ? klantDossier(k) : ''}${window.klantDossier ? '' : docs.length ? `<div class="c"><h2>Documenten</h2>${docs.map((d) => `<div class="dl" style="cursor:pointer" onclick="go('doc','${d.id}')"><span>${TYPENAAM[d.type]} <b>${esc(d.nr || 'concept')}</b> · ${dt(d.datum)}</span><span class="row">${eur(C.totalen(d).inc)} ${tagSt(d)}</span></div>`).join('')}</div>` : ''}
  ${!window.klantDossier && jobs.length ? `<div class="c"><h2>Onderhoudsattesten (VET Heat)</h2>${jobs.map((j) => `<div class="dl"><span>${esc(j.nr)} · ${dt(j.datum)}</span><span class="mu">volgende: ${esc(volgendeControle(j) ? dt(volgendeControle(j)) : '—')}</span></div>`).join('')}</div>` : ''}
  ${RO ? '' : `<button class="red" onclick="klantWeg('${k.id}')">Klant verwijderen</button>`}`;
}
function klantTerug(id) { const d = S.docs.find((x) => x.id === id); const k = S.klanten.find((x) => x.id === (d.klant || {}).id); if (d && k && d.status === 'concept') { d.klant = klantSnapshot(k); if ((S.klantx[k.id] || {}).type === 'aannemer') d.lijnen.forEach((l) => l.btw = 'VERL'); save(); } go('doc', id); }
function klantWeg(id) { if (S.docs.some((d) => d.klant && d.klant.id === id && d.status !== 'concept')) return alert('Deze klant heeft definitieve documenten en kan niet verwijderd worden.'); if (!confirm('Klant verwijderen (ook in VET Heat en VET Work)?')) return; S.klanten = S.klanten.filter((k) => k.id !== id); delete S.klantx[id]; window.CLOUD && CLOUD.markDeleted('shared', 'client', id); save(); go('klanten'); }
