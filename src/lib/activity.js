// 1729 — Activity logging helper
//
// Fire-and-forget event logger. Any failure here MUST NOT propagate; this is
// instrumentation only and a logging error must never break a user flow.

import { supabase } from '../supabaseClient'

export async function logActivity(userId, eventType, { subCommunityId = null, metadata = {} } = {}) {
  if (!userId || !eventType) return
  try {
    const { error } = await supabase.from('activity_log').insert({
      user_id: userId,
      event_type: eventType,
      sub_community_id: subCommunityId,
      metadata,
    })
    if (error) console.warn('[activity] insert error (ignored):', error.message)
  } catch (err) {
    console.warn('[activity] unexpected error (ignored):', err)
  }
}
