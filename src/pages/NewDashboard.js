import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'

const NewDashboard = () => {
  const navigate = useNavigate()
  const { user, profile, signOut } = useAuth()
  const [activeCard, setActiveCard] = useState(null)
  const [myAnswers, setMyAnswers] = useState([])
  const [myGifts, setMyGifts] = useState([])
  const [availableGifts, setAvailableGifts] = useState([])
  const [canRequest, setCanRequest] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    try {
      // Fetch my answers
      const { data: answers } = await supabase
        .from('onboarding_answers')
        .select('*')
        .eq('user_id', user.id)
        .order('question_id')
      
      setMyAnswers(answers || [])

      // Fetch my gifts
      const { data: gifts } = await supabase
        .from('gifts')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false })
      
      setMyGifts(gifts || [])

      // Check if user can request (Balance Law)
      const hasActiveGift = gifts?.some(g => g.status === 'active')
      setCanRequest(hasActiveGift)

      // Fetch available gifts
      const { data: available } = await supabase
        .from('gifts')
        .select(`
          *,
          profiles:creator_id (
            hex_code,
            full_name
          )
        `)
        .eq('status', 'active')
        .neq('creator_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)
      
      setAvailableGifts(available || [])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const cards = [
    {
      id: 'profile',
      title: 'Profil & Cevaplar',
      icon: '👤',
      color: 'from-blue-500 to-cyan-500',
      description: '4 ruh sorunuzu görüntüleyin ve düzenleyin'
    },
    {
      id: 'trust-team',
      title: 'Güven Takımı',
      icon: '🤝',
      color: 'from-purple-500 to-pink-500',
      description: 'Davet edin veya dahil edin'
    },
    {
      id: 'receiving',
      title: 'Alma',
      icon: '🎁',
      color: 'from-green-500 to-emerald-500',
      description: 'Hediyelere göz atın ve talep edin'
    },
    {
      id: 'giving',
      title: 'Verme',
      icon: '✨',
      color: 'from-orange-500 to-red-500',
      description: 'Zahmetsiz dehanızı paylaşın'
    }
  ]

  const questions = [
    "Kanıtlayacak hiçbir şeyiniz ve yapmak *zorunda* olduğunuz hiçbir şey olmasaydı, varlığınız neyle meşgul olurdu?",
    "Hangi konuda hile yapıyorsunuz?",
    "Bu zahmetsiz dehanın başkalarının hangi sorununu çözer?",
    "Hangi görev enerjinizi tüketiyor?"
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Zahmetsiz Deha
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold cursor-pointer hover:scale-110 transition-transform"
                style={{ backgroundColor: profile?.hex_code || '#6366f1' }}
                onClick={() => setActiveCard('profile')}
              >
                {profile?.hex_code?.slice(1, 4).toUpperCase() || 'YOU'}
              </div>
              <button
                onClick={signOut}
                className="text-gray-600 hover:text-gray-900 text-sm font-medium"
              >
                Çıkış
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {!activeCard ? (
          <>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Kontrol Paneliniz
              </h2>
              <p className="text-xl text-gray-600">
                Hediye ekonomisinde yerinizi alın
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {cards.map((card) => (
                <div
                  key={card.id}
                  onClick={() => setActiveCard(card.id)}
                  className="group cursor-pointer"
                >
                  <div className={`bg-gradient-to-br ${card.color} rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all transform hover:scale-105`}>
                    <div className="text-6xl mb-4">{card.icon}</div>
                    <h3 className="text-3xl font-bold text-white mb-2">{card.title}</h3>
                    <p className="text-white/90">{card.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div>
            <button
              onClick={() => setActiveCard(null)}
              className="mb-6 flex items-center text-gray-600 hover:text-gray-900"
            >
              ← Geri Dön
            </button>

            {/* Profile Card Content */}
            {activeCard === 'profile' && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Profiliniz</h2>
                
                <div className="flex items-center space-x-4 mb-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                  <div 
                    className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                    style={{ backgroundColor: profile?.hex_code }}
                  >
                    {profile?.hex_code?.slice(1, 4).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{profile?.hex_code}</h3>
                    <p className="text-gray-600">{profile?.full_name}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {myAnswers.map((answer, index) => (
                    <div key={answer.id} className="border-l-4 border-purple-500 pl-4">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        {index + 1}. {questions[index]}
                      </h4>
                      <p className="text-gray-700">{answer.answer_text}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => navigate('/profile/edit')}
                  className="mt-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg hover:from-purple-600 hover:to-pink-600"
                >
                  Cevapları Düzenle
                </button>
              </div>
            )}

            {/* Trust Team Card Content */}
            {activeCard === 'trust-team' && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Güven Takımı</h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="border-2 border-purple-200 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">🎫 Davet Et</h3>
                    <p className="text-gray-600 mb-4">
                      Arkadaşlarınıza %50 indirimli davet linki gönderin
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      Kalan davet hakkınız: {profile?.invites_remaining || 0}
                    </p>
                    <button className="w-full bg-purple-500 text-white py-3 rounded-lg hover:bg-purple-600">
                      Davet Linki Oluştur
                    </button>
                  </div>

                  <div className="border-2 border-pink-200 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">💝 Dahil Et</h3>
                    <p className="text-gray-600 mb-4">
                      Güven çembrenize ücretsiz katılım sağlayın (%70 indirimle)
                    </p>
                    <button className="w-full bg-pink-500 text-white py-3 rounded-lg hover:bg-pink-600">
                      E-posta Ekle
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Receiving Card Content */}
            {activeCard === 'receiving' && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Hediye Pazarı</h2>
                
                {!canRequest && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6">
                    <h3 className="text-lg font-bold text-red-900 mb-2">⚖️ Denge Yasası</h3>
                    <p className="text-red-700">
                      Hediye talep edebilmek için önce bir hediye paylaşmalısınız. 
                      Vermeden almak mümkün değil.
                    </p>
                    <button
                      onClick={() => setActiveCard('giving')}
                      className="mt-4 bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600"
                    >
                      Hediye Paylaş →
                    </button>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                  {availableGifts.map((gift) => (
                    <div key={gift.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-center space-x-3 mb-4">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: gift.profiles?.hex_code || '#6366f1' }}
                        >
                          {gift.profiles?.hex_code?.slice(1, 3).toUpperCase()}
                        </div>
                        <span className="text-sm text-gray-600">{gift.profiles?.hex_code}</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{gift.title}</h3>
                      <p className="text-gray-600 mb-4">{gift.description}</p>
                      <button
                        disabled={!canRequest}
                        className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {canRequest ? 'Talep Et' : '🔒 Kilitli'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Giving Card Content */}
            {activeCard === 'giving' && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Hediyelerim</h2>
                
                <button
                  onClick={() => navigate('/gift/create')}
                  className="mb-6 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-lg hover:from-orange-600 hover:to-red-600"
                >
                  + Yeni Hediye Paylaş
                </button>

                <div className="space-y-4">
                  {myGifts.map((gift) => (
                    <div key={gift.id} className="border border-gray-200 rounded-xl p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{gift.title}</h3>
                          <p className="text-gray-600 mb-2">{gift.description}</p>
                          <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                            gift.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {gift.status === 'active' ? 'Aktif' : gift.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {myGifts.length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      Henüz hediye paylaşmadınız
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default NewDashboard
