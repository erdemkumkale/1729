import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { makeTitle, loadGiftCommunities } from '../lib/gifts'
import { useI18n } from '../i18n'
import { GiftIcon, GIFT_ICON_IDS, GIFT_ICON_LABELS, suggestIcon } from '../lib/giftIcons'

// ─── New gift modal ────────────────────────────────────────────

const GiftFormModal = ({ profile, t, onClose, onCreate, card }) => {
  const [text, setText]             = useState(card?.description ?? '')
  const [showMore, setShowMore]     = useState(!!card)
  const [titleOverride, setTitleOverride] = useState(card?.title ?? '')
  const [giftType, setGiftType]     = useState(card?.gift_type ?? 'unlimited')
  const [quota, setQuota]           = useState(card?.quota ?? 1)
  const [quotaText, setQuotaText]   = useState(String(card?.quota ?? 1)) // lets the field be empty while typing
  const [isPhysical, setIsPhysical] = useState(card?.is_physical ?? false)
  const [delivery, setDelivery]     = useState(card?.delivery_note ?? '')
  const [visibility, setVisibility] = useState(card?.visibility === 'trust_circle' ? 'trust_circle' : 'community')
  const [whyMe, setWhyMe]           = useState(card?.why_me ?? '')
  const [chosenIcon, setChosenIcon]  = useState(card?.icon ?? null) // null = picked from the words
  const [pickingIcon, setPickingIcon] = useState(false)
  const [creating, setCreating]     = useState(false)
  const [error, setError]           = useState(null)

  const { lang } = useI18n()
  const { user } = useAuth()
  const [myComms, setMyComms]     = useState([])    // my communities: { id, name }
  const [pickedComms, setPickedComms] = useState([]) // chosen community ids

  // Only people in more than one community get the picker; no saved choice = all of them.
  useEffect(() => {
    if (!user) return
    let alive = true
    ;(async () => {
      const { data } = await supabase
        .from('sub_community_members')
        .select('sub_community_id, sub_communities(id, name, owner_id, members_aware)')
        .eq('user_id', user.id)
      const list = (data || []).filter((r) => r.sub_communities).map((r) => r.sub_communities)
        .map((c) => ({ id: c.id, name: c.owner_id === user.id || c.members_aware ? c.name : t.community.unnamed }))
      const saved = card?.id ? await loadGiftCommunities(supabase, card.id) : []
      if (!alive) return
      setMyComms(list)
      const valid = saved.filter((id) => list.some((c) => c.id === id))
      setPickedComms(valid.length > 0 ? valid : list.map((c) => c.id))
    })()
    return () => { alive = false }
  }, [user, card?.id, t])

  const togglePicked = (id) => setPickedComms((cur) => {
    if (!cur.includes(id)) return [...cur, id]
    return cur.length > 1 ? cur.filter((x) => x !== id) : cur // at least one stays
  })
  const showCommPicker = myComms.length > 1 && visibility === 'community'
  const autoTitle = makeTitle(text)
  const suggestedIcon = suggestIcon(`${titleOverride} ${text}`)
  const icon = chosenIcon || suggestedIcon

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
        // null = picker not shown; everything chosen = all communities (no restriction saved)
        _communities: showCommPicker && pickedComms.length < myComms.length ? pickedComms : (showCommPicker ? [] : null),
        icon,
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '0 0 14px' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--user-color)', color: 'var(--user-color-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <GiftIcon id={icon} size={24} />
          </div>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-muted)' }}>
            {chosenIcon ? GIFT_ICON_LABELS[lang === 'en' ? 'en' : 'tr'][chosenIcon] : t.give.iconAuto}
          </span>
          <button
            type="button"
            onClick={() => setPickingIcon((v) => !v)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-muted)', textDecoration: 'underline' }}
          >
            {pickingIcon ? t.give.iconClose : t.give.iconChange}
          </button>
        </div>
        {pickingIcon && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, margin: '0 0 18px' }}>
            {GIFT_ICON_IDS.map((id) => (
              <button
                key={id}
                type="button"
                title={GIFT_ICON_LABELS[lang === 'en' ? 'en' : 'tr'][id]}
                aria-label={GIFT_ICON_LABELS[lang === 'en' ? 'en' : 'tr'][id]}
                onClick={() => { setChosenIcon(id); setPickingIcon(false) }}
                style={{
                  aspectRatio: '1', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: icon === id ? 'var(--user-color)' : 'var(--surface-2)',
                  color: icon === id ? 'var(--user-color-text)' : 'var(--text-primary)',
                  border: '1px solid var(--border)',
                }}
              >
                <GiftIcon id={id} size={24} />
              </button>
            ))}
          </div>
        )}

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
                    type="number" min={1} value={quotaText}
                    onChange={(e) => {
                      setQuotaText(e.target.value)
                      setQuota(Math.max(1, parseInt(e.target.value) || 1))
                    }}
                    onBlur={() => setQuotaText(String(quota))}
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
              {showCommPicker && (
                <div style={{ marginTop: 14 }}>
                  <label style={label}>{t.give.communitiesLabel}</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {myComms.map((c) => {
                      const on = pickedComms.includes(c.id)
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => togglePicked(c.id)}
                          aria-pressed={on}
                          style={{
                            padding: '7px 14px', borderRadius: 999, cursor: 'pointer', fontSize: 14,
                            fontFamily: "'DM Sans', sans-serif",
                            background: on ? 'var(--user-color)' : 'var(--surface-2)',
                            color: on ? 'var(--user-color-text)' : 'var(--text-muted)',
                            border: on ? '1px solid var(--user-color)' : '1px solid var(--border)',
                          }}
                        >
                          {c.name}
                        </button>
                      )
                    })}
                  </div>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-muted)', marginTop: 8, marginBottom: 0 }}>{t.give.communitiesHint}</p>
                </div>
              )}
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
