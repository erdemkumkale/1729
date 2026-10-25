import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../i18n'
import DashboardLayout from '../components/DashboardLayout'

const StatCard = ({ label, value, loading }) => (
  <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>{label}</p>
    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 32, fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>
      {loading ? '—' : value}
    </p>
  </div>
)

const CommunitiesSection = ({ user, t }) => {
  const [rows, setRows] = useState([])
  const [showNew, setShowNew] = useState(false)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('sub_community_members')
      .select('sub_community_id, sub_communities(id, name, owner_id, members_aware)')
      .eq('user_id', user.id)
    setRows((data || []).filter((r) => r.sub_communities))
  }, [user.id])

  useEffect(() => { load() }, [load])

  const create = async () => {
    if (!name.trim()) return
    setBusy(true)
    setError('')
    try {
      const { data: comm, error: e1 } = await supabase
        .from('sub_communities')
        .insert({ owner_id: user.id, name: name.trim(), members_aware: true })
        .select().single()
      if (e1) throw e1
      const { error: e2 } = await supabase
        .from('sub_community_members')
        .upsert({ sub_community_id: comm.id, user_id: user.id }, { onConflict: 'sub_community_id,user_id' })
      if (e2) throw e2
      setName('')
      setShowNew(false)
      load()
    } catch (err) {
      console.error('create community error:', err)
      setError(t.community.error)
    } finally {
      setBusy(false)
    }
  }

  const font = { fontFamily: "'DM Sans', sans-serif" }
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 24, marginBottom: 48 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <h2 style={{ ...font, fontSize: 18, fontWeight: 500, margin: 0 }}>{t.community.myCommunities}</h2>
        {!showNew && (
          <button className="btn-secondary" onClick={() => setShowNew(true)} style={{ padding: '6px 14px', fontSize: 13 }}>
            {t.community.newCommunity}
          </button>
        )}
      </div>

      {showNew && (
        <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <p style={{ ...font, fontSize: 13, color: 'var(--text-muted)', margin: '0 0 8px' }}>{t.community.newTitle}</p>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t.community.namePlaceholder} maxLength={60}
            onKeyDown={(e) => e.key === 'Enter' && create()} />
          {error && <p style={{ ...font, fontSize: 12, color: '#e05c5c', margin: '8px 0 0' }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="btn-secondary" onClick={() => { setShowNew(false); setName('') }} style={{ flex: 1 }}>{t.community.cancel}</button>
            <button className="btn-primary" onClick={create} disabled={busy || !name.trim()} style={{ flex: 1 }}>{t.community.save}</button>
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <p style={{ ...font, fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>{t.community.empty}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rows.map((r) => {
            const c = r.sub_communities
            const isOwner = c.owner_id === user.id
            const visibleName = isOwner || c.members_aware ? c.name : t.community.unnamed
            return (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)' }}>
                <span style={{ ...font, fontSize: 15 }}>{visibleName}</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--text-muted)' }}>
                  {isOwner ? t.community.founder : t.community.member}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const KontrolPaneli = () => {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { t } = useI18n()
  const [stats, setStats] = useState({ activeCards: 0, supportGiven: 0, supportReceived: 0, trustTeamSize: 0 })
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    if (!user) return
    try {
      const { count: activeCards } = await supabase.from('gifts').select('*', { count: 'exact', head: true }).eq('creator_id', user.id).eq('is_active', true)
      const { count: supportGiven } = await supabase.from('support_transactions').select('*', { count: 'exact', head: true }).eq('provider_id', user.id)
      const { count: supportReceived } = await supabase.from('support_transactions').select('*', { count: 'exact', head: true }).eq('receiver_id', user.id)
      const { count: trustTeamSize } = await supabase.from('trust_circle').select('*', { count: 'exact', head: true }).eq('owner_id', user.id)
      const { data: activityData } = await supabase
        .from('support_transactions')
        .select('*, provider:provider_id(hex_code), receiver:receiver_id(hex_code), gift:gift_id(title)')
        .or(`provider_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false }).limit(5)
      setStats({ activeCards: activeCards || 0, supportGiven: supportGiven || 0, supportReceived: supportReceived || 0, trustTeamSize: trustTeamSize || 0 })
      setRecentActivity(activityData || [])
    } catch (err) {
      console.error('fetchStats error:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { if (user) fetchStats() }, [user, fetchStats])

  const quickActions = [
    { title: t.dashboard.quickActions.createCard, desc: t.dashboard.quickActions.createCardDesc, path: '/give' },
    { title: t.dashboard.quickActions.explore, desc: t.dashboard.quickActions.exploreDesc, path: '/receive' },
    { title: t.dashboard.quickActions.editQuestions, desc: t.dashboard.quickActions.editQuestionsDesc, path: '/questions' },
    { title: t.dashboard.quickActions.trustTeam, desc: t.dashboard.quickActions.trustTeamDesc, path: '/trust-team' },
  ]

  const hex = profile?.hex_code

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
        {hex && <div style={{ width: 40, height: 40, borderRadius: '50%', background: hex, boxShadow: '0 0 12px var(--user-color-glow)', flexShrink: 0 }} />}
        <h1 style={{ fontFamily: "'DM Mono', monospace", fontSize: 28, fontWeight: 500, margin: 0 }}>{hex || '—'}</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 48 }}>
        <StatCard label={t.dashboard.activeCards} value={stats.activeCards} loading={loading} />
        <StatCard label={t.dashboard.supportGiven} value={stats.supportGiven} loading={loading} />
        <StatCard label={t.dashboard.supportReceived} value={stats.supportReceived} loading={loading} />
        <StatCard label={t.dashboard.trustTeamSize} value={stats.trustTeamSize} loading={loading} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 48 }}>
        {quickActions.map((a) => (
          <button key={a.path} onClick={() => navigate(a.path)} style={{
            background: 'var(--surface)', border: '1.5px solid var(--border)',
            borderRadius: 16, padding: 24, textAlign: 'left', cursor: 'pointer', transition: 'border-color 150ms ease',
          }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--user-color)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 500, marginBottom: 6 }}>{a.title}</h3>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>{a.desc}</p>
          </button>
        ))}
      </div>

      <CommunitiesSection user={user} t={t} />

      <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 24 }}>
        <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, fontWeight: 500, marginBottom: 24 }}>{t.dashboard.recentActivity}</h2>
        {loading ? (
          <p style={{ color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>—</p>
        ) : recentActivity.length === 0 ? (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-muted)', padding: '16px 0' }}>{t.dashboard.noActivity}</p>
        ) : (
          recentActivity.map((act) => {
            const isProvider = act.provider_id === user.id
            const other = isProvider ? act.receiver : act.provider
            return (
              <div key={act.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: other?.hex_code || 'var(--surface-2)', flexShrink: 0 }} />
                  <div>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, margin: 0 }}>{isProvider ? t.dashboard.gave : t.dashboard.received}</p>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>{act.gift?.title}</p>
                  </div>
                </div>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--text-muted)' }}>{new Date(act.created_at).toLocaleDateString()}</span>
              </div>
            )
          })
        )}
      </div>
    </DashboardLayout>
  )
}

export default KontrolPaneli
