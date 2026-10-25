import React, { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../i18n'
import Logo from '../components/Logo'
import { parseEmails, createInvitations, sendInviteEmails } from '../lib/invites'

const s = { fontFamily: "'DM Sans', sans-serif" }

const CommunitySetup = () => {
  const navigate = useNavigate()
  const { user, hasCommunity, refreshProfile } = useAuth()
  const { t } = useI18n()
  const [name, setName] = useState('')
  const [months, setMonths] = useState(12)
  const [emailText, setEmailText] = useState('')
  const [communityId, setCommunityId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState(null)
  const [copied, setCopied] = useState(false)

  const { valid, invalid } = parseEmails(emailText)
  const ownEmail = (user?.email || '').toLowerCase()
  const targets = valid.filter((e) => e !== ownEmail)
  const canSubmit = name.trim() && targets.length >= 2 && !busy

  if (hasCommunity && !results) return <Navigate to="/dashboard" replace />

  const handleCreate = async () => {
    setError('')
    if (targets.length < 2) { setError(t.community.needTwo); return }
    setBusy(true)
    try {
      let cid = communityId
      if (!cid) {
        const { data: comm, error: commErr } = await supabase
          .from('sub_communities')
          .insert({ owner_id: user.id, name: name.trim(), members_aware: true })
          .select().single()
        if (commErr) throw commErr
        cid = comm.id
        setCommunityId(cid)
        const { error: memErr } = await supabase
          .from('sub_community_members')
          .upsert({ sub_community_id: cid, user_id: user.id }, { onConflict: 'sub_community_id,user_id' })
        if (memErr) throw memErr
      }

      const created = await createInvitations({ userId: user.id, emails: targets, months, communityId: cid })
      const ok = created.filter((r) => r.id)
      if (ok.length < 2) {
        setError(t.community.partialFail)
        return
      }
      await sendInviteEmails(ok.map((r) => r.id))
      setResults(created)
      await refreshProfile()
    } catch (err) {
      console.error('CommunitySetup error:', err)
      setError(err?.message || t.community.error)
    } finally {
      setBusy(false)
    }
  }

  const copyLinks = () => {
    const txt = (results || []).filter((r) => r.link).map((r) => `${r.email}\t${r.link}`).join('\n')
    navigator.clipboard.writeText(txt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const monthBtn = (m, label) => (
    <button
      type="button"
      onClick={() => setMonths(m)}
      style={{
        flex: 1, padding: '12px 8px', borderRadius: 10, cursor: 'pointer', ...s, fontSize: 16, fontWeight: 500,
        background: months === m ? 'var(--user-color)' : 'var(--surface-2)',
        color: months === m ? '#fff' : 'var(--text-muted)',
        border: months === m ? '1px solid var(--user-color)' : '1px solid var(--border)',
      }}
    >
      {label}
    </button>
  )

  const label = { ...s, fontSize: 15, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ maxWidth: 460, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Logo size={48} style={{ display: 'block', margin: '0 auto 16px' }} />
        </div>

        <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 32, border: '1px solid var(--border)' }}>
          {results ? (
            <>
              <h1 style={{ ...s, fontSize: 22, fontWeight: 500, marginBottom: 8 }}>{t.community.done}</h1>
              <p style={{ ...s, fontSize: 15, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.6 }}>{t.community.mailNote}</p>
              <div style={{ maxHeight: 220, overflowY: 'auto', background: 'var(--surface-2)', borderRadius: 12, padding: 12, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {results.map((r, i) => (
                  <div key={i} style={{ padding: '8px 10px', borderRadius: 8, background: r.error ? 'rgba(224,92,92,0.10)' : 'var(--surface)' }}>
                    <p style={{ ...s, fontSize: 14, color: 'var(--text-muted)', margin: '0 0 2px' }}>{r.email}</p>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, margin: 0, wordBreak: 'break-all', color: r.error ? '#e05c5c' : 'var(--text-primary)' }}>
                      {r.error || r.link}
                    </p>
                  </div>
                ))}
              </div>
              <button className="btn-secondary" onClick={copyLinks} style={{ width: '100%', marginBottom: 12 }}>
                {copied ? t.community.copied : t.community.copyAll}
              </button>
              <button className="btn-primary" onClick={() => navigate('/dashboard', { replace: true })} style={{ width: '100%' }}>
                {t.community.continue}
              </button>
            </>
          ) : (
            <>
              <h1 style={{ ...s, fontSize: 22, fontWeight: 500, marginBottom: 8 }}>{t.community.setupTitle}</h1>
              <p style={{ ...s, fontSize: 16, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>{t.community.setupSubtitle}</p>

              {error && <p style={{ ...s, fontSize: 15, color: '#e05c5c', marginBottom: 16 }}>{error}</p>}

              <div style={{ marginBottom: 20 }}>
                <label style={label}>{t.community.nameLabel}</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t.community.namePlaceholder} maxLength={60} disabled={!!communityId} />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={label}>{t.community.durationLabel}</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {monthBtn(6, t.community.months6)}
                  {monthBtn(12, t.community.months12)}
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={label}>{t.community.emailsLabel}</label>
                <textarea
                  value={emailText}
                  onChange={(e) => setEmailText(e.target.value)}
                  placeholder={t.community.emailsPlaceholder}
                  style={{ minHeight: 120, fontFamily: "'DM Mono', monospace", fontSize: 15 }}
                />
                <p style={{ ...s, fontSize: 14, color: targets.length >= 2 ? 'var(--text-muted)' : '#c9a227', marginTop: 6 }}>
                  {t.community.emailsHint(targets.length)}
                </p>
                {invalid.length > 0 && (
                  <p style={{ ...s, fontSize: 14, color: '#e05c5c', marginTop: 4 }}>{t.community.invalidEmails(invalid.join(', '))}</p>
                )}
              </div>

              <button className="btn-primary" onClick={handleCreate} disabled={!canSubmit} style={{ width: '100%' }}>
                {busy ? t.community.creating : t.community.create}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default CommunitySetup
