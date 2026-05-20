import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import DashboardLayout from '../components/DashboardLayout'
import tr from '../strings/tr'

const GuvenTakimi = () => {
  const { user, profile } = useAuth()
  const [trustTeam, setTrustTeam] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteType, setInviteType] = useState('discount_50')
  const [generatedCode, setGeneratedCode] = useState('')

  const fetchTrustTeam = useCallback(async () => {
    if (!user || !profile) return
    setLoading(true)
    try {
      const seen = new Set()
      const members = []

      const { data: inviterData } = await supabase
        .from('invitations')
        .select('inviter_id, inviter:inviter_id(hex_code)')
        .eq('email', profile?.email).eq('status', 'used').maybeSingle()

      if (inviterData?.inviter_id && !seen.has(inviterData.inviter_id)) {
        seen.add(inviterData.inviter_id)
        members.push({ id: inviterData.inviter_id, hex_code: inviterData.inviter?.hex_code, relation: tr.trustTeam.relations.invited })
      }

      const { data: invitedData } = await supabase
        .from('invitations').select('used_by, user:used_by(hex_code)')
        .eq('inviter_id', user.id).eq('status', 'used').not('used_by', 'is', null)

      invitedData?.forEach(item => {
        if (item.used_by && !seen.has(item.used_by)) {
          seen.add(item.used_by)
          members.push({ id: item.used_by, hex_code: item.user?.hex_code, relation: tr.trustTeam.relations.joinedViaYou })
        }
      })

      const { data: txData } = await supabase
        .from('support_transactions')
        .select('provider_id, receiver_id, provider:provider_id(hex_code), receiver:receiver_id(hex_code)')
        .or(`provider_id.eq.${user.id},receiver_id.eq.${user.id}`)

      txData?.forEach(tx => {
        const partnerId = tx.provider_id === user.id ? tx.receiver_id : tx.provider_id
        const partner = tx.provider_id === user.id ? tx.receiver : tx.provider
        if (partnerId && !seen.has(partnerId)) {
          seen.add(partnerId)
          members.push({ id: partnerId, hex_code: partner?.hex_code, relation: tr.trustTeam.relations.exchange })
        }
      })

      setTrustTeam(members)
    } catch (err) {
      console.error('fetchTrustTeam error:', err)
    } finally {
      setLoading(false)
    }
  }, [user, profile])

  useEffect(() => { if (user) fetchTrustTeam() }, [user, fetchTrustTeam])

  const generatePromoCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  }

  const handleCreateInvite = async () => {
    if (!inviteEmail.trim()) return
    try {
      const code = generatePromoCode()
      const { error } = await supabase.from('invitations').insert({
        email: inviteEmail, inviter_id: user.id,
        type: inviteType, status: 'pending', promo_code: code,
      })
      if (error) throw error
      setGeneratedCode(code)
      setInviteEmail('')
    } catch (err) {
      console.error('handleCreateInvite error:', err)
    }
  }

  return (
    <DashboardLayout>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 32, fontWeight: 500, marginBottom: 8 }}>{tr.trustTeam.title}</h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>{tr.trustTeam.subtitle}</p>
      </div>

      <div style={{ marginBottom: 32 }}>
        <button className="btn-primary" onClick={() => setShowModal(true)}>{tr.trustTeam.invite}</button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--user-color)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : trustTeam.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-muted)', marginBottom: 8 }}>{tr.trustTeam.empty}</p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-muted)' }}>{tr.trustTeam.emptyHint}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {trustTeam.map((member) => (
            <div key={member.id} style={{
              background: 'var(--surface)', borderRadius: 16, padding: 20,
              border: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: member.hex_code || 'var(--surface-2)', flexShrink: 0 }} />
                <span className="mono">{member.hex_code || '—'}</span>
              </div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                {member.relation}
              </p>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16,
        }}
          onClick={(e) => { if (e.target === e.currentTarget) { setShowModal(false); setGeneratedCode('') } }}
        >
          <div style={{ background: 'var(--surface)', borderRadius: 20, padding: 32, maxWidth: 440, width: '100%', border: '1px solid var(--border)' }}>
            <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 24, fontWeight: 500, marginBottom: 24 }}>
              {tr.trustTeam.modal.title}
            </h2>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>
                {tr.trustTeam.modal.emailLabel}
              </label>
              <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="ornek@email.com" />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>
                {tr.trustTeam.modal.typeLabel}
              </label>
              <select value={inviteType} onChange={(e) => setInviteType(e.target.value)}>
                <option value="discount_50">{tr.trustTeam.modal.typeDiscount}</option>
                <option value="prepaid">{tr.trustTeam.modal.typePrepaid}</option>
              </select>
            </div>

            {generatedCode && (
              <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: 16, marginBottom: 24, textAlign: 'center' }}>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
                  {tr.trustTeam.modal.codeReady}
                </p>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 28, fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>
                  {generatedCode}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-primary" onClick={handleCreateInvite} style={{ flex: 1 }}>
                {tr.trustTeam.modal.generate}
              </button>
              <button className="btn-secondary" onClick={() => { setShowModal(false); setGeneratedCode('') }} style={{ flex: 1 }}>
                {tr.trustTeam.modal.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default GuvenTakimi
