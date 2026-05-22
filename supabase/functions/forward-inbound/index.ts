// Supabase Edge Function: forward-inbound
// Resend inbound webhook → forward to personal inbox
// Deploy: supabase functions deploy forward-inbound
// Then set webhook URL in Resend Dashboard → Domains → 1729.eco → Inbound

const RESEND_API_KEY   = Deno.env.get('RESEND_API_KEY')!
const FORWARD_TO       = Deno.env.get('FORWARD_TO')!        // ekumkale@gmail.com
const FROM_ADDRESS     = '1729 <hello@1729.eco>'

Deno.serve(async (req) => {
  // Resend sends inbound as multipart/form-data
  let from = '', subject = '', html = '', text = '', replyTo = ''

  const contentType = req.headers.get('content-type') || ''

  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData()
    from      = form.get('from')?.toString()    || ''
    subject   = form.get('subject')?.toString() || '(no subject)'
    html      = form.get('html')?.toString()    || ''
    text      = form.get('text')?.toString()    || ''
    replyTo   = from
  } else {
    // Fallback: JSON body
    const body = await req.json().catch(() => ({}))
    from      = body.from    || ''
    subject   = body.subject || '(no subject)'
    html      = body.html    || ''
    text      = body.text    || ''
    replyTo   = from
  }

  // Build forwarded email body
  const forwardedHtml = html
    ? `<p style="color:#888;font-size:12px;border-bottom:1px solid #eee;padding-bottom:8px;margin-bottom:16px;">
         <strong>Gönderen:</strong> ${from}<br/>
         <strong>Konu:</strong> ${subject}
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
