/* VET Office – cloud (Supabase): synchronisatie met VET Heat, VET Work en VET Secretaris, Peppol, bank en boekhouder-toegang */
let CS = { state: 'uit' };
let EIGENAAR = null; // id van de administratie die een boekhouder bekijkt
const sharedVan = (k) => ({ n: k.n || '', straat: k.straat || '', pc: k.pc || '', adres: k.adres || [k.straat, k.pc].filter(Boolean).join(', '), tel: k.tel || '', mail: k.mail || '', inst: k.inst || null });

const CLOUD = VETSync.create({
  app: 'office',
  pullApps: ['office', 'shared', 'work', 'heat', 'secretaris'],
  owner: () => EIGENAAR,
  readOnly: () => RO,
  noFiles: (r) => ['heat', 'work', 'secretaris'].includes(r.app) || (r.app === 'office' && ['doc', 'peppolin', 'uitgave'].includes(r.kind)),
  collect() {
    const out = [];
    S.docs.forEach((d) => out.push({ app: 'office', kind: 'doc', id: d.id, data: d }));
    (S.uitgaven || []).forEach((u) => out.push({ app: 'office', kind: 'uitgave', id: u.id, data: u }));
    (S.peppolIn || []).forEach((p) => out.push({ app: 'office', kind: 'peppolin', id: p.id, data: p }));
    (S.bank.tx || []).forEach((t) => out.push({ app: 'office', kind: 'banktx', id: t.id, data: t }));
    Object.entries(S.klantx || {}).forEach(([id, x]) => { if (x && Object.keys(x).length) out.push({ app: 'office', kind: 'klantx', id, data: x }); });
    S.klanten.forEach((k) => out.push({ app: 'shared', kind: 'client', id: k.id, data: sharedVan(k) }));
    Object.entries(S.veka || {}).forEach(([id, x]) => out.push({ app: 'shared', kind: 'veka', id, data: x }));
    if (S.artikelsKlaar || (S.artikels || []).length) { S.artikelsKlaar = true; } if (S.artikelsKlaar) out.push({ app: 'shared', kind: 'articles', id: 'main', data: { list: (S.artikels || []).map(artikelShared) } });
    (S.werkUit || []).forEach((o) => out.push({ app: 'work', kind: 'order', id: o.id, data: o })); // nieuwe werkbonnen voor VET Work (nummer geeft Work)
    Object.entries(S.aanvraagUit || {}).forEach(([id, u]) => { const a = EXT.aanvragen.find((x) => x.id === id); if (a && !u.ok && !S.aanvraagWeg[id]) { const d = Object.assign({}, a, { status: u.status, statusDoor: 'office' }); delete d.id; out.push({ app: 'secretaris', kind: 'aanvraag', id, data: d }); } });
    out.push({ app: 'office', kind: 'settings', id: 'main', data: { cfg: S.cfg, seq: S.seq, artikels: S.artikels, aang: S.aang, bel: S.bel, aanvraagSt: S.aanvraagSt, aanvraagWeg: S.aanvraagWeg, onderhoudMail: S.onderhoudMail, bank: { rek: S.bank.rek, koppeling: S.bank.koppeling }, invest: S.invest, wagens: S.wagens, verz: S.verz, ic: S.ic, log: (S.log || []).slice(-300) } });
    return out;
  },
  async apply(rows) {
    for (const r of rows) {
      const del = r.deleted, d = r.data;
      if (r.app === 'office') {
        const lijst = { doc: 'docs', uitgave: 'uitgaven', peppolin: 'peppolIn' }[r.kind];
        if (lijst) { S[lijst] = S[lijst] || []; const i = S[lijst].findIndex((x) => x.id === r.id); if (del) { if (i > -1) S[lijst].splice(i, 1); } else if (i > -1) S[lijst][i] = d; else S[lijst].push(d); }
        else if (r.kind === 'banktx') { S.bank.tx = S.bank.tx || []; const i = S.bank.tx.findIndex((x) => x.id === r.id); if (del) { if (i > -1) S.bank.tx.splice(i, 1); } else if (i > -1) S.bank.tx[i] = d; else S.bank.tx.push(d); }
        else if (r.kind === 'klantx') { if (del) delete S.klantx[r.id]; else S.klantx[r.id] = d; }
        else if (r.kind === 'settings' && !del) {
          if (d.cfg) S.cfg = Object.assign(nieuweCfg(), d.cfg); ['seq', 'aang', 'bel', 'aanvraagSt', 'aanvraagWeg', 'onderhoudMail', 'invest', 'wagens', 'verz', 'ic'].forEach((k) => { if (d[k]) S[k] = d[k]; }); if (d.aanvraagWeg) EXT.aanvragen = EXT.aanvragen.filter((a) => !S.aanvraagWeg[a.id]); if (d.artikels && !S.artikelsKlaar && !(S.artikels || []).length) S.artikels = d.artikels;
          if (d.bank) { S.bank.rek = d.bank.rek || S.bank.rek; S.bank.koppeling = d.bank.koppeling || null; } if (d.log) S.log = d.log; regelsToepassen();
        }
      } else if (r.app === 'shared' && r.kind === 'veka') { if (del) delete S.veka[r.id]; else S.veka[r.id] = d;
      } else if (r.app === 'shared' && r.kind === 'articles' && !del) { artikelsOntvangen(d.list || []);
      } else if (r.app === 'shared' && r.kind === 'client') {
        const i = S.klanten.findIndex((k) => k.id === r.id);
        if (del) { if (i > -1) S.klanten.splice(i, 1); } else if (i > -1) Object.assign(S.klanten[i], d); else S.klanten.push(Object.assign({ id: r.id }, d));
      } else if (r.app === 'work') {
        if (r.kind === 'order') { const i = EXT.orders.findIndex((o) => o.id === r.id); if (del) { if (i > -1) EXT.orders.splice(i, 1); } else { const o = Object.assign({}, d, { sig: '', fotos: [] }); if (i > -1) EXT.orders[i] = o; else EXT.orders.push(o); } }
        else if (r.kind === 'settings' && !del) { EXT.workArt = (d.articles || []).map((a) => ({ id: a.id, n: a.n, p: a.p, u: a.u })); artikelsEersteKeer(); }
      } else if (r.app === 'heat' && r.kind === 'settings' && !del) { EXT.heatCfg = { tech: (d.cfg || {}).tech || {} };
      } else if (r.app === 'heat' && r.kind === 'job') {
        const i = EXT.jobs.findIndex((j) => j.id === r.id);
        if (del) { if (i > -1) EXT.jobs.splice(i, 1); } else { const j = Object.assign({}, d, { sig: '', fotos: [], tickP1: [], tickP2: [], foto: '' }); if (i > -1) EXT.jobs[i] = j; else EXT.jobs.push(j); }
      } else if (r.app === 'secretaris' && r.kind === 'aanvraag') {
        const i = EXT.aanvragen.findIndex((a) => a.id === r.id);
        if (del || S.aanvraagWeg[r.id]) { if (i > -1) EXT.aanvragen.splice(i, 1); } else {
          const a = Object.assign({ id: r.id }, d); if (i > -1) EXT.aanvragen[i] = a; else EXT.aanvragen.push(a);
          const u = (S.aanvraagUit || {})[r.id]; if (u && d.status === u.status) u.ok = true; // Secretaris heeft de status van Office
          const st = (S.aanvraagSt[r.id] || {}).st || 'nieuw';
          if (d.status === 'afgehandeld' && d.statusDoor !== 'office' && !AANVR_KLAAR.includes(st)) (S.aanvraagSt[r.id] = S.aanvraagSt[r.id] || {}).st = 'afgehandeld'; // afgehandeld op de secretaris-gsm
        }
      }
    }
    await save(true);
    if (rows.some((r) => r.app === 'office' && r.kind === 'peppolin' && !r.deleted && r.data && !r.data.verwerkt)) setTimeout(() => window.peppolAuto && peppolAuto(), 300);
    const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement && document.activeElement.tagName);
    if (!typing && !document.querySelector('.mod')) R(); else sideR();
  },
  onPushed(rows) { let x = 0; if ((S.werkUit || []).length) { const n = S.werkUit.length; S.werkUit = S.werkUit.filter((o) => !rows.some((r) => r.app === 'work' && r.id === o.id)); if (S.werkUit.length !== n) x = 1; } rows.forEach((r) => { const u = r.app === 'secretaris' && (S.aanvraagUit || {})[r.id]; if (u && r.data && r.data.status === u.status) { u.ok = true; x = 1; } }); if (x) save(true); },
  onStatus(st) { CS = st; const e = document.getElementById('cloudst'); if (e) e.innerHTML = CLOUDST(); const e2 = document.getElementById('cloudst2'); if (e2) e2.innerHTML = CLOUDST(); const c = document.getElementById('cloudcard'); if (c && CLOUD.session()) c.outerHTML = CLOUDCARD(); }
});

const hm2 = (t) => t ? new Date(t).toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' }) : '';
function CLOUDST() {
  if (!CLOUD.session()) return '<span style="cursor:pointer" onclick="go(\'instellingen\',null,\'cloud\')">☁︎ Niet ingelogd</span>';
  const s = CS.state; return `<span style="cursor:pointer;${s === 'fout' ? 'color:#ff8a70' : ''}" onclick="go('instellingen',null,'cloud')">${{ ok: '☁︎ Gesynchroniseerd ' + hm2(CS.last), bezig: '☁︎ Synchroniseren…', offline: '☁︎ Offline', fout: '⚠ Sync-fout' }[s] || '☁︎'}</span>`;
}
function CLOUDCARD() {
  const s = CLOUD.session();
  if (!s) return `<div class="c" id="cloudcard"><h2>Cloud (VET Office + Heat + Work)</h2><p class="mu">Log in met hetzelfde account als in VET Heat en VET Work. Dan komen werkbonnen, attesten en klanten hier automatisch binnen.</p>
  <label class="f"><span>E-mail</span><input id="ce" type="email" autocomplete="username"></label><label class="f"><span>Wachtwoord</span><input id="cp" type="password" autocomplete="current-password" onkeydown="if(event.key==='Enter')cloudLogin(this.parentElement.nextElementSibling)"></label><button onclick="cloudLogin(this)">Inloggen</button>${CS.error ? `<p class="mu" style="color:var(--rd)">${esc(CS.error)}</p>` : ''}${window.VERSIEKAART ? VERSIEKAART() : ''}</div>`;
  return `<div class="c" id="cloudcard"><h2>Cloud</h2><p style="margin:0 0 6px">Ingelogd als <b>${esc(s.user.email)}</b></p><p class="mu" style="margin:0 0 10px">${{ ok: '✓ Alles gesynchroniseerd om ' + hm2(CS.last), bezig: 'Bezig…', offline: 'Geen internet: wordt later verstuurd.', fout: 'Fout: ' + esc(CS.error || '') }[CS.state] || ''}</p>
  <div class="row wrap"><button class="b2" onclick="CLOUD.sync()">Nu synchroniseren</button><button class="b2" onclick="if(confirm('Uitloggen op dit toestel?')){CLOUD.logout();R()}">Uitloggen</button></div>${window.VERSIEKAART ? VERSIEKAART() : ''}</div>`;
}
async function cloudLogin(btn) {
  const e = $('#ce').value, p = $('#cp').value; if (!e || !p) return;
  btn.disabled = true; btn.textContent = 'Inloggen…';
  try { await CLOUD.login(e, p); R(); toast('Ingelogd'); boekhouderCheck(); } catch (x) { CS.error = x.message; alert('Inloggen mislukt: ' + x.message); btn.disabled = false; btn.textContent = 'Inloggen'; }
}

/* ---------------- Peppol (via edge function vet-peppol) ---------------- */
async function peppolCall(body) {
  if (!CLOUD.session()) throw new Error('Log eerst in (Instellingen › Cloud).');
  const r = await CLOUD.call('vet-peppol', body);
  if (r && r.error) throw new Error(r.error);
  return r;
}
async function peppolTest() {
  const e = $('#ppst'); e.textContent = 'Bezig…';
  try { const r = await peppolCall({ action: 'status' }); S.cfg.peppolActief = !!r.ok; save(); e.textContent = r.ok ? '✓ Verbonden met ' + (r.provider || 'Peppol') + (r.company ? ' · ' + r.company : '') : '✗ ' + (r.message || 'niet geconfigureerd'); }
  catch (x) { e.textContent = '✗ ' + x.message; }
}
async function peppolCheck(id) {
  const x = S.klantx[id] = S.klantx[id] || {}; const pid = x.peppol || C.peppolId(x.btw); const e = document.getElementById('pc_' + id);
  if (!pid) { e.textContent = 'Geen btw-nummer of Peppol-ID'; return; }
  e.textContent = 'Bezig…';
  try { const r = await peppolCall({ action: 'verify', peppolAddress: pid }); x.peppolOk = r.isValid ? '✓ bereikbaar via Peppol (' + new Date().toLocaleDateString('nl-BE') + ')' : '✗ niet op Peppol gevonden'; save(); e.textContent = x.peppolOk; }
  catch (err) { e.textContent = '✗ ' + err.message; }
}
async function peppolVerstuur() {
  const d = curDoc(); const k = d.klant; const naar = k.peppol || C.peppolId(k.btw);
  if (!confirm(`${TYPENAAM[d.type]} ${d.nr} via Peppol versturen naar ${k.naam} (${naar})?`)) return;
  try {
    toast('Versturen…', 4000);
    const pdf = await pdfVan(d); const b64 = await blobB64(pdf);
    const extra = (await bijlageBestanden(d)).filter((x) => /pdf|png|jpe?g/.test(x.mime)); const xml = C.ubl(d, S.cfg, b64, extra);
    const r = await peppolCall({ action: 'send', recipient: naar, xml });
    d.peppol = { id: r.id || '', status: r.deliveryStatus || (r.sentOverPeppol ? 'verzonden' : 'aangeboden'), datum: new Date().toISOString(), naar };
    d.verzonden = d.peppol.datum; save(); sluit(); R(); toast('Verstuurd via Peppol ✓');
  } catch (x) { alert('Peppol-fout: ' + x.message); }
}
async function peppolOphalen() {
  try {
    toast('Ophalen…', 2000);
    const r = await peppolCall({ action: 'inbox' }); let n = 0;
    for (const doc of r.documents || []) {
      if ((S.peppolIn || []).some((p) => p.extId === doc.id)) continue;
      const full = await peppolCall({ action: 'get', id: doc.id });
      if (full.xml) { peppolToevoegen({ id: uid('p'), extId: doc.id, xml: full.xml, bron: 'peppol' }); n++; await peppolCall({ action: 'markread', id: doc.id }); }
    }
    toast(n ? n + ' nieuwe documenten' : 'Geen nieuwe documenten'); R();
  } catch (x) { alert('Peppol: ' + x.message); }
}

/* ---------------- bank (via edge function vet-bank, Enable Banking) ---------------- */
async function bankStart() {
  try {
    const bank = ($('#bnk') || {}).value || (S.bank.koppeling || {}).bank || 'ING';
    const state = uid('eb'); localStorage.setItem('vo_eb_state', state);
    const r = await CLOUD.call('vet-bank', { action: 'start', bank, country: 'BE', redirect: location.origin + location.pathname, state });
    if (r.error) throw new Error(r.error);
    S.bank.koppeling = Object.assign({}, S.bank.koppeling || {}, { bank, bezig: true }); await save(); location.href = r.url;
  } catch (x) { alert('Bank koppelen: ' + x.message); }
}
async function bankTerug(code, state) {
  history.replaceState(null, '', location.pathname);
  if (state !== localStorage.getItem('vo_eb_state')) return;
  try {
    toast('Bank koppelen…', 4000);
    const r = await CLOUD.call('vet-bank', { action: 'session', code }); if (r.error) throw new Error(r.error);
    S.bank.koppeling = { bank: (S.bank.koppeling || {}).bank, sessie: r.session_id, tot: String(r.valid_until || '').slice(0, 10), accounts: (r.accounts || []).map((a) => a.uid) };
    S.bank.rek = (r.accounts || []).map((a) => ({ uid: a.uid, iban: a.iban || '', naam: a.name || a.iban || 'Rekening' }));
    await save(); await bankSync(); go('bank');
  } catch (x) { alert('Bank koppelen mislukt: ' + x.message); }
}
async function bankSync() {
  const k = S.bank.koppeling; if (!k || !k.accounts) return go('instellingen', null, 'bank');
  try {
    toast('Bank bijwerken…', 3000);
    const van = C.addDays(today(), -90); let n = 0;
    for (const rek of S.bank.rek) {
      const r = await CLOUD.call('vet-bank', { action: 'transactions', account: rek.uid, date_from: van }); if (r.error) throw new Error(r.error);
      rek.saldo = r.balance != null ? r.balance : rek.saldo; rek.sync = new Date().toISOString();
      n += bankToevoegen((r.transactions || []).map((t) => ({ id: 'eb' + (t.entry_reference || t.transaction_id || (t.booking_date + t.transaction_amount.amount + (t.remittance_information || []).join(''))).replace(/\W/g, '').slice(0, 60), datum: t.booking_date || t.value_date, bedrag: (t.credit_debit_indicator === 'DBIT' ? -1 : 1) * C.num(t.transaction_amount.amount), tegenpartij: (t.credit_debit_indicator === 'DBIT' ? (t.creditor || {}).name : (t.debtor || {}).name) || '', iban: ((t.credit_debit_indicator === 'DBIT' ? t.creditor_account : t.debtor_account) || {}).iban || '', mededeling: (t.remittance_information || []).join(' ') })));
    }
    save(); R(); toast(n + ' nieuwe transacties');
  } catch (x) { alert('Bank: ' + x.message + (/expired|consent/i.test(x.message) ? '\nKoppel je bank opnieuw (Instellingen › Bank).' : '')); }
}

/* ---------------- mail (Resend) ---------------- */
function vMailInst() {
  return `<div class="c"><h2>Mail rechtstreeks versturen</h2><p class="mu">Om facturen met alle bijlagen (werkbon, attesten) rechtstreeks vanuit VET Office te mailen, en om een melding te krijgen als er een Peppol-factuur binnenkomt, gebruikt VET Office de maildienst Resend (gratis tot 3.000 mails per maand).</p>
  <ol class="mu" style="margin:0 0 10px 18px;padding:0;line-height:1.8"><li>Maak een gratis account. ${ext(LK.resend, 'Resend')}</li><li>Voeg je domein <b>vaneyentechnics.be</b> toe en zet de getoonde DNS-records bij je domeinbeheerder (eenmalig). ${ext(LK.resendDomains, 'Domeinen')}</li><li>Maak een API-sleutel. ${ext(LK.resendKeys, 'API-sleutels')}</li><li>Zet in Supabase de secrets RESEND_API_KEY, MAIL_FROM (bv. <code>Van Eyen Technics &lt;info@vaneyentechnics.be&gt;</code>) en MAIL_NOTIFY (<code>info@vaneyentechnics.be</code>). ${ext(LK.supabaseSecrets, 'Supabase Secrets')}</li><li>Test hieronder.</li></ol>
  ${inp('Afzender (zoals in MAIL_FROM)', 'S.cfg.mailVan', { ph: 'info@vaneyentechnics.be' })}
  <div class="row wrap"><button onclick="mailTest()">Testmail naar mezelf</button><span class="mu" id="mlst">${S.cfg.mailActief ? '✓ actief' : ''}</span></div></div>`;
}
async function mailTest() {
  const e = $('#mlst'); e.textContent = 'Bezig…';
  try { const r = await CLOUD.call('vet-mail', { to: S.cfg.bedrijf.email, subject: 'Test VET Office', text: 'Dit is een testmail van VET Office. Het werkt!' }); if (r.error) throw new Error(r.error); S.cfg.mailActief = true; save(); e.textContent = '✓ Testmail verstuurd naar ' + S.cfg.bedrijf.email; }
  catch (x) { S.cfg.mailActief = false; save(); e.textContent = '✗ ' + x.message; }
}

/* ---------------- boekhouder ---------------- */
let TOEGANG = null;
async function toegangLaden() { try { TOEGANG = await CLOUD.rpc('vet_access_list', {}); } catch (e) { TOEGANG = { fout: e.message }; } }
function vBoekhouder() {
  if (!CLOUD.session()) return `<div class="c"><h2>Boekhouder</h2><p class="mu">Log eerst in bij Cloud.</p></div>`;
  if (TOEGANG === null) { toegangLaden().then(() => { if (v === 'instellingen') R(); }); return '<div class="c">Laden…</div>'; }
  if (TOEGANG.fout) return `<div class="c"><h2>Boekhouder</h2><p class="mu">Nog niet ingesteld in de database (${esc(TOEGANG.fout.slice(0, 120))}).</p></div>`;
  const mijn = TOEGANG.filter((x) => x.owner === CLOUD.session().user.id), klanten = TOEGANG.filter((x) => x.member === CLOUD.session().user.id);
  return `<div class="c"><h2>Je boekhouder toegang geven</h2><p class="mu">Je boekhouder krijgt <b>alleen-lezen</b> toegang tot je facturen, uitgaven, btw en belastingen in VET Office (niet tot VET Heat of VET Work). Hij kan exporteren maar niets wijzigen.</p>
  <ol class="mu" style="margin:0 0 10px 18px;padding:0;line-height:1.8"><li>Maak in Supabase een gebruiker aan met het e-mailadres van je boekhouder (nieuwe registraties staan uit). ${ext(LK.supabaseUsers, 'Supabase Users')}</li><li>Vul dat e-mailadres hieronder in.</li><li>Je boekhouder opent VET Office, logt in en kiest jouw administratie.</li></ol>
  <div class="row wrap"><input id="bhm" type="email" placeholder="e-mail boekhouder" style="max-width:300px;margin:0"><button onclick="boekhouderUitnodig()">Toegang geven</button></div>
  ${mijn.map((x) => `<div class="dl"><span>${esc(x.member_email)} · ${esc(x.rol)}</span><button class="lnk" onclick="boekhouderIntrekken('${x.member}')">Intrekken</button></div>`).join('')}</div>
  ${klanten.length ? `<div class="c"><h2>Administraties die jij mag bekijken</h2>${klanten.map((x) => `<div class="dl"><span>${esc(x.owner_email)}</span><button class="sm" onclick="boekhouderOpen('${x.owner}')">Openen</button></div>`).join('')}</div>` : ''}`;
}
async function boekhouderUitnodig() { try { await CLOUD.rpc('vet_access_grant', { p_email: $('#bhm').value, p_rol: 'boekhouder' }); TOEGANG = null; R(); toast('Toegang gegeven'); } catch (e) { alert(e.message); } }
async function boekhouderIntrekken(m) { if (!confirm('Toegang intrekken?')) return; try { await CLOUD.rpc('vet_access_revoke', { p_member: m }); TOEGANG = null; R(); } catch (e) { alert(e.message); } }
async function boekhouderCheck() { await toegangLaden(); const s = CLOUD.session(); if (Array.isArray(TOEGANG) && TOEGANG.some((x) => x.member === s.user.id) && !S.docs.length) go('instellingen', null, 'boekhouder'); }
async function boekhouderOpen(owner) {
  await save(); RO = true; EIGENAAR = owner; CLOUD.reset();
  S = { docs: [], klanten: [], klantx: {}, uitgaven: [], bank: { tx: [], rek: [], koppeling: null }, bel: {}, aang: {}, aanvraagSt: {}, aanvraagWeg: {}, aanvraagUit: {}, onderhoudMail: {}, werkUit: [], seq: { factuur: {}, offerte: {}, creditnota: {} }, artikels: [], cfg: nieuweCfg(), peppolIn: [], log: [] };
  EXT.jobs = []; EXT.orders = []; EXT.aanvragen = [];
  go('home'); await CLOUD.sync(); R();
}
async function boekhouderStop() { RO = false; EIGENAAR = null; CLOUD.reset(); S.docs = []; await load(); go('home'); CLOUD.sync(); }

/* ---------------- gedeelde artikellijst (VET Office + VET Work) ---------------- */
const eenhNaarWork = (u) => ({ stuks: 'stuk', uren: 'uur' }[u] || u || 'stuk');
const eenhNaarOffice = (u) => ({ stuk: 'stuks', uur: 'uren' }[u] || u || 'stuks');
const artikelShared = (a) => ({ id: a.id || uid('a'), n: a.n || '', p: a.p == null || a.p === '' ? null : C.num(a.p), u: eenhNaarWork(a.u), det: a.det || '', btw: a.btw || '' });
function artikelsOntvangen(list) {
  if (!S.artikelsKlaar) { // eerste keer: eigen artikels die nog niet in de gedeelde lijst staan, toevoegen
    const namen = new Set(list.map((a) => (a.n || '').trim().toLowerCase()));
    (S.artikels || []).forEach((a) => { if (a.n && !namen.has(a.n.trim().toLowerCase())) list.push(artikelShared(a)); });
    S.artikelsKlaar = true; CLOUD.soon(500);
  }
  S.artikels = list.map((a) => Object.assign({}, a, { u: eenhNaarOffice(a.u) }));
}
function artikelsEersteKeer() { // nog geen gedeelde lijst: start met de artikels van VET Work + die van Office
  if (S.artikelsKlaar) return;
  const namen = new Set((S.artikels || []).map((a) => (a.n || '').trim().toLowerCase()));
  (EXT.workArt || []).forEach((a) => { if (a.n && !namen.has(a.n.trim().toLowerCase())) (S.artikels = S.artikels || []).push({ id: a.id || uid('a'), n: a.n, p: a.p, u: eenhNaarOffice(a.u) }); });
}

Object.assign(window, { CLOUD, CLOUDST, CLOUDCARD });
