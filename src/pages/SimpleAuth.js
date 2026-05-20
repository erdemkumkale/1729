import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import tr from '../strings/tr'

const SimpleAuth = () => {
  const navigate = useNavigate()
  const { signUpWithEmail: signUp, signInWithEmail: signIn } = useAuth()
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
      setError(tr.auth.error)
    } finally {
      setLoading(false)
    }
  }

  const tab = (active) => ({
    flex: 1,
    padding: '10px 0',
    background: active ? 'var(--surface-2)' : 'transparent',
    border: 'none',
    borderRadius: 8,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    fontWeight: 500,
    color: active ? 'var(--text-primary)' : 'var(--text-muted)',
    cursor: 'pointer',
    transition: 'all 150ms ease',
  })

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--background)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{ maxWidth: 400, width: '100%' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'var(--text-primary)',
            margin: '0 auto 16px',
          }} />
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            1729
          </p>
        </div>

        <div style={{
          background: 'var(--surface)',
          borderRadius: 16,
          padding: 32,
          border: '1px solid var(--border)',
        }}>
          {/* Tab switcher */}
          <div style={{
            display: 'flex', gap: 4,
            background: 'var(--background)',
            borderRadius: 10, padding: 4, marginBottom: 28,
          }}>
            <button style={tab(isLogin)} onClick={() => setIsLogin(true)}>{tr.auth.login}</button>
            <button style={tab(!isLogin)} onClick={() => setIsLogin(false)}>{tr.auth.signup}</button>
          </div>

          {error && (
            <p style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 13,
              color: '#e05c5c', marginBottom: 16,
            }}>{error}</p>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                {tr.auth.email}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@email.com"
              />
            </div>

            <div>
              <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                {tr.auth.password}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', marginTop: 8 }}
            >
              {loading ? tr.auth.processing : isLogin ? tr.auth.login : tr.auth.signup}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default SimpleAuth
