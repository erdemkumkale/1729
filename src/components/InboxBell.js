import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../i18n'

const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 7l9 6 9-6" />
  </svg>
)

const InboxBell = () => {
  const { user } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [total, setTotal] = useState(0)
  const [items, setItems] = useState([])

  const load = useCallback(async () => {
    if (!user) return
    const { data: unreadRows } = await supabase
      .from('messages')
      .select('transaction_id')
      .eq('receiver_id', user.id)
      .is('read_at', null)
    const counts = {}
    for (const r of unreadRows || []) counts[r.transaction_id] = (counts[r.transaction_id] || 0) + 1
    setTotal((unreadRows || []).length)

    const ids = Object.keys(counts)
    if (ids.length === 0) { setItems([]); return }
    const { data: txs } = await supabase
      .from('support_transactions')
      .select('id, provider_id, gift:gift_id(title), provider:provider_id(hex_code), receiver:receiver_id(hex_code)')
      .in('id', ids)
    setItems((txs || []).map((x) => ({
      id: x.id,
      title: x.gift?.title,
      hex: (x.provider_id === user.id ? x.receiver?.hex_code : x.provider?.hex_code) || '#888888',
      n: counts[x.id],
    })))
  }, [user])

  useEffect(() => {
    load()
    const iv = setInterval(load, 20000)
    return () => clearInterval(iv)
  }, [load])

  const font = { fontFamily: "'DM Sans', sans-serif" }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => { setOpen((o) => !o); load() }}
        title={t.chat.inboxTitle}
        aria-label={t.chat.inboxTitle}
        style={{ position: 'relative', display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: total > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}
      >
        <MailIcon />
        {total > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -6, minWidth: 18, height: 18, padding: '0 5px',
            borderRadius: 9, background: 'var(--user-color)', color: '#fff',
            fontFamily: "'DM Mono', monospace", fontSize: 11, lineHeight: '18px', textAlign: 'center',
          }}>
            {total > 9 ? '9+' : total}
          </span>
        )}
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 150 }} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 10px)', right: 0, zIndex: 160, width: 300, maxWidth: '86vw',
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
          }}>
            <p style={{ ...font, fontSize: 13, color: 'var(--text-muted)', margin: '6px 10px 8px' }}>{t.chat.inboxTitle}</p>
            {items.length === 0 ? (
              <p style={{ ...font, fontSize: 15, color: 'var(--text-muted)', margin: '4px 10px 12px' }}>{t.chat.inboxEmpty}</p>
            ) : items.map((it) => (
              <button
                key={it.id}
                onClick={() => { setOpen(false); navigate(`/chat/${it.id}`) }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', padding: '10px', borderRadius: 8 }}
              >
                <span style={{ width: 24, height: 24, borderRadius: '50%', background: it.hex, flexShrink: 0 }} />
                <span style={{ ...font, flex: 1, minWidth: 0, fontSize: 15, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.title}</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#fff', background: 'var(--user-color)', borderRadius: 999, padding: '1px 8px' }}>{t.chat.unread(it.n)}</span>
              </button>
            ))}
            <button
              onClick={() => { setOpen(false); navigate('/dashboard') }}
              style={{ ...font, width: '100%', background: 'none', border: 'none', borderTop: '1px solid var(--border)', cursor: 'pointer', padding: '10px', marginTop: 4, fontSize: 14, color: 'var(--text-muted)', textAlign: 'left' }}
            >
              {t.chat.inboxAll}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default InboxBell
