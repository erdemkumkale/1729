import React, { useState, useEffect, useCallback } from 'react'
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

  const fetchGift = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('gifts')
        .select(`
          *,
          creator:creator_id (
            id,
            hex_code,
            email
          )
        `)
        .eq('id', giftId)
        .single()

      if (error) {
        console.error('Error fetching gift:', error)
        return
      }
      
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
        .select(`
          *,
          sender:sender_id (
            id,
            hex_code,
            email
          ),
          receiver:receiver_id (
            id,
            hex_code,
            email
          )
        `)
        .eq('gift_id', giftId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching messages:', error)
        return
      }
      
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
        .select(`
          *,
          provider:provider_id (
            id,
            hex_code,
            email
          ),
          receiver:receiver_id (
            id,
            hex_code,
            email
          )
        `)
        .eq('id', requestId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching support transaction:', error)
        return
      }
      
      setSupportTransaction(data)
      
      // Determine receiver
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
    
    if (!window.confirm('Desteği tamamladığınızdan emin misiniz? Bu işlem sonrası karşı tarafın onayını bekleyeceksiniz.')) {
      return
    }

    try {
      // Update support transaction status
      const { error: updateError } = await supabase
        .from('support_transactions')
        .update({ 
          status: 'waiting_approval',
          completed_at: new Date().toISOString()
        })
        .eq('id', requestId)

      if (updateError) throw updateError

      // Send system message to receiver
      const receiverId = supportTransaction.receiver_id
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          gift_id: giftId,
          sender_id: user.id,
          receiver_id: receiverId,
          content: 'Desteği aldın mı?',
          is_system_message: true,
          message_type: 'approval_request'
        })

      if (messageError) throw messageError

      // Refresh data
      await fetchSupportTransaction()
      await fetchMessages()
      
      alert('Destek tamamlandı olarak işaretlendi. Karşı tarafın onayı bekleniyor.')
    } catch (error) {
      console.error('Error completing support:', error)
      alert('Hata oluştu: ' + error.message)
    }
  }

  const handleApproval = async (approved) => {
    if (!supportTransaction || isGiver) return

    try {
      // Update support transaction
      const { error: updateError } = await supabase
        .from('support_transactions')
        .update({ 
          status: 'archived',
          approval_status: approved ? 'approved' : 'rejected'
        })
        .eq('id', requestId)

      if (updateError) throw updateError

      // If approved, add to trust connections
      if (approved) {
        const { error: trustError } = await supabase
          .from('trust_connections')
          .insert({
            follower_id: supportTransaction.receiver_id, // Alan kişi follower
            followed_id: supportTransaction.provider_id  // Veren kişi followed
          })
          .select()

        if (trustError && trustError.code !== '23505') { // Ignore duplicate error
          console.error('Error creating trust connection:', trustError)
        }
      }

      // Send confirmation message
      const confirmMessage = approved 
        ? '✅ Destek onaylandı ve güven çemberine eklendi!'
        : '❌ Destek onaylanmadı.'
      
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          gift_id: giftId,
          sender_id: user.id,
          receiver_id: supportTransaction.provider_id,
          content: confirmMessage,
          is_system_message: true,
          message_type: 'system'
        })

      if (messageError) throw messageError

      // Refresh data
      await fetchSupportTransaction()
      await fetchMessages()
      
      alert(approved ? 'Destek onaylandı ve güven çemberine eklendi!' : 'Destek onaylanmadı.')
    } catch (error) {
      console.error('Error handling approval:', error)
      alert('Hata oluştu: ' + error.message)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !supportTransaction) return

    // Check if chat is locked
    if (supportTransaction.status === 'waiting_approval' || supportTransaction.status === 'archived') {
      alert('Bu sohbet kapatılmıştır.')
      return
    }

    // Determine receiver
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
          message_type: 'user'
        })

      if (error) throw error

      setNewMessage('')
      await fetchMessages()
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Mesaj gönderilirken hata oluştu.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  if (!gift || !supportTransaction) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Sohbet bulunamadı</h2>
          <button 
            onClick={() => navigate('/dashboard')}
            className="mt-4 text-indigo-600 hover:text-indigo-500"
          >
            ← Kontrol Paneline Dön
          </button>
        </div>
      </div>
    )
  }

  const isChatLocked = supportTransaction.status === 'waiting_approval' || supportTransaction.status === 'archived'
  const isWaitingApproval = supportTransaction.status === 'waiting_approval'
  const isArchived = supportTransaction.status === 'archived'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button 
                onClick={() => navigate('/dashboard')}
                className="text-indigo-600 hover:text-indigo-500 mr-4"
              >
                ← Kontrol Paneline Dön
              </button>
              <h1 className="text-xl font-bold text-gray-900">Destek Sohbeti</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: receiver?.hex_code || '#9CA3AF' }}
                >
                  {receiver?.hex_code?.slice(1, 4).toUpperCase() || '???'}
                </div>
                <span className="text-sm text-gray-700">{receiver?.hex_code || 'Yükleniyor...'}</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-6 lg:px-8">
          
          {/* Support Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{gift.title}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {isGiver ? 'Destek veriyorsun' : 'Destek alıyorsun'}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                isArchived 
                  ? 'bg-gray-100 text-gray-800' 
                  : isWaitingApproval
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {isArchived ? 'Arşivlendi' : isWaitingApproval ? 'Onay Bekleniyor' : 'Aktif'}
              </span>
            </div>

            {/* Complete Support Button (Only for Giver) */}
            {isGiver && !isChatLocked && (
              <div className="mt-4">
                <button
                  onClick={handleCompleteSupport}
                  className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 font-medium transition-colors"
                >
                  ✅ Desteği Tamamladım
                </button>
              </div>
            )}

            {/* Status Messages */}
            {isWaitingApproval && (
              <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                <h3 className="font-medium text-yellow-900 mb-2">⏳ Onay Bekleniyor</h3>
                <p className="text-sm text-yellow-800">
                  {isGiver 
                    ? 'Karşı tarafın desteği onaylaması bekleniyor.'
                    : 'Desteği aldığını onaylamanı bekliyoruz.'}
                </p>
              </div>
            )}

            {isArchived && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">
                  {supportTransaction.approval_status === 'approved' ? '✅ Destek Tamamlandı' : '❌ Destek Onaylanmadı'}
                </h3>
                <p className="text-sm text-gray-800">
                  {supportTransaction.approval_status === 'approved' 
                    ? 'Bu destek tamamlandı ve güven çemberine eklendi.'
                    : 'Bu destek onaylanmadı ve arşivlendi.'}
                </p>
              </div>
            )}
          </div>

          {/* Chat Messages */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Mesajlar</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
              {messages.length > 0 ? (
                messages.map((message) => {
                  // System message (approval request)
                  if (message.is_system_message && message.message_type === 'approval_request') {
                    return (
                      <div key={message.id} className="flex justify-center">
                        <div className="max-w-md w-full bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p className="text-center text-blue-900 font-medium mb-3">
                            {message.content}
                          </p>
                          {/* Show approval buttons only to receiver and if still waiting */}
                          {!isGiver && isWaitingApproval && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleApproval(true)}
                                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium transition-colors"
                              >
                                ✅ Evet, Onayla ve Güven Çemberine Ekle
                              </button>
                              <button
                                onClick={() => handleApproval(false)}
                                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-medium transition-colors"
                              >
                                ❌ Hayır, Desteği Alamadım
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  }
                  
                  // System confirmation message
                  if (message.is_system_message && message.message_type === 'system') {
                    return (
                      <div key={message.id} className="flex justify-center">
                        <div className="bg-gray-100 px-4 py-2 rounded-lg">
                          <p className="text-sm text-gray-700 text-center">{message.content}</p>
                        </div>
                      </div>
                    )
                  }
                  
                  // Regular user message
                  return (
                    <div key={message.id} className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender_id === user?.id
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender_id === user?.id ? 'text-indigo-200' : 'text-gray-500'
                        }`}>
                          {new Date(message.created_at).toLocaleTimeString('tr-TR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Henüz mesaj yok. İlk mesajı sen gönder!</p>
                </div>
              )}
            </div>

            {/* Message Input */}
            {isChatLocked ? (
              <div className="bg-gray-100 px-4 py-3 rounded-lg text-center">
                <p className="text-sm text-gray-600">
                  {isArchived ? 'Bu sohbet arşivlendi.' : 'Sohbet onay bekliyor.'}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Mesajını yaz..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Gönder
                </button>
              </form>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}

export default ProjectChat