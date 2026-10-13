/* VET Office – versie 3: aanvraag → werkbon, betalingsherinneringen, onderhoudsherinneringen, maandelijkse back-up */

/* ---------------- regels betalingsherinneringen (België) ----------------
 * Consument (B2C): Boek XIX WER (wet 4 mei 2022). Eerste herinnering kosteloos, minstens 14 kalenderdagen
 *   om te betalen (per mail: vanaf de dag na verzending; per post: vanaf de 3e werkdag na verzending).
 *   Pas daarna schadebeding + interest. Schadebeding max.: ≤ € 150: € 20; € 150,01–500: € 30 + 10% boven € 150;
 *   > € 500: € 65 + 5% boven € 500, max. € 2.000. Interest max. de rentevoet betalingsachterstand.
 * Onderneming (B2B): wet 2 augustus 2002. Van rechtswege interest vanaf de dag na de vervaldag + forfait € 40.
 * Rentevoet betalingsachterstand handelstransacties: 10,5% (1e semester 2026, FOD Financiën). Controleer elk semester.
 */
RL.herinnering = RL.herinnering || { termijn: 14, rente: 10.5, renteBron: 'FOD Financiën, 1e semester 2026', forfaitB2B: 40, schadeMax: 2000 };
const HR = () => Object.assign({}, RL.herinnering, S.cfg.herinnering || {});
function schadebeding(saldo) {
  const s = C.r2(saldo); if (s <= 0) return 0;
  const x = s <= 150 ? 20 : s <= 500 ? 30 + 0.10 * (s - 150) : 65 + 0.05 * (s - 500);
  return C.r2(Math.min(x, HR().schadeMax));
}
const dagenTussen = (a, b) => Math.max(0, Math.round((new Date(b) - new Date(a)) / 864e5));
function werkdagenNa(d, n) { let x = new Date(d); while (n > 0) { x.setDate(x.getDate() + 1); if (x.getDay() !== 0 && x.getDay() !== 6) n--; } return x.toISOString().slice(0, 10); }
const isB2B = (d) => !!(d.klant && d.klant.btw);
function herinnerKan(d) { return !RO && isFactuur(d) && d.type !== 'creditnota' && d.status !== 'concept' && !afgehandeld(d) && d.verval && d.verval < today(); }
function herinnerVoorstel(d) {
  const t = C.totalen(d), open = C.r2(t.open), h = d.herinneringen || [], eerste = h[0], nu = today(), r = HR();
  const b2b = isB2B(d);
  let niveau = h.length ? 'aanmaning' : 'herinnering';
  let kostenMag = false, schade = 0, rente = 0, renteVanaf = '', uitleg = '';
  if (b2b) {
    kostenMag = true; renteVanaf = C.addDays(d.verval, 1);
    rente = C.r2(open * r.rente / 100 * dagenTussen(d.verval, nu) / 365); schade = r.forfaitB2B;
    uitleg = 'Zakelijke klant: interest (' + String(r.rente).replace('.', ',') + '%) vanaf de dag na de vervaldag en een forfait van € ' + r.forfaitB2B + ' zijn van rechtswege verschuldigd.';
  } else if (eerste) {
    const eind = eerste.termijnTot || C.addDays(eerste.datum, r.termijn);
    if (nu > eind) { kostenMag = true; renteVanaf = C.addDays(eind, 1); schade = schadebeding(open); rente = C.r2(open * r.rente / 100 * dagenTussen(eind, nu) / 365); uitleg = 'De termijn van de eerste herinnering liep af op ' + dt(eind) + ': schadebeding en interest volgens je algemene voorwaarden (binnen de wettelijke maxima).'; }
    else uitleg = 'De termijn van de eerste herinnering loopt nog tot ' + dt(eind) + '. Pas daarna mogen kosten aangerekend worden.';
  } else uitleg = 'Particulier: de eerste herinnering is gratis, met minstens ' + r.termijn + ' dagen om te betalen. Kosten kan je pas vragen na die termijn.';
  return { open, b2b, niveau, kostenMag, schade, rente, renteVanaf, uitleg, nr: h.length + 1 };
}
function herinnerTekst(d, v, kosten, post) {
  const b = S.cfg.bedrijf, r = HR(), naam = (d.klant.naam || '').split(' ')[0];
  const tot = post ? werkdagenNa(today(), 3) : today(); const termijnTot = C.addDays(tot, r.termijn);
  const lijn1 = ((d.lijnen || [])[0] || {}).oms || '';
  const extra = kosten ? C.r2(v.schade + v.rente) : 0;
  const L = [];
  L.push('Dag ' + naam + ',', '');
  if (v.niveau === 'herinnering') L.push('Bij nazicht van onze boekhouding merkte ik dat factuur ' + d.nr + ' van ' + dt(d.datum) + (lijn1 ? ' (' + lijn1 + ')' : '') + ' nog niet (volledig) betaald is. De vervaldag was ' + dt(d.verval) + '.', '', 'Waarschijnlijk is dit aan uw aandacht ontsnapt. Mag ik u vragen het openstaande bedrag van ' + eur(v.open) + ' te betalen vóór ' + dt(termijnTot) + '?');
  else L.push('Ondanks mijn herinnering van ' + dt((d.herinneringen || [])[0].datum) + ' staat factuur ' + d.nr + ' van ' + dt(d.datum) + (lijn1 ? ' (' + lijn1 + ')' : '') + ' nog open. De vervaldag was ' + dt(d.verval) + '.', '', 'Openstaand bedrag: ' + eur(v.open) + (extra ? '\n' + (v.b2b ? 'Forfaitaire vergoeding (wet 2 augustus 2002): ' : 'Schadebeding (algemene voorwaarden): ') + eur(v.schade) + '\nInterest ' + String(r.rente).replace('.', ',') + '% vanaf ' + dt(v.renteVanaf) + ': ' + eur(v.rente) + '\nTotaal te betalen: ' + eur(C.r2(v.open + extra)) : ''), '', 'Ik vraag u dit bedrag te betalen vóór ' + dt(termijnTot) + '.' + (v.nr > 2 ? ' Zonder betaling binnen deze termijn draag ik het dossier over voor invordering.' : ''));
  L.push('', 'Rekening: ' + b.iban + (b.bic ? ' (BIC ' + b.bic + ')' : ''), 'Gestructureerde mededeling: ' + (d.ogm || d.nr));
  if (v.niveau === 'herinnering' && !v.b2b) L.push('', 'Gebeurt de betaling niet binnen deze termijn, dan kan een schadebeding van ' + eur(schadebeding(v.open)) + ' en interest aan ' + String(r.rente).replace('.', ',') + '% per jaar aangerekend worden, zoals vermeld in onze algemene voorwaarden.');
  if (v.niveau === 'herinnering' && v.b2b) L.push('', 'Volgens de wet van 2 augustus 2002 zijn bij laattijdige betaling interest (' + String(r.rente).replace('.', ',') + '%) vanaf de vervaldag en een forfaitaire vergoeding van € ' + r.forfaitB2B + ' verschuldigd. Bij betaling binnen bovenstaande termijn reken ik die niet aan.');
  L.push('', 'Heeft u intussen al betaald? Dan mag u deze mail als niet verzonden beschouwen.', '', 'Groetjes,', b.persoon || b.naam, b.naam + ' · ondernemingsnr. ' + C.fmtBtw(b.btw).replace(/^BE\s?/, ''), b.tel || '');
  return { tekst: L.join('\n'), termijnTot, extra };
}
function herinnering() {
  const d = curDoc(); const v = herinnerVoorstel(d); window._hv = v;
  const k = d.klant || {};
  const m = modal(`<h2>${v.niveau === 'herinnering' ? 'Betalingsherinnering' : v.nr > 2 ? 'Laatste aanmaning' : 'Aanmaning'} – factuur ${esc(d.nr)}</h2>
  <div class="ban ${v.kostenMag ? 'o' : 'b'}" style="margin:0 0 10px">${esc(v.uitleg)}</div>
  <div class="cols"><label class="f"><span>Aan</span><input id="hto" value="${esc(k.email || '')}"></label>
  <label class="f"><span>Verzending</span><select id="hpost" onchange="herinnerVernieuw()"><option value="">Per e-mail (termijn start de dag erna)</option><option value="1">Per post (termijn start na 3 werkdagen)</option></select></label></div>
  ${v.kostenMag ? `<label class="row" style="gap:8px;margin-bottom:8px"><input id="hkost" type="checkbox" ${v.niveau === 'aanmaning' ? 'checked' : ''} style="width:auto;margin:0" onchange="herinnerVernieuw()"> Kosten aanrekenen: ${v.b2b ? 'forfait' : 'schadebeding'} ${eur(v.schade)} + interest ${eur(v.rente)}</label>` : ''}
  <label class="f"><span>Tekst</span><textarea id="htx" rows="16"></textarea></label>
  <p class="mu">De factuur gaat als PDF mee. Rentevoet ${String(HR().rente).replace('.', ',')}% (${esc(HR().renteBron)}).</p>
  <div class="row wrap"><span class="sp"></span><button class="b2" onclick="herinnerGedaan(false)">Enkel registreren</button><button onclick="herinnerGedaan(true)">${S.cfg.mailActief ? 'Versturen' : 'Mail klaarzetten'}</button></div>`);
  m.querySelector('.c').style.maxWidth = '760px'; herinnerVernieuw();
}
function herinnerVernieuw() { const d = curDoc(); const x = herinnerTekst(d, window._hv, !!($('#hkost') && $('#hkost').checked), !!$('#hpost').value); $('#htx').value = x.tekst; window._ht = x; }
async function herinnerGedaan(mail) {
  const d = curDoc(), v = window._hv, x = window._ht, to = $('#hto').value.trim(), tx = $('#htx').value, post = !!$('#hpost').value;
  const onderwerp = (v.niveau === 'herinnering' ? 'Herinnering' : 'Aanmaning') + ' factuur ' + d.nr + ' – ' + S.cfg.bedrijf.naam;
  const rec = { datum: today(), niveau: v.niveau, via: post ? 'post' : 'mail', termijnTot: x.termijnTot, kosten: x.extra || 0, naar: to };
  if (mail && !post) {
    if (!to) return alert('Vul een e-mailadres in.');
    const blob = await pdfVan(d); const file = new File([blob], VET_PDF.naam(d), { type: 'application/pdf' });
    if (S.cfg.mailActief) {
      try { toast('Versturen…', 3000); const r = await CLOUD.call('vet-mail', { to, subject: onderwerp, text: tx, attachments: [{ filename: file.name, content: await blobB64(blob) }] }); if (r.error) throw new Error(r.error); rec.id = r.id || ''; }
      catch (e) { return alert('Versturen mislukt: ' + e.message); }
    } else {
      const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = file.name; a.click();
      setTimeout(() => { location.href = 'mailto:' + encodeURIComponent(to) + '?subject=' + encodeURIComponent(onderwerp) + '&body=' + encodeURIComponent(tx + '\n\n(In bijlage: ' + file.name + ')'); }, 700);
    }
  }
  if (post && mail) { const w = window.open('', '_blank'); if (w) { w.document.write('<pre style="font:14px/1.5 sans-serif;white-space:pre-wrap;max-width:700px;margin:40px auto">' + esc(S.cfg.bedrijf.naam + '\n' + S.cfg.bedrijf.straat + '\n' + S.cfg.bedrijf.pc + ' ' + S.cfg.bedrijf.gemeente + '\n\n' + (d.klant.naam || '') + '\n' + (d.klant.straat || '') + '\n' + [d.klant.pc, d.klant.gemeente].filter(Boolean).join(' ') + '\n\n' + today() + '\n\n' + tx) + '</pre>'); w.document.close(); w.print(); } }
  d.herinneringen = (d.herinneringen || []).concat(rec); S.log.push({ t: new Date().toISOString(), w: 'herinnering', id: d.id, nr: d.nr, niveau: v.niveau });
  sluit(); save(); R(); toast(v.niveau === 'herinnering' ? 'Herinnering geregistreerd' : 'Aanmaning geregistreerd');
}
function vHerHist(d) {
  const h = d.herinneringen || []; if (!h.length) return '';
  return `<div class="c"><h2>Herinneringen</h2>${h.map((x, i) => `<div class="dl"><span>${dt(x.datum)} · ${esc(x.niveau)} · ${esc(x.via)}${x.naar ? ' naar ' + esc(x.naar) : ''}${x.kosten ? ' · kosten ' + eur(x.kosten) : ''}</span><span class="row"><span class="mu">betalen vóór ${dt(x.termijnTot)}</span>${RO ? '' : `<button class="lnk" title="Verwijderen" onclick="curDoc().herinneringen.splice(${i},1);save();R()">✕</button>`}</span></div>`).join('')}</div>`;
}

/* ---------------- aanvraag → werkbon in VET Work ---------------- */
function aanvraagKlantVan(a) {
  const m = String(a.adres || '').match(/^(.*?)[,\s]+(\d{4}\s+.+)$/);
  let k = S.klanten.find((c) => c.tel && a.tel && c.tel.replace(/\D/g, '').slice(-9) === a.tel.replace(/\D/g, '').slice(-9));
  if (!k && a.naam) k = S.klanten.find((c) => (c.n || '').trim().toLowerCase() === a.naam.trim().toLowerCase());
  if (!k) { k = { id: uid('c'), n: a.naam || a.tel || 'Onbekend', straat: m ? m[1] : (a.adres || ''), pc: m ? m[2] : '', adres: a.adres || '', tel: a.tel || '', mail: a.mail || '' }; S.klanten.push(k); }
  else { if (!k.mail && a.mail) k.mail = a.mail; if (!k.tel && a.tel) k.tel = a.tel; if (!k.straat && a.adres) { k.straat = m ? m[1] : a.adres; k.pc = m ? m[2] : ''; k.adres = a.adres; } }
  return k;
}
function aanvraagWerkbon(id) {
  if (!CLOUD.session()) return alert('Log eerst in bij Cloud (Instellingen) om werkbonnen naar VET Work te sturen.');
  const a = EXT.aanvragen.find((x) => x.id === id); if (!a) return;
  const st = S.aanvraagSt[id] = S.aanvraagSt[id] || {};
  if (st.wb && !confirm('Er werd al een werkbon gemaakt op ' + dt(st.wb.d) + '. Nog een werkbon maken?')) return;
  const k = aanvraagKlantVan(a);
  const o = {
    id: 's' + Date.now().toString(36), nr: '', datum: today(), klant: k.n, adres: k.adres || [k.straat, k.pc].filter(Boolean).join(', '), tel: k.tel || a.tel || '', mail: k.mail || a.mail || '',
    omschr: [a.toestel, a.probleem].filter(Boolean).join(' – ') || 'Aanvraag via VET Secretaris',
    t: [], werk: [], opm: ['Aanvraag via ' + (a.bron || 'VET Secretaris') + ' op ' + String(a.ontvangen || '').replace('T', ' ').slice(0, 16), a.bericht && a.bericht !== a.probleem ? 'Bericht: ' + a.bericht : ''].filter(Boolean).join('\n'),
    fotos: [], sig: '', sigNaam: k.n, status: 'open', od: { ja: 0, t: '' }, sm: 0, btw: '', pr: 0, src: { app: 'secretaris', id }
  };
  S.werkUit = (S.werkUit || []).concat(o); st.wb = { id: o.id, d: today() }; if (!st.st || st.st === 'nieuw' || st.st === 'gebeld') st.st = 'ingepland';
  save(); R(); CLOUD.sync(); toast('Werkbon staat klaar in VET Work');
}

/* ---------------- onderhoudsherinnering (klanten uit VET Heat) ---------------- */
const ONDH_TEKST = 'Dag {naam},\n\nVolgens mijn gegevens is uw {toestel} op {adres} binnenkort weer aan onderhoud toe. Het vorige onderhoud was op {vorige}.\n\nZal ik een afspraak inplannen? Laat gerust weten welke dagen u passen, dan stel ik een moment voor.\n\nGroetjes,\n{ik}\n{bedrijf}\n{tel}';
function ondhTekst(j) {
  const b = S.cfg.bedrijf, k = j.klant || {}, toestel = [j.toestel && j.toestel.merk, j.toestel && j.toestel.type].filter(Boolean).join(' ');
  return (S.cfg.onderhoudTekst || ONDH_TEKST).replace('{naam}', (k.n || '').split(' ')[0]).replace('{toestel}', toestel ? 'verwarmingstoestel (' + toestel + ')' : 'verwarmingstoestel')
    .replace('{adres}', [k.straat, k.pc].filter(Boolean).join(', ') || 'uw adres').replace('{vorige}', dt(j.datum)).replace('{volgende}', dt(volgendeControle(j)))
    .replace('{ik}', b.persoon || b.naam).replace('{bedrijf}', b.naam).replace('{tel}', b.tel || '');
}
const ondhMail = (j) => (j.klant && j.klant.mail) || (S.klanten.find((c) => (c.n || '').trim().toLowerCase() === ((j.klant || {}).n || '').trim().toLowerCase()) || {}).mail || '';
const ONDH_ONDERWERP = () => 'Jaarlijks onderhoud verwarming – ' + S.cfg.bedrijf.naam;
// recentste attest per adres (een oud attest van hetzelfde toestel telt niet meer)
function laatsteAttesten() { const m = {}; EXT.jobs.forEach((j) => { const k = ((j.klant || {}).n + '|' + (j.klant || {}).straat).toLowerCase(); if (!m[k] || (j.datum || '') > (m[k].datum || '')) m[k] = j; }); return Object.values(m); }
async function ondhStuur(ids) {
  const l = ids.map((id) => EXT.jobs.find((j) => j.id === id)).filter((j) => j && ondhMail(j));
  if (!l.length) return alert('Geen klanten met e-mailadres geselecteerd.');
  if (!S.cfg.mailActief) { const j = l[0]; location.href = 'mailto:' + encodeURIComponent(ondhMail(j)) + '?subject=' + encodeURIComponent(ONDH_ONDERWERP()) + '&body=' + encodeURIComponent(ondhTekst(j)); S.onderhoudMail[j.id] = today(); save(); setTimeout(R, 500); return; }
  if (!confirm(l.length + ' herinnering' + (l.length > 1 ? 'en' : '') + ' versturen?')) return;
  let ok = 0; for (const j of l) { try { const r = await CLOUD.call('vet-mail', { to: ondhMail(j), subject: ONDH_ONDERWERP(), text: ondhTekst(j) }); if (r.error) throw new Error(r.error); S.onderhoudMail[j.id] = today(); ok++; } catch (e) { alert('Mislukt voor ' + (j.klant || {}).n + ': ' + e.message); break; } }
  save(); R(); toast(ok + ' verstuurd');
}
function ondhTekstAanpassen() {
  modal(`<h2>Tekst onderhoudsherinnering</h2><p class="mu">Vervangen: {naam} {toestel} {adres} {vorige} {volgende} {ik} {bedrijf} {tel}</p>
  <textarea id="ondtx" rows="14">${esc(S.cfg.onderhoudTekst || ONDH_TEKST)}</textarea>
  <div class="row"><button class="b2" onclick="$('#ondtx').value=ONDH_TEKST">Standaard</button><span class="sp"></span><button onclick="S.cfg.onderhoudTekst=$('#ondtx').value;save();sluit();toast('Opgeslagen')">Opslaan</button></div>`);
}

/* ---------------- maandelijkse back-up in de cloud ---------------- */
let BACKUPS = null, BACKUP_BEZIG = false;
const backupMaand = () => today().slice(0, 7);
async function backupMaak(stil) {
  if (BACKUP_BEZIG || RO || !window.CLOUD || !CLOUD.session()) return;
  BACKUP_BEZIG = true; if (!stil) toast('Back-up maken…', 4000);
  try {
    const zip = new JSZip(); const j = new Date().getFullYear();
    zip.file('vet-office-data.json', JSON.stringify(S));
    zip.file('vet-apps-data.json', JSON.stringify({ attesten: EXT.jobs, werkbonnen: EXT.orders, aanvragen: EXT.aanvragen }));
    zip.file('LEESMIJ.txt', 'Back-up VET Office van ' + today() + '.\n- vet-office-data.json: volledige administratie (terugzetten via Instellingen › Cloud & back-up › Back-up terugzetten).\n- ' + j + (new Date().getMonth() < 3 ? ' en ' + (j - 1) : '') + ': facturen (PDF + UBL), aankopen met bijlagen en btw-roosters per kwartaal.\nFoto\'s en PDF\'s in de JSON staan als verwijzing naar de cloudopslag (vf:...).\n');
    if (new Date().getMonth() < 3) await boekhoudingInZip(zip, j - 1); // tot de jaarafsluiting ook vorig jaar
    await boekhoudingInZip(zip, j);
    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
    await CLOUD.upload('backup/vet-office-' + backupMaand() + '.zip', blob, 'application/zip');
    S.backupLaatst = { maand: backupMaand(), datum: new Date().toISOString(), grootte: blob.size }; await save();
    await backupOpruimen(); BACKUPS = null;
    if (!stil) { toast('Back-up opgeslagen in de cloud ✓'); R(); }
  } catch (e) { console.warn('back-up', e); if (!stil) alert('Back-up mislukt: ' + e.message); }
  BACKUP_BEZIG = false;
}
// bewaren: de laatste 12 maanden + per jaar de laatste back-up (10 jaar)
async function backupOpruimen() {
  const l = (await CLOUD.list('backup/')).map((x) => x.name).filter((n) => /^vet-office-\d{4}-\d{2}\.zip$/.test(n)).sort().reverse();
  const houden = new Set(l.slice(0, 12)); const perJaar = {}; l.forEach((n) => { const y = n.slice(11, 15); if (!perJaar[y]) perJaar[y] = n; }); Object.values(perJaar).forEach((n) => houden.add(n));
  const weg = l.filter((n) => !houden.has(n)).map((n) => 'backup/' + n); if (weg.length) await CLOUD.remove(weg);
}
function backupAuto() { if (!RO && window.CLOUD && CLOUD.session() && (!S.backupLaatst || S.backupLaatst.maand !== backupMaand())) backupMaak(true); }
async function backupLijst() { try { BACKUPS = (await CLOUD.list('backup/')).filter((x) => /\.zip$/.test(x.name)); } catch (e) { BACKUPS = { fout: e.message }; } if (v === 'instellingen') R(); }
async function backupDownload(n) { toast('Downloaden…', 2000); const blob = await CLOUD.download('backup/' + n); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = n; a.click(); }
function vBackupCloud() {
  if (!window.CLOUD || !CLOUD.session() || RO) return '';
  if (BACKUPS === null) { BACKUPS = []; backupLijst(); }
  const b = S.backupLaatst;
  return `<div class="c"><h2>Automatische back-up (cloud)</h2><p class="mu">Elke maand maakt VET Office zelf een zip met je volledige administratie, alle facturen (PDF + UBL), aankopen en btw-roosters, en zet die in je beveiligde cloudopslag. Bewaard: de laatste 12 maanden + per jaar de laatste (voor de 10 jaar bewaarplicht). Download er af en toe een naar je eigen computer of een externe schijf: een back-up op één plek is geen echte back-up.</p>
  <div class="row wrap" style="margin-bottom:8px"><button class="b2" onclick="backupMaak()">Nu een back-up maken</button><span class="mu">${b ? 'Laatste: ' + esc(String(b.datum).replace('T', ' ').slice(0, 16)) + ' (' + (b.grootte / 1048576).toFixed(1) + ' MB)' : 'Nog geen back-up.'}</span></div>
  ${BACKUPS && BACKUPS.fout ? `<p class="mu" style="color:var(--rd)">${esc(BACKUPS.fout)}</p>` : (BACKUPS || []).map((x) => `<div class="dl"><span>${esc(x.name)}</span><span class="row"><span class="mu">${x.metadata && x.metadata.size ? (x.metadata.size / 1048576).toFixed(1).replace('.', ',') + ' MB' : ''}</span><button class="lnk sm" onclick="backupDownload('${esc(x.name)}')">Downloaden</button></span></div>`).join('')}</div>`;
}
setTimeout(backupAuto, 30000); setInterval(backupAuto, 3600000);
const ondhOpen = () => laatsteAttesten().filter((j) => { const n = volgendeControle(j); return n && n <= C.addDays(today(), 60) && !S.onderhoudMail[j.id] && ondhMail(j); });
