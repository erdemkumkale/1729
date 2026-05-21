import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../i18n'
import DashboardLayout from '../components/DashboardLayout'

// ─── Badge ──────────────────────────────────────────────────────

const Badge = ({ children, color }) => (
  <span style={{
    fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 500,
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

const MyGiftCard = ({ card, hex, onToggle, t }) => {
  const r = parseInt(hex.slice(1,3),16)
  const g = parseInt(hex.slice(3,5),16)
  const b = parseInt(hex.slice(5,7),16)

  const typeBadge = () => {
    if (card.gift_type === 'once') return <Badge>{t.give.badgeOnce}</Badge>
    if (card.gift_type === 'quota') return <Badge>{t.give.badgeQuota(card.quota_remaining ?? card.quota ?? 0)}</Badge>
    return <Badge>{t.give.badgeUnlimited}</Badge>
  }

  return (
    <div className="armagan-card" style={{
      background: `rgba(${r},${g},${b},0.08)`,
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 17, fontWeight: 500, marginBottom: 6, marginTop: 0 }}>{card.title}</h3>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>{card.description}</p>
        </div>
        <button
          className="btn-secondary"
          onClick={() => onToggle(card.id, card.is_active)}
          style={{ padding: '6px 14px', fontSize: 12, whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          {card.is_active ? t.give.cardActive : t.give.cardInactive}
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {typeBadge()}
        {card.is_physical && <Badge>{t.give.badgePhysical}</Badge>}
        {card.visibility === 'trust_circle' && <Badge>{t.give.visTrustCircle}</Badge>}
        {card.visibility === 'global' && <Badge>{t.give.visGlobal}</Badge>}
      </div>
    </div>
  )
}

// ─── New gift modal ────────────────────────────────────────────

const NewGiftModal = ({ profile, t, onClose, onCreate }) => {
  const [title, setTitle]           = useState('')
  const [desc, setDesc]             = useState('')
  const [giftType, setGiftType]     = useState('unlimited')
  const [quota, setQuota]           = useState(1)
  const [isPhysical, setIsPhysical] = useState(false)
  const [delivery, setDelivery]     = useState('')
  const [visibility, setVisibility] = useState('trust_circle')
  const [whyMe, setWhyMe]           = useState('')
  const [creating, setCreating]     = useState(false)
  const [error, setError]           = useState(null)

  const handleCreate = async () => {
    if (!title.trim() || !desc.trim()) return
    setCreating(true)
    setError(null)
    try {
      await onCreate({
        title: title.trim(),
        description: desc.trim(),
        why_me: whyMe.trim() || null,
        gift_type: giftType,
        quota: giftType === 'quota' ? quota : null,
        quota_remaining: giftType === 'quota' ? quota : null,
        is_physical: isPhysical,
        delivery_note: isPhysical && delivery.trim() ? delivery.trim() : null,
        visibility,
        creator_hex: profile?.hex_code,
        status: 'active',
        is_active: true,
        lang: 'en',
      })
    } catch (err) {
      setError(t.give.error)
      setCreating(false)
    }
  }

  const label = { fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }

  const TypeBtn = ({ value, main, hint }) => (
    <button
      onClick={() => setGiftType(value)}
      style={{
        flex: 1, padding: '12px 10px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
        fontFamily: "'DM Sans', sans-serif",
        background: giftType === value ? 'var(--user-color-soft)' : 'var(--surface-2)',
        border: giftType === value ? '1px solid var(--user-color)' : '1px solid var(--border)',
        transition: 'all 150ms ease',
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 500, color: giftType === value ? 'var(--text-primary)' : 'var(--text-muted)', marginBottom: 3 }}>{main}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>{hint}</div>
    </button>
  )

  const FormatBtn = ({ value, label: lbl }) => (
    <button
      onClick={() => setIsPhysical(value)}
      style={{
        flex: 1, padding: '10px 8px', borderRadius: 10, cursor: 'pointer',
        fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
        background: isPhysical === value ? 'var(--user-color)' : 'var(--surface-2)',
        color: isPhysical === value ? '#fff' : 'var(--text-muted)',
        border: isPhysical === value ? '1px solid var(--user-color)' : '1px solid var(--border)',
        transition: 'all 150ms ease',
      }}
    >
      {lbl}
    </button>
  )

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 200, padding: '24px 16px', overflowY: 'auto' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: 'var(--surface)', borderRadius: 20, padding: 32, maxWidth: 520, width: '100%', border: '1px solid var(--border)', marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 22, fontWeight: 500, marginBottom: 28, marginTop: 0 }}>{t.give.newCardTitle}</h2>

        {error && <p style={{ fontSize: 13, color: '#e05c5c', marginBottom: 16 }}>{error}</p>}

        {/* 1. Title */}
        <div style={{ marginBottom: 16 }}>
          <label style={label}>{t.give.titleLabel}</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        {/* 2. Description */}
        <div style={{ marginBottom: 20 }}>
          <label style={label}>{t.give.descLabel}</label>
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} />
        </div>

        {/* 3. Gift type */}
        <div style={{ marginBottom: 20 }}>
          <label style={label}>{t.give.giftTypeLabel}</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <TypeBtn value="unlimited" main={t.give.typeUnlimited} hint={t.give.typeUnlimitedHint} />
            <TypeBtn value="quota"     main={t.give.typeQuota}     hint={t.give.typeQuotaHint} />
            <TypeBtn value="once"      main={t.give.typeOnce}      hint={t.give.typeOnceHint} />
          </div>
          {giftType === 'quota' && (
            <div style={{ marginTop: 12 }}>
              <label style={label}>{t.give.quotaLabel}</label>
              <input
                type="number" min={1} value={quota}
                onChange={(e) => setQuota(Math.max(1, parseInt(e.target.value) || 1))}
                style={{ maxWidth: 120 }}
              />
            </div>
          )}
        </div>

        {/* 4. Physical / Digital */}
        <div style={{ marginBottom: 20 }}>
          <label style={label}>{t.give.physicalLabel}</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: isPhysical ? 12 : 0 }}>
            <FormatBtn value={false} label={t.give.digital} />
            <FormatBtn value={true}  label={t.give.physical} />
          </div>
          {isPhysical && (
            <div style={{ marginTop: 12 }}>
              <textarea
                value={delivery}
                onChange={(e) => setDelivery(e.target.value)}
                placeholder={t.give.deliveryNotePlaceholder}
                style={{ minHeight: 72 }}
              />
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                {t.give.deliveryNoteHint}
              </p>
            </div>
          )}
        </div>

        {/* 5. Visibility */}
        <div style={{ marginBottom: 20 }}>
          <label style={label}>{t.give.visibilityLabel}</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { value: 'trust_circle', label: t.give.visTrustCircle, disabled: false },
              { value: 'community',    label: t.give.visCommunity,    disabled: true  },
              { value: 'global',       label: t.give.visGlobal,        disabled: false },
            ].map(({ value, label: lbl, disabled }) => (
              <button
                key={value}
                onClick={() => !disabled && setVisibility(value)}
                title={disabled ? t.give.comingSoon : undefined}
                style={{
                  flex: 1, padding: '10px 8px', borderRadius: 10,
                  fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
                  background: visibility === value ? 'var(--user-color)' : 'var(--surface-2)',
                  color: disabled ? 'var(--text-muted)' : visibility === value ? '#fff' : 'var(--text-muted)',
                  border: visibility === value ? '1px solid var(--user-color)' : '1px solid var(--border)',
                  opacity: disabled ? 0.4 : 1,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  transition: 'all 150ms ease',
                }}
              >
                {lbl}
                {disabled && <span style={{ display: 'block', fontSize: 10, opacity: 0.7 }}>{t.give.comingSoon}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* 6. Why me */}
        <div style={{ marginBottom: 28 }}>
          <label style={label}>
            {t.give.whyMeLabel} <span style={{ opacity: 0.5 }}>({t.give.optional})</span>
          </label>
          <textarea
            value={whyMe}
            onChange={(e) => setWhyMe(e.target.value)}
            placeholder={t.give.whyMePlaceholder}
            style={{ minHeight: 72 }}
          />
        </div>

        {/* 7. Actions */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn-primary" onClick={handleCreate} disabled={creating || !title.trim() || !desc.trim()} style={{ flex: 1 }}>
            {creating ? t.give.creating : t.give.create}
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

  const handleCreate = async (fields) => {
    const { error } = await supabase.from('gifts').insert({ creator_id: user.id, ...fields })
    if (error) throw error
    setShowModal(false)
    fetchData()
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
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 32, fontWeight: 500, marginBottom: 8 }}>{t.give.title}</h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>{t.give.subtitle}</p>
      </div>

      <div style={{ borderBottom: '1px solid var(--border)', marginBottom: 32 }}>
        <button style={tabStyle(activeTab === 'ver')} onClick={() => setActiveTab('ver')}>{t.give.tabMy}</button>
        <button style={tabStyle(activeTab === 'verdiklerim')} onClick={() => setActiveTab('verdiklerim')}>{t.give.tabHistory}</button>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>—</p>
      ) : activeTab === 'ver' ? (
        <div>
          {myCards.length === 0 && (
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-muted)', padding: '32px 0' }}>
              {t.give.empty}
            </p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            {myCards.map(card => (
              <MyGiftCard key={card.id} card={card} hex={hex} onToggle={toggleCard} t={t} />
            ))}
          </div>
          <button className="btn-primary" onClick={() => setShowModal(true)} style={{ width: '100%' }}>
            {t.give.newCard}
          </button>
        </div>
      ) : (
        givenSupport.length === 0 ? (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-muted)', padding: '32px 0' }}>
            {t.give.historyEmpty}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {givenSupport.map(s => (
              <div key={s.id} style={{ background: 'var(--surface)', borderRadius: 16, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: s.receiver?.hex_code || 'var(--surface-2)', flexShrink: 0 }} />
                  <div>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, margin: 0 }}>{s.receiver?.hex_code}</p>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>{s.gift?.title}</p>
                  </div>
                </div>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--text-muted)' }}>
                  {new Date(s.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )
      )}

      {showModal && (
        <NewGiftModal
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
