import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../i18n'
import DashboardLayout from '../components/DashboardLayout'

const Ver = () => {
  const { user, profile } = useAuth()
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState('ver')
  const [myCards, setMyCards] = useState([])
  const [givenSupport, setGivenSupport] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newWhyMe, setNewWhyMe] = useState('')
  const [newVisibility, setNewVisibility] = useState('global')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      if (activeTab === 'ver') {
        const { data, error } = await supabase.from('gifts').select('*').eq('creator_id', user.id).order('created_at', { ascending: false })
        if (error) throw error
        setMyCards(data || [])
      } else {
        const { data, error } = await supabase.from('support_transactions')
          .select('*, receiver:receiver_id(hex_code), gift:gift_id(title)').eq('provider_id', user.id).order('created_at', { ascending: false })
        if (error) throw error
        setGivenSupport(data || [])
      }
    } catch (err) { console.error('fetchData error:', err) } finally { setLoading(false) }
  }, [user, activeTab])

  useEffect(() => { if (user) fetchData() }, [user, fetchData])

  const toggleCard = async (id, current) => {
    try {
      const { error } = await supabase.from('gifts').update({ is_active: !current }).eq('id', id)
      if (error) throw error
      fetchData()
    } catch (err) { console.error('toggleCard error:', err) }
  }

  const handleCreate = async () => {
    if (!newTitle.trim() || !newDesc.trim()) return
    setCreating(true)
    setError(null)
    try {
      const { error } = await supabase.from('gifts').insert({
        creator_id: user.id,
        title: newTitle,
        description: newDesc,
        why_me: newWhyMe.trim() || null,
        creator_hex: profile?.hex_code,
        visibility: newVisibility,
        status: 'active',
        is_active: true,
        lang: 'en',
      })
      if (error) throw error
      setShowModal(false); setNewTitle(''); setNewDesc(''); setNewWhyMe(''); setNewVisibility('global'); fetchData()
    } catch (err) { setError(t.give.error) } finally { setCreating(false) }
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
          {myCards.length === 0 && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-muted)', padding: '32px 0' }}>{t.give.empty}</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            {myCards.map((card) => {
              const cardHex = profile?.hex_code || '#888'
              const r = parseInt(cardHex.slice(1,3),16), g = parseInt(cardHex.slice(3,5),16), b = parseInt(cardHex.slice(5,7),16)
              return (
                <div key={card.id} className="armagan-card" style={{ background: `rgba(${r},${g},${b},0.10)`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, fontWeight: 500, marginBottom: 6 }}>{card.title}</h3>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>{card.description}</p>
                  </div>
                  <button className="btn-secondary" onClick={() => toggleCard(card.id, card.is_active)} style={{ padding: '8px 16px', fontSize: 13, whiteSpace: 'nowrap' }}>
                    {card.is_active ? t.give.cardActive : t.give.cardInactive}
                  </button>
                </div>
              )
            })}
          </div>
          <button className="btn-primary" onClick={() => setShowModal(true)} style={{ width: '100%' }}>{t.give.newCard}</button>
        </div>
      ) : (
        givenSupport.length === 0 ? (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-muted)', padding: '32px 0' }}>{t.give.historyEmpty}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {givenSupport.map((s) => (
              <div key={s.id} style={{ background: 'var(--surface)', borderRadius: 16, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: s.receiver?.hex_code || 'var(--surface-2)', flexShrink: 0 }} />
                  <div>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, margin: 0 }}>{s.receiver?.hex_code}</p>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>{s.gift?.title}</p>
                  </div>
                </div>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--text-muted)' }}>{new Date(s.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div style={{ background: 'var(--surface)', borderRadius: 20, padding: 32, maxWidth: 480, width: '100%', border: '1px solid var(--border)' }}>
            <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 24, fontWeight: 500, marginBottom: 24 }}>{t.give.newCardTitle}</h2>
            {error && <p style={{ fontSize: 13, color: '#e05c5c', marginBottom: 16 }}>{error}</p>}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>{t.give.titleLabel}</label>
              <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>{t.give.descLabel}</label>
              <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>
                {t.give.whyMeLabel} <span style={{ opacity: 0.5 }}>({t.give.optional})</span>
              </label>
              <textarea value={newWhyMe} onChange={(e) => setNewWhyMe(e.target.value)} placeholder={t.give.whyMePlaceholder} style={{ minHeight: 72 }} />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>{t.give.visibilityLabel}</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['circle', 'community', 'global'].map(v => (
                  <button
                    key={v}
                    onClick={() => setNewVisibility(v)}
                    style={{
                      flex: 1, padding: '10px 8px', borderRadius: 10, cursor: 'pointer',
                      fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
                      background: newVisibility === v ? 'var(--user-color)' : 'var(--surface-2)',
                      color: newVisibility === v ? '#fff' : 'var(--text-muted)',
                      border: newVisibility === v ? '1px solid var(--user-color)' : '1px solid var(--border)',
                      transition: 'all 150ms ease',
                    }}
                  >
                    {v === 'circle' ? t.give.visCircle : v === 'community' ? t.give.visCommunity : t.give.visGlobal}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-primary" onClick={handleCreate} disabled={creating} style={{ flex: 1 }}>{creating ? t.give.creating : t.give.create}</button>
              <button className="btn-secondary" onClick={() => { setShowModal(false); setNewTitle(''); setNewDesc(''); setNewWhyMe(''); setNewVisibility('global'); setError(null) }} style={{ flex: 1 }}>{t.give.cancel}</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default Ver
