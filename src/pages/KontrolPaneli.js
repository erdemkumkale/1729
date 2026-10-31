import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../i18n'
import DashboardLayout from '../components/DashboardLayout'
import ChatList from '../components/ChatList'
import AnnouncementList from '../components/AnnouncementList'
import AnnouncementComposer from '../components/AnnouncementComposer'

const StatCard = ({ label, value, loading }) => (
  <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 18, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: 'var(--text-muted)', marginBottom: 8 }}>{label}</p>
    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 26, fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>
      {loading ? '—' : value}
    </p>
  </div>
)

const CommunityLink = ({ communityId, t }) => {
  const [link, setLink] = useState(undefined) // undefined = loading, null = none yet
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const font = { fontFamily: "'DM Sans', sans-serif" }
  const l = t.communityLink

  useEffect(() => {
    supabase.from('community_links').select('code, enabled').eq('sub_community_id', communityId).maybeSingle()
      .then(({ data }) => setLink(data || null))
  }, [communityId])

  const call = async (enabled, renew = false) => {
    setBusy(true)
    setError('')
    const { data: code, error: err } = await supabase.rpc('set_community_link', { p_community: communityId, p_enabled: enabled, p_renew: renew })
    if (err || !code) {
      console.error('set_community_link error:', err)
      setError(l.error)
    } else {
      setLink({ code, enabled })
    }
    setBusy(false)
  }

  const url = link ? `${window.location.origin}/katil/${link.code}` : ''
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { window.prompt(l.copy, url) }
  }
  const smallBtn = { ...font, background: 'none', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', padding: '6px 12px', fontSize: 14, color: 'var(--text-primary)' }

  if (link === undefined) return null
  return (
    <div style={{ padding: '4px 14px 14px' }}>
      <p style={{ ...font, fontSize: 14, color: 'var(--text-muted)', margin: '0 0 8px', lineHeight: 1.5 }}>{l.title}: {l.hint}</p>
      {!link ? (
        <button style={smallBtn} disabled={busy} onClick={() => call(true)}>{l.create}</button>
      ) : (
        <>
          {link.enabled ? (
            <input readOnly value={url} onFocus={(e) => e.target.select()} style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, marginBottom: 8 }} />
          ) : (
            <p style={{ ...font, fontSize: 14, color: 'var(--text-muted)', margin: '0 0 8px' }}>{l.isOff}</p>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {link.enabled && <button style={smallBtn} onClick={copy}>{copied ? l.copied : l.copy}</button>}
            <button style={smallBtn} disabled={busy} onClick={() => call(!link.enabled)}>{link.enabled ? l.off : l.on}</button>
            <button style={smallBtn} disabled={busy} onClick={() => { if (window.confirm(l.renewConfirm)) call(true, true) }}>{l.renew}</button>
          </div>
        </>
      )}
      {error && <p style={{ ...font, fontSize: 14, color: '#e05c5c', margin: '8px 0 0' }}>{error}</p>}
    </div>
  )
}

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
        <h2 style={{ ...font, fontSize: 20, fontWeight: 500, margin: 0 }}>{t.community.myCommunities}</h2>
        {!showNew && (
          <button className="btn-secondary" onClick={() => setShowNew(true)} style={{ padding: '6px 14px', fontSize: 15 }}>
            {t.community.newCommunity}
          </button>
        )}
      </div>

      {showNew && (
        <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <p style={{ ...font, fontSize: 15, color: 'var(--text-muted)', margin: '0 0 8px' }}>{t.community.newTitle}</p>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t.community.namePlaceholder} maxLength={60}
            onKeyDown={(e) => e.key === 'Enter' && create()} />
          {error && <p style={{ ...font, fontSize: 14, color: '#e05c5c', margin: '8px 0 0' }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="btn-secondary" onClick={() => { setShowNew(false); setName('') }} style={{ flex: 1 }}>{t.community.cancel}</button>
            <button className="btn-primary" onClick={create} disabled={busy || !name.trim()} style={{ flex: 1 }}>{t.community.save}</button>
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <p style={{ ...font, fontSize: 16, color: 'var(--text-muted)', margin: 0 }}>{t.community.empty}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rows.map((r) => {
            const c = r.sub_communities
            const isOwner = c.owner_id === user.id
            const visibleName = isOwner || c.members_aware ? c.name : t.community.unnamed
            return (
              <div key={c.id} style={{ borderRadius: 10, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px' }}>
                  <span style={{ ...font, fontSize: 17 }}>{visibleName}</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: 'var(--text-muted)' }}>
                    {isOwner ? t.community.founder : t.community.member}
                  </span>
                </div>
                {isOwner && <CommunityLink communityId={c.id} t={t} />}
                {isOwner && (
                  <div style={{ padding: '0 14px 14px' }}>
                    <p style={{ ...font, fontSize: 15, fontWeight: 500, margin: '8px 0' }}>{t.announce.composeTitle}</p>
                    <AnnouncementComposer communityId={c.id} t={t} />
                  </div>
                )}
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
  const [stats, setStats] = useState({ supportGiven: 0, supportReceived: 0, trustTeamSize: 0 })
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    if (!user) return
    try {
      const { count: supportGiven } = await supabase.from('support_transactions').select('*', { count: 'exact', head: true }).eq('provider_id', user.id).eq('receiver_confirmed', true)
      const { count: supportReceived } = await supabase.from('support_transactions').select('*', { count: 'exact', head: true }).eq('receiver_id', user.id).eq('receiver_confirmed', true)
      const { data: trustTeamSize } = await supabase.rpc('my_circle_count')
      setStats({ supportGiven: supportGiven || 0, supportReceived: supportReceived || 0, trustTeamSize: trustTeamSize || 0 })
    } catch (err) {
      console.error('fetchStats error:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { if (user) fetchStats() }, [user, fetchStats])

  const hex = profile?.hex_code

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        {hex && <div style={{ width: 36, height: 36, borderRadius: '50%', background: hex, boxShadow: '0 0 12px var(--user-color-glow)', flexShrink: 0 }} />}
        <h1 style={{ fontFamily: "'DM Mono', monospace", fontSize: 26, fontWeight: 500, margin: 0 }}>{hex || '—'}</h1>
      </div>

      <AnnouncementList user={user} t={t} compact />
      <ChatList user={user} t={t} navigate={navigate} limit={5} showAll />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 32 }}>
        <StatCard label={t.dashboard.supportGiven} value={stats.supportGiven} loading={loading} />
        <StatCard label={t.dashboard.supportReceived} value={stats.supportReceived} loading={loading} />
        <StatCard label={t.dashboard.trustTeamSize} value={stats.trustTeamSize} loading={loading} />
      </div>

      <CommunitiesSection user={user} t={t} />
    </DashboardLayout>
  )
}

export default KontrolPaneli
