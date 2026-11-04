import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../i18n'
import { nickSuffix } from '../lib/nick'

const font = { fontFamily: "'DM Sans', sans-serif" }

// Own colour with an optional nickname that can be edited right here.
const NickEditor = ({ hex }) => {
  const { profile, updateProfile } = useAuth()
  const { t } = useI18n()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)
  const nick = (profile?.nickname || '').trim()

  const start = () => { setValue(nick); setError(false); setEditing(true) }
  const save = async () => {
    const next = value.trim().slice(0, 24)
    if (next === nick) { setEditing(false); return }
    try {
      await updateProfile({ nickname: next || null })
      setEditing(false)
    } catch (err) {
      console.error('nickname save failed:', err)
      setError(true)
    }
  }

  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <h1 style={{ fontFamily: "'DM Mono', monospace", fontSize: 26, fontWeight: 500, margin: 0 }}>
          {hex || '—'}{!editing && nickSuffix(nick)}
        </h1>
        {editing ? (
          <>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 22 }}>- (</span>
            <input
              autoFocus
              value={value}
              maxLength={24}
              placeholder={t.dashboard.nickPlaceholder}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
              style={{ ...font, fontSize: 18, padding: '4px 10px', width: 180, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)' }}
            />
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 22 }}>)</span>
            <button className="btn-secondary" onClick={save} style={{ padding: '4px 14px' }}>{t.dashboard.nickSave}</button>
            <button onClick={() => setEditing(false)} style={{ ...font, background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, color: 'var(--text-muted)', textDecoration: 'underline' }}>{t.dashboard.nickCancel}</button>
          </>
        ) : (
          <button onClick={start} style={{ ...font, background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, color: 'var(--text-muted)', textDecoration: 'underline', padding: 0 }}>
            {nick ? t.dashboard.nickEdit : t.dashboard.nickAdd}
          </button>
        )}
      </div>
      {editing && <p style={{ ...font, fontSize: 14, color: 'var(--text-muted)', margin: '6px 0 0' }}>{error ? t.dashboard.nickError : t.dashboard.nickHint}</p>}
    </div>
  )
}

export default NickEditor
