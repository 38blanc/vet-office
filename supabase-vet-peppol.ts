// VET Office – Peppol via Recommand (https://docs.recommand.eu)
// Secrets: RECOMMAND_KEY, RECOMMAND_SECRET, RECOMMAND_COMPANY, optioneel OWNER_ID (enkel deze gebruiker mag versturen)
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const BASE = 'https://app.recommand.eu/api';
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...CORS, 'Content-Type': 'application/json' } });
const sub = (req: Request) => { try { const t = (req.headers.get('authorization') || '').split(' ')[1]; return JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).sub as string; } catch { return ''; } };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const key = Deno.env.get('RECOMMAND_KEY'), secret = Deno.env.get('RECOMMAND_SECRET'), company = Deno.env.get('RECOMMAND_COMPANY');
    const owner = Deno.env.get('OWNER_ID');
    const body = await req.json().catch(() => ({}));
    if (owner && sub(req) !== owner) return json({ error: 'Geen toegang tot Peppol voor dit account.' }, 403);
    if (!key || !secret) return json({ ok: false, message: 'Peppol is nog niet ingesteld (secrets RECOMMAND_KEY/RECOMMAND_SECRET ontbreken).' });
    const auth = 'Basic ' + btoa(key + ':' + secret);
    const call = async (path: string, init: RequestInit = {}) => {
      const r = await fetch(BASE + path, { ...init, headers: { Authorization: auth, 'Content-Type': 'application/json', ...(init.headers || {}) } });
      const t = await r.text(); let j: any; try { j = JSON.parse(t); } catch { j = { raw: t }; }
      if (!r.ok || j.success === false) throw new Error((j.errors ? JSON.stringify(j.errors).slice(0, 400) : j.message || j.error || t.slice(0, 300)) || ('HTTP ' + r.status));
      return j;
    };
    switch (body.action) {
      case 'status': { await call('/core/auth/verify'); return json({ ok: true, provider: 'Recommand', company: company || '(RECOMMAND_COMPANY ontbreekt)' }); }
      case 'verify': { const j = await call('/v1/verify', { method: 'POST', body: JSON.stringify({ peppolAddress: body.peppolAddress }) }); return json({ isValid: !!(j.isValid ?? j.data?.isValid) }); }
      case 'send': {
        if (!company) return json({ error: 'RECOMMAND_COMPANY ontbreekt.' });
        const j = await call(`/v1/${company}/send`, { method: 'POST', body: JSON.stringify({ recipient: body.recipient, documentType: 'xml', document: body.xml }) });
        return json({ id: j.id, sentOverPeppol: j.sentOverPeppol, deliveryStatus: j.deliveryStatus });
      }
      case 'inbox': { const j = await call('/v1/inbox' + (company ? '?companyId=' + company : '')); return json({ documents: (j.documents || []).map((d: any) => ({ id: d.id, type: d.type, createdAt: d.createdAt })) }); }
      case 'get': {
        const r = await fetch(BASE + '/v1/documents/' + body.id, { headers: { Authorization: auth, Accept: 'application/xml' } });
        let xml = await r.text();
        if (!xml.trim().startsWith('<')) { try { const j = JSON.parse(xml); xml = j.xml || j.document?.xml || ''; } catch { xml = ''; } }
        return json({ xml });
      }
      case 'markread': { await call(`/v1/documents/${body.id}/mark-as-read`, { method: 'POST', body: JSON.stringify({ read: true }) }); return json({ ok: true }); }
      default: return json({ error: 'Onbekende actie' }, 400);
    }
  } catch (e) { return json({ error: (e as Error).message }); }
});
