import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import DashboardLayout from '../components/DashboardLayout'

const Al = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('al') // 'al' or 'aldiklarim'
  const [filter, setFilter] = useState('guven') // 'guven', 'turkiye', 'global'
  const [availableGifts, setAvailableGifts] = useState([])
  const [receivedSupport, setReceivedSupport] = useState([])
  const [trustTeamIds, setTrustTeamIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(false)

  const fetchTrustTeamIds = useCallback(async () => {
    if (!user) return
    
    try {
      const teamIds = new Set()

      // 1. Get inviter
      const { data: inviterData } = await supabase
        .from('invitations')
        .select('inviter_id')
        .eq('used_by', user.id)
        .eq('status', 'used')

      inviterData?.forEach(item => {
        if (item.inviter_id) teamIds.add(item.inviter_id)
      })

      // 2. Get invited users
      const { data: invitedData } = await supabase
        .from('invitations')
        .select('used_by')
        .eq('inviter_id', user.id)
        .eq('status', 'used')
        .not('used_by', 'is', null)

      invitedData?.forEach(item => {
        if (item.used_by) teamIds.add(item.used_by)
      })

      // 3. Get support transaction partners
      const { data: transactionsData } = await supabase
        .from('support_transactions')
        .select('provider_id, receiver_id')
        .or(`provider_id.eq.${user.id},receiver_id.eq.${user.id}`)

      transactionsData?.forEach(tx => {
        const partnerId = tx.provider_id === user.id ? tx.receiver_id : tx.provider_id
        if (partnerId) teamIds.add(partnerId)
      })

      setTrustTeamIds(Array.from(teamIds))
    } catch (error) {
      console.error('Error fetching trust team:', error)
    }
  }, [user])

  const fetchData = useCallback(async () => {
    if (!user) return
    
    setLoading(true)
    try {
      if (activeTab === 'al') {
        // Fetch available gifts based on filter
        let query = supabase
          .from('gifts')
          .select(`
            *,
            creator:creator_id(hex_code, email)
          `)
          .eq('is_active', true)
          .neq('creator_id', user.id) // Don't show own cards

        // Apply filter
        if (filter === 'guven' && trustTeamIds.length > 0) {
          query = query.in('creator_id', trustTeamIds)
        }
        // 'turkiye' and 'global' filters can be added later with country field

        const { data, error } = await query.order('created_at', { ascending: false })
        if (error) throw error
        setAvailableGifts(data || [])
      } else {
        // Fetch support I've received
        const { data, error } = await supabase
          .from('support_transactions')
          .select(`
            *,
            provider:provider_id(hex_code, email),
            gift:gift_id(title)
          `)
          .eq('receiver_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setReceivedSupport(data || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [user, activeTab, filter, trustTeamIds])

  useEffect(() => {
    if (user) {
      fetchTrustTeamIds()
    }
  }, [user, fetchTrustTeamIds])

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user, fetchData])

  const handleRequestSupport = async (giftId, providerId) => {
    setRequesting(true)
    try {
      const { error } = await supabase
        .from('support_transactions')
        .insert({
          provider_id: providerId,
          receiver_id: user.id,
          gift_id: giftId,
          status: 'active'
        })

      if (error) throw error

      alert('Destek talebi gönderildi!')
      fetchData() // Refresh
    } catch (error) {
      console.error('Error requesting support:', error)
      alert('Hata: ' + error.message)
    } finally {
      setRequesting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Al</h1>
          <p className="text-gray-600">Destek al ve geçmişini gör</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('al')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'al'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              AL
            </button>
            <button
              onClick={() => setActiveTab('aldiklarim')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'aldiklarim'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ALDIKLARIM
            </button>
          </nav>
        </div>

        {/* Filters (only show in AL tab) */}
        {activeTab === 'al' && (
          <div className="mb-6 flex space-x-4">
            {['guven', 'turkiye', 'global'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  filter === f
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f === 'guven' ? 'Güven Takımı' : f === 'turkiye' ? 'Türkiye' : 'Global'}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        ) : activeTab === 'al' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableGifts.map((gift) => (
              <div key={gift.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center space-x-2 mb-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: gift.creator?.hex_code || '#9CA3AF' }}
                  >
                    {gift.creator?.hex_code?.slice(1, 4).toUpperCase() || '???'}
                  </div>
                  <span className="text-sm text-gray-600">{gift.creator?.hex_code}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{gift.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{gift.description}</p>
                <button 
                  onClick={() => handleRequestSupport(gift.id, gift.creator_id)}
                  disabled={requesting}
                  className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {requesting ? 'Gönderiliyor...' : 'Destek İste'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {receivedSupport.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Henüz destek almadınız</p>
            ) : (
              receivedSupport.map((support) => (
                <div key={support.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {support.provider?.hex_code || 'Kullanıcı'}
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
        )}
      </div>
    </DashboardLayout>
  )
}

export default Al
