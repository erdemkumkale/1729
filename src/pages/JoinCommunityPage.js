import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../i18n'
import Logo from '../components/Logo'

// Community join link: /katil/:code. Works before and after signing in.
// Before: the code is remembered and redeemed right after the account exists (see AuthContext).
const JoinCommunityPage = () => {
  const { code } = useParams()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const { t, lang, setLanguage } = useI18n()

  const [name, setName] = useState(null)
  const [checking, setChecking] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    supabase.rpc('get_community_by_code', { p_code: code }).then(({ data }) => {
      if (!active) return
      setName(Array.isArray(data) && data.length ? data[0].name : null)
      setChecking(false)
    })
    return () => { active = false }
  }, [code])

  const remember = () => {
    try { localStorage.setItem('1729_join_code', code) } catch { /* storage blocked */ }
  }

  const goAuth = (mode) => {
    remember()
    navigate(`/login?mode=${mode}`)
  }

  const joinNow = async () => {
    setBusy(true)
    setError('')
    const { data, error: err } = await supabase.rpc('join_community_by_code', { p_code: code })
    if (err || !data) {
      console.error('join community error:', err)
      setError(t.joinCommunity.error)
      setBusy(false)
      return
    }
    window.location.assign('/')
  }

  const font = { fontFamily: "'DM Sans', sans-serif" }
  const j = t.joinCommunity

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ maxWidth: 400, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <Logo size={48} style={{ display: 'block', margin: '0 auto 16px' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 15, color: 'var(--text-muted)', margin: 0 }}>1729</p>
            <button
              onClick={() => setLanguage(lang === 'en' ? 'tr' : 'en')}
              style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: 'var(--text-muted)', background: 'none', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px', cursor: 'pointer' }}
            >
              {lang === 'en' ? 'TR' : 'EN'}
            </button>
          </div>
        </div>

        <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 32, border: '1px solid var(--border)' }}>
          {checking || authLoading ? (
            <p style={{ ...font, fontSize: 16, color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>—</p>
          ) : !name ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ ...font, fontSize: 16, color: '#e05c5c', lineHeight: 1.6, marginBottom: 24 }}>{j.invalid}</p>
              <Link to="/" className="btn-secondary" style={{ display: 'inline-block', textDecoration: 'none' }}>{j.home}</Link>
            </div>
          ) : (
            <>
              <h1 style={{ ...font, fontSize: 22, fontWeight: 500, marginBottom: 8 }}>{j.title(name)}</h1>
              <p style={{ ...font, fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 24 }}>{j.subtitle}</p>
              {error && <p style={{ ...font, fontSize: 15, color: '#e05c5c', marginBottom: 16 }}>{error}</p>}
              {user ? (
                <button className="btn-primary" onClick={joinNow} disabled={busy} style={{ width: '100%' }}>
                  {busy ? j.joining : j.join}
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button className="btn-primary" onClick={() => goAuth('signup')} style={{ width: '100%' }}>{j.signup}</button>
                  <button className="btn-secondary" onClick={() => goAuth('login')} style={{ width: '100%' }}>{j.login}</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default JoinCommunityPage
