import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../i18n'

const SimpleAuth = () => {
  const navigate = useNavigate()
  const { signUpWithEmail: signUp, signInWithEmail: signIn } = useAuth()
  const { t, lang, setLanguage } = useI18n()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isLogin) {
        await signIn(email, password)
      } else {
        await signUp(email, password)
      }
      await new Promise(r => setTimeout(r, 1000))
      navigate('/')
    } catch (err) {
      setError(t.auth.error)
    } finally {
      setLoading(false)
    }
  }

  const tabStyle = (active) => ({
    flex: 1, padding: '10px 0',
    background: active ? 'var(--surface-2)' : 'transparent',
    border: 'none', borderRadius: 8,
    fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500,
    color: active ? 'var(--text-primary)' : 'var(--text-muted)',
    cursor: 'pointer', transition: 'all 150ms ease',
  })

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
          <div style={{
            display: 'flex', gap: 4,
            background: 'var(--background)', borderRadius: 10, padding: 4, marginBottom: 28,
          }}>
            <button style={tabStyle(isLogin)} onClick={() => setIsLogin(true)}>{t.auth.login}</button>
            <button style={tabStyle(!isLogin)} onClick={() => setIsLogin(false)}>{t.auth.signup}</button>
          </div>

          {error && (
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#e05c5c', marginBottom: 16 }}>{error}</p>
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
              {loading ? t.auth.processing : isLogin ? t.auth.login : t.auth.signup}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default SimpleAuth
