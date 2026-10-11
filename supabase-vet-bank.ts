// VET Office – bankrekening via Enable Banking (PSD2, alleen lezen) – https://enablebanking.com/docs/api
// Secrets: EB_APP_ID, EB_PRIVATE_KEY (inhoud van het .pem-bestand), optioneel OWNER_ID
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const BASE = 'https://api.enablebanking.com';
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...CORS, 'Content-Type': 'application/json' } });
const b64u = (b: ArrayBuffer | Uint8Array | string) => { const s = typeof b === 'string' ? btoa(b) : btoa(String.fromCharCode(...new Uint8Array(b as ArrayBuffer))); return s.replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_'); };
const sub = (req: Request) => { try { const t = (req.headers.get('authorization') || '').split(' ')[1]; return JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).sub as string; } catch { return ''; } };

async function jwt(appId: string, pem: string) {
  const der = Uint8Array.from(atob(pem.replace(/-----[^-]+-----/g, '').replace(/\s/g, '')), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const now = Math.floor(Date.now() / 1000);
  const head = b64u(JSON.stringify({ typ: 'JWT', alg: 'RS256', kid: appId }));
  const body = b64u(JSON.stringify({ iss: 'enablebanking.com', aud: 'api.enablebanking.com', iat: now, exp: now + 3600 }));
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(head + '.' + body));
  return head + '.' + body + '.' + b64u(sig);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const appId = Deno.env.get('EB_APP_ID'), pem = Deno.env.get('EB_PRIVATE_KEY'), owner = Deno.env.get('OWNER_ID');
    if (owner && sub(req) !== owner) return json({ error: 'Geen toegang tot de bank voor dit account.' }, 403);
    if (!appId || !pem) return json({ error: 'Bankkoppeling is nog niet ingesteld (secrets EB_APP_ID/EB_PRIVATE_KEY ontbreken).' });
    const token = await jwt(appId, pem);
    const call = async (path: string, init: RequestInit = {}) => {
      const r = await fetch(BASE + path, { ...init, headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', ...(init.headers || {}) } });
      const t = await r.text(); let j: any; try { j = JSON.parse(t); } catch { j = { raw: t }; }
      if (!r.ok) throw new Error(j.message || j.detail || j.error || t.slice(0, 300));
      return j;
    };
    const body = await req.json().catch(() => ({}));
    switch (body.action) {
      case 'start': {
        const lijst = await call('/aspsps?country=' + (body.country || 'BE'));
        const want = String(body.bank || '').toLowerCase();
        const a = (lijst.aspsps || []).find((x: any) => x.name.toLowerCase() === want) || (lijst.aspsps || []).find((x: any) => x.name.toLowerCase().includes(want.split(' ')[0]));
        if (!a) return json({ error: 'Bank niet gevonden: ' + body.bank + '. Beschikbaar: ' + (lijst.aspsps || []).map((x: any) => x.name).join(', ') });
        const valid = new Date(Date.now() + 179 * 864e5).toISOString();
        const j = await call('/auth', { method: 'POST', body: JSON.stringify({ access: { valid_until: valid }, aspsp: { name: a.name, country: a.country }, state: body.state, redirect_url: body.redirect, psu_type: 'personal' }) });
        return json({ url: j.url });
      }
      case 'session': {
        const j = await call('/sessions', { method: 'POST', body: JSON.stringify({ code: body.code }) });
        return json({ session_id: j.session_id, valid_until: j.access?.valid_until, accounts: (j.accounts || []).map((x: any) => ({ uid: x.uid, iban: x.account_id?.iban || '', name: x.name || x.product || '' })) });
      }
      case 'transactions': {
        let tx: any[] = []; let cont = ''; let n = 0;
        do {
          const q = new URLSearchParams({ date_from: body.date_from || new Date(Date.now() - 90 * 864e5).toISOString().slice(0, 10) }); if (cont) q.set('continuation_key', cont);
          const j = await call(`/accounts/${body.account}/transactions?` + q.toString());
          tx = tx.concat(j.transactions || []); cont = j.continuation_key || ''; n++;
        } while (cont && n < 20);
        let balance = null;
        try { const b = await call(`/accounts/${body.account}/balances`); const bl = (b.balances || []).find((x: any) => ['CLBD', 'ITAV', 'XPCD'].includes(x.balance_type)) || (b.balances || [])[0]; if (bl) balance = Number(bl.balance_amount.amount); } catch { /* saldo optioneel */ }
        return json({ transactions: tx, balance });
      }
      default: return json({ error: 'Onbekende actie' }, 400);
    }
  } catch (e) { return json({ error: (e as Error).message }); }
});
