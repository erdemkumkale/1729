import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'

const AllTeams = () => {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const [collaborations, setCollaborations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCollaborations()
  }, [])

  const fetchCollaborations = async () => {
    try {
      const { data, error } = await supabase
        .from('collaborations')
        .select(`
          *,
          gifts:gift_id (
            id,
            title,
            description,
            status,
            created_at
          ),
          giver:giver_id (
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
        .order('started_at', { ascending: false })

      if (error) {
        console.error('Error fetching collaborations:', error)
        setCollaborations([])
        return
      }
      
      setCollaborations(data || [])
    } catch (error) {
      console.error('Error fetching collaborations:', error)
      setCollaborations([])
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = () => {
    console.log('AllTeams: Signing out...')
    signOut()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-gray-900">Zahmetsiz Deha Ekosistemi</h1>
              <div className="hidden sm:flex sm:space-x-8">
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium"
                >
                  Hediye Pazarı
                </button>
                <button className="text-gray-900 hover:text-gray-700 px-3 py-2 text-sm font-medium border-b-2 border-indigo-500">
                  Aktif İşbirlikleri
                </button>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center space-x-3 hover:bg-gray-50 px-3 py-2 rounded-md"
              >
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                  #4A9
                </div>
                <span className="text-sm text-gray-700">#4A90E2</span>
              </button>
              <button 
                onClick={handleSignOut}
                className="ml-4 text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-6 lg:px-8">
          
          <div className="sm:flex sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Aktif İşbirlikleri</h1>
              <p className="mt-2 text-sm text-gray-700">
                Ekosistemde başlatılmış hediye işbirlikleri
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {collaborations.length} Aktif İşbirliği
                </span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <>
              {/* Collaborations Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {collaborations.map((collaboration) => (
                  <div key={collaboration.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{collaboration.gifts?.title}</h3>
                        <p className="text-gray-600 text-sm mb-3">{collaboration.gifts?.description}</p>
                        <div className="flex items-center space-x-2 mb-4">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Aktif İşbirliği
                          </span>
                          <span className="text-xs text-gray-500">
                            Başladı {new Date(collaboration.started_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Collaboration Members */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700">İşbirliği Üyeleri</h4>
                      <div className="space-y-2">
                        {/* Giver */}
                        <div className="flex items-center">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3"
                            style={{ backgroundColor: collaboration.giver?.color }}
                          >
                            {collaboration.giver?.hex_code?.slice(1, 3).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {collaboration.giver?.real_name}
                            </p>
                            <p className="text-xs text-gray-500">Hediye Veren</p>
                          </div>
                        </div>
                        
                        {/* Receiver */}
                        <div className="flex items-center">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3"
                            style={{ backgroundColor: collaboration.receiver?.color }}
                          >
                            {collaboration.receiver?.hex_code?.slice(1, 3).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {collaboration.receiver?.real_name}
                            </p>
                            <p className="text-xs text-gray-500">Hediye Alan</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <button 
                        onClick={() => navigate(`/gift/${collaboration.gifts?.id}`)}
                        className="w-full text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                      >
                        Hediyeyi Görüntüle
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Empty State */}
              {collaborations.length === 0 && (
                <div className="text-center py-12">
                  <div className="mx-auto h-12 w-12 text-gray-400">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.196-2.121M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.196-2.121M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Henüz işbirliği yok</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Hediye sahipleri talepleri kabul ettiğinde işbirlikleri başlar.
                  </p>
                </div>
              )}
            </>
          )}

        </div>
      </main>
    </div>
  )
}

export default AllTeams