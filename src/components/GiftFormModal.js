import React, { useState } from 'react'
import { makeTitle } from '../lib/gifts'

// ─── New gift modal ────────────────────────────────────────────

const GiftFormModal = ({ profile, t, onClose, onCreate, card }) => {
  const [text, setText]             = useState(card?.description ?? '')
  const [showMore, setShowMore]     = useState(!!card)
  const [titleOverride, setTitleOverride] = useState(card?.title ?? '')
  const [giftType, setGiftType]     = useState(card?.gift_type ?? 'unlimited')
  const [quota, setQuota]           = useState(card?.quota ?? 1)
  const [isPhysical, setIsPhysical] = useState(card?.is_physical ?? false)
  const [delivery, setDelivery]     = useState(card?.delivery_note ?? '')
  const [visibility, setVisibility] = useState(card?.visibility === 'trust_circle' ? 'trust_circle' : 'community')
  const [whyMe, setWhyMe]           = useState(card?.why_me ?? '')
  const [creating, setCreating]     = useState(false)
  const [error, setError]           = useState(null)

  const autoTitle = makeTitle(text)

  const handleCreate = async () => {
    if (!text.trim()) return
    setCreating(true)
    setError(null)
    try {
      await onCreate({
        title: titleOverride.trim() || autoTitle,
        description: text.trim(),
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
      console.error('create gift error:', err)
      setError(err?.message ? `${t.give.error} (${err.message})` : t.give.error)
      setCreating(false)
    }
  }

  const label = { fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }

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
      <div style={{ fontSize: 15, fontWeight: 500, color: giftType === value ? 'var(--text-primary)' : 'var(--text-muted)', marginBottom: 3 }}>{main}</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.4 }}>{hint}</div>
    </button>
  )

  const SegBtn = ({ active, onClick, children }) => (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: '10px 8px', borderRadius: 10, cursor: 'pointer',
        fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 500,
        background: active ? 'var(--user-color)' : 'var(--surface-2)',
        color: active ? 'var(--user-color-text)' : 'var(--text-muted)',
        border: active ? '1px solid var(--user-color)' : '1px solid var(--border)',
        transition: 'all 150ms ease',
      }}
    >
      {children}
    </button>
  )

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 200, padding: '24px 16px', overflowY: 'auto' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: 'var(--surface)', borderRadius: 20, padding: 32, maxWidth: 520, width: '100%', border: '1px solid var(--border)', marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 24, fontWeight: 500, marginBottom: 20, marginTop: 0 }}>{card ? t.give.editTitle : t.give.offerQuestion}</h2>

        {error && <p style={{ fontSize: 15, color: '#e05c5c', marginBottom: 16 }}>{error}</p>}

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.give.offerPlaceholder}
          style={{ minHeight: 110 }}
          autoFocus={!card}
        />
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-muted)', margin: '8px 0 14px' }}>{t.give.offerHint}</p>

        <div style={{ display: card ? 'none' : 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
          {t.give.examples.map((ex) => (
            <button
              key={ex.label}
              type="button"
              onClick={() => setText(ex.text)}
              style={{
                padding: '7px 14px', borderRadius: 999, cursor: 'pointer', fontSize: 14,
                fontFamily: "'DM Sans', sans-serif", color: 'var(--text-primary)',
                background: 'var(--surface-2)', border: '1px solid var(--border)',
              }}
            >
              {ex.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <button className="btn-primary" onClick={handleCreate} disabled={creating || !text.trim()} style={{ flex: 1 }}>
            {creating ? t.give.creating : (card ? t.give.save : t.give.addGift)}
          </button>
          <button className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>{t.give.cancel}</button>
        </div>

        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: 'var(--text-muted)', textDecoration: 'underline' }}
        >
          {showMore ? t.give.lessOptions : t.give.moreOptions}
        </button>

        {showMore && (
          <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
            <div style={{ marginBottom: 20 }}>
              <label style={label}>{t.give.titleLabel}</label>
              <input value={titleOverride} onChange={(e) => setTitleOverride(e.target.value)} placeholder={autoTitle || t.give.titleAuto} />
            </div>

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

            <div style={{ marginBottom: 20 }}>
              <label style={label}>{t.give.physicalLabel}</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: isPhysical ? 12 : 0 }}>
                <SegBtn active={!isPhysical} onClick={() => setIsPhysical(false)}>{t.give.digital}</SegBtn>
                <SegBtn active={isPhysical} onClick={() => setIsPhysical(true)}>{t.give.physical}</SegBtn>
              </div>
              {isPhysical && (
                <div style={{ marginTop: 12 }}>
                  <textarea
                    value={delivery}
                    onChange={(e) => setDelivery(e.target.value)}
                    placeholder={t.give.deliveryNotePlaceholder}
                    style={{ minHeight: 72 }}
                  />
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-muted)', marginTop: 6 }}>{t.give.deliveryNoteHint}</p>
                </div>
              )}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={label}>{t.give.visibilityLabel}</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <SegBtn active={visibility === 'community'} onClick={() => setVisibility('community')}>{t.give.visCommunity}</SegBtn>
                <SegBtn active={visibility === 'trust_circle'} onClick={() => setVisibility('trust_circle')}>{t.give.visTrustCircle}</SegBtn>
              </div>
            </div>

            <div>
              <label style={label}>{t.give.whyMeLabel} <span style={{ opacity: 0.5 }}>({t.give.optional})</span></label>
              <textarea
                value={whyMe}
                onChange={(e) => setWhyMe(e.target.value)}
                placeholder={t.give.whyMePlaceholder}
                style={{ minHeight: 72 }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default GiftFormModal
