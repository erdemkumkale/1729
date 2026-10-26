import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../i18n'
import DashboardLayout from '../components/DashboardLayout'

const font = { fontFamily: "'DM Sans', sans-serif" }

const Stat = ({ label, value }) => (
  <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 20, border: '1px solid var(--border)' }}>
    <p style={{ ...font, fontSize: 14, color: 'var(--text-muted)', margin: '0 0 6px' }}>{label}</p>
    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 22, fontWeight: 500, margin: 0 }}>{value}</p>
  </div>
)

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 36 }}>
    <h2 style={{ ...font, fontSize: 20, fontWeight: 500, margin: '0 0 16px' }}>{title}</h2>
    {children}
  </div>
)

const MemberProfile = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useI18n()
  const [data, setData] = useState(undefined) // undefined = loading, null = not visible
  const [gifts, setGifts] = useState([])

  useEffect(() => {
    let active = true
    const load = async () => {
      const { data: prof, error } = await supabase.rpc('get_member_profile', { p_user: id })
      if (error) console.error('get_member_profile error:', error)
      if (!active) return
      setData(error ? null : prof)
      if (prof) {
        const { data: g } = await supabase
          .from('gifts')
          .select('id, title, description, gift_type, quota_remaining, quota, is_physical, is_disaster')
          .eq('creator_id', id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
        if (active) setGifts(g || [])
      }
    }
    load()
    return () => { active = false }
  }, [id])

  const questionText = {
    1: t.onboarding.screen2.question,
    2: t.onboarding.screen3.question,
    3: t.onboarding.screen4.question,
    4: t.onboarding.screen6.question,
  }

  const back = (
    <button
      onClick={() => navigate(-1)}
      style={{ ...font, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 24, fontSize: 15, color: 'var(--text-muted)', textDecoration: 'underline' }}
    >
      {t.member.back}
    </button>
  )

  if (data === undefined) {
    return <DashboardLayout><p style={{ ...font, color: 'var(--text-muted)' }}>—</p></DashboardLayout>
  }

  if (data === null) {
    return (
      <DashboardLayout>
        {back}
        <p style={{ ...font, fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: 520 }}>{t.member.notVisible}</p>
      </DashboardLayout>
    )
  }

  const hex = data.hex || '#888888'
  const isSelf = id === user?.id

  return (
    <DashboardLayout>
      {back}

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: hex, boxShadow: '0 0 12px var(--user-color-glow)', flexShrink: 0 }} />
        <div>
          <h1 style={{ fontFamily: "'DM Mono', monospace", fontSize: 28, fontWeight: 500, margin: 0 }}>{hex}</h1>
          {isSelf && <p style={{ ...font, fontSize: 14, color: 'var(--text-muted)', margin: '4px 0 0' }}>{t.member.you}</p>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 40 }}>
        <Stat label={t.member.gave} value={t.member.times(data.given_count)} />
        <Stat label={t.member.received} value={t.member.times(data.received_count)} />
        <Stat label={t.member.circle} value={t.member.people(data.circle_size)} />
      </div>

      <Section title={t.member.gifts}>
        {gifts.length === 0 ? (
          <p style={{ ...font, fontSize: 16, color: 'var(--text-muted)', margin: 0 }}>{t.member.noGifts}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {gifts.map((g) => (
              <button
                key={g.id}
                onClick={() => navigate(`/gift/${g.id}`)}
                style={{ textAlign: 'left', cursor: 'pointer', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 18px' }}
              >
                <p style={{ ...font, fontSize: 17, fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>{g.title}</p>
                {g.description && g.description.trim() !== (g.title || '').trim() && (
                  <p style={{ ...font, fontSize: 15, color: 'var(--text-muted)', margin: '6px 0 0', lineHeight: 1.6 }}>{g.description}</p>
                )}
              </button>
            ))}
          </div>
        )}
      </Section>

      <Section title={t.member.receivedTitle}>
        {data.received.length === 0 ? (
          <p style={{ ...font, fontSize: 16, color: 'var(--text-muted)', margin: 0 }}>{t.member.noReceived}</p>
        ) : (
          <ul style={{ ...font, fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.8, margin: 0, paddingLeft: 20 }}>
            {data.received.map((title, i) => <li key={i}>{title}</li>)}
          </ul>
        )}
      </Section>

      <Section title={t.member.answers}>
        {data.answers.length === 0 ? (
          <p style={{ ...font, fontSize: 16, color: 'var(--text-muted)', margin: 0 }}>{t.member.noAnswers}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {data.answers.map((a) => (
              <div key={a.q}>
                <p style={{ ...font, fontSize: 15, color: 'var(--text-muted)', margin: '0 0 6px', lineHeight: 1.6 }}>{questionText[a.q]}</p>
                <p style={{ ...font, fontSize: 17, color: 'var(--text-primary)', margin: 0, lineHeight: 1.7, whiteSpace: 'pre-line' }}>{a.text}</p>
              </div>
            ))}
          </div>
        )}
      </Section>
    </DashboardLayout>
  )
}

export default MemberProfile
