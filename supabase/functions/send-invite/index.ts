// Supabase Edge Function: send-invite
// Called by the signed-in inviter with { invitation_ids: string[] }.
// Sends one invite email per pending invitation the caller owns, via Resend.
// Deploy: Supabase Dashboard → Edge Functions → send-invite (verify JWT ON).

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

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

async function handle(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const admin = createClient(SUPABASE_URL, SERVICE_KEY)
  const jwt = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
  const { data: { user }, error: userErr } = await admin.auth.getUser(jwt)
  if (userErr || !user) return json({ error: 'unauthorized' }, 401)

  const body = await req.json().catch(() => ({}))
  const ids: string[] = Array.isArray(body.invitation_ids) ? body.invitation_ids : []
  const notifyInviter = body.notify_inviter !== false
  if (ids.length === 0 || ids.length > 50) return json({ error: 'invalid invitation_ids' }, 400)

  const { data: invites } = await admin
    .from('invitations')
    .select('id, email, sub_community_id')
    .in('id', ids)
    .eq('inviter_id', user.id)
    .eq('status', 'pending')
  if (!invites || invites.length === 0) return json({ sent: 0 })

  const communityIds = [...new Set(invites.map((i) => i.sub_community_id).filter(Boolean))]
  const names: Record<string, string> = {}
  if (communityIds.length) {
    const { data: comms } = await admin
      .from('sub_communities').select('id, name, members_aware').in('id', communityIds)
    for (const c of comms ?? []) if (c.members_aware) names[c.id] = c.name
  }

  // lead with the inviter's language (the invitee has no profile yet)
  const { data: inviterProfile } = await admin.from('profiles').select('language').eq('id', user.id).maybeSingle()
  const firstEn = inviterProfile?.language === 'en'

  const emails = invites.map((inv) => {
    const link = `${SITE}/davet/${inv.id}`
    const group = inv.sub_community_id ? names[inv.sub_community_id] : undefined
    const groupTr = group ? ` <strong>${esc(group)}</strong> topluluğuna` : ''
    const groupEn = group ? ` the <strong>${esc(group)}</strong> community` : ' a community'
    const trBlock = `
  <p>Bir 1729 üyesi seni${groupTr} davet etti.</p>
  <p>1729, güvendiğin küçük bir çemberde kimin neyi kolayca verebileceğini görünür kılan bir yer. Burada isim yok, sadece bir renk var.</p>
  <p><a href="${link}" style="display:inline-block;background:#111;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">Daveti kabul et</a></p>`
    const enBlock = `
  <p>A 1729 member invited you to join${groupEn}.</p>
  <p>1729 is a small, trusted circle where people share what they can easily give. No names here, just a colour.</p>
  <p><a href="${link}" style="display:inline-block;background:#111;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">Accept the invitation</a></p>`
    const trSmall = `<p style="color:#666;font-size:14px">Bir 1729 üyesi seni${groupTr} davet etti. 1729, güvendiğin küçük bir çemberde kimin neyi kolayca verebileceğini görünür kılan bir yer. Burada isim yok, sadece bir renk var.</p><p style="color:#666;font-size:14px"><a href="${link}">${link}</a></p>`
    const enSmall = `<p style="color:#666;font-size:14px">A 1729 member invited you to join${groupEn}. 1729 is a small, trusted circle where people share what they can easily give. No names here, just a colour.</p><p style="color:#666;font-size:14px"><a href="${link}">${link}</a></p>`
    const html = `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#222;line-height:1.6">
  ${firstEn ? enBlock : trBlock}
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
  ${firstEn ? trSmall : enSmall}
  <p style="color:#999;font-size:12px">${firstEn ? "If you weren't expecting this, you can ignore it. / Bu daveti beklemiyorsan görmezden gelebilirsin." : "Bu daveti beklemiyorsan görmezden gelebilirsin. / If you weren't expecting this, you can ignore it."}</p>
</div>`
    return {
      from: FROM_ADDRESS,
      to: [inv.email],
      subject: firstEn ? "You're invited to 1729 / 1729'a davetlisin" : "1729'a davetlisin / You're invited to 1729",
      html,
    }
  })

  // Summary to the inviter: who was invited and the links, so nothing depends on the screen.
  if (notifyInviter && user.email) {
    const rows = invites.map((inv) => {
      const link = `${SITE}/davet/${inv.id}`
      return `<li style="margin-bottom:10px">${esc(inv.email)}<br/><a href="${link}">${link}</a></li>`
    }).join('')
    emails.push({
      from: FROM_ADDRESS,
      to: [user.email],
      subject: firstEn
        ? `Your invitations were sent (${invites.length}) / Davetlerin gönderildi`
        : `Davetlerin gönderildi (${invites.length}) / Your invitations were sent`,
      html: `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#222;line-height:1.6">
  ${firstEn
    ? `<p>Invitation emails were sent to ${invites.length} ${invites.length === 1 ? 'person' : 'people'}. If you hear nothing back, you can share the links below yourself.</p>`
    : `<p>${invites.length} kişiye davet e-postası gönderildi. Yanıt gelmezse aşağıdaki linkleri kendin de paylaşabilirsin.</p>`}
  <ul style="padding-left:18px">${rows}</ul>
  <p style="color:#666;font-size:14px">${firstEn
    ? 'You can check their status in 1729 under Trust Circle → Invited.'
    : "Davetlerin durumunu 1729'da Güven Çemberi → Davet Ettiklerim sayfasından görebilirsin."}</p>
</div>`,
    })
  }

  const res = await fetch('https://api.resend.com/emails/batch', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(emails),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    console.error('send-invite resend error:', res.status, err)
    return json({ error: 'mail service error', detail: err }, 502)
  }
  return json({ sent: invites.length })
}

Deno.serve(async (req) => {
  try {
    return await handle(req)
  } catch (err) {
    console.error('send-invite crashed:', err)
    return json({ error: 'internal error', detail: String((err as Error)?.message ?? err) }, 500)
  }
})
