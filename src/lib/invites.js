import { supabase } from '../supabaseClient'

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export const generateCode = () =>
  Array.from({ length: 6 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('')

export const getEndDate = (months) => {
  const d = new Date()
  d.setDate(d.getDate() + months * 30)
  return d.toISOString()
}

// Splits on newlines, commas, semicolons and spaces; lower-cases and de-duplicates.
export const parseEmails = (text) => {
  const all = (text || '').split(/[\s,;]+/).map((s) => s.trim().toLowerCase()).filter(Boolean)
  const unique = [...new Set(all)]
  return {
    valid: unique.filter((e) => EMAIL_RE.test(e)),
    invalid: unique.filter((e) => !EMAIL_RE.test(e)),
  }
}

export const createInvitations = async ({ userId, emails, months, communityId }) => {
  const results = []
  for (const email of emails) {
    const code = generateCode()
    const { data, error } = await supabase.from('invitations').insert({
      email,
      inviter_id: userId,
      type: 'prepaid',
      status: 'pending',
      promo_code: code,
      funded_by_inviter: true,
      duration_months: months,
      subscription_ends_at: getEndDate(months),
      sub_community_id: communityId,
    }).select('id').single()
    if (error) {
      results.push({ email, error: error.message || 'failed' })
    } else {
      results.push({ email, code, id: data.id, link: `${window.location.origin}/davet/${data.id}` })
    }
  }
  return results
}

// Returns true if the invite emails were handed to the mail service.
export const sendInviteEmails = async (invitationIds) => {
  if (!invitationIds.length) return true
  try {
    const { error } = await supabase.functions.invoke('send-invite', { body: { invitation_ids: invitationIds } })
    if (error) throw error
    return true
  } catch (err) {
    console.warn('[invites] send-invite failed (links can still be shared manually):', err)
    return false
  }
}
