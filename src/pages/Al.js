import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../i18n'
import DashboardLayout from '../components/DashboardLayout'

// ─── Badge ──────────────────────────────────────────────────────

const Badge = ({ children }) => (
  <span style={{
    fontFamily: "'DM Mono', monospace", fontSize: 11,
    padding: '2px 8px', borderRadius: 6,
    background: 'var(--surface-2)', color: 'var(--text-muted)',
    border: '1px solid var(--border)', whiteSpace: 'nowrap',
  }}>
    {children}
  </span>
)

// ─── Icons (inline SVG) ─────────────────────────────────────────

const FilterIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
)

const Chevron = ({ open }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms ease' }}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const GiftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 12 20 22 4 22 4 12" />
    <rect x="2" y="7" width="20" height="5" />
    <line x1="12" y1="22" x2="12" y2="7" />
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
  </svg>
)

// ─── Scope segmented control (grouped pill) ─────────────────────

const ScopeSegment = ({ value, onChange, options }) => (
  <div style={{
    display: 'inline-flex', gap: 3, padding: 3,
    background: 'var(--surface-2)', borderRadius: 10,
  }}>
    {options.map(o => {
      const active = value === o.value
      return (
        <button key={o.value} onClick={() => onChange(o.value)} style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
          padding: '7px 14px', borderRadius: 7, border: 'none', cursor: 'pointer',
          background: active ? 'var(--surface)' : 'transparent',
          color: active ? 'var(--text-primary)' : 'var(--text-muted)',
          boxShadow: active ? '0 1px 2px rgba(0,0,0,0.18)' : 'none',
          transition: 'all 150ms ease', whiteSpace: 'nowrap',
        }}>
          {o.label}
        </button>
      )
    })}
  </div>
)

// ─── Type dropdown ──────────────────────────────────────────────

const TypeDropdown = ({ value, options, onChange, label }) => {
  const [open, setOpen] = useState(false)
  const current = options.find(o => o.value === value)
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        fontFamily: "'DM Sans', sans-serif", fontSize: 13,
        color: 'var(--text-primary)',
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 8, padding: '8px 12px', cursor: 'pointer',
        minHeight: 40, whiteSpace: 'nowrap',
      }}>
        <FilterIcon />
        <span>{label}: {current?.label}</span>
        <Chevron open={open} />
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 90 }} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 100,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 10, padding: 4, minWidth: 190,
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          }}>
            {options.map(o => {
              const active = value === o.value
              return (
                <button key={o.value} onClick={() => { onChange(o.value); setOpen(false) }} style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                  color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontWeight: active ? 500 : 400,
                  background: active ? 'var(--surface-2)' : 'transparent',
                  border: 'none', borderRadius: 7, padding: '11px 12px',
                  cursor: 'pointer', minHeight: 44,
                }}>
                  {o.label}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Empty-state card ───────────────────────────────────────────

const EmptyState = ({ filter, t, onOffer }) => {
  const isCircle = filter === 'trust_circle'
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
      <div style={{
        maxWidth: 420, width: '100%', textAlign: 'center',
        border: '1px dashed var(--border)', borderRadius: 20, padding: 32,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: 'var(--surface-2)', color: 'var(--text-muted)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
        }}>
          <GiftIcon />
        </div>
        <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 500, marginBottom: 8 }}>
          {isCircle ? t.explore.emptyCircleTitle : t.explore.emptyOtherTitle}
        </h3>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 320, marginBottom: 20 }}>
          {isCircle ? t.explore.emptyCircleText : t.explore.emptyOtherText}
        </p>
        <button className="btn-primary" onClick={onOffer} style={{ borderRadius: 8 }}>
          + {t.explore.offerGift}
        </button>
      </div>
    </div>
  )
}

// ─── Gift card ───────────────────────────────────────────────────

const GiftCard = ({ gift, onRequest, requesting, t }) => {
  const hex = gift.creator?.hex_code || gift.creator_hex || '#888888'
  const r = parseInt(hex.slice(1,3),16)
  const g = parseInt(hex.slice(3,5),16)
  const b = parseInt(hex.slice(5,7),16)

  const typeBadge = () => {
    if (gift.gift_type === 'once')  return <Badge>{t.give.badgeOnce}</Badge>
    if (gift.gift_type === 'quota') return <Badge>{t.give.badgeQuota(gift.quota_remaining ?? gift.quota ?? 0)}</Badge>
    return null // unlimited — no badge needed
  }

  return (
    <div className="armagan-card" style={{ background: `rgba(${r},${g},${b},0.10)` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', background: hex, flexShrink: 0 }} />
        <span className="mono">{hex}</span>
      </div>
      <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, fontWeight: 500, marginBottom: 8 }}>{gift.title}</h3>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-muted)', marginBottom: 12 }}>{gift.description}</p>

      {/* Badges row */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {typeBadge()}
        {gift.is_physical && <Badge>{t.give.badgePhysical}</Badge>}
      </div>

      <button
        className="btn-primary"
        onClick={() => onRequest(gift.id, gift.creator_id)}
        disabled={requesting}
        style={{ width: '100%', background: hex, borderRadius: 8 }}
      >
        {requesting ? t.explore.requesting : t.explore.requestSupport}
      </button>
    </div>
  )
}

// ─── Add-to-circle modal ────────────────────────────────────────

const AddToCircleModal = ({ data, onAdd, onSkip }) => {
  const { t } = useI18n()
  const hex = data.providerHex || '#888888'
  const r = parseInt(hex.slice(1,3),16)
  const g = parseInt(hex.slice(3,5),16)
  const b = parseInt(hex.slice(5,7),16)
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}>
      <div style={{ background: 'var(--surface)', borderRadius: 20, padding: 32, maxWidth: 380, width: '100%', border: '1px solid var(--border)', textAlign: 'center' }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: `rgba(${r},${g},${b},0.15)`, border: `2px solid rgba(${r},${g},${b},0.4)`, margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: hex }} />
        </div>
        <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 20, fontWeight: 500, marginBottom: 8 }}>{t.explore.addToCircle}</h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-muted)', marginBottom: 8 }}>{t.explore.addToCircleHint}</p>
        {data.giftTitle && (
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--text-muted)', marginBottom: 28 }}>"{data.giftTitle}"</p>
        )}
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-secondary" onClick={onSkip} style={{ flex: 1 }}>{t.explore.addToCircleSkip}</button>
          <button className="btn-primary"   onClick={onAdd}  style={{ flex: 1 }}>{t.explore.addToCircleYes}</button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────

const Al = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useI18n()
  const [activeTab, setActiveTab]       = useState('al')
  const [filter, setFilter]             = useState('trust_circle')
  const [typeFilter, setTypeFilter]     = useState('all')
  const [availableGifts, setAvailableGifts] = useState([])
  const [receivedSupport, setReceivedSupport] = useState([])
  const [circleIds, setCircleIds]       = useState([])
  const [communityIds, setCommunityIds] = useState([])
  const [loading, setLoading]           = useState(true)
  const [requesting, setRequesting]     = useState(false)
  const [confirmModal, setConfirmModal] = useState(null)

  const fetchCircleIds = useCallback(async () => {
    if (!user) return
    const { data } = await supabase.from('trust_circle').select('member_id').eq('owner_id', user.id)
    setCircleIds(data?.map(r => r.member_id) || [])
  }, [user])

  const fetchCommunityIds = useCallback(async () => {
    if (!user) return
    const { data: myComms } = await supabase.from('sub_community_members').select('sub_community_id').eq('user_id', user.id)
    if (!myComms || myComms.length === 0) { setCommunityIds([]); return }
    const commIds = myComms.map(r => r.sub_community_id)
    const { data: members } = await supabase.from('sub_community_members').select('user_id').in('sub_community_id', commIds)
    setCommunityIds([...new Set((members || []).map(r => r.user_id).filter(id => id !== user.id))])
  }, [user])

  const fetchData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      if (activeTab === 'al') {
        let query = supabase
          .from('gifts')
          .select('*, creator:creator_id(hex_code)')
          .eq('is_active', true)
          .neq('creator_id', user.id)

        if (filter === 'trust_circle') {
          if (circleIds.length === 0) { setAvailableGifts([]); setLoading(false); return }
          query = query.in('creator_id', circleIds)
        } else if (filter === 'community') {
          if (communityIds.length === 0) { setAvailableGifts([]); setLoading(false); return }
          query = query.in('creator_id', communityIds)
        }
        // 'global' → no filter

        // Type filter
        if (typeFilter === 'unlimited') query = query.eq('gift_type', 'unlimited')
        else if (typeFilter === 'quota') query = query.eq('gift_type', 'quota')
        else if (typeFilter === 'once')  query = query.eq('gift_type', 'once')
        else if (typeFilter === 'physical') query = query.eq('is_physical', true)

        const { data, error } = await query.order('created_at', { ascending: false })
        if (error) throw error
        setAvailableGifts(data || [])
      } else {
        const { data, error } = await supabase
          .from('support_transactions')
          .select('*, provider:provider_id(hex_code), gift:gift_id(title), receiver_confirmed, confirmed_at')
          .eq('receiver_id', user.id)
          .order('created_at', { ascending: false })
        if (error) throw error
        setReceivedSupport(data || [])
      }
    } catch (err) { console.error('fetchData error:', err) }
    finally { setLoading(false) }
  }, [user, activeTab, filter, typeFilter, circleIds, communityIds])

  useEffect(() => { if (user) { fetchCircleIds(); fetchCommunityIds() } }, [user, fetchCircleIds, fetchCommunityIds])
  useEffect(() => { if (user) fetchData() }, [user, fetchData])

  const handleRequest = async (giftId, providerId) => {
    setRequesting(true)
    try {
      const { error } = await supabase.from('support_transactions').insert({ provider_id: providerId, receiver_id: user.id, gift_id: giftId, status: 'active' })
      if (error) throw error
      fetchData()
    } catch (err) { console.error('handleRequest error:', err) }
    finally { setRequesting(false) }
  }

  const handleMarkReceived = async (tx) => {
    try {
      await supabase.from('support_transactions').update({ receiver_confirmed: true, confirmed_at: new Date().toISOString() }).eq('id', tx.id)
      setReceivedSupport(prev => prev.map(s => s.id === tx.id ? { ...s, receiver_confirmed: true } : s))
      setConfirmModal({ transactionId: tx.id, providerId: tx.provider_id, providerHex: tx.provider?.hex_code, giftTitle: tx.gift?.title })
    } catch (err) { console.error('handleMarkReceived error:', err) }
  }

  const handleAddToCircle = async () => {
    if (!confirmModal) return
    try {
      await supabase.from('trust_circle').upsert(
        { owner_id: user.id, member_id: confirmModal.providerId, gift_title: confirmModal.giftTitle || null },
        { onConflict: 'owner_id,member_id' }
      )
      fetchCircleIds()
    } catch (err) { console.error('handleAddToCircle error:', err) }
    finally { setConfirmModal(null) }
  }

  const tabStyle = (active) => ({
    fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500,
    color: active ? 'var(--text-primary)' : 'var(--text-muted)',
    background: 'none', border: 'none',
    borderBottom: active ? '2px solid var(--user-color)' : '2px solid transparent',
    padding: '12px 0', cursor: 'pointer', marginRight: 24, transition: 'color 150ms ease',
  })

  const typeFilters = [
    { value: 'all',      label: t.explore.filterAll },
    { value: 'unlimited',label: t.explore.filterUnlimited },
    { value: 'quota',    label: t.explore.filterQuota },
    { value: 'once',     label: t.explore.filterOnce },
    { value: 'physical', label: t.explore.filterPhysical },
  ]

  return (
    <DashboardLayout>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 32, fontWeight: 500, marginBottom: 6 }}>{t.explore.title}</h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>{t.explore.subtitle}</p>
      </div>

      <div style={{ borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
        <button style={tabStyle(activeTab === 'al')} onClick={() => setActiveTab('al')}>{t.explore.tabFeed}</button>
        <button style={tabStyle(activeTab === 'aldiklarim')} onClick={() => setActiveTab('aldiklarim')}>{t.explore.tabHistory}</button>
      </div>

      {/* Single-row filter: scope segment (left) + type dropdown (right) */}
      {activeTab === 'al' && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          gap: 12, flexWrap: 'wrap', marginBottom: 28,
        }}>
          <ScopeSegment
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'trust_circle', label: t.explore.filterTrustCircle },
              { value: 'community',    label: t.explore.filterCommunity },
              { value: 'global',       label: t.explore.filterGlobal },
            ]}
          />
          <TypeDropdown
            value={typeFilter}
            onChange={setTypeFilter}
            label={t.explore.typeLabel}
            options={typeFilters}
          />
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>—</p>
      ) : activeTab === 'al' ? (
        availableGifts.length === 0 ? (
          <EmptyState filter={filter} t={t} onOffer={() => navigate('/give')} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {availableGifts.map(gift => (
              <GiftCard key={gift.id} gift={gift} onRequest={handleRequest} requesting={requesting} t={t} />
            ))}
          </div>
        )
      ) : (
        receivedSupport.length === 0 ? (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-muted)', padding: '64px 0' }}>{t.explore.historyEmpty}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {receivedSupport.map(s => (
              <div key={s.id} style={{ background: 'var(--surface)', borderRadius: 16, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: s.provider?.hex_code || 'var(--surface-2)', flexShrink: 0 }} />
                  <div>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, margin: 0 }}>{s.provider?.hex_code || '—'}</p>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>{s.gift?.title}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--text-muted)' }}>
                    {new Date(s.created_at).toLocaleDateString()}
                  </span>
                  {!s.receiver_confirmed ? (
                    <button className="btn-ghost" onClick={() => handleMarkReceived(s)} style={{ fontSize: 12 }}>
                      {t.explore.markReceived}
                    </button>
                  ) : (
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'rgba(80,200,120,0.8)' }}>✓</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {confirmModal && (
        <AddToCircleModal
          data={confirmModal}
          onAdd={handleAddToCircle}
          onSkip={() => setConfirmModal(null)}
        />
      )}
    </DashboardLayout>
  )
}

export default Al
