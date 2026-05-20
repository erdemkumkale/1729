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
      const { data: activityData } = await supabase
        .from('support_transactions')
        .select('*, provider:provider_id(hex_code), receiver:receiver_id(hex_code), gift:gift_id(title)')
        .or(`provider_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false }).limit(5)
      setStats({ activeCards: activeCards || 0, supportGiven: supportGiven || 0, supportReceived: supportReceived || 0, trustTeamSize: 0 })
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
