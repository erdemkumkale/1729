import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import DashboardLayout from '../components/DashboardLayout'

const Ver = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('ver') // 'ver' or 'verdiklerim'
  const [myCards, setMyCards] = useState([])
  const [givenSupport, setGivenSupport] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNewCardModal, setShowNewCardModal] = useState(false)
  const [newCardTitle, setNewCardTitle] = useState('')
  const [newCardDescription, setNewCardDescription] = useState('')
  const [creating, setCreating] = useState(false)

  const fetchData = useCallback(async () => {
    if (!user) return
    
    setLoading(true)
    try {
      if (activeTab === 'ver') {
        // Fetch my gift cards
        const { data, error } = await supabase
          .from('gifts')
          .select('*')
          .eq('creator_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setMyCards(data || [])
      } else {
        // Fetch support I've given
        const { data, error } = await supabase
          .from('support_transactions')
          .select(`
            *,
            receiver:receiver_id(hex_code, email),
            gift:gift_id(title)
          `)
          .eq('provider_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setGivenSupport(data || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [user, activeTab])

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user, fetchData])

  const toggleCardStatus = async (cardId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('gifts')
        .update({ is_active: !currentStatus })
        .eq('id', cardId)

      if (error) throw error
      fetchData() // Refresh
    } catch (error) {
      console.error('Error toggling card:', error)
      alert('Hata: ' + error.message)
    }
  }

  const handleCreateCard = async () => {
    if (!newCardTitle.trim() || !newCardDescription.trim()) {
      alert('Lütfen başlık ve açıklama girin')
      return
    }

    setCreating(true)
    try {
      const { error } = await supabase
        .from('gifts')
        .insert({
          creator_id: user.id,
          title: newCardTitle,
          description: newCardDescription,
          visibility: 'global',
          status: 'active',
          is_active: true
        })

      if (error) throw error

      alert('Destek kartı oluşturuldu!')
      setShowNewCardModal(false)
      setNewCardTitle('')
      setNewCardDescription('')
      fetchData() // Refresh
    } catch (error) {
      console.error('Error creating card:', error)
      alert('Hata: ' + error.message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Ver</h1>
          <p className="text-gray-600">Destek kartlarını yönet</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('ver')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'ver'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              VER
            </button>
            <button
              onClick={() => setActiveTab('verdiklerim')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'verdiklerim'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              VERDİKLERİM
            </button>
          </nav>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        ) : activeTab === 'ver' ? (
          <div>
            {/* My Cards */}
            <div className="space-y-4 mb-6">
              {myCards.map((card) => (
                <div key={card.id} className="bg-white rounded-lg shadow p-6 flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{card.title}</h3>
                    <p className="text-sm text-gray-600">{card.description}</p>
                  </div>
                  <div className="ml-4">
                    <button
                      onClick={() => toggleCardStatus(card.id, card.is_active)}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        card.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {card.is_active ? 'Açık' : 'Kapalı'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* New Card Button */}
            <button 
              onClick={() => setShowNewCardModal(true)}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              + Yeni Destek Kartı Aç
            </button>
          </div>
        ) : (
          <div>
            {/* Given Support History */}
            <div className="space-y-4">
              {givenSupport.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Henüz destek vermediniz</p>
              ) : (
                givenSupport.map((support) => (
                  <div key={support.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {support.receiver?.hex_code || 'Kullanıcı'}
                        </p>
                        <p className="text-sm text-gray-600">{support.gift?.title}</p>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(support.created_at).toLocaleDateString('tr-TR')}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* New Card Modal */}
        {showNewCardModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Yeni Destek Kartı</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Başlık
                  </label>
                  <input
                    type="text"
                    value={newCardTitle}
                    onChange={(e) => setNewCardTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Örn: Web Tasarım Desteği"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Açıklama
                  </label>
                  <textarea
                    value={newCardDescription}
                    onChange={(e) => setNewCardDescription(e.target.value)}
                    className="w-full h-32 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    placeholder="Bu konuda nasıl destek verebilirsin?"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleCreateCard}
                    disabled={creating}
                    className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {creating ? 'Oluşturuluyor...' : 'Oluştur'}
                  </button>
                  <button
                    onClick={() => {
                      setShowNewCardModal(false)
                      setNewCardTitle('')
                      setNewCardDescription('')
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    İptal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default Ver
