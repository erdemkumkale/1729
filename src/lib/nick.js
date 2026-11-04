// A member is always their colour. An optional nickname may follow it: "#B5AE3E - (Ada)".
export const nickSuffix = (nick) => {
  const n = (nick || '').trim()
  return n ? ` - (${n})` : ''
}
