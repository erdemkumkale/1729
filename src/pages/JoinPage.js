import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../i18n'

// Invite-based signup. The :token is the invitation row's UUID id.
// Email comes from the invitation (locked), the invitee only sets a password.
// Invitations are prepaid (funded by the inviter), so on success we mark the
// profile as paid and skip the separate /payment step entirely.
const JoinPage = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const { signUpWithEmail: signUp } = useAuth()
  const { t, lang, setLanguage } = useI18n()

  const [invite, setInvite] = useState(null)
  const [checking, setChecking] = useState(true)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  useEffect(() => {
    let active = true
    const load = async () => {
      const { data } = await supabase
        .from('invitations')
        .select('id, email, status, duration_months, subscription_ends_at, sub_community_id')
        .eq('id', token)
        .eq('status', 'pending')
        .maybeSingle()
      if (active) {
        setInvite(data || null)
        setChecking(false)
      }
    }
    load()
    return () => { active = false }
  }, [token])

  const completePrepaid = async (userId) => {
    // Mark profile paid + record invitation as used + attach community.
    await supabase
      .from('profiles')
      .update({ payment_status: 'paid', email: invite.email })
      .eq('id', userId)

    await supabase
      .from('invitations')
      .update({ status: 'used', used_by: userId, used_at: new Date().toISOString() })
      .eq('id', invite.id)

    if (invite.sub_community_id) {
      await supabase
        .from('sub_community_members')
        .upsert(
          { sub_community_id: invite.sub_community_id, user_id: userId },
          { onConflict: 'sub_community_id,user_id' }
        )
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    if (password.length < 6) {
      setError(lang === 'tr' ? 'Şifre en az 6 karakter olmalı.' : 'Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    try {
      const data = await signUp(invite.email, password)
      if (!data?.session) {
        // Email confirmation is enabled — no session yet, can't write under RLS.
        setInfo(t.join.confirmEmail)
        setLoading(false)
        return
      }
      await completePrepaid(data.user.id)
      // Route through GateKeeper so it dispatches against the fresh profile.
      navigate('/', { replace: true })
    } catch (err) {
      const msg = (err?.message || '').toLowerCase()
      if (msg.includes('already registered') || msg.includes('user already')) {
        setError(lang === 'tr'
          ? 'Bu e-posta zaten kayıtlı. Giriş yapmayı dene.'
          : 'This email is already registered. Try logging in.')
      } else {
        setError(err?.message || t.join.error)
      }
    } finally {
      setLoading(false)
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
          {checking ? (
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-muted)', textAlign: 'center' }}>—</p>
          ) : !invite ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#e05c5c', lineHeight: 1.6, marginBottom: 24 }}>
                {t.join.invalidInvite}
              </p>
              <Link to="/login" className="btn-secondary" style={{ display: 'inline-block', textDecoration: 'none' }}>
                {t.auth.login}
              </Link>
            </div>
          ) : info ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#5ca97c', lineHeight: 1.6, marginBottom: 24 }}>
                {info}
              </p>
              <Link to="/login" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
                {t.auth.login}
              </Link>
            </div>
          ) : (
            <>
              <h1 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 22, fontWeight: 500, marginBottom: 8 }}>
                {t.join.title}
              </h1>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
                {t.join.subtitle}
              </p>

              {error && (
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#e05c5c', marginBottom: 16 }}>{error}</p>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                    {t.join.invitedAs}
                  </label>
                  <input
                    type="email"
                    value={invite.email}
                    disabled
                    style={{ opacity: 0.7, cursor: 'not-allowed' }}
                  />
                </div>
                <div>
                  <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                    {t.join.passwordLabel}
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.join.passwordPlaceholder}
                    minLength={6}
                  />
                </div>
                <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', marginTop: 8 }}>
                  {loading ? t.join.joining : t.join.cta}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Link
                  to="/login"
                  style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                    color: 'var(--text-muted)', textDecoration: 'underline',
                  }}
                >
                  {t.join.haveAccount}
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default JoinPage
