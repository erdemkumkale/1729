// Picks black or white text, whichever reads better on the given #rrggbb background (WCAG contrast).
const channel = (v) => {
  const c = v / 255
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

const luminance = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

export const readableText = (hex) => {
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return '#0C0C0B'
  const l = luminance(hex)
  const contrastWithWhite = 1.05 / (l + 0.05)
  const contrastWithDark = (l + 0.05) / (luminance('#0C0C0B') + 0.05)
  return contrastWithWhite >= contrastWithDark ? '#FFFFFF' : '#0C0C0B'
}
