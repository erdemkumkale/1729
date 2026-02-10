import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import DashboardLayout from '../components/DashboardLayout'

const GuvenTakimi = () => {
  const { user, profile } = useAuth()
  const [trustTeam, setTrustTeam] = useState([])
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteType, setInviteType] = useState('discount_50')
  const [generatedCode, setGeneratedCode] = useState('')

  useEffect(() => {
    if (user) {
      fetchTrustTeam()
    }
  }, [user])

  const fetchTrustTeam = async () => {
    setLoading(true)
    try {
      const teamMembers = new Set()
      const memberDetails = []

      // 1. Get inviter (who invited me)
      const { data: inviterData } = await supabase
        .from('invitations')
        .select('inviter_id, inviter:inviter_id(hex_code, email)')
        .eq('email', profile?.email)
        .eq('status', 'used')
        .maybeSingle()

      if (inviterData?.inviter_id) {
        teamMembers.add(inviterData.inviter_id)
        memberDetails.push({
          id: inviterData.inviter_id,
          hex_code: inviterData.inviter?.hex_code,
          email: inviterData.inviter?.email,
          relation: 'Seni davet etti'
        })
      }

      // 2. Get invited users (who I invited)
      const { data: invitedData } = await supabase
        .from('invitations')
        .select('used_by, user:used_by(hex_code, email)')
        .eq('inviter_id', user.id)
        .eq('status', 'used')
        .not('used_by', 'is', null)

      invitedData?.forEach(item => {
        if (item.used_by && !teamMembers.has(item.used_by)) {
          teamMembers.add(item.used_by)
          memberDetails.push({
            id: item.used_by,
            hex_code: item.user?.hex_code,
            email: item.user?.email,
            relation: 'Senin davetinle katıldı'
          })
        }
      })

      // 3. Get support transaction partners
      const { data: transactionsData } = await supabase
        .from('support_transactions')
        .select(`
          provider_id,
          receiver_id,
          provider:provider_id(hex_code, email),
          receiver:receiver_id(hex_code, email)
        `)
        .or(`provider_id.eq.${user.id},receiver_id.eq.${user.id}`)

      transactionsData?.forEach(tx => {
        const partnerId = tx.provider_id === user.id ? tx.receiver_id : tx.provider_id
        const partner = tx.provider_id === user.id ? tx.receiver : tx.provider
        
        if (partnerId && !teamMembers.has(partnerId)) {
          teamMembers.add(partnerId)
          memberDetails.push({
            id: partnerId,
            hex_code: partner?.hex_code,
            email: partner?.email,
            relation: 'Destek alışverişi yaptınız'
          })
        }
      })

      setTrustTeam(memberDetails)
    } catch (error) {
      console.error('Error fetching trust team:', error)
    } finally {
      setLoading(false)
    }
  }

  const generatePromoCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  const handleCreateInvite = async () => {
    if (!inviteEmail.trim()) {
      alert('Lütfen email girin')
      return
    }

    try {
      const promoCode = generatePromoCode()

      const { error } = await supabase
        .from('invitations')
        .insert({
          email: inviteEmail,
          inviter_id: user.id,
          type: inviteType,
          status: 'pending',
          promo_code: promoCode
        })

      if (error) throw error

      setGeneratedCode(promoCode)
      alert(`Kod oluşturuldu: ${promoCode}\n\nBu kodu ${inviteEmail} ile paylaşın.`)
      setInviteEmail('')
    } catch (error) {
      console.error('Error creating invite:', error)
      alert('Hata: ' + error.message)
    }
  }

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Güven Takımı</h1>
          <p className="text-gray-600">Ağını genişlet ve yönet</p>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex space-x-4">
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Davet Linki / Dahil Et
          </button>
        </div>

        {/* Trust Team List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        ) : trustTeam.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 mb-4">Henüz güven takımın oluşmadı</p>
            <p className="text-sm text-gray-400">Birini davet ederek başla!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trustTeam.map((member) => (
              <div key={member.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: member.hex_code || '#9CA3AF' }}
                  >
                    {member.hex_code?.slice(1, 4).toUpperCase() || '???'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{member.hex_code}</p>
                    <p className="text-xs text-gray-500">{member.email}</p>
                  </div>
                </div>
                <p className="text-sm text-indigo-600">{member.relation}</p>
              </div>
            ))}
          </div>
        )}

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Davet Oluştur</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="ornek@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Davet Tipi
                  </label>
                  <select
                    value={inviteType}
                    onChange={(e) => setInviteType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="discount_50">%50 İndirim</option>
                    <option value="prepaid">Dahil Et (Ücretsiz)</option>
                  </select>
                </div>

                {generatedCode && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800 mb-2">Kod oluşturuldu:</p>
                    <p className="text-2xl font-bold text-green-900">{generatedCode}</p>
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    onClick={handleCreateInvite}
                    className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Kod Oluştur
                  </button>
                  <button
                    onClick={() => {
                      setShowInviteModal(false)
                      setGeneratedCode('')
                      setInviteEmail('')
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Kapat
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

export default GuvenTakimi
