// VET Office – webhook van Recommand: ontvangen Peppol-factuur automatisch bij de kosten zetten + mailmelding
// Instellen in Recommand › Webhooks: URL https://<project>.supabase.co/functions/v1/vet-peppol-hook?k=<PEPPOL_HOOK_KEY>
// Secrets: PEPPOL_HOOK_KEY, RECOMMAND_KEY, RECOMMAND_SECRET, OWNER_ID, (RESEND_API_KEY, MAIL_FROM, MAIL_NOTIFY voor de mail)
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'Content-Type': 'application/json' } });
const tag = (xml: string, name: string) => { const m = xml.match(new RegExp('<(?:\\w+:)?' + name + '(?:\\s[^>]*)?>([^<]*)</(?:\\w+:)?' + name + '>')); return m ? m[1].trim() : ''; };
const blok = (xml: string, name: string) => { const m = xml.match(new RegExp('<(?:\\w+:)?' + name + '[\\s>][\\s\\S]*?</(?:\\w+:)?' + name + '>')); return m ? m[0] : ''; };
const b64 = (u8: Uint8Array) => { let s = ''; for (let i = 0; i < u8.length; i += 8192) s += String.fromCharCode(...u8.subarray(i, i + 8192)); return btoa(s); };
Deno.serve(async (req) => {
  try {
    const url = new URL(req.url); const hookKey = Deno.env.get('PEPPOL_HOOK_KEY');
    if (!hookKey || url.searchParams.get('k') !== hookKey) return json({ error: 'niet toegestaan' }, 401);
    const ev = await req.json().catch(() => ({}));
    if (ev.eventType !== 'document.received' || !ev.documentId) return json({ ok: true, genegeerd: ev.eventType || '' });
    const auth = 'Basic ' + btoa(Deno.env.get('RECOMMAND_KEY') + ':' + Deno.env.get('RECOMMAND_SECRET'));
    const owner = Deno.env.get('OWNER_ID')!, SB = Deno.env.get('SUPABASE_URL')!, SR = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const r = await fetch('https://app.recommand.eu/api/v1/documents/' + ev.documentId, { headers: { Authorization: auth, Accept: 'application/xml' } });
    let xml = await r.text(); if (!xml.trim().startsWith('<')) { try { const j = JSON.parse(xml); xml = j.xml || j.document?.xml || ''; } catch { xml = ''; } }
    if (!xml) return json({ error: 'document niet gevonden' }, 502);
    const sup = blok(xml, 'AccountingSupplierParty');
    const lev = tag(blok(sup, 'PartyName'), 'Name') || tag(sup, 'RegistrationName');
    const nr = tag(xml, 'ID'), datum = tag(xml, 'IssueDate'), totaal = Number(tag(blok(xml, 'LegalMonetaryTotal'), 'PayableAmount') || 0);
    const pdfM = xml.match(/<(?:\w+:)?EmbeddedDocumentBinaryObject[^>]*mimeCode="application\/pdf"[^>]*>([\s\S]*?)<\/(?:\w+:)?EmbeddedDocumentBinaryObject>/);
    const up = async (naam: string, body: Uint8Array, type: string) => { const p = owner + '/peppol-' + ev.documentId + '-' + naam; const u = await fetch(SB + '/storage/v1/object/vet-files/' + p, { method: 'POST', headers: { Authorization: 'Bearer ' + SR, apikey: SR, 'Content-Type': type, 'x-upsert': 'true' }, body }); if (!u.ok) throw new Error('opslag ' + u.status); return 'vf:' + p; };
    const xmlRef = await up('factuur.xml', new TextEncoder().encode(xml), 'application/xml');
    let pdfRef = ''; if (pdfM) { const bin = Uint8Array.from(atob(pdfM[1].replace(/\s/g, '')), (c) => c.charCodeAt(0)); pdfRef = await up('factuur.pdf', bin, 'application/pdf'); }
    const id = 'pp' + String(ev.documentId).replace(/\W/g, '');
    const data = { id, extId: ev.documentId, xml: xmlRef, pdf: pdfRef, leverancier: lev, nr, datum, totaal, bron: 'peppol', ontvangen: new Date().toISOString() };
    const ins = await fetch(SB + '/rest/v1/docs?on_conflict=user_id,app,kind,id', { method: 'POST', headers: { Authorization: 'Bearer ' + SR, apikey: SR, 'Content-Type': 'application/json', Prefer: 'resolution=ignore-duplicates,return=minimal' }, body: JSON.stringify([{ user_id: owner, app: 'office', kind: 'peppolin', id, data, deleted: false }]) });
    if (!ins.ok) throw new Error('database ' + ins.status + ' ' + (await ins.text()).slice(0, 200));
    await fetch('https://app.recommand.eu/api/v1/documents/' + ev.documentId + '/mark-as-read', { method: 'POST', headers: { Authorization: auth, 'Content-Type': 'application/json' }, body: JSON.stringify({ read: true }) }).catch(() => {});
    const rk = Deno.env.get('RESEND_API_KEY'), from = Deno.env.get('MAIL_FROM'), to = Deno.env.get('MAIL_NOTIFY');
    if (rk && from && to) {
      const att = pdfRef && pdfM ? [{ filename: (lev || 'factuur').replace(/[^\w.-]+/g, '-') + '-' + nr + '.pdf', content: pdfM[1].replace(/\s/g, '') }] : [];
      await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + rk, 'Content-Type': 'application/json' }, body: JSON.stringify({ from, to: [to], subject: 'Nieuwe Peppol-factuur van ' + (lev || 'onbekend') + (nr ? ' (' + nr + ')' : ''), text: `Er is een nieuwe factuur binnengekomen via Peppol.\n\nLeverancier: ${lev}\nNummer: ${nr}\nDatum: ${datum}\nTe betalen: € ${totaal.toFixed(2).replace('.', ',')}\n\nDe factuur staat bij je kosten in VET Office: https://38blanc.github.io/vet-office/`, attachments: att }) }).catch(() => {});
    }
    return json({ ok: true, id });
  } catch (e) { return json({ error: (e as Error).message }, 500); }
});
