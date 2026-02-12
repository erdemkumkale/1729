import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'

const Dashboard = () => {
  const [showCreateProject, setShowCreateProject] = useState(false)
  const [newProject, setNewProject] = useState({ title: '', description: '' })
  const navigate = useNavigate()
  const { user, profile, signOut } = useAuth()
  const [gifts, setGifts] = useState([])
  const [trustedUsers, setTrustedUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGifts()
    fetchTrustedUsers()
  }, [])

  const fetchGifts = async () => {
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
        .eq('status', 'Available')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching gifts:', error)
        // Set empty array on error so UI doesn't break
        setGifts([])
        return
      }
      
      setGifts(data || [])
    } catch (error) {
      console.error('Error fetching gifts:', error)
      setGifts([])
    } finally {
      setLoading(false)
    }
  }

  const fetchTrustedUsers = async () => {
    if (!user) return
    
    try {
      // Get users that current user follows (trusts)
      const { data, error } = await supabase
        .from('trust_connections')
        .select(`
          followed_id,
          created_at,
          followed:followed_id (
            id,
            hex_code,
            email
          )
        `)
        .eq('follower_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching trusted users:', error)
        setTrustedUsers([])
        return
      }
      
      setTrustedUsers(data || [])
    } catch (error) {
      console.error('Error fetching trusted users:', error)
      setTrustedUsers([])
    }
  }

  const handleSignOut = () => {
    console.log('Dashboard: Signing out...')
    signOut()
  }

  const handleCreateProject = async (e) => {
    e.preventDefault()
    if (!newProject.title.trim() || !newProject.description.trim()) return

    try {
      const { error } = await supabase
        .from('gifts')
        .insert([
          {
            creator_id: user.id,
            title: newProject.title,
            description: newProject.description,
            status: 'Available'
          },
        ])

      if (error) throw error

      setNewProject({ title: '', description: '' })
      setShowCreateProject(false)
      fetchGifts() // Refresh gifts
    } catch (error) {
      console.error('Error creating gift:', error)
      alert('Hediye oluşturulurken hata oluştu. Lütfen tekrar deneyin.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-gray-900">Zahmetsiz Deha Ekosistemi</h1>
              <div className="hidden sm:flex sm:space-x-8">
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="text-gray-900 hover:text-gray-700 px-3 py-2 text-sm font-medium border-b-2 border-indigo-500"
                >
                  Hediye Pazarı
                </button>
                <button className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium"
                  onClick={() => navigate('/teams')}
                >
                  Aktif İşbirlikleri
                </button>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center space-x-3 hover:bg-gray-50 px-3 py-2 rounded-md"
              >
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: profile?.color || '#4A90E2' }}
                >
                  {profile?.hex_code ? profile.hex_code.slice(1, 4).toUpperCase() : '#4A9'}
                </div>
                <span className="text-sm text-gray-700">{profile?.hex_code || '#4A90E2'}</span>
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
              <h1 className="text-2xl font-bold text-gray-900">Ekosistemin Hediyeleri</h1>
              <p className="mt-2 text-sm text-gray-700">
                "En yüksek katma değer, en kolay yapılan işten gelir. (0 Kalori Efor)"
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <button
                onClick={() => setShowCreateProject(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                🎁 Zahmetsiz Dehanı Sun
              </button>
            </div>
          </div>

          {/* Create Project Modal */}
          {showCreateProject && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">🎁 Zahmetsiz Dehanı Sun</h3>
                  <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
                    <p className="text-sm text-green-800">
                      💡 Senin için oyun olan şey, başkası için iş olabilir. Hile kodunu paylaş!
                    </p>
                  </div>
                  <form onSubmit={handleCreateProject} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hangi konuda hile yapıyorsun?
                      </label>
                      <input
                        type="text"
                        required
                        value={newProject.title}
                        onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Örn: Ben hamur açarken dinlenirim, başkası kan ter içinde kalır"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bu hediye başkalarının hangi sorununu çözer?
                      </label>
                      <textarea
                        required
                        value={newProject.description}
                        onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        rows="4"
                        placeholder="Senin için oyun olan şey, başkası için iş olabilir..."
                      />
                    </div>
                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
                      >
                        🎁 Hediyemi Sun
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCreateProject(false)}
                        className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                      >
                        İptal
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Projects Section */}
          <div className="mb-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">🎁 Mevcut Hediyeler (Abundance)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gifts.map((gift) => (
                <div key={gift.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{gift.title}</h3>
                      <p className="text-gray-600 text-sm mb-3">{gift.description}</p>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {gift.status === 'Available' ? 'Mevcut' : gift.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(gift.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <button 
                      onClick={() => navigate(`/gift/${gift.id}`)}
                      className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium"
                    >
                      Bu Hediyeyi Talep Et
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trusted Users Section */}
          {trustedUsers.length > 0 && (
            <div className="mb-12">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">🤝 Güven Çemberin</h2>
              <div className="bg-white rounded-lg shadow-md p-6">
                <p className="text-sm text-gray-600 mb-4">
                  Bu kişilerle başarılı bir işbirliği tamamladınız ve güven çemberinize eklediniz.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {trustedUsers.map((connection) => (
                    <div 
                      key={connection.followed_id}
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: connection.followed?.hex_code || '#9CA3AF' }}
                      >
                        {connection.followed?.hex_code?.slice(1, 4).toUpperCase() || '???'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {connection.followed?.hex_code || 'Bilinmeyen'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(connection.created_at).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}

export default Dashboard