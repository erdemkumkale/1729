import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'

const RealDashboard = () => {
  const navigate = useNavigate()
  const { user, profile, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState('global') // 'global' or 'circle'
  const [globalGifts, setGlobalGifts] = useState([])
  const [circleGifts, setCircleGifts] = useState([])
  const [myCircles, setMyCircles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newGift, setNewGift] = useState({
    title: '',
    description: '',
    visibility: 'global',
    circle_id: null
  })

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    try {
      // Fetch my circles
      const { data: circles } = await supabase
        .from('circle_members')
        .select('circle_id, circles(*)')
        .eq('user_id', user.id)

      const myCirclesList = circles?.map(c => c.circles) || []
      setMyCircles(myCirclesList)

      // Fetch global gifts
      const { data: global } = await supabase
        .from('gifts')
        .select(`
          *,
          profiles:creator_id (
            hex_code,
            full_name
          )
        `)
        .eq('visibility', 'global')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      setGlobalGifts(global || [])

      // Fetch circle gifts
      if (myCirclesList.length > 0) {
        const circleIds = myCirclesList.map(c => c.id)
        const { data: circle } = await supabase
          .from('gifts')
          .select(`
            *,
            profiles:creator_id (
              hex_code,
              full_name
            ),
            circles:circle_id (
              name,
              hex_code
            )
          `)
          .in('circle_id', circleIds)
          .eq('status', 'active')
          .order('created_at', { ascending: false })

        setCircleGifts(circle || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGift = async (e) => {
    e.preventDefault()
    
    try {
      const giftData = {
        creator_id: user.id,
        title: newGift.title,
        description: newGift.description,
        visibility: newGift.visibility,
        status: 'active'
      }

      if (newGift.visibility === 'circle' && newGift.circle_id) {
        giftData.circle_id = newGift.circle_id
      }

      const { error } = await supabase
        .from('gifts')
        .insert([giftData])

      if (error) throw error

      setShowCreateModal(false)
      setNewGift({
        title: '',
        description: '',
        visibility: 'global',
        circle_id: null
      })
      fetchData()
      alert('Hediye başarıyla oluşturuldu!')
    } catch (error) {
      console.error('Error creating gift:', error)
      alert('Hata: ' + error.message)
    }
  }

  const handleSignOut = () => {
    signOut()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  const displayGifts = activeTab === 'global' ? globalGifts : circleGifts

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-gray-900">Zahmetsiz Deha</h1>
              <div className="hidden sm:flex sm:space-x-8">
                <button 
                  className="text-gray-900 hover:text-gray-700 px-3 py-2 text-sm font-medium border-b-2 border-indigo-500"
                >
                  Hediye Pazarı
                </button>
                <button 
                  onClick={() => navigate('/circles')}
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium"
                >
                  Çemberlerim
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:scale-110 transition-transform"
                style={{ backgroundColor: profile?.hex_code || '#9CA3AF' }}
                onClick={() => navigate('/profile')}
                title={profile?.hex_code || 'Loading...'}
              >
                {profile?.hex_code ? profile.hex_code.slice(1, 4).toUpperCase() : '...'}
              </div>
              <button 
                onClick={handleSignOut}
                className="text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="sm:flex sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Hediye Pazarı</h1>
              <p className="mt-2 text-sm text-gray-700">
                Zahmetsiz dehalarını keşfet ve paylaş
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                🎁 Hediye Paylaş
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('global')}
                className={`${
                  activeTab === 'global'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                🌍 Global Hediyeler ({globalGifts.length})
              </button>
              <button
                onClick={() => setActiveTab('circle')}
                className={`${
                  activeTab === 'circle'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                ⭕ Çember Hediyeleri ({circleGifts.length})
              </button>
            </nav>
          </div>

          {/* Gifts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayGifts.map((gift) => (
              <div key={gift.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-3">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: gift.profiles?.hex_code || '#6366f1' }}
                      >
                        {gift.profiles?.hex_code?.slice(1, 3).toUpperCase() || 'XX'}
                      </div>
                      <span className="text-sm text-gray-600">{gift.profiles?.hex_code}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{gift.title}</h3>
                    <p className="text-gray-600 text-sm mb-3">{gift.description}</p>
                    
                    {gift.visibility === 'circle' && gift.circles && (
                      <div className="flex items-center space-x-2 mb-2">
                        <div 
                          className="w-5 h-5 rounded-full"
                          style={{ backgroundColor: gift.circles.hex_code }}
                        ></div>
                        <span className="text-xs text-gray-500">{gift.circles.name}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        gift.visibility === 'global' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {gift.visibility === 'global' ? '🌍 Global' : '⭕ Çember'}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/gift/${gift.id}`)}
                  className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                  Detayları Gör
                </button>
              </div>
            ))}
          </div>

          {displayGifts.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">
                {activeTab === 'global' ? '🌍' : '⭕'}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {activeTab === 'global' ? 'Henüz global hediye yok' : 'Henüz çember hediyesi yok'}
              </h3>
              <p className="text-gray-500">
                {activeTab === 'global' 
                  ? 'İlk hediyeyi siz paylaşın!' 
                  : 'Çemberlerinizde henüz hediye paylaşılmamış'}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Create Gift Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative p-8 bg-white w-full max-w-md m-4 rounded-lg shadow-xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Yeni Hediye Paylaş</h3>
            <form onSubmit={handleCreateGift} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hediye Başlığı
                </label>
                <input
                  type="text"
                  required
                  value={newGift.title}
                  onChange={(e) => setNewGift({ ...newGift, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Örn: Logo tasarımında ustayım"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama
                </label>
                <textarea
                  required
                  value={newGift.description}
                  onChange={(e) => setNewGift({ ...newGift, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  rows="4"
                  placeholder="Bu hediyenin detaylarını açıklayın..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Görünürlük
                </label>
                <select
                  value={newGift.visibility}
                  onChange={(e) => setNewGift({ 
                    ...newGift, 
                    visibility: e.target.value,
                    circle_id: e.target.value === 'global' ? null : newGift.circle_id
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="global">🌍 Global (Herkes Görebilir)</option>
                  <option value="circle">⭕ Çemberlerim (Sadece Çember Üyeleri)</option>
                </select>
              </div>
              
              {newGift.visibility === 'circle' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Çember Seçin
                  </label>
                  <select
                    required
                    value={newGift.circle_id || ''}
                    onChange={(e) => setNewGift({ ...newGift, circle_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Çember seçin...</option>
                    {myCircles.map((circle) => (
                      <option key={circle.id} value={circle.id}>
                        {circle.name}
                      </option>
                    ))}
                  </select>
                  {myCircles.length === 0 && (
                    <p className="mt-1 text-xs text-red-500">
                      Önce bir çember oluşturmalısınız
                    </p>
                  )}
                </div>
              )}
              
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Paylaş
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default RealDashboard
