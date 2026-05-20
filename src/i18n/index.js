import React, { createContext, useContext, useState, useEffect } from 'react'
import en from '../strings/en'
import tr from '../strings/tr'

const strings = { en, tr }

// Detect browser language → 'en' or 'tr', fallback 'en'
const detectBrowserLang = () => {
  const lang = navigator.language?.slice(0, 2).toLowerCase()
  return lang === 'tr' ? 'tr' : 'en'
}

const I18nContext = createContext(null)

export function I18nProvider({ children, profileLanguage }) {
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

  const t = strings[lang] || en

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
