// Short card title from the text a member wrote: the whole text if it is short,
// otherwise the first words followed by an ellipsis.
export const makeTitle = (text) => {
  const clean = (text || '').trim().replace(/\s+/g, ' ')
  if (clean.length <= 60) return clean
  return clean.split(' ').slice(0, 8).join(' ').slice(0, 60).trim() + '…'
}
