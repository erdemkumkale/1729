import React, { createContext, useContext, useState, useEffect, useMemo } from 'react'
import en from '../strings/en'
import tr from '../strings/tr'

const strings = { en, tr }

// ─── Gift-word substitution ──────────────────────────────────────
// Users can swap the default word ("armağan"/"gift") for a plainer
// alternative ("şey"/"thing"). Turkish inflects with vowel harmony, so
// a naive "armağan"→"şey" replace would yield "şeylar" etc. These ordered
// maps (longest form first) cover every inflected form used in the strings.
const giftWordMaps = {
  tr: [
    ['Armağanlarım', 'Şeylerim'], ['armağanlarım', 'şeylerim'],
    ['Armağanlara', 'Şeylere'],   ['armağanlara', 'şeylere'],
    ['Armağanları', 'Şeyleri'],   ['armağanları', 'şeyleri'],
    ['Armağanlar', 'Şeyler'],     ['armağanlar', 'şeyler'],
    ['Armağanımı', 'Şeyimi'],     ['armağanımı', 'şeyimi'],
    ['Armağanını', 'Şeyini'],     ['armağanını', 'şeyini'],
    ['Armağanınla', 'Şeyinle'],   ['armağanınla', 'şeyinle'],
    ['Armağanın', 'Şeyin'],       ['armağanın', 'şeyin'],
    ['Armağanı', 'Şeyi'],         ['armağanı', 'şeyi'],
    ['Armağan', 'Şey'],           ['armağan', 'şey'],
  ],
  en: [
    ['Gifts', 'Things'], ['gifts', 'things'],
    ['Gift', 'Thing'],   ['gift', 'thing'],
  ],
}

const replaceWord = (str, pairs) => {
  let out = str
  for (const [from, to] of pairs) out = out.split(from).join(to)
  return out
}

// Deep-transform string values; leave functions/numbers untouched.
const transformStrings = (val, pairs) => {
  if (typeof val === 'string') return replaceWord(val, pairs)
  if (Array.isArray(val)) return val.map(v => transformStrings(v, pairs))
  if (val && typeof val === 'object') {
    const out = {}
    for (const k in val) out[k] = transformStrings(val[k], pairs)
    return out
  }
  return val
}

// Detect browser language → 'en' or 'tr', fallback 'en'
const detectBrowserLang = () => {
  const lang = navigator.language?.slice(0, 2).toLowerCase()
  return lang === 'tr' ? 'tr' : 'en'
}

const I18nContext = createContext(null)

export function I18nProvider({ children, profileLanguage, profileGiftWord }) {
  const [lang, setLang] = useState(() => {
    // Priority: profile setting → localStorage → browser → fallback en
    if (profileLanguage) return profileLanguage
    const stored = localStorage.getItem('1729_lang')
    if (stored && strings[stored]) return stored
    return detectBrowserLang()
  })

  // Re-sync when profile language loads
  useEffect(() => {
    if (profileLanguage && strings[profileLanguage]) {
      setLang(profileLanguage)
    }
  }, [profileLanguage])

  const setLanguage = (newLang) => {
    if (!strings[newLang]) return
    setLang(newLang)
    localStorage.setItem('1729_lang', newLang)
  }

  const t = useMemo(() => {
    const base = strings[lang] || en
    // 'şey' is the stored alternative token (language-independent flag)
    if (profileGiftWord !== 'şey') return base
    return transformStrings(base, giftWordMaps[lang] || [])
  }, [lang, profileGiftWord])

  return (
    <I18nContext.Provider value={{ t, lang, setLanguage }}>
      {children}
    </I18nContext.Provider>
  )
}

export const useI18n = () => {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider')
  return ctx
}
