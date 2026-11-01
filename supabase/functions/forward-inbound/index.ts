// Supabase Edge Function: forward-inbound
// Resend inbound webhook → forward to personal inbox
// Deploy: supabase functions deploy forward-inbound
// Then set webhook URL in Resend Dashboard → Domains → 1729.eco → Inbound

const RESEND_API_KEY   = Deno.env.get('RESEND_API_KEY')!
const FORWARD_TO       = Deno.env.get('FORWARD_TO')!        // ekumkale@gmail.com
const FROM_ADDRESS     = '1729 <hello@1729.eco>'
// Shared secret: the Resend webhook URL must end with  ?token=<INBOUND_SECRET>
const INBOUND_SECRET   = Deno.env.get('INBOUND_SECRET')

const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

Deno.serve(async (req) => {
  // Only Resend (which knows the secret in the URL) may call this.
  const token = new URL(req.url).searchParams.get('token')
  if (!INBOUND_SECRET || token !== INBOUND_SECRET) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 })
  }

  let from = '', subject = '', html = '', text = '', replyTo = ''

  // Resend webhook only sends metadata — fetch full email content via API
  const body   = await req.json().catch(() => ({}))
  const mail   = body.data ?? body
  from         = mail.from    || ''
  subject      = mail.subject || '(no subject)'
  replyTo      = from

  // Resend ids are UUIDs; anything else must never reach the API URL.
  const emailId = /^[0-9a-f-]{36}$/i.test(String(mail.email_id ?? '')) ? mail.email_id : ''
  if (emailId) {
    for (const url of [
      `https://api.resend.com/emails/receiving/${emailId}`,
    ]) {
      const fetchRes = await fetch(url, {
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}` },
      })
      const full = await fetchRes.json()
      console.log(`${url} →`, JSON.stringify(full).slice(0, 500))
      if (fetchRes.ok && (full.html || full.text)) {
        html = full.html || ''
        text = full.text || ''
        break
      }
    }
  }

  // Last resort: show metadata so mail isn't blank
  if (!html && !text) {
    text = `Gönderen: ${from}\nKonu: ${subject}\n\n[İçerik alınamadı — Resend inbound API body içermiyor olabilir]`
  }

  // Build forwarded email body
  const forwardedHtml = html
    ? `<p style="color:#888;font-size:12px;border-bottom:1px solid #eee;padding-bottom:8px;margin-bottom:16px;">
         <strong>Gönderen:</strong> ${esc(from)}<br/>
         <strong>Konu:</strong> ${esc(subject)}
       </p>${html}`
    : `Gönderen: ${from}\nKonu: ${subject}\n\n${text}`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from:     FROM_ADDRESS,
      to:       [FORWARD_TO],
      reply_to: replyTo,          // "Reply" tuşuna basınca asıl gönderenin adresi açılır
      subject:  `Fwd: ${subject}`,
      ...(html ? { html: forwardedHtml } : { text: forwardedHtml }),
    }),
  })

  if (!res.ok) {
    const err = await res.json()
    console.error('forward-inbound error:', err)
    return new Response(JSON.stringify({ error: err }), { status: 500 })
  }

  const result = await res.json()
  console.log('Forwarded:', result.id, '| From:', from, '| Subject:', subject)
  return new Response(JSON.stringify({ forwarded: result.id }), { status: 200 })
})
