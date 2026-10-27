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

// Shows the unread count. One unread conversation opens it directly; otherwise the inbox.
const InboxBell = () => {
  const { user } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const [total, setTotal] = useState(0)
  const [conversationIds, setConversationIds] = useState([])

  const load = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('messages')
      .select('transaction_id')
      .eq('receiver_id', user.id)
      .is('read_at', null)
    setTotal((data || []).length)
    setConversationIds([...new Set((data || []).map((r) => r.transaction_id))])
  }, [user])

  useEffect(() => {
    load()
    const iv = setInterval(load, 20000)
    return () => clearInterval(iv)
  }, [load])

  const open = () => {
    if (conversationIds.length === 1) navigate(`/chat/${conversationIds[0]}`)
    else navigate('/messages')
  }

  return (
    <button
      onClick={open}
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
  )
}

export default InboxBell
