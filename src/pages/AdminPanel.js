import React, { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'

// Founder UID is baked in at build time. Set REACT_APP_FOUNDER_UID in .env.
const FOUNDER_UID = process.env.REACT_APP_FOUNDER_UID || ''

const Metric = ({ label, value, hint }) => (
  <div style={{
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 14, padding: 20, minWidth: 0,
  }}>
    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--text-muted)', margin: '0 0 8px' }}>
      {label}
    </p>
    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 28, fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>
      {value ?? '—'}
    </p>
    {hint && (
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--text-muted)', margin: '8px 0 0' }}>
        {hint}
      </p>
    )}
  </div>
)

const AdminPanel = () => {
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState({
    onboardingComplete: null,
    dropoff: null,
    supportTx: null,
    weeklyActive: null,
    perCommunity: null,
  })
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user || user.id !== FOUNDER_UID) return
    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        // 1. profiles where onboarding_completed = true
        const { count: onboardingComplete } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('onboarding_completed', true)

        // 2. drop-off per question: count of distinct user_id per question_index
        const { data: answers } = await supabase
          .from('onboarding_answers')
          .select('question_index, user_id')
        const perQuestion = {}
        for (const row of answers || []) {
          perQuestion[row.question_index] = (perQuestion[row.question_index] || new Set())
          perQuestion[row.question_index].add(row.user_id)
        }
        const dropoff = Object.fromEntries(
          Object.entries(perQuestion).map(([k, v]) => [k, v.size])
        )

        // 3. support_transactions count
        const { count: supportTx } = await supabase
          .from('support_transactions')
          .select('id', { count: 'exact', head: true })

        // 4. weekly active = distinct user_id in activity_log last 7d
        const sinceIso = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()
        const { data: weeklyRows } = await supabase
          .from('activity_log')
          .select('user_id')
          .gte('created_at', sinceIso)
        const weeklyActive = new Set((weeklyRows || []).map(r => r.user_id).filter(Boolean)).size

        // 5. per-sub_community activity (last 7d)
        const { data: commRows } = await supabase
          .from('activity_log')
          .select('sub_community_id')
          .gte('created_at', sinceIso)
          .not('sub_community_id', 'is', null)
        const perCommunity = {}
        for (const r of commRows || []) {
          perCommunity[r.sub_community_id] = (perCommunity[r.sub_community_id] || 0) + 1
        }

        if (!cancelled) {
          setMetrics({
            onboardingComplete: onboardingComplete ?? 0,
            dropoff,
            supportTx: supportTx ?? 0,
            weeklyActive,
            perCommunity,
          })
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Load failed')
        console.error('[AdminPanel] load error:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [user])

  if (authLoading) return null
  if (!user) return <Navigate to="/login" replace />
  if (!FOUNDER_UID || user.id !== FOUNDER_UID) return <Navigate to="/" replace />

  const dropoffSummary = metrics.dropoff
    ? [1, 2, 3, 4, 5].map(i => `Q${i}: ${metrics.dropoff[i] || 0}`).join(' · ')
    : null

  const communityCount = metrics.perCommunity ? Object.keys(metrics.perCommunity).length : 0

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', padding: '48px 24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 28, fontWeight: 500, marginBottom: 8 }}>
          Admin
        </h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-muted)', marginBottom: 32 }}>
          Anonymous pilot metrics. Read-only.
        </p>

        {error && (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#e05c5c', marginBottom: 24 }}>
            {error}
          </p>
        )}

        {loading ? (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-muted)' }}>—</p>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 16,
          }}>
            <Metric
              label="Onboarding completed"
              value={metrics.onboardingComplete}
              hint="Profiles past Q4."
            />
            <Metric
              label="Drop-off per question"
              value={metrics.dropoff ? Object.values(metrics.dropoff).reduce((a, b) => Math.max(a, b), 0) : 0}
              hint={dropoffSummary || 'Max responders at any question.'}
            />
            <Metric
              label="Support transactions"
              value={metrics.supportTx}
              hint="All-time match count."
            />
            <Metric
              label="Weekly active users"
              value={metrics.weeklyActive}
              hint="Distinct users in activity_log (7d)."
            />
            <Metric
              label="Active communities (7d)"
              value={communityCount}
              hint="Sub-communities with any logged event."
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminPanel
