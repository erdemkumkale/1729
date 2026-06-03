import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../i18n'
import DashboardLayout from '../components/DashboardLayout'

// ─── Helpers ───────────────────────────────────────────────────

const generateCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

const daysLeft = (endsAt) => {
  if (!endsAt) return null
  const diff = new Date(endsAt) - new Date()
  return Math.max(0, Math.floor(diff / 86400000))
}

const getEndDate = (months) => {
  const d = new Date()
  d.setDate(d.getDate() + months * 30)
  return d.toISOString()
}

// ─── Sub-components ────────────────────────────────────────────

const TrustCircleCard = ({ member, t }) => {
  const hex = member.member?.hex_code || '#888888'
  const r = parseInt(hex.slice(1,3),16)
  const g = parseInt(hex.slice(3,5),16)
  const b = parseInt(hex.slice(5,7),16)
  return (
    <div style={{
      background: `rgba(${r},${g},${b},0.08)`,
      border: `1px solid rgba(${r},${g},${b},0.20)`,
      borderRadius: 16, padding: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: hex, flexShrink: 0 }} />
        <span className="mono">{hex}</span>
      </div>
      {member.gift_title && (
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
          {t.trustTeam.gaveGift}
          <br />
          <em>"{member.gift_title}"</em>
        </p>
      )}
    </div>
  )
}

const InvitedRow = ({ inv, t, onEnd }) => {
  const days = daysLeft(inv.subscription_ends_at)
  const ended = inv.subscription_ends_at && days === 0
  const pending = inv.status === 'pending'

  let statusLabel = t.trustTeam.subscriptionActive
  let statusColor = 'rgba(80,200,120,0.8)'
  if (pending) { statusLabel = t.trustTeam.subscriptionPending; statusColor = 'var(--text-muted)' }
  if (ended) { statusLabel = t.trustTeam.subscriptionEnded; statusColor = '#e05c5c' }

  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 14, padding: '16px 20px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      border: '1px solid var(--border)',
    }}>
      <div>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-primary)', margin: '0 0 4px' }}>
          {inv.email}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: statusColor }}>
            {statusLabel}
          </span>
          {!ended && !pending && days !== null && (
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--text-muted)' }}>
              · {t.trustTeam.daysLeft(days)}
            </span>
          )}
        </div>
      </div>
      {!ended && !pending && (
        <button
          className="btn-ghost"
          onClick={() => onEnd(inv.id)}
          style={{ fontSize: 12, padding: '4px 10px' }}
        >
          {t.trustTeam.endSubscription}
        </button>
      )}
    </div>
  )
}

// ─── Invite Modal ──────────────────────────────────────────────

const InviteModal = ({ onClose, onSuccess, user, t }) => {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [bulkEmails, setBulkEmails] = useState('')
  const [bulk, setBulk] = useState(false)
  const [duration, setDuration] = useState(1)
  const [communityChoice, setCommunityChoice] = useState('general')
  const [communityName, setCommunityName] = useState('')
  const [membersAware, setMembersAware] = useState(false)
  const [selectedCommunityId, setSelectedCommunityId] = useState('')
  const [communities, setCommunities] = useState([])
  const [generatedCode, setGeneratedCode] = useState('')
  const [inviteLink, setInviteLink] = useState('')
  const [bulkResults, setBulkResults] = useState([]) // [{ email, link, code, error }]
  const [copied, setCopied] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedAll, setCopiedAll] = useState(false)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(null) // { done, total }

  const parsedEmails = bulkEmails
    .split(/[\n,;]+/)
    .map(s => s.trim())
    .filter(Boolean)

  useEffect(() => {
    supabase.from('sub_communities').select('*').eq('owner_id', user.id)
      .then(({ data }) => setCommunities(data || []))
  }, [user.id])

  const createInvite = async (targetEmail, communityId) => {
    const code = generateCode()
    const { data: inserted, error } = await supabase.from('invitations').insert({
      email: targetEmail,
      inviter_id: user.id,
      type: 'prepaid',
      status: 'pending',
      promo_code: code,
      funded_by_inviter: true,
      duration_months: duration,
      subscription_ends_at: getEndDate(duration),
      sub_community_id: communityId,
    }).select('id').single()
    if (error) throw error
    return { code, link: `${window.location.origin}/davet/${inserted.id}` }
  }

  const handleGenerate = async () => {
    setLoading(true)
    try {
      let communityId = null

      if (communityChoice === 'new' && communityName.trim()) {
        const { data: comm, error: commErr } = await supabase
          .from('sub_communities')
          .insert({ owner_id: user.id, name: communityName.trim(), members_aware: membersAware })
          .select().single()
        if (commErr) throw commErr
        communityId = comm.id
      } else if (communityChoice === 'existing' && selectedCommunityId) {
        communityId = selectedCommunityId
      }

      if (bulk) {
        const results = []
        setProgress({ done: 0, total: parsedEmails.length })
        for (const target of parsedEmails) {
          try {
            const { code, link } = await createInvite(target, communityId)
            results.push({ email: target, code, link })
          } catch (err) {
            console.error('bulk invite error for', target, err)
            results.push({ email: target, error: err?.message || 'failed' })
          }
          setProgress(p => ({ done: (p?.done ?? 0) + 1, total: parsedEmails.length }))
        }
        setBulkResults(results)
        setStep(4)
        onSuccess()
        return
      }

      const { code, link } = await createInvite(email.trim(), communityId)
      setGeneratedCode(code)
      setInviteLink(link)
      setStep(4)
      onSuccess()
    } catch (err) {
      console.error('handleGenerate error:', err)
    } finally {
      setLoading(false)
      setProgress(null)
    }
  }

  const handleCopyAll = () => {
    const txt = bulkResults
      .filter(r => r.link)
      .map(r => `${r.email}\t${r.link}`)
      .join('\n')
    navigator.clipboard.writeText(txt)
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 2000)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const s = { fontFamily: "'DM Sans', sans-serif" }
  const stepLabel = { ...s, fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }
  const title = { ...s, fontSize: 20, fontWeight: 500, marginBottom: 24, color: 'var(--text-primary)' }

  const DurationBtn = ({ months, label }) => (
    <button
      onClick={() => setDuration(months)}
      style={{
        flex: 1, padding: '12px 8px', borderRadius: 10, cursor: 'pointer',
        fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500,
        background: duration === months ? 'var(--user-color)' : 'var(--surface-2)',
        color: duration === months ? '#fff' : 'var(--text-muted)',
        border: duration === months ? '1px solid var(--user-color)' : '1px solid var(--border)',
        transition: 'all 150ms ease',
      }}
    >
      {label}
    </button>
  )

  const CommunityOption = ({ value, label }) => (
    <button
      onClick={() => setCommunityChoice(value)}
      style={{
        width: '100%', padding: '12px 16px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
        fontFamily: "'DM Sans', sans-serif", fontSize: 14,
        background: communityChoice === value ? 'var(--user-color-soft)' : 'var(--surface-2)',
        color: communityChoice === value ? 'var(--text-primary)' : 'var(--text-muted)',
        border: communityChoice === value ? '1px solid var(--user-color)' : '1px solid var(--border)',
        marginBottom: 8, transition: 'all 150ms ease',
      }}
    >
      {label}
    </button>
  )

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: 'var(--surface)', borderRadius: 20, padding: 32, maxWidth: 440, width: '100%', border: '1px solid var(--border)' }}>
        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: i <= step ? 'var(--user-color)' : 'var(--border)',
              transition: 'background 300ms ease',
            }} />
          ))}
        </div>

        {/* Step 1: Email */}
        {step === 1 && (
          <>
            <p style={stepLabel}>{t.trustTeam.modal.step1}</p>
            <h2 style={title}>{t.trustTeam.modal.title}</h2>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ ...s, fontSize: 13, color: 'var(--text-muted)' }}>
                {bulk ? t.trustTeam.modal.bulkLabel : t.trustTeam.modal.emailLabel}
              </label>
              <button
                onClick={() => setBulk(b => !b)}
                style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--user-color)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                }}
              >
                {bulk ? t.trustTeam.modal.bulkSwitchSingle : t.trustTeam.modal.bulkSwitchMany}
              </button>
            </div>
            {bulk ? (
              <>
                <textarea
                  value={bulkEmails}
                  onChange={(e) => setBulkEmails(e.target.value)}
                  placeholder={t.trustTeam.modal.bulkPlaceholder}
                  style={{ minHeight: 140, fontFamily: "'DM Mono', monospace", fontSize: 13 }}
                />
                <p style={{ ...s, fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                  {t.trustTeam.modal.bulkHint(parsedEmails.length)}
                </p>
              </>
            ) : (
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.trustTeam.modal.emailPlaceholder}
                onKeyDown={(e) => e.key === 'Enter' && email.trim() && setStep(2)}
              />
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
              <button className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>{t.trustTeam.modal.close}</button>
              <button
                className="btn-primary"
                onClick={() => setStep(2)}
                disabled={bulk ? parsedEmails.length === 0 : !email.trim()}
                style={{ flex: 1 }}
              >
                {t.trustTeam.modal.next}
              </button>
            </div>
          </>
        )}

        {/* Step 2: Duration */}
        {step === 2 && (
          <>
            <p style={stepLabel}>{t.trustTeam.modal.step2}</p>
            <h2 style={title}>{bulk ? t.trustTeam.modal.bulkSubject(parsedEmails.length) : email}</h2>
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              <DurationBtn months={1} label={t.trustTeam.modal.duration1} />
              <DurationBtn months={6} label={t.trustTeam.modal.duration6} />
              <DurationBtn months={12} label={t.trustTeam.modal.duration12} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-secondary" onClick={() => setStep(1)} style={{ flex: 1 }}>{t.trustTeam.modal.back}</button>
              <button className="btn-primary" onClick={() => setStep(3)} style={{ flex: 1 }}>{t.trustTeam.modal.next}</button>
            </div>
          </>
        )}

        {/* Step 3: Community */}
        {step === 3 && (
          <>
            <p style={stepLabel}>{t.trustTeam.modal.step3}</p>
            <h2 style={title}>{bulk ? t.trustTeam.modal.bulkSubject(parsedEmails.length) : email}</h2>

            <CommunityOption value="general" label={t.trustTeam.modal.communityGeneral} />
            <CommunityOption value="new" label={t.trustTeam.modal.communityNew} />
            {communities.length > 0 && (
              <CommunityOption value="existing" label={t.trustTeam.modal.communityExisting} />
            )}

            {communityChoice === 'new' && (
              <div style={{ marginTop: 12, padding: 16, background: 'var(--surface-2)', borderRadius: 12 }}>
                <label style={{ ...s, fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>
                  {t.trustTeam.modal.communityNameLabel}
                </label>
                <input
                  type="text"
                  value={communityName}
                  onChange={(e) => setCommunityName(e.target.value)}
                  placeholder="e.g. Core Group"
                  style={{ marginBottom: 12 }}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', ...s, fontSize: 13, color: 'var(--text-muted)' }}>
                  <input
                    type="checkbox"
                    checked={membersAware}
                    onChange={(e) => setMembersAware(e.target.checked)}
                    style={{ width: 16, height: 16 }}
                  />
                  {t.trustTeam.modal.membersAwareLabel}
                </label>
              </div>
            )}

            {communityChoice === 'existing' && communities.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <select
                  value={selectedCommunityId}
                  onChange={(e) => setSelectedCommunityId(e.target.value)}
                >
                  <option value="">—</option>
                  {communities.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button className="btn-secondary" onClick={() => setStep(2)} style={{ flex: 1 }}>{t.trustTeam.modal.back}</button>
              <button
                className="btn-primary"
                onClick={handleGenerate}
                disabled={loading || (communityChoice === 'new' && !communityName.trim()) || (communityChoice === 'existing' && !selectedCommunityId)}
                style={{ flex: 1 }}
              >
                {loading
                  ? (progress ? `${progress.done}/${progress.total}` : '…')
                  : t.trustTeam.modal.generate}
              </button>
            </div>
          </>
        )}

        {/* Step 4: Invite link (code as backup) — or bulk list */}
        {step === 4 && bulk && (
          <>
            <p style={stepLabel}>{t.trustTeam.modal.step4}</p>
            <h2 style={title}>{t.trustTeam.modal.bulkReady(bulkResults.filter(r => r.link).length)}</h2>
            <p style={{ ...s, fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              {t.trustTeam.modal.linkHint}
            </p>
            <div style={{
              maxHeight: 260, overflowY: 'auto',
              background: 'var(--surface-2)', borderRadius: 12, padding: 12, marginBottom: 16,
              display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              {bulkResults.map((r, i) => (
                <div key={i} style={{
                  padding: '8px 10px', borderRadius: 8,
                  background: r.error ? 'rgba(224,92,92,0.10)' : 'var(--surface)',
                }}>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--text-muted)', margin: '0 0 2px' }}>
                    {r.email}
                  </p>
                  {r.error ? (
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#e05c5c', margin: 0 }}>
                      {r.error}
                    </p>
                  ) : (
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--text-primary)', margin: 0, wordBreak: 'break-all' }}>
                      {r.link}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <button className="btn-primary" onClick={handleCopyAll} style={{ width: '100%', marginBottom: 12 }}>
              {copiedAll ? t.trustTeam.modal.copied : t.trustTeam.modal.copyAll}
            </button>
            <button className="btn-secondary" onClick={onClose} style={{ width: '100%' }}>{t.trustTeam.modal.close}</button>
          </>
        )}

        {step === 4 && !bulk && (
          <>
            <p style={stepLabel}>{t.trustTeam.modal.step4}</p>
            <h2 style={title}>{t.trustTeam.modal.linkReady}</h2>
            <p style={{ ...s, fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
              {t.trustTeam.modal.linkHint}
            </p>

            {/* Link box */}
            <div style={{
              background: 'var(--surface-2)', borderRadius: 12, padding: '14px 16px',
              marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{
                fontFamily: "'DM Mono', monospace", fontSize: 13, color: 'var(--text-primary)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
              }}>
                {inviteLink}
              </span>
            </div>
            <button className="btn-primary" onClick={handleCopyLink} style={{ width: '100%', marginBottom: 20 }}>
              {copied ? t.trustTeam.modal.copied : t.trustTeam.modal.copyLink}
            </button>

            {/* Code backup */}
            <div style={{
              borderTop: '1px solid var(--border)', paddingTop: 16, marginBottom: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <p style={{ ...s, fontSize: 12, color: 'var(--text-muted)', margin: '0 0 4px' }}>
                  {t.trustTeam.modal.codeBackupLabel}
                </p>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 20, fontWeight: 500, letterSpacing: 4, color: 'var(--text-primary)', margin: 0 }}>
                  {generatedCode}
                </p>
              </div>
              <button className="btn-ghost" onClick={handleCopyCode} style={{ fontSize: 12 }}>
                {copiedCode ? t.trustTeam.modal.copied : t.trustTeam.modal.copy}
              </button>
            </div>

            <button className="btn-secondary" onClick={onClose} style={{ width: '100%' }}>{t.trustTeam.modal.close}</button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────

const GuvenTakimi = () => {
  const { user } = useAuth()
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState('circle')
  const [trustCircle, setTrustCircle] = useState([])
  const [invited, setInvited] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const fetchTrustCircle = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('trust_circle')
      .select('*, member:member_id(hex_code)')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
    setTrustCircle(data || [])
  }, [user])

  const fetchInvited = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('invitations')
      .select('*')
      .eq('inviter_id', user.id)
      .order('created_at', { ascending: false })
    setInvited(data || [])
  }, [user])

  useEffect(() => {
    if (!user) return
    setLoading(true)
    Promise.all([fetchTrustCircle(), fetchInvited()]).finally(() => setLoading(false))
  }, [user, fetchTrustCircle, fetchInvited])

  const handleEndSubscription = async (invitationId) => {
    await supabase
      .from('invitations')
      .update({ subscription_ends_at: new Date().toISOString() })
      .eq('id', invitationId)
    fetchInvited()
  }

  const tabStyle = (active) => ({
    fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500,
    color: active ? 'var(--text-primary)' : 'var(--text-muted)',
    background: 'none', border: 'none',
    borderBottom: active ? '2px solid var(--user-color)' : '2px solid transparent',
    padding: '12px 0', cursor: 'pointer', marginRight: 24, transition: 'color 150ms ease',
  })

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 32, fontWeight: 500, marginBottom: 8 }}>{t.trustTeam.title}</h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>{t.trustTeam.subtitle}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)} style={{ flexShrink: 0 }}>
          {t.trustTeam.invite}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid var(--border)', marginBottom: 32 }}>
        <button style={tabStyle(activeTab === 'circle')} onClick={() => setActiveTab('circle')}>
          {t.trustTeam.tabCircle}
          {trustCircle.length > 0 && (
            <span style={{ marginLeft: 8, fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--text-muted)' }}>
              {trustCircle.length}
            </span>
          )}
        </button>
        <button style={tabStyle(activeTab === 'invited')} onClick={() => setActiveTab('invited')}>
          {t.trustTeam.tabInvited}
          {invited.length > 0 && (
            <span style={{ marginLeft: 8, fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--text-muted)' }}>
              {invited.length}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>—</p>
      ) : activeTab === 'circle' ? (
        trustCircle.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-muted)', marginBottom: 8 }}>
              {t.trustTeam.emptyCircle}
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-muted)', maxWidth: 360, margin: '0 auto' }}>
              {t.trustTeam.emptyCircleHint}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
            {trustCircle.map(m => <TrustCircleCard key={m.id} member={m} t={t} />)}
          </div>
        )
      ) : (
        invited.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-muted)' }}>
              {t.trustTeam.emptyInvited}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {invited.map(inv => (
              <InvitedRow key={inv.id} inv={inv} t={t} onEnd={handleEndSubscription} />
            ))}
          </div>
        )
      )}

      {showModal && (
        <InviteModal
          user={user}
          t={t}
          onClose={() => setShowModal(false)}
          onSuccess={() => fetchInvited()}
        />
      )}
    </DashboardLayout>
  )
}

export default GuvenTakimi
