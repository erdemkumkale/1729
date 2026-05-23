import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'

const ProjectChat = () => {
  const { giftId, requestId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [newMessage, setNewMessage] = useState('')
  const [gift, setGift] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [supportTransaction, setSupportTransaction] = useState(null)
  const [isGiver, setIsGiver] = useState(false)
  const [receiver, setReceiver] = useState(null)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => { scrollToBottom() }, [messages])

  const fetchGift = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('gifts')
        .select('*, creator:creator_id (id, hex_code, email)')
        .eq('id', giftId)
        .single()
      if (error) { console.error('Error fetching gift:', error); return }
      setGift(data)
      setIsGiver(data.creator_id === user?.id)
    } catch (error) {
      console.error('Error fetching gift:', error)
    }
  }, [giftId, user])

  const fetchMessages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*, sender:sender_id (id, hex_code, email), receiver:receiver_id (id, hex_code, email)')
        .eq('gift_id', giftId)
        .order('created_at', { ascending: true })
      if (error) { console.error('Error fetching messages:', error); return }
      setMessages(data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }, [giftId])

  const fetchSupportTransaction = useCallback(async () => {
    if (!requestId) return
    try {
      const { data, error } = await supabase
        .from('support_transactions')
        .select('*, provider:provider_id (id, hex_code, email), receiver:receiver_id (id, hex_code, email)')
        .eq('id', requestId)
        .single()
      if (error && error.code !== 'PGRST116') { console.error('Error fetching support transaction:', error); return }
      setSupportTransaction(data)
      if (data) {
        const receiverData = data.provider_id === user?.id ? data.receiver : data.provider
        setReceiver(receiverData)
      }
    } catch (error) {
      console.error('Error fetching support transaction:', error)
    } finally {
      setLoading(false)
    }
  }, [requestId, user])

  useEffect(() => {
    const loadData = async () => {
      await fetchGift()
      await fetchMessages()
      await fetchSupportTransaction()
    }
    loadData()
  }, [fetchGift, fetchMessages, fetchSupportTransaction])

  const handleCompleteSupport = async () => {
    if (!supportTransaction || !isGiver) return
    if (!window.confirm('Desteği tamamladığınızdan emin misiniz? Bu işlem sonrası karşı tarafın onayını bekleyeceksiniz.')) return

    try {
      const { error: updateError } = await supabase
        .from('support_transactions')
        .update({ status: 'waiting_approval', completed_at: new Date().toISOString() })
        .eq('id', requestId)
      if (updateError) throw updateError

      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          gift_id: giftId,
          sender_id: user.id,
          receiver_id: supportTransaction.receiver_id,
          content: 'Desteği aldın mı?',
          is_system_message: true,
          message_type: 'approval_request',
        })
      if (messageError) throw messageError

      await fetchSupportTransaction()
      await fetchMessages()
    } catch (error) {
      console.error('Error completing support:', error)
      alert('Hata oluştu: ' + error.message)
    }
  }

  const handleApproval = async (approved) => {
    if (!supportTransaction || isGiver) return
    try {
      const { error: updateError } = await supabase
        .from('support_transactions')
        .update({ status: 'archived', approval_status: approved ? 'approved' : 'rejected' })
        .eq('id', requestId)
      if (updateError) throw updateError

      if (approved) {
        const { error: trustError } = await supabase
          .from('trust_connections')
          .insert({ follower_id: supportTransaction.receiver_id, followed_id: supportTransaction.provider_id })
          .select()
        if (trustError && trustError.code !== '23505') console.error('Error creating trust connection:', trustError)
      }

      const confirmMessage = approved ? '✅ Destek onaylandı ve güven çemberine eklendi!' : '❌ Destek onaylanmadı.'
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          gift_id: giftId,
          sender_id: user.id,
          receiver_id: supportTransaction.provider_id,
          content: confirmMessage,
          is_system_message: true,
          message_type: 'system',
        })
      if (messageError) throw messageError

      await fetchSupportTransaction()
      await fetchMessages()
    } catch (error) {
      console.error('Error handling approval:', error)
      alert('Hata oluştu: ' + error.message)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !supportTransaction) return
    if (supportTransaction.status === 'waiting_approval' || supportTransaction.status === 'archived') return

    const receiverId = isGiver ? supportTransaction.receiver_id : supportTransaction.provider_id
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          gift_id: giftId,
          sender_id: user.id,
          receiver_id: receiverId,
          content: newMessage,
          is_system_message: false,
          message_type: 'user',
        })
      if (error) throw error
      setNewMessage('')
      await fetchMessages()
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  // ─── Loading ───
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid var(--user-color)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // ─── Not found ───
  if (!gift || !supportTransaction) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>Sohbet bulunamadı.</p>
        <button className="btn-secondary" onClick={() => navigate('/dashboard')}>← Kontrol Paneline Dön</button>
      </div>
    )
  }

  const isChatLocked = supportTransaction.status === 'waiting_approval' || supportTransaction.status === 'archived'
  const isWaitingApproval = supportTransaction.status === 'waiting_approval'
  const isArchived = supportTransaction.status === 'archived'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', flexDirection: 'column' }}>

      {/* ─── Top nav ─── */}
      <nav style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '0 20px',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 20, lineHeight: 1, padding: 4 }}
          >
            ←
          </button>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 500, color: 'var(--text-primary)' }}>
            {gift.title}
          </span>
        </div>
        {receiver?.hex_code && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: receiver.hex_code }} />
            <span className="mono">{receiver.hex_code}</span>
          </div>
        )}
      </nav>

      {/* ─── Status card ─── */}
      <div style={{ padding: '16px 20px 0' }}>
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          maxWidth: 760,
          margin: '0 auto',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
              {isGiver ? 'Destek veriyorsun' : 'Destek alıyorsun'}
            </p>
            <StatusBadge isArchived={isArchived} isWaitingApproval={isWaitingApproval} supportTransaction={supportTransaction} />
          </div>

          {isGiver && !isChatLocked && (
            <button className="btn-primary" onClick={handleCompleteSupport} style={{ width: '100%' }}>
              Desteği Tamamladım
            </button>
          )}

          {isWaitingApproval && (
            <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: '12px 16px' }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                {isGiver
                  ? 'Karşı tarafın desteği onaylaması bekleniyor.'
                  : 'Desteği aldığını onaylamanı bekliyoruz.'}
              </p>
            </div>
          )}

          {isArchived && (
            <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: '12px 16px' }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                {supportTransaction.approval_status === 'approved'
                  ? 'Bu destek tamamlandı ve güven çemberine eklendi.'
                  : 'Bu destek onaylanmadı ve arşivlendi.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ─── Messages ─── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', maxWidth: 760, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-muted)' }}>
              Henüz mesaj yok. İlk mesajı sen gönder.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map((message) => {
              if (message.is_system_message && message.message_type === 'approval_request') {
                return (
                  <div key={message.id} style={{ display: 'flex', justifyContent: 'center' }}>
                    <div style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 14,
                      padding: '16px 20px',
                      maxWidth: 400,
                      width: '100%',
                      textAlign: 'center',
                    }}>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-primary)', marginBottom: !isGiver && isWaitingApproval ? 12 : 0 }}>
                        {message.content}
                      </p>
                      {!isGiver && isWaitingApproval && (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button
                            onClick={() => handleApproval(true)}
                            className="btn-primary"
                            style={{ flex: 1 }}
                          >
                            Evet, Onayla
                          </button>
                          <button
                            onClick={() => handleApproval(false)}
                            className="btn-secondary"
                            style={{ flex: 1 }}
                          >
                            Alamadım
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              }

              if (message.is_system_message) {
                return (
                  <div key={message.id} style={{ display: 'flex', justifyContent: 'center' }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--text-muted)', background: 'var(--surface-2)', borderRadius: 20, padding: '4px 12px' }}>
                      {message.content}
                    </span>
                  </div>
                )
              }

              const isMine = message.sender_id === user?.id
              const senderHex = message.sender?.hex_code || '#888888'
              return (
                <div key={message.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', gap: 8, alignItems: 'flex-end' }}>
                  {!isMine && (
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: senderHex, flexShrink: 0 }} />
                  )}
                  <div style={{
                    maxWidth: '72%',
                    background: isMine ? 'var(--user-color)' : 'var(--surface)',
                    border: isMine ? 'none' : '1px solid var(--border)',
                    borderRadius: isMine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    padding: '10px 14px',
                  }}>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: isMine ? '#0C0C0B' : 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>
                      {message.content}
                    </p>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: isMine ? 'rgba(12,12,11,0.5)' : 'var(--text-muted)', margin: '4px 0 0', textAlign: 'right' }}>
                      {new Date(message.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ─── Input bar ─── */}
      <div style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        padding: '12px 20px',
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
        flexShrink: 0,
      }}>
        {isChatLocked ? (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
            {isArchived ? 'Bu sohbet arşivlendi.' : 'Sohbet onay bekliyor.'}
          </p>
        ) : (
          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: 10, maxWidth: 760, margin: '0 auto' }}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Mesajını yaz..."
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn-primary" disabled={!newMessage.trim()} style={{ flexShrink: 0 }}>
              Gönder
            </button>
          </form>
        )}
      </div>

    </div>
  )
}

const StatusBadge = ({ isArchived, isWaitingApproval, supportTransaction }) => {
  let label, color
  if (isArchived) {
    const approved = supportTransaction.approval_status === 'approved'
    label = approved ? 'Tamamlandı' : 'Onaylanmadı'
    color = approved ? 'var(--user-color)' : 'var(--text-muted)'
  } else if (isWaitingApproval) {
    label = 'Onay Bekleniyor'
    color = '#f59e0b'
  } else {
    label = 'Aktif'
    color = 'var(--user-color)'
  }

  return (
    <span style={{
      fontFamily: "'DM Mono', monospace",
      fontSize: 11,
      color,
      border: `1px solid ${color}`,
      borderRadius: 20,
      padding: '3px 10px',
    }}>
      {label}
    </span>
  )
}

export default ProjectChat
