import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import DashboardLayout from '../components/DashboardLayout'

const KontrolPaneli = () => {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [stats, setStats] = useState({
    activeCards: 0,
    supportGiven: 0,
    supportReceived: 0,
    trustTeamSize: 0
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchStats()
    }
  }, [user])

  const fetchStats = async () => {
    try {
      // Count active gift cards
      const { count: activeCards } = await supabase
        .from('gifts')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', user.id)
        .eq('is_active', true)

      // Count support given
      const { count: supportGiven } = await supabase
        .from('support_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('provider_id', user.id)

      // Count support received
      const { count: supportReceived } = await supabase
        .from('support_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)

      // Fetch recent activity (last 5 transactions)
      const { data: activityData } = await supabase
        .from('support_transactions')
        .select(`
          *,
          provider:provider_id(hex_code),
          receiver:receiver_id(hex_code),
          gift:gift_id(title)
        `)
        .or(`provider_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(5)

      setStats({
        activeCards: activeCards || 0,
        supportGiven: supportGiven || 0,
        supportReceived: supportReceived || 0,
        trustTeamSize: 0 // Will calculate in trust team page
      })

      setRecentActivity(activityData || [])
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    { title: 'Destek Kartı Aç', description: 'Yeni bir destek kartı oluştur', path: '/give', icon: '🎁' },
    { title: 'Destek Al', description: 'Güven takımından destek iste', path: '/receive', icon: '🤝' },
    { title: 'Sorularımı Düzenle', description: 'Cevaplarını güncelle', path: '/questions', icon: '✏️' },
    { title: 'Güven Takımı', description: 'Ağını genişlet', path: '/trust-team', icon: '👥' },
  ]

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            {/* Hex Avatar Circle */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3"
              style={{ backgroundColor: profile?.hex_code || '#9CA3AF' }}
            >
              {profile?.hex_code ? profile.hex_code.slice(1, 4).toUpperCase() : '...'}
            </div>
            Hoş Geldin, {profile?.hex_code || 'Kullanıcı'}
          </h1>
          <p className="text-gray-600">
            Takımlaşma ekosistemine giriş yaptın
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500 mb-1">Aktif Kartlar</div>
            <div className="text-3xl font-bold text-indigo-600">
              {loading ? '...' : stats.activeCards}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500 mb-1">Verilen Destek</div>
            <div className="text-3xl font-bold text-green-600">
              {loading ? '...' : stats.supportGiven}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500 mb-1">Alınan Destek</div>
            <div className="text-3xl font-bold text-blue-600">
              {loading ? '...' : stats.supportReceived}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500 mb-1">Güven Takımı</div>
            <div className="text-3xl font-bold text-purple-600">
              {loading ? '...' : stats.trustTeamSize}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Hızlı Erişim</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className="bg-white rounded-lg shadow p-6 text-left hover:shadow-md transition-shadow"
              >
                <div className="text-3xl mb-3">{action.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                <p className="text-sm text-gray-600">{action.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Son Aktiviteler</h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
          ) : recentActivity.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Henüz aktivite yok. Destek kartı açarak başla!
            </p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity) => {
                const isProvider = activity.provider_id === user.id
                const otherUser = isProvider ? activity.receiver : activity.provider
                
                return (
                  <div key={activity.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: otherUser?.hex_code || '#9CA3AF' }}
                      >
                        {otherUser?.hex_code?.slice(1, 4).toUpperCase() || '???'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {isProvider ? 'Destek verdin' : 'Destek aldın'}
                        </p>
                        <p className="text-xs text-gray-500">{activity.gift?.title}</p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(activity.created_at).toLocaleDateString('tr-TR')}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default KontrolPaneli
