// VET Office – mail versturen via Resend (facturen met bijlagen, testmail)
// Secrets: RESEND_API_KEY, MAIL_FROM (bv. "Van Eyen Technics <info@vaneyentechnics.be>"), optioneel OWNER_ID
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...CORS, 'Content-Type': 'application/json' } });
const sub = (req: Request) => { try { const t = (req.headers.get('authorization') || '').split(' ')[1]; return JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).sub as string; } catch { return ''; } };
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const key = Deno.env.get('RESEND_API_KEY'), from = Deno.env.get('MAIL_FROM'), owner = Deno.env.get('OWNER_ID');
    if (owner && sub(req) !== owner) return json({ error: 'Geen toegang.' }, 403);
    if (!key || !from) return json({ error: 'Mail is nog niet ingesteld (secrets RESEND_API_KEY en MAIL_FROM ontbreken).' });
    const b = await req.json();
    if (!b.to || !b.subject) return json({ error: 'Ontvanger of onderwerp ontbreekt.' });
    const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: Array.isArray(b.to) ? b.to : [b.to], subject: b.subject, text: b.text || '', reply_to: b.replyTo || undefined, attachments: (b.attachments || []).map((a: any) => ({ filename: a.filename, content: a.content })) }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return json({ error: j.message || j.error || ('Resend ' + r.status) });
    return json({ id: j.id });
  } catch (e) { return json({ error: (e as Error).message }); }
});
