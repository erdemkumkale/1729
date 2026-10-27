import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../i18n'
import DashboardLayout from '../components/DashboardLayout'
import RequestModal from '../components/RequestModal'
import { findOpenRequest } from '../lib/chat'
import { readableText } from '../lib/color'

const font = { fontFamily: "'DM Sans', sans-serif" }

const Badge = ({ children }) => (
  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, padding: '2px 8px', borderRadius: 6, background: 'var(--surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
    {children}
  </span>
)

const GiftDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useI18n()
  const [gift, setGift] = useState(undefined) // undefined = loading, null = not found
  const [showRequest, setShowRequest] = useState(false)

  useEffect(() => {
    let active = true
    supabase
      .from('gifts')
      .select('*, creator:creator_id(hex_code)')
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (err) console.error('gift detail error:', err)
        if (active) setGift(err ? null : data)
      })
    return () => { active = false }
  }, [id])

  const request = async () => {
    const existing = await findOpenRequest(gift.id, user.id)
    if (existing) { navigate(`/chat/${existing}`); return }
    setShowRequest(true)
  }

  const back = (
    <button
      onClick={() => navigate(-1)}
      style={{ ...font, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 24, fontSize: 15, color: 'var(--text-muted)', textDecoration: 'underline' }}
    >
      {t.member.back}
    </button>
  )

  if (gift === undefined) return <DashboardLayout><p style={{ ...font, color: 'var(--text-muted)' }}>—</p></DashboardLayout>
  if (gift === null) {
    return (
      <DashboardLayout>
        {back}
        <p style={{ ...font, fontSize: 16, color: 'var(--text-muted)' }}>{t.member.notFound}</p>
      </DashboardLayout>
    )
  }

  const hex = gift.creator?.hex_code || '#888888'
  const isOwn = gift.creator_id === user?.id
  const badges = []
  if (gift.is_disaster) {
    const cat = t.disaster.categories[gift.disaster_category]
    badges.push(cat ? `${t.disaster.badge}: ${cat}` : t.disaster.badge)
    if (gift.expires_at) badges.push(t.disaster.daysLeft(Math.ceil((new Date(gift.expires_at) - Date.now()) / 86400000)))
  }
  if (gift.gift_type === 'once') badges.push(t.give.badgeOnce)
  if (gift.gift_type === 'quota') badges.push(t.give.badgeQuota(gift.quota_remaining ?? gift.quota ?? 0))
  if (gift.is_physical) badges.push(t.give.badgePhysical)

  return (
    <DashboardLayout>
      {back}
      <div style={{ maxWidth: 640 }}>
        <button
          onClick={() => navigate(`/member/${gift.creator_id}`)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 20 }}
        >
          <span style={{ width: 28, height: 28, borderRadius: '50%', background: hex, display: 'inline-block' }} />
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 16, color: 'var(--text-primary)' }}>{hex}</span>
          <span style={{ ...font, fontSize: 14, color: 'var(--text-muted)', textDecoration: 'underline' }}>{t.member.openProfile}</span>
        </button>

        <h1 style={{ ...font, fontSize: 30, fontWeight: 500, margin: '0 0 14px', lineHeight: 1.3 }}>{gift.title}</h1>

        {badges.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
            {badges.map((b) => <Badge key={b}>{b}</Badge>)}
          </div>
        )}

        {gift.description && gift.description.trim() !== (gift.title || '').trim() && (
          <p style={{ ...font, fontSize: 18, color: 'var(--text-muted)', lineHeight: 1.8, margin: '0 0 24px', whiteSpace: 'pre-line' }}>{gift.description}</p>
        )}

        {gift.delivery_note && (
          <p style={{ ...font, fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.7, margin: '0 0 24px' }}>{gift.delivery_note}</p>
        )}

        {gift.why_me && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px', marginBottom: 28 }}>
            <p style={{ ...font, fontSize: 14, color: 'var(--text-muted)', margin: '0 0 6px' }}>{t.member.whyGive}</p>
            <p style={{ ...font, fontSize: 17, margin: 0, lineHeight: 1.7 }}>{gift.why_me}</p>
          </div>
        )}

        {isOwn ? (
          <p style={{ ...font, fontSize: 15, color: 'var(--text-muted)' }}>{t.member.ownGift}</p>
        ) : (
          <button className="btn-primary" onClick={request} style={{ background: hex, color: readableText(hex), minWidth: 180 }}>
            {t.member.request}
          </button>
        )}
      </div>

      {showRequest && (
        <RequestModal
          gift={gift}
          t={t}
          onClose={() => setShowRequest(false)}
          onDone={(txId) => navigate(`/chat/${txId}`)}
        />
      )}
    </DashboardLayout>
  )
}

export default GiftDetail
