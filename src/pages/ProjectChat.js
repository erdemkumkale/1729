import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'

const ProjectChat = () => {
  const { giftId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [newMessage, setNewMessage] = useState('')
  const [gift, setGift] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [collaboration, setCollaboration] = useState(null)

  useEffect(() => {
    fetchGift()
    fetchMessages()
    fetchCollaboration()
  }, [giftId])

  const fetchGift = async () => {
    try {
      const { data, error } = await supabase
        .from('gifts')
        .select(`
          *,
          profiles:creator_id (
            hex_code,
            color,
            real_name
          )
        `)
        .eq('id', giftId)
        .single()

      if (error) {
        console.error('Error fetching gift:', error)
        return
      }
      
      setGift(data)
    } catch (error) {
      console.error('Error fetching gift:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id (
            hex_code,
            color,
            real_name
          ),
          receiver:receiver_id (
            hex_code,
            color,
            real_name
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
  }

  const fetchCollaboration = async () => {
    try {
      const { data, error } = await supabase
        .from('collaborations')
        .select('*')
        .eq('gift_id', giftId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching collaboration:', error)
        return
      }
      
      setCollaboration(data)
    } catch (error) {
      console.error('Error fetching collaboration:', error)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !gift) return

    // Determine receiver (the other person in the chat)
    const receiverId = gift.creator_id === user.id 
      ? collaboration?.receiver_id 
      : gift.creator_id

    if (!receiverId) {
      alert('Mesaj göndermek için önce işbirliği başlatılmalı.')
      return
    }

    try {
      const { error } = await supabase
        .from('messages')
        .insert([
          {
            gift_id: giftId,
            sender_id: user.id,
            receiver_id: receiverId,
            content: newMessage
          }
        ])

      if (error) throw error

      setNewMessage('')
      fetchMessages() // Refresh messages
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

  if (!gift) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Hediye bulunamadı</h2>
          <button 
            onClick={() => navigate('/dashboard')}
            className="mt-4 text-indigo-600 hover:text-indigo-500"
          >
            ← Hediye Pazarına Dön
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button 
                onClick={() => navigate(`/gift/${giftId}`)}
                className="text-indigo-600 hover:text-indigo-500 mr-4"
              >
                ← Hediyeye Dön
              </button>
              <h1 className="text-xl font-bold text-gray-900">Hediye Sohbeti</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                  #4A9
                </div>
                <span className="text-sm text-gray-700">#4A90E2</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-6 lg:px-8">
          
          {/* Gift Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{gift.title}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Hediye sahibi ile özel sohbet
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                collaboration 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {collaboration ? 'İşbirliği Aktif' : 'Görüşme Aşamasında'}
              </span>
            </div>

            {collaboration && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <h3 className="font-medium text-green-900 mb-2">🤝 İşbirliği Başladı!</h3>
                <p className="text-sm text-green-800">
                  Hediye talebin kabul edildi. Artık birbirinizin gerçek isimlerini görebilir ve birlikte çalışabilirsiniz!
                </p>
              </div>
            )}
          </div>

          {/* Chat Messages */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Mesajlar</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {messages.length > 0 ? (
                messages.map((message) => (
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
                        {new Date(message.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Henüz mesaj yok. İlk mesajı sen gönder!</p>
                </div>
              )}
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="mt-4 flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Mesajını yaz..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                type="submit"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 font-medium"
              >
                Gönder
              </button>
            </form>
          </div>

        </div>
      </main>
    </div>
  )
}

export default ProjectChat