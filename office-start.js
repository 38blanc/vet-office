/* ---------------- start ---------------- */
(async () => {
  await load();
  if (S.cfg.thema) document.documentElement.dataset.theme = S.cfg.thema;
  const p = new URLSearchParams(location.search);
  R();
  if (p.get('code') && p.get('state') && window.bankTerug) bankTerug(p.get('code'), p.get('state'));
})();
