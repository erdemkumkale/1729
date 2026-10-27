import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../i18n'
import DashboardLayout from '../components/DashboardLayout'
import { logActivity } from '../lib/activity'
import { makeTitle } from '../lib/gifts'
import GiftFormModal from '../components/GiftFormModal'

// ─── Badge ──────────────────────────────────────────────────────

const Badge = ({ children, color }) => (
  <span style={{
    fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 500,
    padding: '2px 8px', borderRadius: 6,
    background: color || 'var(--surface-2)',
    color: 'var(--text-muted)',
    border: '1px solid var(--border)',
    whiteSpace: 'nowrap',
  }}>
    {children}
  </span>
)

// ─── Gift card (my gifts list) ─────────────────────────────────

const MyGiftCard = ({ card, hex, onToggle, onEdit, onRenew, t }) => {
  const r = parseInt(hex.slice(1,3),16)
  const g = parseInt(hex.slice(3,5),16)
  const b = parseInt(hex.slice(5,7),16)

  const badges = []
  if (card.gift_type === 'once') badges.push(t.give.badgeOnce)
  if (card.gift_type === 'quota') badges.push(t.give.badgeQuota(card.quota_remaining ?? card.quota ?? 0))
  if (card.is_physical) badges.push(t.give.badgePhysical)
  if (card.is_disaster) badges.unshift(`${t.disaster.badge}: ${t.disaster.categories[card.disaster_category] || ''}`.replace(/: $/, ''))
  const daysLeft = card.expires_at ? Math.ceil((new Date(card.expires_at) - Date.now()) / 86400000) : null

  const showDescription = card.description && card.description.trim() !== (card.title || '').trim()
  const visLabel = card.visibility === 'trust_circle' ? t.give.visTrustCircle : t.give.visCommunity
  const live = card.is_active

  return (
    <div className="armagan-card" style={{
      background: `rgba(${r},${g},${b},0.08)`,
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 19, fontWeight: 500, marginBottom: showDescription ? 6 : 0, marginTop: 0 }}>{card.title}</h3>
          {showDescription && (
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>{card.description}</p>
          )}
        </div>
        {!card.is_disaster && (
          <button
            className="btn-secondary"
            onClick={() => onEdit(card)}
            style={{ padding: '6px 14px', fontSize: 14, whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            {t.give.edit}
          </button>
        )}
      </div>

      {badges.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {badges.map((x) => <Badge key={x}>{x}</Badge>)}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-muted)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: live ? 'rgba(80,200,120,0.9)' : 'var(--text-muted)' }} />
          {live ? t.give.statusLive : t.give.statusPaused}
          <span style={{ opacity: 0.6 }}>·</span>
          {card.is_disaster ? t.disaster.daysLeft(daysLeft ?? 0) : `${t.give.visibleTo}: ${visLabel}`}
        </span>
        <span style={{ display: 'inline-flex', gap: 16 }}>
          {card.is_disaster && (
            <button
              onClick={() => onRenew(card.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-muted)', textDecoration: 'underline' }}
            >
              {t.disaster.renew}
            </button>
          )}
          <button
            onClick={() => onToggle(card.id, card.is_active)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-muted)', textDecoration: 'underline' }}
          >
            {live ? t.give.pause : t.give.resume}
          </button>
        </span>
      </div>
    </div>
  )
}

// ─── Disaster offer modal ──────────────────────────────────────

const DISASTER_MIN = 40
const DISASTER_CATEGORIES = ['housing', 'food', 'transport', 'health', 'communication', 'shipping', 'other']

const DisasterModal = ({ t, onClose, onCreate }) => {
  const [category, setCategory] = useState('housing')
  const [text, setText] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState(null)
  const len = text.trim().length
  const ok = len >= DISASTER_MIN

  const submit = async () => {
    if (!ok) return
    setCreating(true)
    setError(null)
    try {
      await onCreate({ category, text: text.trim() })
    } catch (err) {
      console.error('create disaster offer error:', err)
      setError(err?.message ? `${t.give.error} (${err.message})` : t.give.error)
      setCreating(false)
    }
  }

  const label = { fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 200, padding: '24px 16px', overflowY: 'auto' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: 'var(--surface)', borderRadius: 20, padding: 32, maxWidth: 520, width: '100%', border: '1px solid var(--border)', marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 24, fontWeight: 500, margin: '0 0 8px' }}>{t.disaster.modalTitle}</h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 24px' }}>{t.disaster.intro}</p>

        {error && <p style={{ fontSize: 15, color: '#e05c5c', marginBottom: 16 }}>{error}</p>}

        <label style={label}>{t.disaster.categoryLabel}</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
          {DISASTER_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              style={{
                padding: '8px 14px', borderRadius: 999, cursor: 'pointer', fontSize: 14, fontFamily: "'DM Sans', sans-serif",
                background: category === c ? 'var(--user-color)' : 'var(--surface-2)',
                color: category === c ? 'var(--user-color-text)' : 'var(--text-primary)',
                border: category === c ? '1px solid var(--user-color)' : '1px solid var(--border)',
              }}
            >
              {t.disaster.categories[c]}
            </button>
          ))}
        </div>

        <label style={label}>{t.disaster.descLabel}</label>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={t.disaster.descPlaceholder} style={{ minHeight: 140 }} />
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, margin: '8px 0 4px' }}>{t.disaster.descHint}</p>
        {!ok && len > 0 && (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#c9a227', margin: '0 0 4px' }}>{t.disaster.minChars(DISASTER_MIN, len)}</p>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button className="btn-primary" onClick={submit} disabled={creating || !ok} style={{ flex: 1 }}>
            {creating ? t.give.creating : t.disaster.publish}
          </button>
          <button className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>{t.give.cancel}</button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────

const Ver = () => {
  const { user, profile } = useAuth()
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState('ver')
  const [myCards, setMyCards] = useState([])
  const [givenSupport, setGivenSupport] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCard, setEditingCard] = useState(null)
  const [showDisaster, setShowDisaster] = useState(false)

  const hex = profile?.hex_code || '#888888'

  const fetchData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      if (activeTab === 'ver') {
        const { data, error } = await supabase
          .from('gifts').select('*').eq('creator_id', user.id).order('created_at', { ascending: false })
        if (error) throw error
        setMyCards(data || [])
      } else {
        const { data, error } = await supabase
          .from('support_transactions')
          .select('*, receiver:receiver_id(hex_code), gift:gift_id(title)')
          .eq('provider_id', user.id).order('created_at', { ascending: false })
        if (error) throw error
        setGivenSupport(data || [])
      }
    } catch (err) { console.error('fetchData error:', err) }
    finally { setLoading(false) }
  }, [user, activeTab])

  useEffect(() => { if (user) fetchData() }, [user, fetchData])

  const toggleCard = async (id, current) => {
    try {
      const { error } = await supabase.from('gifts').update({ is_active: !current }).eq('id', id)
      if (error) throw error
      fetchData()
    } catch (err) { console.error('toggleCard error:', err) }
  }

  const handleCreateDisaster = async ({ category, text }) => {
    const expires = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()
    const label = t.disaster.categories[category] || ''
    const { error } = await supabase.from('gifts').insert({
      creator_id: user.id,
      title: `${label}: ${makeTitle(text).slice(0, 50)}`,
      description: text,
      is_disaster: true,
      disaster_category: category,
      expires_at: expires,
      visibility: 'community',
      gift_type: 'unlimited',
      is_physical: false,
      status: 'active',
      is_active: true,
      creator_hex: profile?.hex_code,
      lang: 'en',
    })
    if (error) throw error
    logActivity(user.id, 'disaster_offered', { metadata: { category } })
    setShowDisaster(false)
    fetchData()
  }

  const renewDisaster = async (id) => {
    const expires = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()
    try {
      const { error } = await supabase.from('gifts').update({ expires_at: expires, is_active: true }).eq('id', id)
      if (error) throw error
      fetchData()
    } catch (err) { console.error('renewDisaster error:', err) }
  }

  const handleSave = async (fields) => {
    const patch = {
      title: fields.title,
      description: fields.description,
      why_me: fields.why_me,
      gift_type: fields.gift_type,
      quota: fields.quota,
      is_physical: fields.is_physical,
      delivery_note: fields.delivery_note,
      visibility: fields.visibility,
    }
    if (fields.gift_type === 'quota' && fields.quota !== editingCard.quota) patch.quota_remaining = fields.quota
    const { error } = await supabase.from('gifts').update(patch).eq('id', editingCard.id)
    if (error) throw error
    setEditingCard(null)
    fetchData()
  }

  const handleCreate = async (fields) => {
    const { error } = await supabase.from('gifts').insert({ creator_id: user.id, ...fields })
    if (error) throw error
    logActivity(user.id, 'gift_offered', { metadata: { visibility: fields.visibility, gift_type: fields.gift_type } })
    setShowModal(false)
    fetchData()
  }

  const tabStyle = (active) => ({
    fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 500,
    color: active ? 'var(--text-primary)' : 'var(--text-muted)',
    background: 'none', border: 'none',
    borderBottom: active ? '2px solid var(--user-color)' : '2px solid transparent',
    padding: '12px 0', cursor: 'pointer', marginRight: 24, transition: 'color 150ms ease',
  })

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 32, fontWeight: 500, marginBottom: 8 }}>{t.give.title}</h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: 'var(--text-muted)', margin: 0 }}>{t.give.subtitle}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={() => setShowDisaster(true)}>
            {t.disaster.offerButton}
          </button>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            + {t.give.newCard}
          </button>
        </div>
      </div>

      <div style={{ borderBottom: '1px solid var(--border)', marginBottom: 32 }}>
        <button style={tabStyle(activeTab === 'ver')} onClick={() => setActiveTab('ver')}>{t.give.tabMy}</button>
        <button style={tabStyle(activeTab === 'verdiklerim')} onClick={() => setActiveTab('verdiklerim')}>{t.give.tabHistory}</button>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif", fontSize: 16 }}>—</p>
      ) : activeTab === 'ver' ? (
        <div>
          {myCards.length === 0 && (
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: 'var(--text-muted)', padding: '32px 0' }}>
              {t.give.empty}
            </p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            {myCards.map(card => (
              <MyGiftCard key={card.id} card={card} hex={hex} onToggle={toggleCard} onEdit={setEditingCard} onRenew={renewDisaster} t={t} />
            ))}
          </div>
        </div>
      ) : (
        givenSupport.length === 0 ? (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: 'var(--text-muted)', padding: '32px 0' }}>
            {t.give.historyEmpty}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {givenSupport.map(s => (
              <div key={s.id} style={{ background: 'var(--surface)', borderRadius: 16, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: s.receiver?.hex_code || 'var(--surface-2)', flexShrink: 0 }} />
                  <div>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 15, margin: 0 }}>{s.receiver?.hex_code}</p>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: 'var(--text-muted)', margin: 0 }}>{s.gift?.title}</p>
                  </div>
                </div>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: 'var(--text-muted)' }}>
                  {new Date(s.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )
      )}

      {showDisaster && (
        <DisasterModal t={t} onClose={() => setShowDisaster(false)} onCreate={handleCreateDisaster} />
      )}

      {editingCard && (
        <GiftFormModal
          card={editingCard}
          profile={profile}
          t={t}
          onClose={() => setEditingCard(null)}
          onCreate={handleSave}
        />
      )}

      {showModal && (
        <GiftFormModal
          profile={profile}
          t={t}
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
        />
      )}
    </DashboardLayout>
  )
}

export default Ver
