// Supabase Edge Function: notify-event
// Called by a signed-in member right after they send a request or a message.
// Body: { type: 'request' | 'message', transaction_id: string }
// E-mails the OTHER person in the thread, if their notification settings allow it.
// The e-mail never says who wrote (only a link back to the site).
// Deploy: Supabase Dashboard → Edge Functions → notify-event (verify JWT ON).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL   = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SITE           = 'https://1729.eco'
const FROM_ADDRESS   = '1729 <hello@1729.eco>'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

const esc = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const preview = (v: string, max = 160) => {
  const clean = v.replace(/\s+/g, ' ').trim()
  return clean.length > max ? clean.slice(0, max).trim() + '…' : clean
}

async function handle(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const admin = createClient(SUPABASE_URL, SERVICE_KEY)
  const jwt = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
  const { data: { user }, error: userErr } = await admin.auth.getUser(jwt)
  if (userErr || !user) return json({ error: 'unauthorized' }, 401)

  const body = await req.json().catch(() => ({}))
  const type = body.type === 'request' ? 'request' : body.type === 'message' ? 'message' : null
  const txId: string = body.transaction_id
  if (!type || !txId) return json({ error: 'invalid body' }, 400)

  const { data: tx } = await admin
    .from('support_transactions')
    .select('id, provider_id, receiver_id, gift_id')
    .eq('id', txId)
    .maybeSingle()
  if (!tx) return json({ error: 'not found' }, 404)
  if (tx.provider_id !== user.id && tx.receiver_id !== user.id) return json({ error: 'forbidden' }, 403)

  const recipientId = tx.provider_id === user.id ? tx.receiver_id : tx.provider_id

  // settings: "gift_interest" for a new request, "new_message" for messages (default on)
  const key = type === 'request' ? 'gift_interest' : 'new_message'
  const { data: prefs } = await admin
    .from('notification_preferences').select('*').eq('user_id', recipientId).maybeSingle()
  if (prefs && prefs[key] === false) return json({ sent: 0, reason: 'disabled' })

  // at most one message e-mail per conversation per hour
  if (type === 'message') {
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count } = await admin
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('transaction_id', txId)
      .eq('sender_id', user.id)
      .gt('created_at', since)
    if ((count ?? 0) > 1) return json({ sent: 0, reason: 'throttled' })
  }

  const { data: recipient } = await admin.auth.admin.getUserById(recipientId)
  const to = recipient?.user?.email
  if (!to) return json({ sent: 0, reason: 'no email' })

  // what the e-mail may show: the gift title and the start of the latest message. Never who wrote it.
  const { data: gift } = await admin.from('gifts').select('title').eq('id', tx.gift_id).maybeSingle()
  const { data: lastMsg } = await admin
    .from('messages')
    .select('content')
    .eq('transaction_id', txId)
    .eq('sender_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  const giftTitle = esc(preview(gift?.title ?? '', 80))
  const quote = lastMsg?.content ? esc(preview(lastMsg.content)) : ''

  const link = `${SITE}/chat/${txId}`
  const isRequest = type === 'request'
  const subject = isRequest
    ? 'Birisi armağanınla ilgilendi / Someone is interested in your gift'
    : 'Yeni mesajın var / You have a new message'
  const lineTr = isRequest
    ? `Birisi <strong>"${giftTitle}"</strong> armağanınla ilgilendi ve sana yazdı.`
    : `<strong>"${giftTitle}"</strong> sohbetinde yeni bir mesajın var.`
  const lineEn = isRequest
    ? `Someone is interested in your gift <strong>"${giftTitle}"</strong> and wrote to you.`
    : `You have a new message in the <strong>"${giftTitle}"</strong> conversation.`
  const quoteHtml = quote
    ? `<blockquote style="margin:16px 0;padding:8px 14px;border-left:3px solid #ccc;color:#444">${quote}</blockquote>`
    : ''

  const html = `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#222;line-height:1.6">
  <p>${lineTr}</p>
  ${quoteHtml}
  <p><a href="${link}" style="display:inline-block;background:#111;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">Sohbeti aç ve yanıtla</a></p>
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
  <p style="color:#666;font-size:14px">${lineEn} <a href="${link}">Open conversation</a></p>
  <p style="color:#999;font-size:12px">Bu e-postaları Ayarlar sayfasından kapatabilirsin. / You can turn these e-mails off in Settings.</p>
</div>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM_ADDRESS, to: [to], subject, html }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    console.error('notify-event resend error:', res.status, err)
    return json({ error: 'mail service error', detail: err }, 502)
  }
  return json({ sent: 1 })
}

Deno.serve(async (req) => {
  try {
    return await handle(req)
  } catch (err) {
    console.error('notify-event crashed:', err)
    return json({ error: 'internal error', detail: String((err as Error)?.message ?? err) }, 500)
  }
})
