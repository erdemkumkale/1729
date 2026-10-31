import { supabase } from '../supabaseClient'

const WINDOW_DAYS = 30

// Announcements from the last 30 days that this member can see, newest first, with their read state.
export const fetchAnnouncements = async (userId, limit = 20) => {
  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString()
  const { data: items } = await supabase
    .from('announcements')
    .select('id, body, created_at, sub_community_id, community:sub_community_id(name)')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(limit)
  const { data: reads } = await supabase
    .from('announcement_reads').select('announcement_id').eq('user_id', userId)
  const readIds = new Set((reads || []).map((r) => r.announcement_id))
  return (items || []).map((a) => ({ ...a, unread: !readIds.has(a.id) }))
}

export const markAnnouncementsRead = async (userId, ids) => {
  if (!ids.length) return
  await supabase
    .from('announcement_reads')
    .upsert(ids.map((id) => ({ user_id: userId, announcement_id: id })), { onConflict: 'user_id,announcement_id' })
}

// communityId = null posts from #1729 (admin only). Returns { ok, error, emailed }.
export const postAnnouncement = async ({ communityId, body, important = false, sendEmail = false }) => {
  const { data: id, error } = await supabase.rpc('post_announcement', {
    p_community: communityId, p_body: body, p_important: important,
  })
  if (error || !id) {
    const msg = error?.message || ''
    return { ok: false, error: msg.includes('too_soon') ? 'too_soon' : 'failed' }
  }
  let emailed = null
  if (sendEmail || (communityId === null && important)) {
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('send-announcement', { body: { announcement_id: id } })
      if (fnErr) throw fnErr
      emailed = data?.sent ?? 0
      if (data?.reason === 'disabled') emailed = 'disabled'
    } catch (err) {
      console.warn('[announcements] e-mail step failed:', err)
      emailed = 'failed'
    }
  }
  return { ok: true, emailed }
}

export const deleteAnnouncement = (id) => supabase.rpc('delete_announcement', { p_id: id })
