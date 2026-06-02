import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../i18n'
import Logo from '../components/Logo'

const SimpleAuth = () => {
  const navigate = useNavigate()
  const { signInWithEmail: signIn } = useAuth()
  const { t, lang, setLanguage } = useI18n()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  // Translate Supabase auth error codes to friendly text
  const friendlyError = (err) => {
    const msg = (err?.message || '').toLowerCase()
    if (msg.includes('invalid login')) {
      return lang === 'tr'
        ? 'E-posta ya da şifre hatalı.'
        : 'Wrong email or password.'
    }
    if (msg.includes('email not confirmed')) {
      return lang === 'tr'
        ? 'E-postanı doğrulaman gerekiyor. Gelen kutuna bakar mısın?'
        : 'You need to confirm your email. Please check your inbox.'
    }
    if (msg.includes('already registered') || msg.includes('user already')) {
      return lang === 'tr'
        ? 'Bu e-posta zaten kayıtlı. Giriş yapmayı dene.'
        : 'This email is already registered. Try logging in.'
    }
    if (msg.includes('password should be')) {
      return lang === 'tr'
        ? 'Şifre en az 6 karakter olmalı.'
        : 'Password must be at least 6 characters.'
    }
    return err?.message || t.auth.error
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/')
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    setError('')
    setInfo('')
    if (!email.trim()) {
      setError(lang === 'tr' ? 'Önce e-postanı yaz.' : 'Enter your email first.')
      return
    }
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (err) throw err
      setInfo(lang === 'tr'
        ? 'Şifre sıfırlama linki e-postana gönderildi.'
        : 'Password reset link sent to your email.')
    } catch (err) {
      setError(friendlyError(err))
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--background)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{ maxWidth: 400, width: '100%' }}>
        {/* Logo + lang toggle */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <Logo size={48} style={{ display: 'block', margin: '0 auto 16px' }} />
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
          <h1 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 22, fontWeight: 500, marginBottom: 28 }}>
            {t.auth.login}
          </h1>

          {error && (
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#e05c5c', marginBottom: 16 }}>{error}</p>
          )}
          {info && (
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#5ca97c', marginBottom: 16, lineHeight: 1.5 }}>{info}</p>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                {t.auth.email}
              </label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div>
              <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                {t.auth.password}
              </label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" minLength={6} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', marginTop: 8 }}>
              {loading ? t.auth.processing : t.auth.login}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button
              type="button"
              onClick={handleForgotPassword}
              style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                color: 'var(--text-muted)', background: 'none', border: 'none',
                cursor: 'pointer', textDecoration: 'underline', padding: 4,
              }}
            >
              {t.auth.forgotPassword}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SimpleAuth
