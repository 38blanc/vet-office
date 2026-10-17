/* ---------------- start ---------------- */
(async () => {
  await load();
  if (S.cfg.thema && window.vetThema) { try { if (!localStorage.getItem('vetThema')) vetThema(S.cfg.thema); } catch (e) {} } // eenmalig overnemen van de oude instelling
  const p = new URLSearchParams(location.search);
  R();
  if (p.get('code') && p.get('state') && window.bankTerug) bankTerug(p.get('code'), p.get('state'));
})();
