import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../i18n'
import DashboardLayout from '../components/DashboardLayout'

// ─── Gift card ─────────────────────────────────────────────────

const GiftCard = ({ gift, onRequest, requesting, t }) => {
  const hex = gift.creator?.hex_code || gift.creator_hex || '#888888'
  const r = parseInt(hex.slice(1,3),16)
  const g = parseInt(hex.slice(3,5),16)
  const b = parseInt(hex.slice(5,7),16)
  return (
    <div className="armagan-card" style={{ background: `rgba(${r},${g},${b},0.10)` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', background: hex, flexShrink: 0 }} />
        <span className="mono">{hex}</span>
      </div>
      <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, fontWeight: 500, marginBottom: 8 }}>{gift.title}</h3>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>{gift.description}</p>
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

const FilterPill = ({ label, active, onClick }) => (
  <button className={`btn-ghost${active ? ' active' : ''}`} onClick={onClick}>{label}</button>
)

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
          <button className="btn-primary" onClick={onAdd} style={{ flex: 1 }}>{t.explore.addToCircleYes}</button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────

const Al = () => {
  const { user } = useAuth()
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState('al')
  const [filter, setFilter] = useState('guven')
  const [availableGifts, setAvailableGifts] = useState([])
  const [receivedSupport, setReceivedSupport] = useState([])
  const [circleIds, setCircleIds] = useState([])
  const [communityIds, setCommunityIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(false)
  const [confirmModal, setConfirmModal] = useState(null) // { transactionId, providerId, providerHex, giftTitle }

  // Fetch trust circle member IDs (from trust_circle table)
  const fetchCircleIds = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('trust_circle')
      .select('member_id')
      .eq('owner_id', user.id)
    setCircleIds(data?.map(r => r.member_id) || [])
  }, [user])

  // Fetch community member IDs (co-members in shared sub_communities)
  const fetchCommunityIds = useCallback(async () => {
    if (!user) return
    // Get all communities the user is in
    const { data: myComms } = await supabase
      .from('sub_community_members')
      .select('sub_community_id')
      .eq('user_id', user.id)
    if (!myComms || myComms.length === 0) { setCommunityIds([]); return }

    const commIds = myComms.map(r => r.sub_community_id)
    // Get all co-members in those communities
    const { data: members } = await supabase
      .from('sub_community_members')
      .select('user_id')
      .in('sub_community_id', commIds)
    const ids = [...new Set((members || []).map(r => r.user_id).filter(id => id !== user.id))]
    setCommunityIds(ids)
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

        if (filter === 'guven') {
          if (circleIds.length === 0) { setAvailableGifts([]); setLoading(false); return }
          query = query.in('creator_id', circleIds)
        } else if (filter === 'community') {
          if (communityIds.length === 0) { setAvailableGifts([]); setLoading(false); return }
          query = query.in('creator_id', communityIds)
        }
        // 'global' → no extra filter

        const { data, error } = await query.order('created_at', { ascending: false })
        if (error) throw error
        setAvailableGifts(data || [])
      } else {
        // Received tab — include receiver_confirmed
        const { data, error } = await supabase
          .from('support_transactions')
          .select('*, provider:provider_id(hex_code), gift:gift_id(title), receiver_confirmed, confirmed_at')
          .eq('receiver_id', user.id)
          .order('created_at', { ascending: false })
        if (error) throw error
        setReceivedSupport(data || [])
      }
    } catch (err) {
      console.error('fetchData error:', err)
    } finally {
      setLoading(false)
    }
  }, [user, activeTab, filter, circleIds, communityIds])

  useEffect(() => {
    if (user) { fetchCircleIds(); fetchCommunityIds() }
  }, [user, fetchCircleIds, fetchCommunityIds])

  useEffect(() => { if (user) fetchData() }, [user, fetchData])

  const handleRequest = async (giftId, providerId) => {
    setRequesting(true)
    try {
      const { error } = await supabase
        .from('support_transactions')
        .insert({ provider_id: providerId, receiver_id: user.id, gift_id: giftId, status: 'active' })
      if (error) throw error
      fetchData()
    } catch (err) {
      console.error('handleRequest error:', err)
    } finally {
      setRequesting(false)
    }
  }

  const handleMarkReceived = async (tx) => {
    try {
      await supabase
        .from('support_transactions')
        .update({ receiver_confirmed: true, confirmed_at: new Date().toISOString() })
        .eq('id', tx.id)
      // Refresh list optimistically
      setReceivedSupport(prev => prev.map(s => s.id === tx.id ? { ...s, receiver_confirmed: true } : s))
      // Show "Add to circle?" modal
      setConfirmModal({
        transactionId: tx.id,
        providerId: tx.provider_id,
        providerHex: tx.provider?.hex_code,
        giftTitle: tx.gift?.title,
      })
    } catch (err) {
      console.error('handleMarkReceived error:', err)
    }
  }

  const handleAddToCircle = async () => {
    if (!confirmModal) return
    try {
      await supabase.from('trust_circle').upsert(
        {
          owner_id: user.id,
          member_id: confirmModal.providerId,
          gift_title: confirmModal.giftTitle || null,
        },
        { onConflict: 'owner_id,member_id' }
      )
      fetchCircleIds()
    } catch (err) {
      console.error('handleAddToCircle error:', err)
    } finally {
      setConfirmModal(null)
    }
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
        <h1 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 32, fontWeight: 500, marginBottom: 8 }}>{t.explore.title}</h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>{t.explore.subtitle}</p>
      </div>

      <div style={{ borderBottom: '1px solid var(--border)', marginBottom: 32 }}>
        <button style={tabStyle(activeTab === 'al')} onClick={() => setActiveTab('al')}>{t.explore.tabFeed}</button>
        <button style={tabStyle(activeTab === 'aldiklarim')} onClick={() => setActiveTab('aldiklarim')}>{t.explore.tabHistory}</button>
      </div>

      {activeTab === 'al' && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
          <FilterPill label={t.explore.filterTrustTeam} active={filter === 'guven'} onClick={() => setFilter('guven')} />
          <FilterPill label={t.explore.filterCommunity} active={filter === 'community'} onClick={() => setFilter('community')} />
          <FilterPill label={t.explore.filterGlobal} active={filter === 'global'} onClick={() => setFilter('global')} />
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>—</p>
      ) : activeTab === 'al' ? (
        availableGifts.length === 0 ? (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-muted)', padding: '64px 0' }}>
            {t.explore.empty}
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {availableGifts.map(gift => (
              <GiftCard key={gift.id} gift={gift} onRequest={handleRequest} requesting={requesting} t={t} />
            ))}
          </div>
        )
      ) : (
        receivedSupport.length === 0 ? (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-muted)', padding: '64px 0' }}>
            {t.explore.historyEmpty}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {receivedSupport.map(s => (
              <div key={s.id} style={{
                background: 'var(--surface)', borderRadius: 16, padding: 20,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                border: '1px solid var(--border)',
              }}>
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
                  {!s.receiver_confirmed && (
                    <button
                      className="btn-ghost"
                      onClick={() => handleMarkReceived(s)}
                      style={{ fontSize: 12 }}
                    >
                      {t.explore.markReceived}
                    </button>
                  )}
                  {s.receiver_confirmed && (
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
