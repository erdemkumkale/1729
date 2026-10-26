import React, { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { logActivity } from '../lib/activity'
import { notifyEvent } from '../lib/chat'

const font = { fontFamily: "'DM Sans', sans-serif" }

const RequestModal = ({ gift, t, onClose, onDone }) => {
  const { user } = useAuth()
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const send = async () => {
    if (!text.trim()) return
    setBusy(true)
    setError('')
    try {
      const { data: tx, error: txErr } = await supabase
        .from('support_transactions')
        .insert({ provider_id: gift.creator_id, receiver_id: user.id, gift_id: gift.id, status: 'active' })
        .select('id')
        .single()
      if (txErr) throw txErr

      const { error: msgErr } = await supabase.from('messages').insert({
        transaction_id: tx.id,
        gift_id: gift.id,
        sender_id: user.id,
        receiver_id: gift.creator_id,
        content: text.trim(),
      })
      if (msgErr) throw msgErr

      logActivity(user.id, 'match', { metadata: { gift_id: gift.id, provider_id: gift.creator_id } })
      notifyEvent('request', tx.id)
      onDone(tx.id)
    } catch (err) {
      console.error('request error:', err)
      setError(err?.message ? `${t.chat.error} (${err.message})` : t.chat.error)
      setBusy(false)
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 200, padding: '24px 16px', overflowY: 'auto' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: 'var(--surface)', borderRadius: 20, padding: 32, maxWidth: 480, width: '100%', border: '1px solid var(--border)' }}>
        <h2 style={{ ...font, fontSize: 22, fontWeight: 500, margin: '0 0 8px' }}>{t.chat.requestTitle}</h2>
        <p style={{ ...font, fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 6px' }}>{gift.title}</p>
        <p style={{ ...font, fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 18px' }}>{t.chat.requestHint}</p>

        {error && <p style={{ ...font, fontSize: 15, color: '#e05c5c', marginBottom: 12 }}>{error}</p>}

        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={t.chat.requestPlaceholder} style={{ minHeight: 110 }} autoFocus />

        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <button className="btn-primary" onClick={send} disabled={busy || !text.trim()} style={{ flex: 1 }}>
            {busy ? t.chat.sending : t.chat.send}
          </button>
          <button className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>{t.give.cancel}</button>
        </div>
      </div>
    </div>
  )
}

export default RequestModal
