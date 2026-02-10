import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'

const Circles = () => {
  const navigate = useNavigate()
  const { user, profile, signOut } = useAuth()
  const [myCircles, setMyCircles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [selectedCircle, setSelectedCircle] = useState(null)
  const [newCircle, setNewCircle] = useState({ name: '', description: '' })
  const [memberEmail, setMemberEmail] = useState('')

  useEffect(() => {
    if (user) {
      fetchMyCircles()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const fetchMyCircles = async () => {
    try {
      // Fetch circles where user is admin or member
      const { data: adminCircles } = await supabase
        .from('circles')
        .select('*, circle_members(count)')
        .eq('admin_id', user.id)

      const { data: memberCircles } = await supabase
        .from('circles')
        .select('*, circle_members(count)')
        .in('id', 
          await supabase
            .from('circle_members')
            .select('circle_id')
            .eq('user_id', user.id)
            .then(res => res.data?.map(m => m.circle_id) || [])
        )

      const allCircles = [...(adminCircles || []), ...(memberCircles || [])]
      const uniqueCircles = Array.from(new Map(allCircles.map(c => [c.id, c])).values())
      
      setMyCircles(uniqueCircles)
    } catch (error) {
      console.error('Error fetching circles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCircle = async (e) => {
    e.preventDefault()
    
    try {
      // Generate unique hex for circle
      const hexCode = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
      
      const { error } = await supabase
        .from('circles')
        .insert([{
          name: newCircle.name,
          description: newCircle.description,
          hex_code: hexCode,
          admin_id: user.id
        }])

      if (error) throw error

      setShowCreateModal(false)
      setNewCircle({ name: '', description: '' })
      fetchMyCircles()
      alert('Çember başarıyla oluşturuldu!')
    } catch (error) {
      console.error('Error creating circle:', error)
      alert('Hata: ' + error.message)
    }
  }

  const handleAddMember = async (e) => {
    e.preventDefault()
    
    try {
      // Find user by email
      const { data: userToAdd, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', memberEmail)
        .single()

      if (userError || !userToAdd) {
        alert('Bu e-posta ile kayıtlı kullanıcı bulunamadı')
        return
      }

      // Add to circle
      const { error } = await supabase
        .from('circle_members')
        .insert([{
          circle_id: selectedCircle.id,
          user_id: userToAdd.id
        }])

      if (error) throw error

      setShowAddMemberModal(false)
      setMemberEmail('')
      setSelectedCircle(null)
      fetchMyCircles()
      alert('Üye başarıyla eklendi!')
    } catch (error) {
      console.error('Error adding member:', error)
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
                  onClick={() => navigate('/dashboard')}
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium"
                >
                  Hediye Pazarı
                </button>
                <button 
                  className="text-gray-900 hover:text-gray-700 px-3 py-2 text-sm font-medium border-b-2 border-indigo-500"
                >
                  Çemberlerim
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer"
                style={{ backgroundColor: profile?.hex_code || '#6366f1' }}
                onClick={() => navigate('/profile')}
              >
                {profile?.hex_code?.slice(1, 4).toUpperCase() || 'YOU'}
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
              <h1 className="text-2xl font-bold text-gray-900">Çemberlerim</h1>
              <p className="mt-2 text-sm text-gray-700">
                Güven çemberlerinizi yönetin ve üye ekleyin
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                + Yeni Çember Oluştur
              </button>
            </div>
          </div>

          {/* Circles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myCircles.map((circle) => (
              <div key={circle.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: circle.hex_code }}
                      >
                        {circle.hex_code.slice(1, 3).toUpperCase()}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">{circle.name}</h3>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{circle.description}</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {circle.admin_id === user.id ? 'Yönetici' : 'Üye'}
                      </span>
                    </div>
                  </div>
                </div>

                {circle.admin_id === user.id && (
                  <button
                    onClick={() => {
                      setSelectedCircle(circle)
                      setShowAddMemberModal(true)
                    }}
                    className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium"
                  >
                    + Üye Ekle
                  </button>
                )}
              </div>
            ))}
          </div>

          {myCircles.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">⭕</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz çemberiniz yok</h3>
              <p className="text-gray-500 mb-4">İlk güven çemberinizi oluşturun</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Çember Oluştur
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Create Circle Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative p-8 bg-white w-full max-w-md m-4 rounded-lg shadow-xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Yeni Çember Oluştur</h3>
            <form onSubmit={handleCreateCircle} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Çember Adı
                </label>
                <input
                  type="text"
                  required
                  value={newCircle.name}
                  onChange={(e) => setNewCircle({ ...newCircle, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Örn: Tasarım Ekibi"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama
                </label>
                <textarea
                  value={newCircle.description}
                  onChange={(e) => setNewCircle({ ...newCircle, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  rows="3"
                  placeholder="Bu çember hakkında kısa bir açıklama..."
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Oluştur
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

      {/* Add Member Modal */}
      {showAddMemberModal && selectedCircle && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative p-8 bg-white w-full max-w-md m-4 rounded-lg shadow-xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Üye Ekle: {selectedCircle.name}
            </h3>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Üye E-posta Adresi
                </label>
                <input
                  type="email"
                  required
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="ornek@email.com"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Bu e-posta ile kayıtlı kullanıcı çembere eklenecek
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Ekle
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddMemberModal(false)
                    setMemberEmail('')
                    setSelectedCircle(null)
                  }}
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

export default Circles
