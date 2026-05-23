import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../i18n'

const generateHexColor = () => {
  const h = Math.floor(Math.random() * 360)
  const s = 60 + Math.floor(Math.random() * 20)  // 60–80%: always saturated
  const l = 48 + Math.floor(Math.random() * 10)  // 48–58%: never too dark or light
  const f = (n) => {
    const k = (n + h / 30) % 12
    const a = (s / 100) * Math.min(l / 100, 1 - l / 100)
    const val = l / 100 - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)))
    return Math.round(255 * val).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

const applyColor = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  document.documentElement.style.setProperty('--user-color', hex)
  document.documentElement.style.setProperty('--user-color-soft', `rgba(${r},${g},${b},0.10)`)
  document.documentElement.style.setProperty('--user-color-glow', `rgba(${r},${g},${b},0.25)`)
}

const FadeScreen = ({ children }) => (
  <div className="fade-in" style={{
    minHeight: '100vh', background: 'var(--background)',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '32px 16px',
  }}>
    {children}
  </div>
)

const PrimaryBtn = ({ onClick, disabled, children }) => (
  <button className="btn-primary" onClick={onClick} disabled={disabled}
    style={{ marginTop: 32, minWidth: 160 }}>
    {children}
  </button>
)

const OnboardingFlow = () => {
  const navigate = useNavigate()
  const { user, profile, refreshProfile } = useAuth()
  const { t, lang } = useI18n()
  const [screen, setScreen] = useState(1)
  const [hexColor, setHexColor] = useState('')
  const [answers, setAnswers] = useState({ q1: '', q2: '', q3: '', q4: '', q4b: '' })
  const [loading, setLoading] = useState(false)
  const [cardVisible, setCardVisible] = useState(false)

  const showOptional = answers.q4.length >= 10

  useEffect(() => {
    const existing = profile?.hex_code
    if (existing) {
      setHexColor(existing)
      applyColor(existing)
    } else {
      const hex = generateHexColor()
      setHexColor(hex)
      applyColor(hex)
    }
  }, [profile])

  const goNext = () => setScreen((s) => s + 1)

  const saveHexAndProceed = async () => {
    if (!profile?.hex_code) {
      await supabase.from('profiles').update({ hex_code: hexColor }).eq('id', user.id)
    }
    setScreen(1.5)
  }

  const saveAnswer = async (questionIndex, text) => {
    await supabase.from('onboarding_answers').upsert(
      { user_id: user.id, question_index: questionIndex, answer_text: text },
      { onConflict: 'user_id,question_index' }
    )
  }

  const handleQ = async (qKey, index) => {
    if (!answers[qKey].trim()) return
    setLoading(true)
    await saveAnswer(index, answers[qKey])
    setLoading(false)
    goNext()
  }

  const handleQ4 = async () => {
    if (!answers.q4.trim()) return
    setLoading(true)
    try {
      await saveAnswer(4, answers.q4)
      if (answers.q4b.trim()) await saveAnswer(5, answers.q4b)

      const title = answers.q4.trim().split(/\s+/).slice(0, 6).join(' ')
      await supabase.from('gifts').insert({
        creator_id: user.id,
        title,
        description: answers.q4,
        why_me: answers.q4b || null,
        visibility: 'global',
        status: 'active',
        is_active: true,
        creator_hex: hexColor,
        lang: lang || 'en',
      })

      await supabase.from('profiles').update({ onboarding_completed: true }).eq('id', user.id)
      await refreshProfile()
      goNext()
      setTimeout(() => setCardVisible(true), 400)
    } catch (err) {
      console.error('handleQ4 error:', err)
    } finally {
      setLoading(false)
    }
  }

  const mono = { fontFamily: "'DM Mono', monospace", fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }
  const heading = { fontFamily: "'DM Sans', sans-serif", fontWeight: 500, color: 'var(--text-primary)', textAlign: 'center' }
  const muted = { fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }

  // Shared style for question headings — smaller on mobile via clamp
  const questionHeading = {
    ...heading,
    fontSize: 'clamp(17px, 3.5vw, 22px)',
    maxWidth: 560,
    lineHeight: 1.6,
    marginTop: 24,
    marginBottom: 32,
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
  }

  if (screen === 1) return (
    <FadeScreen>
      <div style={{
        width: 120, height: 120, borderRadius: '50%', background: hexColor,
        boxShadow: `0 0 48px var(--user-color-glow)`, marginBottom: 24,
      }} />
      <p style={{ ...mono, fontSize: 18, marginBottom: 16 }}>{hexColor}</p>
      <p style={{ ...heading, fontSize: 20, maxWidth: 400, lineHeight: 1.7, color: 'var(--text-muted)' }}>
        {t.onboarding.screen1.headline}
      </p>
      <PrimaryBtn onClick={saveHexAndProceed}>{t.onboarding.screen1.cta}</PrimaryBtn>
    </FadeScreen>
  )

  if (screen === 1.5) return (
    <FadeScreen>
      <div style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
        <p style={{ ...heading, fontSize: 'clamp(22px, 5vw, 32px)', lineHeight: 1.5, marginBottom: 8 }}>
          {t.onboarding.screenVillage.line1}
        </p>
        <p style={{ ...muted, fontSize: 16, lineHeight: 1.8, marginBottom: 4 }}>
          {t.onboarding.screenVillage.line2}
        </p>
        <p style={{ ...muted, fontSize: 16, lineHeight: 1.8, marginBottom: 4 }}>
          {t.onboarding.screenVillage.line3}
        </p>
        <p style={{ ...muted, fontSize: 16, lineHeight: 1.8 }}>
          {t.onboarding.screenVillage.line4}
        </p>
      </div>
      <PrimaryBtn onClick={goNext}>{t.onboarding.screenVillage.cta}</PrimaryBtn>
    </FadeScreen>
  )

  if (screen === 2) return (
    <FadeScreen>
      <p style={muted}>{t.onboarding.screen2.atmospheric}</p>
      <h2 style={questionHeading}>
        {t.onboarding.screen2.question}
      </h2>
      <textarea style={{ maxWidth: 560, width: '100%' }} value={answers.q1} onChange={(e) => setAnswers({ ...answers, q1: e.target.value })} placeholder={t.onboarding.textareaPlaceholder} />
      <PrimaryBtn onClick={() => handleQ('q1', 1)} disabled={loading || !answers.q1.trim()}>
        {loading ? t.onboarding.saving : t.onboarding.screen2.cta}
      </PrimaryBtn>
    </FadeScreen>
  )

  if (screen === 3) return (
    <FadeScreen>
      <p style={muted}>{t.onboarding.screen3.atmospheric}</p>
      <h2 style={questionHeading}>
        {t.onboarding.screen3.question}
      </h2>
      <textarea style={{ maxWidth: 560, width: '100%' }} value={answers.q2} onChange={(e) => setAnswers({ ...answers, q2: e.target.value })} placeholder={t.onboarding.textareaPlaceholder} />
      <PrimaryBtn onClick={() => handleQ('q2', 2)} disabled={loading || !answers.q2.trim()}>
        {loading ? t.onboarding.saving : t.onboarding.screen3.cta}
      </PrimaryBtn>
    </FadeScreen>
  )

  if (screen === 4) return (
    <FadeScreen>
      <p style={muted}>{t.onboarding.screen4.atmospheric}</p>
      <h2 style={questionHeading}>
        {t.onboarding.screen4.question}
      </h2>
      <textarea style={{ maxWidth: 560, width: '100%' }} value={answers.q3} onChange={(e) => setAnswers({ ...answers, q3: e.target.value })} placeholder={t.onboarding.textareaPlaceholder} />
      <PrimaryBtn onClick={() => handleQ('q3', 3)} disabled={loading || !answers.q3.trim()}>
        {loading ? t.onboarding.saving : t.onboarding.screen4.cta}
      </PrimaryBtn>
    </FadeScreen>
  )

  if (screen === 5) return (
    <FadeScreen>
      <div style={{ background: 'var(--surface)', borderRadius: 24, padding: 'clamp(28px, 6vw, 48px) clamp(20px, 6vw, 40px)', maxWidth: 440, width: '100%', border: '1px solid var(--border)' }}>
        <p style={{ ...heading, fontSize: 18, lineHeight: 1.9, whiteSpace: 'pre-line', color: 'var(--text-muted)' }}>
          {t.onboarding.screen5.text}
        </p>
      </div>
      <PrimaryBtn onClick={goNext}>{t.onboarding.screen5.cta}</PrimaryBtn>
    </FadeScreen>
  )

  if (screen === 6) return (
    <FadeScreen>
      <h2 style={{ ...questionHeading, marginBottom: 32 }}>
        {t.onboarding.screen6.question}
      </h2>
      <textarea style={{ maxWidth: 560, width: '100%' }} value={answers.q4} onChange={(e) => setAnswers({ ...answers, q4: e.target.value })} placeholder={t.onboarding.textareaPlaceholder} />

      {showOptional && (
        <div className="fade-in" style={{ maxWidth: 560, width: '100%', marginTop: 16 }}>
          <p style={{ ...muted, marginBottom: 8, textAlign: 'left' }}>{t.onboarding.screen6.optionalLabel}</p>
          <textarea
            value={answers.q4b}
            onChange={(e) => setAnswers({ ...answers, q4b: e.target.value })}
            placeholder={t.onboarding.screen6.optionalPlaceholder}
          />
        </div>
      )}

      <PrimaryBtn onClick={handleQ4} disabled={loading || !answers.q4.trim()}>
        {loading ? t.onboarding.saving : t.onboarding.screen6.cta}
      </PrimaryBtn>
    </FadeScreen>
  )

  if (screen === 7) return (
    <FadeScreen>
      {cardVisible && (
        <div className="fade-in" style={{ maxWidth: 400, width: '100%' }}>
          <div className="armagan-card" style={{
            background: `rgba(${parseInt(hexColor.slice(1,3),16)},${parseInt(hexColor.slice(3,5),16)},${parseInt(hexColor.slice(5,7),16)},0.12)`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: hexColor }} />
              <span className="mono">{hexColor}</span>
            </div>
            <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, fontWeight: 500, marginBottom: 8 }}>
              {answers.q4.trim().split(/\s+/).slice(0, 6).join(' ')}
            </h3>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>
              {answers.q4}
            </p>
            <button className="btn-primary" style={{ width: '100%', background: hexColor, borderRadius: 8 }}>
              {t.explore.requestSupport}
            </button>
          </div>

          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-muted)', textAlign: 'center', marginTop: 24 }}>
            {t.onboarding.screen7.ready}
          </p>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <PrimaryBtn onClick={() => navigate('/dashboard')}>{t.onboarding.screen7.cta}</PrimaryBtn>
          </div>
        </div>
      )}
    </FadeScreen>
  )

  return null
}

export default OnboardingFlow
