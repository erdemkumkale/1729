// Supabase Edge Function: send-announcement
// Called by the author (JWT verified) right after post_announcement, with { announcement_id }.
// E-mails the announcement, only when the secret ANNOUNCE_EMAILS_ENABLED is "true".
//  - from #1729 (no community): admins only, and only when the announcement is marked important
//  - from a community: its founder, at most one e-mailed announcement per community per week
// Members who turned off "announcement e-mails" in Settings are skipped. Nobody sees who else got it,
// and the author is never named.
// Deploy: Supabase Dashboard → Edge Functions → send-announcement (verify JWT ON).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL   = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ENABLED        = Deno.env.get('ANNOUNCE_EMAILS_ENABLED') === 'true'
const SITE           = 'https://1729.eco'
const FROM_ADDRESS   = '1729 <hello@1729.eco>'
const MAX_RECIPIENTS = 300

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

const esc = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

async function handle(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (!ENABLED) return json({ sent: 0, reason: 'disabled' })

  const admin = createClient(SUPABASE_URL, SERVICE_KEY)
  const jwt = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
  const { data: { user }, error: userErr } = await admin.auth.getUser(jwt)
  if (userErr || !user) return json({ error: 'unauthorized' }, 401)

  const body = await req.json().catch(() => ({}))
  const id: string = body.announcement_id
  if (!id) return json({ error: 'invalid body' }, 400)

  const { data: ann } = await admin
    .from('announcements').select('id, sub_community_id, body, important, emailed_at').eq('id', id).maybeSingle()
  if (!ann) return json({ error: 'not found' }, 404)
  if (ann.emailed_at) return json({ sent: 0, reason: 'already sent' })

  let label = '#1729'
  let recipientIds: string[] = []

  if (!ann.sub_community_id) {
    const { data: isAdmin } = await admin.from('app_admins').select('user_id').eq('user_id', user.id).maybeSingle()
    if (!isAdmin) return json({ error: 'forbidden' }, 403)
    if (!ann.important) return json({ sent: 0, reason: 'not important' })
    const ids: string[] = []
    for (let page = 1; page <= 10; page++) {
      const { data } = await admin.auth.admin.listUsers({ page, perPage: 200 })
      const users = data?.users ?? []
      ids.push(...users.filter((u) => u.email_confirmed_at).map((u) => u.id))
      if (users.length < 200) break
    }
    recipientIds = ids
  } else {
    const { data: comm } = await admin
      .from('sub_communities').select('name, owner_id').eq('id', ann.sub_community_id).maybeSingle()
    if (!comm || comm.owner_id !== user.id) return json({ error: 'forbidden' }, 403)
    label = comm.name
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { count } = await admin
      .from('announcements').select('id', { count: 'exact', head: true })
      .eq('sub_community_id', ann.sub_community_id).gt('emailed_at', weekAgo)
    if ((count ?? 0) > 0) return json({ sent: 0, reason: 'weekly limit' })
    const { data: members } = await admin
      .from('sub_community_members').select('user_id').eq('sub_community_id', ann.sub_community_id)
    recipientIds = (members ?? []).map((m) => m.user_id).filter((uid) => uid !== user.id)
  }

  if (recipientIds.length > MAX_RECIPIENTS) return json({ error: 'too many recipients' }, 400)

  const { data: prefs } = await admin
    .from('notification_preferences').select('user_id, announcement_emails').in('user_id', recipientIds)
  const optedOut = new Set((prefs ?? []).filter((p) => p.announcement_emails === false).map((p) => p.user_id))
  const { data: profs } = await admin.from('profiles').select('id, language').in('id', recipientIds)
  const langOf = new Map((profs ?? []).map((p) => [p.id, p.language]))

  const emails: Record<string, unknown>[] = []
  for (const uid of recipientIds) {
    if (optedOut.has(uid)) continue
    const { data: u } = await admin.auth.admin.getUserById(uid)
    const to = u?.user?.email
    if (!to) continue
    const en = langOf.get(uid) === 'en'
    const open = en ? 'Open 1729' : "1729'u aç"
    const foot = en
      ? 'You can turn off announcement e-mails in Settings. / Duyuru e-postalarını Ayarlar sayfasından kapatabilirsin.'
      : 'Duyuru e-postalarını Ayarlar sayfasından kapatabilirsin. / You can turn off announcement e-mails in Settings.'
    const preview = ann.body.replace(/\s+/g, ' ').trim()
    emails.push({
      from: FROM_ADDRESS,
      to: [to],
      subject: `${label}: ${preview.length > 60 ? preview.slice(0, 60).trim() + '…' : preview}`,
      headers: { 'List-Unsubscribe': `<${SITE}/settings>` },
      html: `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#222;line-height:1.6">
  <p style="color:#666;font-size:14px;margin:0 0 8px">${esc(label)}</p>
  <p style="white-space:pre-wrap;margin:0 0 16px">${esc(ann.body)}</p>
  <p><a href="${SITE}/messages" style="display:inline-block;background:#111;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">${open}</a></p>
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
  <p style="color:#999;font-size:12px">${foot}</p>
</div>`,
    })
  }

  let sent = 0
  for (let i = 0; i < emails.length; i += 100) {
    const chunk = emails.slice(i, i + 100)
    const res = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(chunk),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('send-announcement resend error:', res.status, err)
      return json({ error: 'mail service error', sent, detail: err }, 502)
    }
    sent += chunk.length
  }

  await admin.from('announcements').update({ emailed_at: new Date().toISOString() }).eq('id', id)
  return json({ sent })
}

Deno.serve(async (req) => {
  try {
    return await handle(req)
  } catch (err) {
    console.error('send-announcement crashed:', err)
    return json({ error: 'internal error', detail: String((err as Error)?.message ?? err) }, 500)
  }
})
