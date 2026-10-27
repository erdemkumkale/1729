import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

const ChatList = ({ user, t, navigate, limit = 10, showAll = false, includeClosed = false }) => {
  const [rows, setRows] = useState([])
  const [unread, setUnread] = useState({})

  useEffect(() => {
    let active = true
    const load = async () => {
      const { data } = await supabase
        .from('support_transactions')
        .select('id, status, provider_id, receiver_id, created_at, gift:gift_id(title), provider:provider_id(hex_code), receiver:receiver_id(hex_code)')
        .or(`provider_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .in('status', includeClosed ? ['active', 'confirmed', 'closed'] : ['active', 'confirmed'])
        .order('created_at', { ascending: false })
        .limit(limit)
      const { data: unreadRows } = await supabase
        .from('messages')
        .select('transaction_id')
        .eq('receiver_id', user.id)
        .is('read_at', null)
      if (!active) return
      const counts = {}
      for (const r of unreadRows || []) counts[r.transaction_id] = (counts[r.transaction_id] || 0) + 1
      setRows(data || [])
      setUnread(counts)
    }
    load()
    return () => { active = false }
  }, [user.id, limit, includeClosed])

  const font = { fontFamily: "'DM Sans', sans-serif" }
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 24, marginBottom: 32 }}>
      <h2 style={{ ...font, fontSize: 18, fontWeight: 500, margin: '0 0 16px' }}>{t.chat.listTitle}</h2>
      {rows.length === 0 ? (
        <p style={{ ...font, fontSize: 16, color: 'var(--text-muted)', margin: 0 }}>{t.chat.listEmpty}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rows.map((r) => {
            const mine = r.provider_id === user.id
            const hex = (mine ? r.receiver?.hex_code : r.provider?.hex_code) || '#888888'
            const n = unread[r.id] || 0
            return (
              <button
                key={r.id}
                onClick={() => navigate(`/chat/${r.id}`)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', cursor: 'pointer', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent' }}
              >
                <span style={{ width: 28, height: 28, borderRadius: '50%', background: hex, flexShrink: 0 }} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ ...font, display: 'block', fontSize: 16, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.gift?.title}</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: 'var(--text-muted)' }}>{hex}</span>
                </span>
                {n > 0 && (
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: 'var(--user-color-text)', background: 'var(--user-color)', borderRadius: 999, padding: '2px 10px' }}>{t.chat.unread(n)}</span>
                )}
              </button>
            )
          })}
        </div>
      )}
      {showAll && rows.length > 0 && (
        <button
          onClick={() => navigate('/messages')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 14, fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: 'var(--text-muted)', textDecoration: 'underline' }}
        >
          {t.chat.inboxAll}
        </button>
      )}
    </div>
  )
}

export default ChatList

