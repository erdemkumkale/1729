import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import DashboardLayout from '../components/DashboardLayout'
import tr from '../strings/tr'

const Ver = () => {
  const { user, profile } = useAuth()
  const [activeTab, setActiveTab] = useState('ver')
  const [myCards, setMyCards] = useState([])
  const [givenSupport, setGivenSupport] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      if (activeTab === 'ver') {
        const { data, error } = await supabase
          .from('gifts').select('*').eq('creator_id', user.id)
          .order('created_at', { ascending: false })
        if (error) throw error
        setMyCards(data || [])
      } else {
        const { data, error } = await supabase
          .from('support_transactions')
          .select('*, receiver:receiver_id(hex_code), gift:gift_id(title)')
          .eq('provider_id', user.id)
          .order('created_at', { ascending: false })
        if (error) throw error
        setGivenSupport(data || [])
      }
    } catch (err) {
      console.error('fetchData error:', err)
    } finally {
      setLoading(false)
    }
  }, [user, activeTab])

  useEffect(() => { if (user) fetchData() }, [user, fetchData])

  const toggleCard = async (id, current) => {
    try {
      const { error } = await supabase.from('gifts').update({ is_active: !current }).eq('id', id)
      if (error) throw error
      fetchData()
    } catch (err) {
      console.error('toggleCard error:', err)
    }
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
        creator_hex: profile?.hex_code,
        visibility: 'global',
        status: 'active',
        is_active: true,
        lang: 'tr',
      })
      if (error) throw error
      setShowModal(false)
      setNewTitle('')
      setNewDesc('')
      fetchData()
    } catch (err) {
      setError(tr.give.error)
    } finally {
      setCreating(false)
    }
  }

  const tabStyle = (active) => ({
    fontFamily: "'Inter', sans-serif",
    fontSize: 14,
    fontWeight: 500,
    color: active ? 'var(--text-primary)' : 'var(--text-muted)',
    background: 'none',
    border: 'none',
    borderBottom: active ? '2px solid var(--user-color)' : '2px solid transparent',
    padding: '12px 0',
    cursor: 'pointer',
    marginRight: 24,
    transition: 'color 150ms ease',
  })

  return (
    <DashboardLayout>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "'Lora', serif", fontSize: 32, fontWeight: 600, marginBottom: 8 }}>{tr.give.title}</h1>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>{tr.give.subtitle}</p>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid var(--border)', marginBottom: 32 }}>
        <button style={tabStyle(activeTab === 'ver')} onClick={() => setActiveTab('ver')}>{tr.give.tabMy}</button>
        <button style={tabStyle(activeTab === 'verdiklerim')} onClick={() => setActiveTab('verdiklerim')}>{tr.give.tabHistory}</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 64, color: 'var(--text-muted)', fontFamily: "'Inter', sans-serif" }}>—</div>
      ) : activeTab === 'ver' ? (
        <div>
          {myCards.length === 0 && (
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: 'var(--text-muted)', padding: '32px 0' }}>
              {tr.give.empty}
            </p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            {myCards.map((card) => {
              const cardHex = profile?.hex_code || '#888'
              const r = parseInt(cardHex.slice(1,3),16)
              const g = parseInt(cardHex.slice(3,5),16)
              const b = parseInt(cardHex.slice(5,7),16)
              return (
                <div
                  key={card.id}
                  className="koz-card"
                  style={{
                    background: `rgba(${r},${g},${b},0.10)`,
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 16,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontFamily: "'Lora', serif", fontSize: 18, fontWeight: 600, marginBottom: 6 }}>{card.title}</h3>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>{card.description}</p>
                  </div>
                  <button
                    onClick={() => toggleCard(card.id, card.is_active)}
                    className="btn-secondary"
                    style={{ padding: '8px 16px', fontSize: 13, whiteSpace: 'nowrap' }}
                  >
                    {card.is_active ? tr.give.cardActive : tr.give.cardInactive}
                  </button>
                </div>
              )
            })}
          </div>
          <button className="btn-primary" onClick={() => setShowModal(true)} style={{ width: '100%' }}>
            {tr.give.newCard}
          </button>
        </div>
      ) : (
        givenSupport.length === 0 ? (
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: 'var(--text-muted)', padding: '32px 0' }}>
            {tr.give.historyEmpty}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {givenSupport.map((s) => (
              <div key={s.id} style={{ background: 'var(--surface)', borderRadius: 16, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: s.receiver?.hex_code || '#ccc', flexShrink: 0 }} />
                  <div>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 500, margin: 0 }}>{s.receiver?.hex_code}</p>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>{s.gift?.title}</p>
                  </div>
                </div>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'var(--text-muted)' }}>
                  {new Date(s.created_at).toLocaleDateString('tr-TR')}
                </span>
              </div>
            ))}
          </div>
        )
      )}

      {/* ─── New Card Modal ─── */}
      {showModal && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 200, padding: 16,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div style={{
            background: 'var(--surface)', borderRadius: 20, padding: 32,
            maxWidth: 480, width: '100%',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }}>
            <h2 style={{ fontFamily: "'Lora', serif", fontSize: 24, fontWeight: 600, marginBottom: 24 }}>
              {tr.give.newCardTitle}
            </h2>

            {error && (
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#c0392b', marginBottom: 16 }}>{error}</p>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>
                {tr.give.titleLabel}
              </label>
              <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>
                {tr.give.descLabel}
              </label>
              <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-primary" onClick={handleCreate} disabled={creating} style={{ flex: 1 }}>
                {creating ? tr.give.creating : tr.give.create}
              </button>
              <button className="btn-secondary" onClick={() => { setShowModal(false); setNewTitle(''); setNewDesc(''); setError(null) }} style={{ flex: 1 }}>
                {tr.give.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default Ver
