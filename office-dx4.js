/* VET Office – werkwijze 1:1 zoals Dexxter, deel 2: uitgaven (kosten, kost ingeven in 4 stappen, leveranciers, afschrijvingen, kostencategorieën) */

/* ================= kosten: raster of lijst, filters ================= */
const DXK = { bron: '', min: '', max: '', kc: '', lev: '', van: '', tot: '', kw: 0, st: '' };
filt.kv = dxLS('kv', 'raster');
const uInc = (u) => C.r2((u.tarieven || []).reduce((x, t) => x + C.num(t.basis) + C.num(t.btw), 0) * (u.creditnota ? -1 : 1));
const uKlaar = (u) => !!((u.leverancier || '').trim() && (u.tarieven || []).some((t) => C.num(t.basis)));
function dxKFilterActief() { return Object.entries(DXK).some(([k, x]) => k === 'kw' ? x : x !== ''); }
function dxKLijst() {
  const j = +filt.jaar; const q = (filt.q || '').toLowerCase();
  let l = (S.uitgaven || []).filter((u) => jaarVan(u.datum) === j);
  if (q) l = l.filter((u) => [u.leverancier, u.nr, u.oms, catVan(u).n, uInc(u).toFixed(2).replace('.', ',')].join(' ').toLowerCase().includes(q));
  if (DXK.bron) l = l.filter((u) => (DXK.bron === 'peppol' ? u.bron === 'peppol' : DXK.bron === 'zonder' ? !u.bijlage : u.bron !== 'peppol' && u.bijlage));
  if (DXK.min !== '') l = l.filter((u) => Math.abs(uInc(u)) >= C.num(DXK.min)); if (DXK.max !== '') l = l.filter((u) => Math.abs(uInc(u)) <= C.num(DXK.max));
  if (DXK.kc) l = l.filter((u) => u.kc === DXK.kc); if (DXK.lev) l = l.filter((u) => (u.leverancier || '').trim().toLowerCase() === DXK.lev.toLowerCase());
  if (DXK.van) l = l.filter((u) => u.datum >= DXK.van); if (DXK.tot) l = l.filter((u) => u.datum <= DXK.tot); if (DXK.kw) l = l.filter((u) => Math.ceil(+String(u.datum).slice(5, 7) / 3) === DXK.kw);
  if (DXK.st === 'betaald') l = l.filter((u) => u.betaald); if (DXK.st === 'open') l = l.filter((u) => !u.betaald); if (DXK.st === 'aanvullen') l = l.filter((u) => !uKlaar(u));
  return l.sort((a, b) => (b.datum || '').localeCompare(a.datum || ''));
}
vUitgaven = function () {
  const l = dxKLijst(); const j = +filt.jaar; const ps = filt.ps, pgs = Math.max(1, Math.ceil(l.length / ps)); if ((filt.pg || 1) > pgs) filt.pg = pgs; const pg = filt.pg || 1;
  const blad = l.slice((pg - 1) * ps, pg * ps); const raster = filt.kv !== 'lijst';
  const som = blad.reduce((s, u) => s + uInc(u), 0);
  setTimeout(thumbsAanvullen, 50);
  const fch = [DXK.bron && ['Aanlevering: ' + ({ peppol: 'Peppol', upload: 'upload / foto', zonder: 'zonder bijlage' })[DXK.bron], "DXK.bron=''"], (DXK.min !== '' || DXK.max !== '') && ['Bedrag ' + (DXK.min || 0) + ' – ' + (DXK.max || '…'), "DXK.min='';DXK.max=''"], DXK.kc && ['Categorie: ' + (alleCats().find((c) => c.id === DXK.kc) || {}).n, "DXK.kc=''"], DXK.lev && ['Leverancier: ' + DXK.lev, "DXK.lev=''"], (DXK.van || DXK.tot) && ['Periode: ' + (DXK.van ? dt(DXK.van) : '…') + ' – ' + (DXK.tot ? dt(DXK.tot) : '…'), "DXK.van='';DXK.tot=''"], DXK.kw && ['Kwartaal ' + DXK.kw, 'DXK.kw=0'], DXK.st && ['Status: ' + ({ betaald: 'Betaald', open: 'Nog te betalen', aanvullen: 'Nog aan te vullen' })[DXK.st], "DXK.st=''"]].filter(Boolean);
  const ok = (u) => uKlaar(u) ? '<span class="dxok" title="Volledig ingeboekt">✓</span>' : '<span class="dxok o" title="Nog aan te vullen">!</span>';
  const betaaldChip = (u) => u.betaald ? '<span class="tag g">✓ Betaald</span>' : '<span class="tag o">Te betalen</span>';
  return `<div class="dxhead"><div><h1>Kosten</h1><div class="mu" style="margin-top:4px">Aankoopfacturen via Peppol komen vanzelf binnen in de <a class="lnk" style="padding:0" onclick="go('peppol')">Inbox</a>. Kastickets en andere facturen upload je hier.</div></div><span class="sp"></span>${RO ? '' : `<div class="row wrap dxknop"><button class="b2o" onclick="dxKies('image/*','ticket',1)">📷 Ticket fotograferen</button><button class="b2o" onclick="uitgaveNieuw()">Zonder bijlage</button><button onclick="dxKies('image/*,application/pdf','',0)">＋ Kosten uploaden</button></div>`}</div>
  <div class="c dxcard" ondragover="event.preventDefault();this.classList.add('drop')" ondragleave="this.classList.remove('drop')" ondrop="event.preventDefault();this.classList.remove('drop');[...event.dataTransfer.files].forEach(f=>kostBestand(f))">
    <div class="row" style="gap:10px;margin-bottom:12px"><div class="dxzoek"><span>🔍</span><input placeholder="Zoeken" value="${esc(filt.q || '')}" oninput="filt.q=this.value;filt.pg=1;clearTimeout(window._ft);window._ft=setTimeout(R,250)"></div><button class="b2o" onclick="dxKFilters()">⚲ Filters${dxKFilterActief() ? ' •' : ''}</button>
      <div class="dxtgl dxvw"><button class="${raster ? 'on' : ''}" title="Raster" onclick="filt.kv='raster';dxLSset('kv','raster');R()">▦</button><button class="${!raster ? 'on' : ''}" title="Lijst" onclick="filt.kv='lijst';dxLSset('kv','lijst');R()">☰</button></div></div>
    ${fch.length ? `<div class="chips">${fch.map(([t, k]) => `<button class="chip on" onclick="${k};filt.pg=1;R()">${esc(t)} ✕</button>`).join('')}</div>` : ''}
    ${raster ? `<div class="dxkgrid">${blad.map((u) => { const k = kostVan(u, j); return `<div class="dxkc" onclick="dxUitOpen('${u.id}')"><div class="kop">${ok(u)}<div class="nm"><b>${esc(u.leverancier || 'Onbekende leverancier')}</b><div class="mu">${dt(u.datum)}</div></div><button class="dxdots" onclick="event.stopPropagation();dxUMenu(event,'${u.id}')">⋮</button></div>
        <div class="th">${u.thumb ? `<img id="th_${u.id}" src="${thumbSrc(u)}" alt="">` : u.bijlage ? `<img id="th_${u.id}" alt=""><span>📄</span>` : '<span class="mu">geen bijlage</span>'}${u.bron === 'peppol' ? '<span class="tag pp">Peppol</span>' : ''}</div>
        <div class="vt">${betaaldChip(u)}${u.creditnota ? '<span class="tag o">creditnota</span>' : ''}<span class="sp"></span><b class="tab">${eur(uInc(u))}</b></div>
        <div class="cat"><span>${esc(k.c.n)}</span><b class="tab">${eur(k.kost)}</b></div><div class="mu" style="font-size:12.5px">${Math.round(k.beroep * 100)}% beroepsmatig · ${Math.round(k.aftrek * 100)}% btw-aftrek</div></div>`; }).join('') || `<p class="mu">Geen kosten in ${j}${dxKFilterActief() || filt.q ? ' met deze filters' : ''}. Sleep je facturen hierheen of klik op "Kosten uploaden".</p>`}</div>`
    : `<div class="dxt-d" style="overflow:auto"><table class="t dxt"><tr><th class="c0"></th><th>Datum</th><th>Leverancier</th><th>Type</th><th>Referentie</th><th class="r">Incl. btw</th><th>Betaald</th><th class="c0"></th></tr>
      ${blad.map((u) => `<tr class="cl" onclick="dxUitOpen('${u.id}')"><td class="c0">${ok(u)}</td><td class="nw">${dt(u.datum)}</td><td><b>${esc(u.leverancier || '—')}</b>${u.bron === 'peppol' ? ' <span class="tag">Peppol</span>' : ''}</td><td><span class="tag n" style="white-space:normal">${esc(catVan(u).n)}</span></td><td>${esc(u.nr || '')}</td><td class="r tab nw">${eur(uInc(u))}</td><td>${betaaldChip(u)}</td><td class="c0"><button class="dxdots" onclick="event.stopPropagation();dxUMenu(event,'${u.id}')">⋮</button></td></tr>`).join('') || `<tr><td colspan="8" class="mu" style="padding:16px">Geen kosten in ${j}.</td></tr>`}
      ${blad.length ? `<tr class="dxsom"><td colspan="5"><b>Totaal van de pagina</b></td><td class="r tab nw"><b>${eur(som)}</b></td><td colspan="2"></td></tr>` : ''}</table></div>
      <div class="dxt-m">${blad.map((u) => `<div class="dxrm" onclick="dxUitOpen('${u.id}')"><div class="a"><b>${esc(u.leverancier || '—')}</b><b class="tab">${eur(uInc(u))}</b></div><div class="b"><span class="mu">${dt(u.datum).slice(0, 5)} · ${esc(catVan(u).n)}</span>${betaaldChip(u)}</div></div>`).join('')}</div>`}
    ${dxPager(l.length)}
  </div>`;
};
function dxUitOpen(id) { const u = (S.uitgaven || []).find((x) => x.id === id); WZU[id] = { stap: u && uKlaar(u) ? 4 : 1 }; go('uitgave', id); }
function dxUMenu(ev, id) {
  const u = S.uitgaven.find((x) => x.id === id); if (!u) return;
  dxMenu(ev, [u.bijlage && ['Bekijk bestand', `bestandOpen(S.uitgaven.find(x=>x.id==='${id}').bijlage)`], !RO && ['Uitgave bewerken', `WZU['${id}']={stap:1};go('uitgave','${id}')`], u.bijlage && ['Downloaden', `dxUDownload('${id}')`], !RO && ['Dupliceren', `dxUDup('${id}')`], !RO && ['Verwijderen', `cur='${id}';uitgaveWeg()`, { red: 1 }], !RO && (u.betaald ? ['Markeer niet betaald', `dxUBet('${id}',0)`] : ['Markeer betaald', `dxUBet('${id}',1)`])]);
}
function dxUBet(id, b) { const u = S.uitgaven.find((x) => x.id === id); u.betaald = !!b; save(); R(); }
function dxUDup(id) { const u = S.uitgaven.find((x) => x.id === id); const n = JSON.parse(JSON.stringify(u)); Object.assign(n, { id: uid('u'), datum: today(), nr: '', betaald: false, bijlage: '', thumb: '', bron: '' }); S.uitgaven.unshift(n); save(); WZU[n.id] = { stap: 2 }; go('uitgave', n.id); }
async function dxUDownload(id) { const u = S.uitgaven.find((x) => x.id === id); const d = await (window.CLOUD ? CLOUD.file(u.bijlage) : u.bijlage); const mime = String(d).slice(5, String(d).indexOf(';')); const a = document.createElement('a'); a.href = URL.createObjectURL(b64Blob(String(d).split(',')[1], mime)); a.download = [(u.leverancier || 'kost').replace(/[^\w\- ]+/g, ''), u.nr, u.datum].filter(Boolean).join('_') + (/pdf/.test(mime) ? '.pdf' : /png/.test(mime) ? '.png' : '.jpg'); a.click(); }
function dxKFilters() {
  const tab = window._dxkt || 'periode'; window._dxk = JSON.parse(JSON.stringify(DXK));
  const levs = [...new Set((S.uitgaven || []).map((u) => (u.leverancier || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const cats = alleCats().filter((c) => (S.uitgaven || []).some((u) => u.kc === c.id));
  const tabs = [['bron', '➤ Aanlevermethode'], ['bedrag', '€ Bedrag'], ['kc', '🏷 Kostencategorie'], ['lev', '🏭 Leverancier'], ['periode', '📅 Periode'], ['st', '☰ Status']];
  const rad = (k, opts) => opts.map(([x, t]) => `<label class="row" style="gap:8px;margin-top:8px"><input type="radio" name="r_${k}" style="width:auto;margin:0" ${DXK[k] === x ? 'checked' : ''} onchange="_dxk.${k}='${x}'"> ${t}</label>`).join('');
  const m = modal(`<div class="dxfilt"><h2 style="color:var(--tx);font-size:17px">Filters</h2><div class="dxfgrid"><div class="dxftabs">${tabs.map(([k, t]) => `<button class="${tab === k ? 'on' : ''}" onclick="window._dxkt='${k}';dxFiltTab('${k}')">${t}</button>`).join('')}</div>
    <div class="dxfbody">
      <div data-t="bron" ${tab !== 'bron' ? 'hidden' : ''}><b>Filter op aanlevermethode</b>${rad('bron', [['', 'Alle'], ['peppol', 'Peppol (e-factuur)'], ['upload', 'Upload / foto'], ['zonder', 'Zonder bijlage']])}</div>
      <div data-t="bedrag" ${tab !== 'bedrag' ? 'hidden' : ''}><b>Filter op bedrag (incl. btw)</b><div class="cols" style="margin-top:8px"><label class="f"><span>Van €</span><input inputmode="decimal" value="${esc(DXK.min)}" oninput="_dxk.min=this.value"></label><label class="f"><span>Tot €</span><input inputmode="decimal" value="${esc(DXK.max)}" oninput="_dxk.max=this.value"></label></div></div>
      <div data-t="kc" ${tab !== 'kc' ? 'hidden' : ''}><b>Filter op kostencategorie</b><select style="margin-top:8px" onchange="_dxk.kc=this.value"><option value="">Alle categorieën</option>${cats.map((c) => `<option value="${c.id}" ${DXK.kc === c.id ? 'selected' : ''}>${esc(c.n)}</option>`).join('')}</select></div>
      <div data-t="lev" ${tab !== 'lev' ? 'hidden' : ''}><b>Filter op leverancier</b><select style="margin-top:8px" onchange="_dxk.lev=this.value"><option value="">Alle leveranciers</option>${levs.map((x) => `<option ${DXK.lev === x ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></div>
      <div data-t="periode" ${tab !== 'periode' ? 'hidden' : ''}><div class="cols"><div><b>Filter op periode</b><label class="f" style="margin-top:8px"><span>Van</span><input type="date" value="${DXK.van}" onchange="_dxk.van=this.value"></label><label class="f"><span>Tot</span><input type="date" value="${DXK.tot}" onchange="_dxk.tot=this.value"></label></div>
        <div><b>Filter op kwartaal</b><div class="dxkw" style="margin-top:8px">${[1, 2, 3, 4].map((k) => `<button class="${DXK.kw === k ? 'on' : ''}" onclick="_dxk.kw=_dxk.kw===${k}?0:${k};this.parentElement.querySelectorAll('button').forEach((b,i)=>b.classList.toggle('on',_dxk.kw===i+1))">${k}</button>`).join('')}</div></div></div></div>
      <div data-t="st" ${tab !== 'st' ? 'hidden' : ''}><b>Filter op status</b>${rad('st', [['', 'Alle'], ['betaald', 'Betaald'], ['open', 'Nog te betalen'], ['aanvullen', 'Nog aan te vullen']])}</div>
    </div></div>
    <div class="row" style="margin-top:14px"><button class="lnk" onclick="Object.assign(DXK,{bron:'',min:'',max:'',kc:'',lev:'',van:'',tot:'',kw:0,st:''});filt.pg=1;sluit();R()">Alles wissen</button><span class="sp"></span><button class="b2o" onclick="sluit()">Annuleren</button><button onclick="Object.assign(DXK,_dxk);filt.pg=1;sluit();R()">Toepassen</button></div></div>`);
  m.querySelector('.c').style.maxWidth = '720px';
}

/* ================= kost ingeven / bewerken: Leverancier → Document → Boekingen → Bevestigen ================= */
const WZU = {};
const _uitgaveNieuw0 = uitgaveNieuw;
uitgaveNieuw = function (o = {}) { const n = _uitgaveNieuw0(o); const u = curUitgave(); if (u) { WZU[u.id] = { stap: 1, nieuw: 1 }; R(); } return n; };
const DXUSTAP = ['Leverancier', 'Document', 'Boekingen', 'Bevestigen'];
vUitgave = function () {
  const u = curUitgave(); if (!u) return '<p>Niet gevonden.</p>';
  if (u.bron === 'peppol' && !u.gezien && !RO) { u.gezien = true; setTimeout(save, 10); }
  const w = WZU[u.id] = WZU[u.id] || { stap: RO || uKlaar(u) ? 4 : 1 }; const st = RO ? 4 : w.stap;
  const isPdf = /^data:application\/pdf/.test(u.bijlage) || /\.pdf$/i.test(u.bijlage);
  const stepper = `<div class="dxsteps">${DXUSTAP.map((s, i) => `<div class="dxstep ${st === i + 1 ? 'on' : st > i + 1 ? 'klaar' : ''}" onclick="dxUStap(${i + 1})"><span class="n">${st > i + 1 ? '✓' : i + 1}</span><span class="t">${s}</span></div>`).join('<div class="dxline"></div>')}</div>`;
  const body = [dxU1, dxU2, dxU3, dxU4][st - 1](u, w);
  const knop = RO ? '' : `<div class="row" style="margin-top:16px">${st > 1 ? `<button class="b2o" onclick="dxUStap(${st - 1})">Vorige</button>` : ''}<span class="sp"></span>${st < 4 ? `<button onclick="dxUStap(${st + 1})">Volgende</button>` : `<button onclick="dxUOpslaan()">Opslaan</button>`}</div>`;
  return `<div class="dxhead"><div><h1>${w.nieuw ? 'Kost toevoegen' : RO ? 'Uitgave' : 'Uitgave bewerken'}</h1><a class="dxback" onclick="go('uitgaven')">← Terug naar kosten</a></div><span class="sp"></span>${RO ? '' : `<label class="btnl b2l b2o" style="border:1.5px solid var(--ac)">⬆ ${u.bijlage ? 'Bijlage vervangen' : 'Bijlage uploaden'}<input type="file" accept="image/*,application/pdf" style="display:none" onchange="bijlageZet(this.files[0])"></label>`}</div>
  <div class="dxudet"><div class="c dxcard dxwiz">${stepper}<div class="dxwb">${body}</div>${knop}</div>
  <div class="c dxcard dxubij"><div class="row" style="margin-bottom:8px"><b>${u.bijlage ? 'Document' : 'Geen bijlage'}</b><span class="sp"></span>${u.bijlage ? `<button class="lnk sm" onclick="bijlageOpen()">Openen in nieuw venster ↗</button>` : ''}</div>
    ${u.bijlage ? (isPdf ? `<iframe id="ubijpdf" class="kpv"></iframe>` : `<img src="${String(u.bijlage).startsWith('vf:') ? '' : u.bijlage}" id="ubij" style="max-width:100%;border-radius:8px">`) : `<p class="mu">Aankoopfacturen en tickets moet je 10 jaar bewaren.</p>${RO ? '' : `<div class="row wrap"><label class="btnl b2l">📷 Foto<input type="file" accept="image/*" capture="environment" style="display:none" onchange="bijlageZet(this.files[0])"></label><label class="btnl b2l">PDF / afbeelding<input type="file" accept="image/*,application/pdf" style="display:none" onchange="bijlageZet(this.files[0])"></label></div>`}`}</div></div>`;
};
function dxUStap(n) {
  const u = curUitgave(); const w = WZU[u.id];
  if (n > w.stap) {
    if (w.stap === 1) { if (w.nl) { const x = window._nl || {}; if (!(x.n || '').trim()) return alert('Vul de naam van de leverancier in.'); dxLevMaak(u); } if (!(u.leverancier || '').trim()) return alert('Kies of maak een leverancier.'); }
    if (w.stap === 2 && !u.datum) return alert('Vul de documentdatum in.');
    if (w.stap === 3 && !(u.tarieven || []).some((t) => C.num(t.basis)) && !confirm('Er is nog geen bedrag ingevuld. Toch verder?')) return;
  }
  w.stap = Math.max(1, Math.min(4, n)); R(); scrollTo(0, 0);
}
function dxU1(u, w) {
  const lev = (S.leveranciers || []).find((x) => (x.n || '').trim().toLowerCase() === (u.leverancier || '').trim().toLowerCase());
  return `<div class="dxtgl"><button class="${!w.nl ? 'on' : ''}" onclick="WZU[curUitgave().id].nl=0;R()">🔍 ZOEKEN</button><button class="${w.nl ? 'on' : ''}" onclick="window._nl={n:'',btw:'',kc:curUitgave().kc};WZU[curUitgave().id].nl=1;R()">＋ AANMAKEN</button></div>
  ${!w.nl ? `<div class="ac" style="max-width:460px;margin-top:14px"><label class="f"><span>Leverancier (verplicht)</span><input id="lz" autocomplete="off" placeholder="Zoek op naam of ondernemingsnummer" value="${esc(u.leverancier || '')}" oninput="dxLevZoek(this)" onfocus="dxLevZoek(this)" onblur="setTimeout(()=>{const l=this.closest('.ac').querySelector('.lst');if(l)l.style.display='none'},180)"></label><div class="lst" style="display:none"></div></div>
    ${u.leverancier ? `<div class="dxkl"><div><b>${esc(u.leverancier)}</b>${lev && lev.btw ? `<div class="mu">${esc(C.fmtBtw(lev.btw))}</div>` : ''}${lev && lev.kc ? `<div class="mu">Standaard: ${esc((alleCats().find((c) => c.id === lev.kc) || {}).n || '')}</div>` : ''}</div></div>` : ''}`
  : `<div style="max-width:560px;margin-top:14px"><label class="f"><span>Naam (verplicht)</span><input value="${esc((window._nl || {}).n || '')}" oninput="_nl.n=this.value"></label><label class="f"><span>Ondernemingsnummer</span><input placeholder="BE0123456789" value="${esc((window._nl || {}).btw || '')}" oninput="_nl.btw=this.value"></label>
    <label class="f"><span>Standaard kostencategorie</span><select onchange="_nl.kc=this.value">${dxCatOpties((window._nl || {}).kc)}</select></label></div>`}`;
}
function dxCatOpties(sel) { const l = alleCats(); return [...new Set(l.map((x) => x.h))].sort().map((g) => `<optgroup label="${esc(g)}">${l.filter((x) => x.h === g).map((x) => `<option value="${x.id}" ${x.id === sel ? 'selected' : ''}>${esc(x.n)}</option>`).join('')}</optgroup>`).join(''); }
function dxLevZoek(el) {
  const q = el.value.toLowerCase(); const box = el.closest('.ac').querySelector('.lst');
  const l = (S.leveranciers || []).filter((x) => !q || [x.n, x.btw].join(' ').toLowerCase().includes(q)).sort((a, b) => (a.n || '').localeCompare(b.n || '')).slice(0, 30);
  box.innerHTML = l.map((x) => `<div onmousedown="dxLevKies(${esc(JSON.stringify(x.n))})"><b>${esc(x.n)}</b>${x.btw ? `<div class="mu">${esc(C.fmtBtw(x.btw))}</div>` : ''}</div>`).join('') + `<div onmousedown="window._nl={n:${esc(JSON.stringify(el.value))},btw:'',kc:curUitgave().kc};WZU[curUitgave().id].nl=1;R()" style="color:var(--ac);font-weight:600">＋ Nieuwe leverancier${el.value ? ' "' + esc(el.value) + '"' : ''}</div>`;
  box.style.display = 'block';
}
function dxLevKies(n) { levKies(n); R(); }
function dxLevMaak(u) { const x = window._nl; S.leveranciers = S.leveranciers || []; if (!S.leveranciers.some((y) => (y.n || '').trim().toLowerCase() === x.n.trim().toLowerCase())) S.leveranciers.push({ id: uid('v'), n: x.n.trim(), btw: x.btw || '', kc: x.kc || '' }); u.leverancier = x.n.trim(); if (x.kc && x.kc !== u.kc) { u.kc = x.kc; const c = alleCats().find((y) => y.id === x.kc); if (c) { u.cat = c.rooster; u.aftrek = c.btw; u.beroep = c.beroep; } } WZU[u.id].nl = 0; window._nl = null; save(); }
function dxU2(u) {
  return `<div style="max-width:560px"><div class="cols">${inp('Documentdatum (verplicht)', 'U.datum', { type: 'date' })}${inp('Vervaldag', 'U.verval', { type: 'date' })}</div>
    ${inp('Referentie (factuurnummer van de leverancier)', 'U.nr')}${inp('Omschrijving (optioneel)', 'U.oms')}
    ${inp('Geldige btw-factuur / btw-regime', 'U.regime', { sel: [['normaal', 'Ja – leverancier rekent btw aan'], ['verlegd', 'Verlegd – jij voldoet de btw (onderaanneming, 87/56)'], ['icdienst', 'Dienst uit ander EU-land (bv. Google, Meta) → 88/55'], ['icgoed', 'Goederen uit ander EU-land → 86/55']], re: 1 })}
    <label class="row dxchk"><input type="checkbox" ${u.creditnota ? 'checked' : ''} onchange="set('U.creditnota',this.checked);R()"> Is een creditnota (van de leverancier)</label></div>`;
}
function dxU3(u) {
  const k = kostVan(u); const c = k.c; let basis = 0, btw = 0; (u.tarieven || []).forEach((t) => { basis += C.num(t.basis); btw += C.num(t.btw); });
  const normaal = !u.regime || u.regime === 'normaal';
  return `<div style="max-width:620px"><label class="f"><span>Kostencategorie</span><select onchange="kostCat(this.value)">${dxCatOpties(c.id)}</select></label>${c.oms ? `<p class="mu" style="margin:-4px 0 10px">${esc(c.oms)}</p>` : ''}
    ${['wagen', 'vracht', 'moto'].includes(c.soort) ? `<label class="f"><span>Voertuig</span><select onchange="set('U.voertuig',this.value);R()"><option value="">— kies —</option>${(S.wagens || []).map((x) => `<option value="${x.id}" ${u.voertuig === x.id ? 'selected' : ''}>${esc(x.naam)}</option>`).join('')}</select></label>${!(S.wagens || []).length ? `<p class="mu">Voeg eerst je voertuig toe bij <a class="lnk" onclick="go('wagens')">Auto's</a>.</p>` : ''}` : ''}
    ${c.soort === 'invest' ? `<div class="ban b">Deze aankoop wordt afgeschreven. <a style="cursor:pointer;text-decoration:underline" onclick="go('invest')">Bekijk bij Afschrijvingen</a></div>` : ''}
    <div class="cols">${inp('Beroepsmatig gebruik (%)', 'U.beroep', { num: 1, re: 1 })}${inp('Btw-aftrek (%)', 'U.aftrek', { num: 1, re: 1 })}</div>
    ${(u.tarieven || []).map((t, i) => { const mode = t.mode || 'ex'; const val = mode === 'inc' ? C.r2(C.num(t.basis) + C.num(t.btw)) : C.num(t.basis); return `<div class="dxbedr"><label class="f"><span>Bedrag</span><input inputmode="decimal" value="${val ? String(val).replace('.', ',') : ''}" placeholder="€ 0,00" onchange="dxTar(${i},'val',this.value)"></label>
      <label class="f"><span>Excl/incl btw</span><select onchange="dxTar(${i},'mode',this.value)"><option value="ex" ${mode === 'ex' ? 'selected' : ''}>Excl. btw</option><option value="inc" ${mode === 'inc' ? 'selected' : ''}>Incl. btw</option></select></label>
      <label class="f"><span>Btw-tarief</span><select onchange="dxTar(${i},'pct',this.value)">${[21, 12, 6, 0].map((p) => `<option value="${p}" ${C.num(t.pct) === p ? 'selected' : ''}>${p}%</option>`).join('')}</select></label>
      <label class="f"><span>Btw</span><input inputmode="decimal" value="${String(C.num(t.btw)).replace('.', ',')}" onchange="dxTar(${i},'btw',this.value)" title="Pas aan als de btw op de factuur een paar cent verschilt"></label>
      ${u.tarieven.length > 1 ? `<button class="lnk" title="Bedrag verwijderen" onclick="curUitgave().tarieven.splice(${i},1);save();R()">🗑</button>` : '<span></span>'}</div>`; }).join('')}
    <button class="lnk" style="padding:4px 0" onclick="curUitgave().tarieven.push({pct:21,basis:0,btw:0});save();R()">＋ Voeg bedrag toe</button>
    <div class="tot dxtot" style="margin-top:10px"><div><span>Bedrag excl. btw</span><span class="tab">${eur(basis * (u.creditnota ? -1 : 1))}</span></div><div><span>Bedrag btw</span><span class="tab">${eur(btw * (u.creditnota ? -1 : 1))}</span></div><div><span>Btw te recupereren</span><span class="tab">${eur(normaal ? k.btwAftrek : 0)}</span></div><div class="big"><span>Kost in boekhouding</span><span class="tab">${eur(k.kost)}</span></div>${k.verworpen ? `<div class="mu"><span>waarvan verworpen uitgave</span><span class="tab">${eur(k.verworpen)}</span></div>` : ''}</div>
    <label class="row dxchk"><input type="checkbox" ${u.privé ? 'checked' : ''} onchange="set('U.privé',this.checked);R()"> Privé (niet meetellen in de boekhouding)</label></div>`;
}
function dxTar(i, k, val) {
  const u = curUitgave(); const t = u.tarieven[i]; t.mode = t.mode || 'ex';
  if (k === 'mode') { t.mode = val; save(); R(); return; }
  if (k === 'btw') { t.btw = C.num(val); save(); R(); return; }
  if (k === 'pct') { const inc = C.r2(C.num(t.basis) + C.num(t.btw)); t.pct = C.num(val); if (t.mode === 'inc') { t.basis = C.r2(inc / (1 + t.pct / 100)); t.btw = C.r2(inc - t.basis); } else t.btw = C.r2(C.num(t.basis) * t.pct / 100); }
  if (k === 'val') { const x = C.num(val); if (t.mode === 'inc') { t.basis = C.r2(x / (1 + C.num(t.pct) / 100)); t.btw = C.r2(x - t.basis); } else { t.basis = x; t.btw = C.r2(x * C.num(t.pct) / 100); } }
  save(); R();
}
function dxU4(u) {
  const k = kostVan(u); let basis = 0, btw = 0; (u.tarieven || []).forEach((t) => { basis += C.num(t.basis); btw += C.num(t.btw); }); const s = u.creditnota ? -1 : 1;
  const lev = (S.leveranciers || []).find((x) => (x.n || '').trim().toLowerCase() === (u.leverancier || '').trim().toLowerCase()) || {};
  const rg = { normaal: 'Geldige btw-factuur', geen: 'Geen btw-factuur', verlegd: 'Btw verlegd', icdienst: 'Dienst uit EU', icgoed: 'Goederen uit EU' }[u.regime || 'normaal'];
  return `<div class="dxsum"><div class="k">Leverancier</div><div><b>${esc(u.leverancier || '—')}</b>${lev.btw ? `<div>${esc(C.fmtBtw(lev.btw))}</div>` : ''}</div>
    <div class="k">Document</div><div><div class="dxkv"><span>Documentdatum</span><span>${dt(u.datum)}</span></div>${u.verval ? `<div class="dxkv"><span>Vervaldag</span><span>${dt(u.verval)}</span></div>` : ''}<div class="dxkv"><span>Referentie</span><span>${esc(u.nr || '—')}</span></div><div class="dxkv"><span>Btw</span><span>${rg}${u.creditnota ? ' · creditnota' : ''}</span></div>${u.oms ? `<div class="dxkv"><span>Omschrijving</span><span>${esc(u.oms)}</span></div>` : ''}</div>
    <div class="k">Boeking</div><div><b>${esc(k.c.n)}</b><div class="dxkv"><span>Bedrag excl. btw</span><span class="tab">${eur(basis * s)}</span></div><div class="dxkv"><span>Bedrag btw</span><span class="tab">${eur(btw * s)}</span></div><div class="dxkv"><span>Btw-aftrek</span><b>${Math.round(k.aftrek * 100)}%</b></div><div class="dxkv"><span>Btw te recupereren</span><span class="tab">${eur(k.btwAftrek)}</span></div><div class="dxkv"><span>Beroepsmatig gebruik</span><b>${Math.round(k.beroep * 100)}%</b></div><div class="dxkv"><span>Kost in boekhouding</span><b class="tab">${eur(k.kost)}</b></div>${k.verworpen ? `<div class="dxkv"><span>Verworpen uitgave</span><span class="tab">${eur(k.verworpen)}</span></div>` : ''}${u.privé ? '<div class="tag o">Privé – telt niet mee</div>' : ''}</div></div>
    ${RO ? '' : `<label class="row dxchk" style="margin-top:12px"><input type="checkbox" ${u.betaald ? 'checked' : ''} onchange="set('U.betaald',this.checked)"> Betaald</label><button class="lnk" style="color:var(--rd);padding:4px 0" onclick="uitgaveWeg()">Uitgave verwijderen</button>`}`;
}
function dxUOpslaan() { const u = curUitgave(); if (window.levKies && u.leverancier) { const x = (S.leveranciers || []).find((y) => (y.n || '').trim().toLowerCase() === u.leverancier.trim().toLowerCase()); if (!x) { S.leveranciers = S.leveranciers || []; S.leveranciers.push({ id: uid('v'), n: u.leverancier.trim(), btw: '', kc: u.kc }); } } delete WZU[u.id]; save(); toast('Kost opgeslagen'); go('uitgaven'); }

/* ================= leveranciers (lijst zoals Dexxter, bewerken in een venster) ================= */
vLeveranciers = function () {
  levUitKosten(); const q = (filt.q || '').toLowerCase();
  const l = (S.leveranciers || []).filter((x) => !q || [x.n, x.btw, x.mail, x.adres].join(' ').toLowerCase().includes(q)).sort((a, b) => (a.n || '').localeCompare(b.n || ''));
  const ps = filt.ps, pgs = Math.max(1, Math.ceil(l.length / ps)); if ((filt.pg || 1) > pgs) filt.pg = pgs; const blad = l.slice(((filt.pg || 1) - 1) * ps, (filt.pg || 1) * ps);
  const tot = (n) => (S.uitgaven || []).filter((u) => jaarVan(u.datum) === +filt.jaar && (u.leverancier || '').trim().toLowerCase() === (n || '').trim().toLowerCase()).reduce((s, u) => s + uInc(u), 0);
  return `<div class="dxhead"><h1>Leveranciers</h1><span class="sp"></span>${RO ? '' : `<button onclick="dxLevForm()">＋ Leverancier toevoegen</button>`}</div>
  <div class="c dxcard"><div class="row" style="margin-bottom:12px"><div class="dxzoek"><span>🔍</span><input placeholder="Zoeken" value="${esc(filt.q || '')}" oninput="filt.q=this.value;filt.pg=1;clearTimeout(window._ft);window._ft=setTimeout(R,250)"></div></div>
  <div class="dxt-d" style="overflow:auto"><table class="t dxt"><tr><th>Bedrijfsnaam</th><th>Ondernemingsnummer</th><th>E-mail</th><th>Telefoon</th><th>Adres</th><th>Standaard kostencategorie</th><th class="r">Kosten ${filt.jaar}</th><th class="c0"></th></tr>
  ${blad.map((x) => `<tr class="cl" onclick="dxLevForm('${x.id}')"><td><span class="mu">🏢</span> <a class="dxnr">${esc(x.n)}</a></td><td class="nw">${esc(x.btw ? C.fmtBtw(x.btw) : '')}</td><td>${x.mail ? `<a href="mailto:${esc(x.mail)}" onclick="event.stopPropagation()">${esc(x.mail)}</a>` : '-'}</td><td class="nw">${esc(x.tel || '-')}</td><td>${esc(x.adres || '')}</td><td>${esc((alleCats().find((c) => c.id === x.kc) || {}).n || '—')}</td><td class="r tab nw">${eur(tot(x.n))}</td><td class="c0"><button class="dxdots" onclick="event.stopPropagation();dxMenu(event,[['Bewerken','dxLevForm(\\'${x.id}\\')'],['Kosten bekijken','DXK.lev=${esc(JSON.stringify(x.n))};go(\\'uitgaven\\')'],${RO ? '' : `['Verwijderen','levWeg(\\'${x.id}\\')',{red:1}]`}])">⋮</button></td></tr>`).join('') || '<tr><td colspan="8" class="mu" style="padding:16px">Nog geen leveranciers. Ze komen er vanzelf bij als je een kost opslaat.</td></tr>'}</table></div>
  <div class="dxt-m">${blad.map((x) => `<div class="dxrm" onclick="dxLevForm('${x.id}')"><div class="a"><b>🏢 ${esc(x.n)}</b><b class="tab">${eur(tot(x.n))}</b></div><div class="b"><span class="mu">${esc((alleCats().find((c) => c.id === x.kc) || {}).n || '')}</span></div></div>`).join('')}</div>
  ${dxPager(l.length)}<p class="mu" style="margin:10px 0 0">De standaard kostencategorie wordt automatisch ingevuld bij een nieuwe kost van die leverancier.</p></div>`;
};
function dxLevForm(id) {
  if (RO) return; S.leveranciers = S.leveranciers || []; let x = S.leveranciers.find((y) => y.id === id); const nieuw = !x; if (!x) x = { id: uid('v'), n: '', btw: '', kc: '', mail: '', tel: '', adres: '' };
  window._lv = JSON.parse(JSON.stringify(x)); window._lvNieuw = nieuw;
  const f = (lab, k, ph) => `<label class="f"><span>${lab}</span><input value="${esc(x[k] || '')}" placeholder="${esc(ph || '')}" oninput="_lv['${k}']=this.value"></label>`;
  modal(`<h2 style="color:var(--tx);font-size:17px">${nieuw ? 'Leverancier toevoegen' : 'Leverancier bewerken'}</h2>${f('Bedrijfsnaam (verplicht)', 'n')}<div class="cols">${f('Ondernemingsnummer', 'btw', 'BE0123456789')}${f('Telefoon', 'tel')}</div>${f('E-mail', 'mail')}${f('Adres', 'adres', 'Straat nr, postcode gemeente')}
  <label class="f"><span>Standaard kostencategorie</span><select onchange="_lv.kc=this.value"><option value="">—</option>${dxCatOpties(x.kc)}</select></label>
  <div class="row" style="margin-top:10px"><span class="sp"></span><button class="b2o" onclick="sluit()">Annuleren</button><button onclick="dxLevOk()">${nieuw ? 'Toevoegen' : 'Opslaan'}</button></div>`);
}
function dxLevOk() {
  const x = window._lv; if (!(x.n || '').trim()) return alert('Vul de bedrijfsnaam in.');
  const oud = S.leveranciers.find((y) => y.id === x.id);
  if (oud) { if (oud.n !== x.n) (S.uitgaven || []).forEach((u) => { if ((u.leverancier || '').trim().toLowerCase() === (oud.n || '').trim().toLowerCase()) u.leverancier = x.n; }); Object.assign(oud, x); } else S.leveranciers.push(x);
  sluit(); save(); R();
}

/* ================= afschrijvingen (zoals Dexxter: per soort met subtotaal) ================= */
vInvest = function () {
  const j = +filt.jaar;
  const rows = (S.invest || []).map((inv) => { const t = RL.afschrijvingTabel(inv); const r = t.find((x) => x.jaar === j) || { begin: 0, afschrijving: 0, eind: 0 }; return { inv, r }; }).filter((x) => x.r.begin || x.r.afschrijving || (jaarVan(x.inv.datum) <= j && !x.inv.verkocht));
  const groepen = [...new Set(rows.map((x) => x.inv.cat || 'Overige'))].sort();
  const som = (l) => l.reduce((s, x) => ({ w: s.w + C.num(x.inv.waarde), b: s.b + x.r.begin, a: s.a + x.r.afschrijving, e: s.e + x.r.eind }), { w: 0, b: 0, a: 0, e: 0 });
  const rij = (t, s, cls) => `<tr class="${cls}"><td colspan="3"><b>${t}</b></td><td class="r tab">${eur(s.w)}</td><td class="r tab">${eur(s.b)}</td><td class="r tab"><b>${eur(s.a)}</b></td><td class="r tab">${eur(s.e)}</td><td></td></tr>`;
  return `<div class="dxhead"><h1>Afschrijvingen</h1><span class="sp"></span><div class="row wrap dxknop">${RO ? '' : `<button onclick="investNieuw()">＋ Bestaande afschrijving toevoegen</button>`}<button class="b2o" onclick="print()">🖨 Afdrukken</button></div></div>
  <div class="c dxcard"><p class="mu" style="margin-top:0">Aankopen van ± € 250 of meer die meerdere jaren meegaan, schrijf je af: het eerste jaar pro rata per dag (zoals Dexxter), daarna gelijke jaarlijkse delen. Boek je een kost in de categorie "Investering", dan verschijnt ze hier automatisch.</p>
  <div style="overflow:auto"><table class="t dxt"><tr><th>Beschrijving</th><th>Startdatum</th><th>Termijn</th><th class="r">Totale waarde</th><th class="r">Beginwaarde ${j}</th><th class="r">Af te schrijven ${j}</th><th class="r">Eindwaarde ${j}</th><th class="c0">Acties</th></tr>
  ${groepen.map((g) => { const l = rows.filter((x) => (x.inv.cat || 'Overige') === g); return `<tr class="dxgrp"><td colspan="8"><b>${esc(g)}</b></td></tr>` + l.map(({ inv, r }) => `<tr class="cl" onclick="investOpen('${inv.id}')"><td>${esc(inv.oms || '(zonder naam)')}${inv.verkocht ? `<div class="mu">verkocht ${dt(inv.verkocht)}</div>` : ''}${C.num(inv.beroep || 100) < 100 ? `<div class="mu">${inv.beroep}% beroepsmatig</div>` : ''}</td><td class="nw">${dt(inv.datum)}</td><td class="nw">${inv.jaren} jaar</td><td class="r tab">${eur(inv.waarde)}</td><td class="r tab">${eur(r.begin)}</td><td class="r tab"><b>${eur(r.afschrijving)}</b></td><td class="r tab">${eur(r.eind)}</td><td class="c0"><button class="dxdots" onclick="event.stopPropagation();investOpen('${inv.id}')">⋮</button></td></tr>`).join('') + rij('Subtotaal', som(l), 'dxsub'); }).join('') || '<tr><td colspan="8" class="mu" style="padding:16px">Geen afschrijvingen in ' + j + '.</td></tr>'}
  ${rows.length ? rij('Totaal ' + j, som(rows), 'dxsom') : ''}</table></div></div>`;
};

/* ================= kostencategorieën als kaarten (zoals Dexxter) ================= */
function vKostcatsDx() {
  const l = alleCats(); const q = (filt.q || '').toLowerCase(); const h = filt.kch || '';
  const groepen = [...new Set(l.map((c) => c.h))].sort(); const n = (S.uitgaven || []).reduce((m, u) => (m[u.kc] = (m[u.kc] || 0) + 1, m), {});
  const zicht = l.filter((c) => (!h || c.h === h) && (!q || [c.n, c.oms, c.h].join(' ').toLowerCase().includes(q))).sort((a, b) => a.n.localeCompare(b.n));
  return `<div class="dxhead"><h1>Kostencategorieën</h1><span class="sp"></span>${RO ? '' : `<button onclick="dxKcForm()">＋ Kostencategorie toevoegen</button>`}</div>
  <div class="row wrap" style="gap:10px;margin-bottom:14px"><div class="dxzoek" style="background:var(--card)"><span>🔍</span><input placeholder="Zoeken" value="${esc(filt.q || '')}" oninput="filt.q=this.value;clearTimeout(window._ft);window._ft=setTimeout(R,250)"></div><select style="width:auto;margin:0;min-width:220px" onchange="filt.kch=this.value;R()"><option value="">Alle hoofdcategorieën</option>${groepen.map((g) => `<option ${g === h ? 'selected' : ''}>${esc(g)}</option>`).join('')}</select></div>
  <div class="dxkcg">${zicht.map((c) => `<div class="c dxkcc"><div class="row"><b style="font-size:16px">${esc(c.n)}</b><span class="sp"></span>${RO ? '' : `<button class="dxdots" onclick="dxMenu(event,[['Percentages aanpassen','dxKcForm(\\'${c.id}\\')'],${c.eigen ? `['Verwijderen','kcWeg(\\'${c.id}\\')',{red:1}]` : `['Standaard terugzetten','dxKcReset(\\'${c.id}\\')']`}])">⋮</button>`}</div>
    <div class="row" style="margin:6px 0"><i class="mu">${esc(c.h)}</i><span class="sp"></span>${c.eigen ? '<span class="tag">eigen</span>' : ''}${n[c.id] ? `<span class="tag n">${n[c.id]}× gebruikt</span>` : ''}</div>
    <p style="font-size:13.5px;margin:0 0 10px">${esc(c.oms || '')}</p><div class="dxkv"><span class="mu">% beroepsmatig gebruik</span><b>${c.beroep}%</b></div><div class="dxkv"><span class="mu">% btw-aftrek</span><b>${c.btw}%</b></div>${c.verworpen ? `<div class="dxkv"><span class="mu">% verworpen uitgave</span><b>${c.verworpen}%</b></div>` : ''}</div>`).join('') || '<p class="mu">Niets gevonden.</p>'}</div>`;
}
function dxKcForm(id) {
  if (RO) return; const c = id ? alleCats().find((x) => x.id === id) : { n: '', h: 'Algemene kosten', rooster: '82', beroep: 100, btw: 100, eigen: true };
  const groepen = [...new Set(alleCats().map((x) => x.h))].sort(); window._kc = { id, ...c };
  modal(`<h2 style="color:var(--tx);font-size:17px">${id ? esc(c.n) : 'Kostencategorie toevoegen'}</h2>
  ${!id ? `<label class="f"><span>Naam</span><input oninput="_kc.n=this.value"></label><div class="cols"><label class="f"><span>Hoofdcategorie</span><select onchange="_kc.h=this.value">${groepen.map((g) => `<option ${g === c.h ? 'selected' : ''}>${esc(g)}</option>`).join('')}</select></label><label class="f"><span>Btw-rooster</span><select onchange="_kc.rooster=this.value"><option value="82">82 diensten & diverse goederen</option><option value="81">81 handelsgoederen</option><option value="83">83 investering</option></select></label></div>` : `<p class="mu">${esc(c.oms || '')}</p>`}
  <div class="cols"><label class="f"><span>% beroepsmatig gebruik</span><input inputmode="decimal" value="${c.beroep}" oninput="_kc.beroep=C.num(this.value)"></label><label class="f"><span>% btw-aftrek</span><input inputmode="decimal" value="${c.btw}" oninput="_kc.btw=C.num(this.value)"></label></div>
  <div class="row"><span class="sp"></span><button class="b2o" onclick="sluit()">Annuleren</button><button onclick="dxKcOk()">Opslaan</button></div>`);
}
function dxKcOk() { const x = window._kc; if (x.id) { kcZet(x.id, 'beroep', x.beroep); kcZet(x.id, 'btw', x.btw); } else { if (!(x.n || '').trim()) return alert('Vul een naam in.'); S.cfg.kcEigen = S.cfg.kcEigen || []; S.cfg.kcEigen.push({ id: uid('kc'), n: x.n.trim(), h: x.h, rooster: x.rooster, beroep: x.beroep, btw: x.btw, eigen: true }); save(); } sluit(); R(); }
function dxKcReset(id) { if (S.cfg.kcAanp) delete S.cfg.kcAanp[id]; save(); R(); }

/* ================= router: eigen schermen + menu-item Kostencategorieën ================= */
DXNAV.forEach((n) => { if (n && n.items) n.items.forEach((x) => { if (x[0] === 'kostcats') x.length = 2; }); });
const DXV = { kostcats: vKostcatsDx };
const _R3 = R;
R = function () {
  if (DXV[v]) { dxPvTok++; sideR(); $('#app').innerHTML = DXV[v](); topR(); fabR(); return; }
  _R3();
};
Object.assign(DXFAB, { leveranciers: [['Leverancier toevoegen', 'dxLevForm()', '🏭']], invest: [['Afschrijving toevoegen', 'investNieuw()', '🛠']], kostcats: [['Kostencategorie toevoegen', 'dxKcForm()', '🏷']] });
const _go1 = go;
go = function (nv, id, s) { if (nv !== 'uitgave' && nv !== window._dxLijst && nv !== 'uitgaven') Object.assign(DXK, { bron: '', min: '', max: '', kc: '', lev: '', van: '', tot: '', kw: 0, st: '' }); _go1(nv, id, s); };
