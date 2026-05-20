import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import DashboardLayout from '../components/DashboardLayout'
import tr from '../strings/tr'

const StatCard = ({ label, value, loading }) => (
  <div style={{
    background: 'var(--surface)',
    borderRadius: 16,
    padding: 24,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  }}>
    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>{label}</p>
    <p style={{ fontFamily: "'Lora', serif", fontSize: 32, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
      {loading ? '—' : value}
    </p>
  </div>
)

const KontrolPaneli = () => {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [stats, setStats] = useState({ activeCards: 0, supportGiven: 0, supportReceived: 0, trustTeamSize: 0 })
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    if (!user) return
    try {
      const { count: activeCards } = await supabase
        .from('gifts').select('*', { count: 'exact', head: true })
        .eq('creator_id', user.id).eq('is_active', true)

      const { count: supportGiven } = await supabase
        .from('support_transactions').select('*', { count: 'exact', head: true })
        .eq('provider_id', user.id)

      const { count: supportReceived } = await supabase
        .from('support_transactions').select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)

      const { data: activityData } = await supabase
        .from('support_transactions')
        .select('*, provider:provider_id(hex_code), receiver:receiver_id(hex_code), gift:gift_id(title)')
        .or(`provider_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(5)

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
    { title: tr.dashboard.quickActions.createCard, desc: tr.dashboard.quickActions.createCardDesc, path: '/give' },
    { title: tr.dashboard.quickActions.getSupport, desc: tr.dashboard.quickActions.getSupportDesc, path: '/receive' },
    { title: tr.dashboard.quickActions.editQuestions, desc: tr.dashboard.quickActions.editQuestionsDesc, path: '/questions' },
    { title: tr.dashboard.quickActions.trustTeam, desc: tr.dashboard.quickActions.trustTeamDesc, path: '/trust-team' },
  ]

  const hex = profile?.hex_code

  return (
    <DashboardLayout>
      {/* ─── Identity row ─── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
        {hex && (
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: hex,
            boxShadow: '0 0 12px var(--user-color-glow)',
            flexShrink: 0,
          }} />
        )}
        <div>
          <h1 style={{ fontFamily: "'Lora', serif", fontSize: 32, fontWeight: 600, margin: 0 }}>
            {hex || '—'}
          </h1>
        </div>
      </div>

      {/* ─── Stats ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 48 }}>
        <StatCard label={tr.dashboard.activeCards} value={stats.activeCards} loading={loading} />
        <StatCard label={tr.dashboard.supportGiven} value={stats.supportGiven} loading={loading} />
        <StatCard label={tr.dashboard.supportReceived} value={stats.supportReceived} loading={loading} />
        <StatCard label={tr.dashboard.trustTeamSize} value={stats.trustTeamSize} loading={loading} />
      </div>

      {/* ─── Quick actions ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 48 }}>
        {quickActions.map((a) => (
          <button
            key={a.path}
            onClick={() => navigate(a.path)}
            style={{
              background: 'var(--surface)',
              border: '1.5px solid var(--border)',
              borderRadius: 16,
              padding: 24,
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'border-color 150ms ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--user-color)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <h3 style={{ fontFamily: "'Lora', serif", fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{a.title}</h3>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>{a.desc}</p>
          </button>
        ))}
      </div>

      {/* ─── Recent activity ─── */}
      <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <h2 style={{ fontFamily: "'Lora', serif", fontSize: 24, fontWeight: 600, marginBottom: 24 }}>
          {tr.dashboard.recentActivity}
        </h2>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--user-color)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : recentActivity.length === 0 ? (
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0' }}>
            {tr.dashboard.noActivity}
          </p>
        ) : (
          <div>
            {recentActivity.map((act) => {
              const isProvider = act.provider_id === user.id
              const other = isProvider ? act.receiver : act.provider
              return (
                <div
                  key={act.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 0',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: other?.hex_code || '#ccc',
                      flexShrink: 0,
                    }} />
                    <div>
                      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 500, margin: 0 }}>
                        {isProvider ? tr.dashboard.gave : tr.dashboard.received}
                      </p>
                      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                        {act.gift?.title}
                      </p>
                    </div>
                  </div>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'var(--text-muted)' }}>
                    {new Date(act.created_at).toLocaleDateString('tr-TR')}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </DashboardLayout>
  )
}

export default KontrolPaneli
