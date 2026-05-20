import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../i18n'
import DashboardLayout from '../components/DashboardLayout'

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
      <button className="btn-primary" onClick={() => onRequest(gift.id, gift.creator_id)} disabled={requesting}
        style={{ width: '100%', background: hex, borderRadius: 8 }}>
        {requesting ? t.explore.requesting : t.explore.requestSupport}
      </button>
    </div>
  )
}

const FilterPill = ({ label, active, onClick }) => (
  <button className={`btn-ghost${active ? ' active' : ''}`} onClick={onClick}>{label}</button>
)

const Al = () => {
  const { user } = useAuth()
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState('al')
  const [filter, setFilter] = useState('guven')
  const [availableGifts, setAvailableGifts] = useState([])
  const [receivedSupport, setReceivedSupport] = useState([])
  const [trustTeamIds, setTrustTeamIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(false)

  const fetchTrustTeamIds = useCallback(async () => {
    if (!user) return
    try {
      const teamIds = new Set()
      const { data: inviterData } = await supabase.from('invitations').select('inviter_id').eq('used_by', user.id).eq('status', 'used')
      inviterData?.forEach(i => i.inviter_id && teamIds.add(i.inviter_id))
      const { data: invitedData } = await supabase.from('invitations').select('used_by').eq('inviter_id', user.id).eq('status', 'used').not('used_by', 'is', null)
      invitedData?.forEach(i => i.used_by && teamIds.add(i.used_by))
      const { data: txData } = await supabase.from('support_transactions').select('provider_id, receiver_id').or(`provider_id.eq.${user.id},receiver_id.eq.${user.id}`)
      txData?.forEach(tx => { const p = tx.provider_id === user.id ? tx.receiver_id : tx.provider_id; if (p) teamIds.add(p) })
      setTrustTeamIds(Array.from(teamIds))
    } catch (err) { console.error('fetchTrustTeamIds error:', err) }
  }, [user])

  const fetchData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      if (activeTab === 'al') {
        let query = supabase.from('gifts').select('*, creator:creator_id(hex_code)').eq('is_active', true).neq('creator_id', user.id)
        if (filter === 'guven' && trustTeamIds.length > 0) query = query.in('creator_id', trustTeamIds)
        const { data, error } = await query.order('created_at', { ascending: false })
        if (error) throw error
        setAvailableGifts(data || [])
      } else {
        const { data, error } = await supabase.from('support_transactions')
          .select('*, provider:provider_id(hex_code), gift:gift_id(title)').eq('receiver_id', user.id).order('created_at', { ascending: false })
        if (error) throw error
        setReceivedSupport(data || [])
      }
    } catch (err) { console.error('fetchData error:', err) } finally { setLoading(false) }
  }, [user, activeTab, filter, trustTeamIds])

  useEffect(() => { if (user) fetchTrustTeamIds() }, [user, fetchTrustTeamIds])
  useEffect(() => { if (user) fetchData() }, [user, fetchData])

  const handleRequest = async (giftId, providerId) => {
    setRequesting(true)
    try {
      const { error } = await supabase.from('support_transactions').insert({ provider_id: providerId, receiver_id: user.id, gift_id: giftId, status: 'active' })
      if (error) throw error
      fetchData()
    } catch (err) { console.error('handleRequest error:', err) } finally { setRequesting(false) }
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
          <FilterPill label={t.explore.filterTurkey} active={filter === 'turkiye'} onClick={() => setFilter('turkiye')} />
          <FilterPill label={t.explore.filterGlobal} active={filter === 'global'} onClick={() => setFilter('global')} />
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>—</p>
      ) : activeTab === 'al' ? (
        availableGifts.length === 0 ? (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-muted)', padding: '64px 0' }}>{t.explore.empty}</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {availableGifts.map((gift) => <GiftCard key={gift.id} gift={gift} onRequest={handleRequest} requesting={requesting} t={t} />)}
          </div>
        )
      ) : (
        receivedSupport.length === 0 ? (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-muted)', padding: '64px 0' }}>{t.explore.historyEmpty}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {receivedSupport.map((s) => (
              <div key={s.id} style={{ background: 'var(--surface)', borderRadius: 16, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: s.provider?.hex_code || 'var(--surface-2)', flexShrink: 0 }} />
                  <div>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, margin: 0 }}>{s.provider?.hex_code}</p>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>{s.gift?.title}</p>
                  </div>
                </div>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--text-muted)' }}>{new Date(s.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )
      )}
    </DashboardLayout>
  )
}

export default Al
