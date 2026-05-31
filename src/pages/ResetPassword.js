import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useI18n } from '../i18n'

const ResetPassword = () => {
  const navigate = useNavigate()
  const { t, lang, setLanguage } = useI18n()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [hasSession, setHasSession] = useState(true)

  // The recovery link establishes a session via the URL hash. If none is
  // present (expired/invalid link, or page opened directly), warn the user.
  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (active && !session) setHasSession(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active && session) setHasSession(true)
    })
    return () => { active = false; subscription.unsubscribe() }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError(lang === 'tr' ? 'Şifre en az 6 karakter olmalı.' : 'Password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setError(t.auth.passwordMismatch)
      return
    }
    setLoading(true)
    try {
      const { error: err } = await supabase.auth.updateUser({ password })
      if (err) throw err
      setDone(true)
    } catch (err) {
      const msg = (err?.message || '').toLowerCase()
      if (msg.includes('session') || msg.includes('jwt') || msg.includes('token')) {
        setError(t.auth.resetExpired)
      } else {
        setError(err?.message || t.auth.error)
      }
    } finally {
      setLoading(false)
    }
  }

  const goToLogin = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--background)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{ maxWidth: 400, width: '100%' }}>
        {/* Logo + lang toggle */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--text-primary)', margin: '0 auto 16px' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>1729</p>
            <button
              onClick={() => setLanguage(lang === 'en' ? 'tr' : 'en')}
              style={{
                fontFamily: "'DM Mono', monospace", fontSize: 11,
                color: 'var(--text-muted)', background: 'none',
                border: '1px solid var(--border)', borderRadius: 4,
                padding: '2px 6px', cursor: 'pointer',
              }}
            >
              {lang === 'en' ? 'TR' : 'EN'}
            </button>
          </div>
        </div>

        <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 32, border: '1px solid var(--border)' }}>
          {done ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: 24 }}>
                {t.auth.passwordUpdated}
              </p>
              <button onClick={goToLogin} className="btn-primary" style={{ width: '100%' }}>
                {t.auth.login}
              </button>
            </div>
          ) : (
            <>
              <h1 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 22, fontWeight: 500, marginBottom: 8 }}>
                {t.auth.resetTitle}
              </h1>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
                {t.auth.resetSubtitle}
              </p>

              {!hasSession && (
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#e05c5c', marginBottom: 16, lineHeight: 1.5 }}>
                  {t.auth.resetExpired}
                </p>
              )}
              {error && (
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#e05c5c', marginBottom: 16 }}>{error}</p>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                    {t.auth.newPassword}
                  </label>
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" minLength={6} />
                </div>
                <div>
                  <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                    {t.auth.confirmPassword}
                  </label>
                  <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" minLength={6} />
                </div>
                <button type="submit" disabled={loading || !hasSession} className="btn-primary" style={{ width: '100%', marginTop: 8 }}>
                  {loading ? t.auth.processing : t.auth.updatePassword}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <button
                  type="button"
                  onClick={goToLogin}
                  style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                    color: 'var(--text-muted)', background: 'none', border: 'none',
                    cursor: 'pointer', textDecoration: 'underline', padding: 4,
                  }}
                >
                  {t.auth.backToLogin}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ResetPassword
