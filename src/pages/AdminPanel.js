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
    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-muted)', margin: '0 0 8px' }}>
      {label}
    </p>
    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 28, fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>
      {value ?? '—'}
    </p>
    {hint && (
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-muted)', margin: '8px 0 0' }}>
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
  const [offers, setOffers] = useState([])

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

        // 6. disaster offers + report counts (moderation)
        const { data: offerRows } = await supabase
          .from('gifts')
          .select('id, title, description, hidden, expires_at, is_active, disaster_category')
          .eq('is_disaster', true)
          .order('created_at', { ascending: false })
          .limit(30)
        const { data: reportRows } = await supabase.from('gift_reports').select('gift_id')
        const reportCounts = {}
        for (const r of reportRows || []) reportCounts[r.gift_id] = (reportCounts[r.gift_id] || 0) + 1
        const offersWithReports = (offerRows || []).map((o) => ({ ...o, reports: reportCounts[o.id] || 0 }))

        if (!cancelled) {
          setOffers(offersWithReports)
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

  const toggleHidden = async (id, hidden) => {
    const { error: upErr } = await supabase.from('gifts').update({ hidden: !hidden }).eq('id', id)
    if (upErr) { console.error('toggleHidden error:', upErr); return }
    setOffers((list) => list.map((o) => (o.id === id ? { ...o, hidden: !hidden } : o)))
  }

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
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: 'var(--text-muted)', marginBottom: 32 }}>
          Anonymous pilot metrics. Read-only.
        </p>

        {error && (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: '#e05c5c', marginBottom: 24 }}>
            {error}
          </p>
        )}

        {loading ? (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: 'var(--text-muted)' }}>—</p>
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

        {!loading && (
          <div style={{ marginTop: 40 }}>
            <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 22, fontWeight: 500, marginBottom: 16 }}>Afet gönderileri</h2>
            {offers.length === 0 ? (
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: 'var(--text-muted)' }}>Henüz afet gönderisi yok.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {offers.map((o) => (
                  <div key={o.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'flex-start', opacity: o.hidden ? 0.55 : 1 }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 500, margin: '0 0 4px' }}>{o.title}</p>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-muted)', margin: '0 0 6px', lineHeight: 1.5 }}>{o.description}</p>
                      <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: o.reports >= 1 ? '#e0a05c' : 'var(--text-muted)', margin: 0 }}>
                        {o.reports} bildirim{o.hidden ? ' · gizli' : ''}
                      </p>
                    </div>
                    <button className="btn-secondary" onClick={() => toggleHidden(o.id, o.hidden)} style={{ flexShrink: 0, padding: '6px 14px', fontSize: 14 }}>
                      {o.hidden ? 'Göster' : 'Gizle'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminPanel
