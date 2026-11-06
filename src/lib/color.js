import { supabase } from '../supabaseClient'

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

export const hslToHex = (h, s, l) => {
  const f = (n) => {
    const k = (n + h / 30) % 12
    const a = (s / 100) * Math.min(l / 100, 1 - l / 100)
    const val = l / 100 - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)))
    return Math.round(255 * val).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

const hexToHue = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b)
  const d = max - Math.min(r, g, b)
  if (d === 0) return 0
  let h
  if (max === r) h = ((g - b) / d) % 6
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  return (h * 60 + 360) % 360
}

// Picks the hue farthest from every colour already taken, so two members never look alike.
export const generateHexColor = (taken = []) => {
  const takenHues = taken.filter((x) => /^#[0-9a-fA-F]{6}$/.test(x)).map(hexToHue)
  let h = Math.floor(Math.random() * 360)
  if (takenHues.length) {
    let best = -1
    for (let i = 0; i < 60; i++) {
      const cand = Math.floor(Math.random() * 360)
      const gap = Math.min(...takenHues.map((t) => { const d = Math.abs(cand - t); return Math.min(d, 360 - d) }))
      if (gap > best) { best = gap; h = cand }
    }
  }
  const s = 60 + Math.floor(Math.random() * 20)  // 60–80%: always saturated
  const l = 48 + Math.floor(Math.random() * 10)  // 48–58%: never too dark or light
  return hslToHex(h, s, l)
}

export const fetchTakenColors = async () => {
  const { data } = await supabase.rpc('all_hex_codes')
  return Array.isArray(data) ? data.map((r) => (typeof r === 'string' ? r : r.hex_code)).filter(Boolean) : []
}

