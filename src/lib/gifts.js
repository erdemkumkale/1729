// Short card title from the text a member wrote: the whole text if it is short,
// otherwise the first words followed by an ellipsis.
export const makeTitle = (text) => {
  const clean = (text || '').trim().replace(/\s+/g, ' ')
  if (clean.length <= 60) return clean
  return clean.split(' ').slice(0, 8).join(' ').slice(0, 60).trim() + '…'
}

// The icon column arrives with a database step; until then saving must still work without it.
export const isMissingIconColumn = (err) =>
  !!err && /icon/i.test(err.message || '') && /column|schema cache/i.test(err.message || '')

const withoutIcon = ({ icon, ...rest }) => rest // eslint-disable-line no-unused-vars

// Runs a gift write with the icon, and once more without it if the column does not exist yet.
export const writeGift = async (run, row) => {
  const first = await run(row)
  if (first.error && isMissingIconColumn(first.error)) return run(withoutIcon(row))
  return first
}

// Which communities a card is shown in. No rows = all of the creator's communities.
// Quietly does nothing until the gift_communities table exists.
export const loadGiftCommunities = async (supabase, giftId) => {
  const { data, error } = await supabase.from('gift_communities').select('community_id').eq('gift_id', giftId)
  return error ? [] : (data || []).map((r) => r.community_id)
}

export const saveGiftCommunities = async (supabase, giftId, ids) => {
  if (!ids) return // the picker was not shown (member of a single community)
  await supabase.from('gift_communities').delete().eq('gift_id', giftId)
  if (ids.length === 0) return
  await supabase.from('gift_communities').insert(ids.map((community_id) => ({ gift_id: giftId, community_id })))
}
