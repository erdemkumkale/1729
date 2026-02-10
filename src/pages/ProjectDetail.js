import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'

const ProjectDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [showProposalForm, setShowProposalForm] = useState(false)
  const [proposalText, setProposalText] = useState('')
  const [gift, setGift] = useState(null)
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState([])

  useEffect(() => {
    fetchGift()
    fetchRequests()
  }, [id])

  const fetchGift = async () => {
    try {
      const { data, error } = await supabase
        .from('gifts')
        .select(`
          *,
          profiles:creator_id (
            hex_code,
            color,
            real_name,
            answers_json
          )
        `)
        .eq('id', id)
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

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('requests')
        .select(`
          *,
          profiles:requester_id (
            hex_code,
            color,
            real_name
          )
        `)
        .eq('gift_id', id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching requests:', error)
        return
      }
      
      setRequests(data || [])
    } catch (error) {
      console.error('Error fetching requests:', error)
    }
  }

  const handleSubmitProposal = async (e) => {
    e.preventDefault()
    if (!proposalText.trim()) return
    
    try {
      const { error } = await supabase
        .from('requests')
        .insert([
          {
            gift_id: id,
            requester_id: user.id,
            request_message: proposalText,
            status: 'Pending'
          }
        ])

      if (error) throw error

      setProposalText('')
      setShowProposalForm(false)
      fetchRequests() // Refresh requests
      alert('Talebiniz gönderildi! Hediye sahibi size geri dönecek.')
    } catch (error) {
      console.error('Error creating request:', error)
      alert('Talep gönderilirken hata oluştu. Lütfen tekrar deneyin.')
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
                onClick={() => navigate('/dashboard')}
                className="text-indigo-600 hover:text-indigo-500 mr-4"
              >
                ← Hediye Pazarına Dön
              </button>
              <h1 className="text-xl font-bold text-gray-900">Hediye Detayları</h1>
            </div>
            <div className="flex items-center">
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

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-6 lg:px-8">
          
          {/* Gift Info */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-3">{gift.title}</h1>
                <p className="text-gray-600 mb-4">{gift.description}</p>
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    {gift.status === 'Available' ? 'Mevcut' : gift.status}
                  </span>
                  <span className="text-sm text-gray-500">
                    Oluşturuldu {new Date(gift.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Request Help Section */}
            {gift.creator_id !== user?.id && (
              <>
                {!showProposalForm ? (
                  <button
                    onClick={() => setShowProposalForm(true)}
                    className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 transition-colors font-medium"
                  >
                    Bu Hediyeyi Talep Et
                  </button>
                ) : (
                  <form onSubmit={handleSubmitProposal} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bu hediyeyi neden istiyorsun? Nasıl kullanacaksın?
                      </label>
                      <textarea
                        value={proposalText}
                        onChange={(e) => setProposalText(e.target.value)}
                        placeholder="Bu hediyenin senin için nasıl faydalı olacağını açıkla..."
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        rows="4"
                        required
                      />
                    </div>
                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors font-medium"
                      >
                        Talebi Gönder
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowProposalForm(false)}
                        className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors font-medium"
                      >
                        İptal
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}

            {gift.creator_id === user?.id && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  Bu senin hediyendir. Gelen talepleri bekle ve uygun olanları kabul et.
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Gift Creator */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Hediye Sahibi</h2>
              <div className="flex items-center mb-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4"
                  style={{ backgroundColor: gift.profiles?.color }}
                >
                  {gift.profiles?.hex_code?.slice(1, 4).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{gift.profiles?.hex_code}</h3>
                  <p className="text-sm text-gray-500">Anonim Kimlik</p>
                </div>
              </div>
              
              {gift.profiles?.answers_json && (
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Meşgul olduğu şey:</h4>
                    <p className="text-sm text-gray-600">{gift.profiles.answers_json.question1}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Haksız avantajı:</h4>
                    <p className="text-sm text-gray-600">{gift.profiles.answers_json.question2}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">İhtiyaç duyduğu destek:</h4>
                    <p className="text-sm text-gray-600">{gift.profiles.answers_json.question3}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Devretmek istediği:</h4>
                    <p className="text-sm text-gray-600">{gift.profiles.answers_json.question4}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Requests */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Gelen Talepler ({requests.length})</h2>
              <div className="space-y-3">
                {requests.length > 0 ? (
                  requests.map((request) => (
                    <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3"
                            style={{ backgroundColor: request.profiles?.color }}
                          >
                            {request.profiles?.hex_code?.slice(1, 3).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{request.profiles?.hex_code}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(request.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          request.status === 'Pending' 
                            ? 'bg-yellow-100 text-yellow-800'
                            : request.status === 'Accepted'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {request.status === 'Pending' ? 'Bekliyor' : 
                           request.status === 'Accepted' ? 'Kabul Edildi' : 'Reddedildi'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{request.request_message}</p>
                      
                      {gift.creator_id === user?.id && request.status === 'Pending' && (
                        <div className="flex space-x-2 mt-3">
                          <button className="flex-1 bg-green-600 text-white py-1 px-3 rounded text-xs hover:bg-green-700">
                            Kabul Et
                          </button>
                          <button className="flex-1 bg-red-600 text-white py-1 px-3 rounded text-xs hover:bg-red-700">
                            Reddet
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Henüz talep yok
                  </p>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}

export default ProjectDetail