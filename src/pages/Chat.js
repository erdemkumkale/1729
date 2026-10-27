import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../i18n'
import DashboardLayout from '../components/DashboardLayout'
import { notifyEvent } from '../lib/chat'

const font = { fontFamily: "'DM Sans', sans-serif" }

const Chat = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useI18n()
  const [tx, setTx] = useState(undefined) // undefined = loading, null = not found
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [circleAdded, setCircleAdded] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)
  const lastCount = useRef(0)

  const load = useCallback(async () => {
    const { data: row, error: txErr } = await supabase
      .from('support_transactions')
      .select('*, gift:gift_id(id, title), provider:provider_id(hex_code), receiver:receiver_id(hex_code)')
      .eq('id', id)
      .maybeSingle()
    if (txErr) console.error('chat load error:', txErr)
    setTx(row || null)
    if (!row) return

    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .eq('transaction_id', id)
      .order('created_at', { ascending: true })
    setMessages((prev) => ((msgs || []).length === prev.length && prev.length > 0 && msgs[msgs.length - 1].id === prev[prev.length - 1].id ? prev : (msgs || [])))

    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('transaction_id', id)
      .eq('receiver_id', user.id)
      .is('read_at', null)
  }, [id, user.id])

  useEffect(() => {
    load()
    const iv = setInterval(load, 6000)
    return () => clearInterval(iv)
  }, [load])

  useEffect(() => {
    if (messages.length !== lastCount.current) {
      lastCount.current = messages.length
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [messages])

  const back = (
    <button
      onClick={() => navigate('/dashboard')}
      style={{ ...font, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 20, fontSize: 15, color: 'var(--text-muted)', textDecoration: 'underline' }}
    >
      {t.member.back}
    </button>
  )

  if (tx === undefined) return <DashboardLayout><p style={{ ...font, color: 'var(--text-muted)' }}>—</p></DashboardLayout>
  if (tx === null) {
    return (
      <DashboardLayout>
        {back}
        <p style={{ ...font, fontSize: 16, color: 'var(--text-muted)' }}>{t.chat.notFound}</p>
      </DashboardLayout>
    )
  }

  const isProvider = tx.provider_id === user.id
  const otherId = isProvider ? tx.receiver_id : tx.provider_id
  const otherHex = (isProvider ? tx.receiver?.hex_code : tx.provider?.hex_code) || '#888888'
  const closed = tx.status === 'closed'
  const confirmed = tx.receiver_confirmed === true

  const sendMessage = async () => {
    const content = text.trim()
    if (!content || closed) return
    setSending(true)
    setError('')
    try {
      const { data, error: err } = await supabase
        .from('messages')
        .insert({ transaction_id: tx.id, gift_id: tx.gift_id, sender_id: user.id, receiver_id: otherId, content })
        .select()
        .single()
      if (err) throw err
      setMessages((m) => [...m, data])
      setText('')
      notifyEvent('message', tx.id)
    } catch (err) {
      console.error('send message error:', err)
      setError(t.chat.error)
    } finally {
      setSending(false)
    }
  }

  const closeRequest = async () => {
    const { error: err } = await supabase.from('support_transactions').update({ status: 'closed' }).eq('id', tx.id)
    if (err) { console.error('close error:', err); return }
    setTx((x) => ({ ...x, status: 'closed' }))
  }

  const markReceived = async () => {
    const patch = { receiver_confirmed: true, confirmed_at: new Date().toISOString(), status: 'confirmed' }
    const { error: err } = await supabase.from('support_transactions').update(patch).eq('id', tx.id)
    if (err) { console.error('confirm error:', err); return }
    setTx((x) => ({ ...x, ...patch }))
  }

  const addToCircle = async () => {
    const { error: err } = await supabase
      .from('trust_circle')
      .upsert({ owner_id: user.id, member_id: tx.provider_id, gift_title: tx.gift?.title || null }, { onConflict: 'owner_id,member_id' })
    if (err) { console.error('circle error:', err); return }
    setCircleAdded(true)
  }

  const smallBtn = { ...font, background: 'none', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', padding: '6px 14px', fontSize: 14, color: 'var(--text-primary)' }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {back}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <button onClick={() => navigate(`/member/${otherId}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }} aria-label={otherHex}>
              <span style={{ width: 36, height: 36, borderRadius: '50%', background: otherHex, display: 'inline-block' }} />
            </button>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 16, margin: 0 }}>{otherHex}</p>
              <button onClick={() => navigate(`/gift/${tx.gift_id}`)} style={{ ...font, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 14, color: 'var(--text-muted)', textDecoration: 'underline', textAlign: 'left' }}>
                {tx.gift?.title}
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {isProvider && !closed && <button style={smallBtn} onClick={closeRequest}>{t.chat.close}</button>}
            {!isProvider && !confirmed && !closed && <button style={smallBtn} onClick={markReceived}>{t.chat.markReceived}</button>}
            {!isProvider && confirmed && (
              circleAdded
                ? <span style={{ ...font, fontSize: 14, color: 'rgba(80,200,120,0.9)', alignSelf: 'center' }}>{t.explore.added}</span>
                : <button style={smallBtn} onClick={addToCircle}>{t.chat.addToCircle}</button>
            )}
          </div>
        </div>

        {confirmed && <p style={{ ...font, fontSize: 14, color: 'rgba(80,200,120,0.9)', margin: '0 0 12px' }}>{t.chat.deliveredNote}</p>}
        {closed && <p style={{ ...font, fontSize: 14, color: 'var(--text-muted)', margin: '0 0 12px' }}>{t.chat.closedNote}</p>}

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 16, minHeight: 260, maxHeight: '55vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {messages.length === 0 ? (
            <p style={{ ...font, fontSize: 15, color: 'var(--text-muted)', margin: 'auto' }}>{t.chat.empty}</p>
          ) : messages.map((m) => {
            const mine = m.sender_id === user.id
            return (
              <div key={m.id} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                <div style={{
                  ...font, fontSize: 16, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  padding: '10px 14px', borderRadius: 14,
                  background: mine ? 'var(--user-color)' : 'var(--surface-2)',
                  color: mine ? 'var(--user-color-text)' : 'var(--text-primary)',
                }}>
                  {m.content}
                </div>
                <p style={{ ...font, fontSize: 12, color: 'var(--text-muted)', margin: '4px 4px 0', textAlign: mine ? 'right' : 'left' }}>
                  {new Date(m.created_at).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {error && <p style={{ ...font, fontSize: 14, color: '#e05c5c', margin: '12px 0 0' }}>{error}</p>}

        {!closed && (
          <div style={{ display: 'flex', gap: 10, marginTop: 14, alignItems: 'flex-end' }}>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              placeholder={t.chat.placeholder}
              style={{ minHeight: 56, maxHeight: 140 }}
            />
            <button className="btn-primary" onClick={sendMessage} disabled={sending || !text.trim()} style={{ flexShrink: 0 }}>
              {t.chat.send}
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default Chat
