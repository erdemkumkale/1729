import { supabase } from '../supabaseClient'

// Fire-and-forget: asks the server to e-mail the other person (respecting their settings).
export const notifyEvent = async (type, transactionId) => {
  try {
    const { error } = await supabase.functions.invoke('notify-event', { body: { type, transaction_id: transactionId } })
    if (error) throw error
  } catch (err) {
    console.warn('[chat] notify-event failed (ignored):', err)
  }
}

// The receiver's current open request for a gift, if any.
export const findOpenRequest = async (giftId, userId) => {
  const { data } = await supabase
    .from('support_transactions')
    .select('id')
    .eq('gift_id', giftId)
    .eq('receiver_id', userId)
    .eq('status', 'active')
    .limit(1)
  return data && data.length ? data[0].id : null
}
