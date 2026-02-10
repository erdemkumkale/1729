import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'

const UserProfile = () => {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [answers, setAnswers] = useState({
    question1: '',
    question2: '',
    question3: '',
    question4: '',
  })
  const [myGifts, setMyGifts] = useState([])
  const [myCollaborations, setMyCollaborations] = useState([])
  const [loading, setLoading] = useState(true)
  const [profileData, setProfileData] = useState(null)

  useEffect(() => {
    console.log('UserProfile: useEffect triggered')
    console.log('UserProfile: user:', user)
    console.log('UserProfile: profile:', profile)
    
    // Add global error handler for unhandled promise rejections
    const handleUnhandledRejection = (event) => {
      if (event.reason && event.reason.name === 'AbortError') {
        console.log('UserProfile: Suppressing AbortError:', event.reason.message)
        event.preventDefault()
      }
    }
    
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    
    if (user) {
      // Always try to fetch profile data directly if we have a user
      fetchProfileData()
    }

    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('UserProfile: Timeout reached, stopping loading')
        setLoading(false)
      }
    }, 10000) // 10 second timeout

    return () => {
      clearTimeout(timeout)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [user])

  const fetchProfileData = async () => {
    if (!user) return
    
    console.log('UserProfile: Fetching profile data for user:', user.id)
    try {
      // Fetch profile directly with simple error handling
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('UserProfile: Error fetching profile:', profileError)
        if (profileError.code === 'PGRST116') {
          console.log('UserProfile: Profile not found, user needs to complete signup')
        }
        setLoading(false)
        return
      }

      console.log('UserProfile: Profile data fetched:', profileData)
      setProfileData(profileData)
      
      setAnswers(profileData.answers_json || {
        question1: '',
        question2: '',
        question3: '',
        question4: '',
      })

      // Fetch user's gifts and collaborations
      await fetchMyData()
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('UserProfile: Profile fetch was aborted (ignoring)')
      } else {
        console.error('UserProfile: Error in fetchProfileData:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchMyData = async () => {
    if (!user) return
    
    try {
      // Fetch my gifts with error handling
      try {
        const { data: giftsData, error: giftsError } = await supabase
          .from('gifts')
          .select('*')
          .eq('creator_id', user.id)
          .order('created_at', { ascending: false })

        if (giftsError) {
          console.error('Error fetching gifts:', giftsError)
        } else {
          setMyGifts(giftsData || [])
        }
      } catch (giftError) {
        if (giftError.name !== 'AbortError') {
          console.error('Error fetching gifts:', giftError)
        }
        setMyGifts([])
      }

      // Fetch my collaborations with error handling
      try {
        const { data: collaborationsData, error: collaborationsError } = await supabase
          .from('collaborations')
          .select(`
            *,
            gifts:gift_id (
              title,
              description
            ),
            giver:giver_id (
              real_name,
              hex_code,
              color
            ),
            receiver:receiver_id (
              real_name,
              hex_code,
              color
            )
          `)
          .or(`giver_id.eq.${user.id},receiver_id.eq.${user.id}`)

        if (collaborationsError) {
          console.error('Error fetching collaborations:', collaborationsError)
        } else {
          setMyCollaborations(collaborationsData || [])
        }
      } catch (collabError) {
        if (collabError.name !== 'AbortError') {
          console.error('Error fetching collaborations:', collabError)
        }
        setMyCollaborations([])
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  const questions = [
    "Kanıtlayacak hiçbir şeyiniz ve yapmak *zorunda* olduğunuz hiçbir şey olmasaydı, varlığınız neyle meşgul olurdu?",
    "Hangi konuda hile yapıyorsun? (Senin için oyun olan, başkası için iş olan şey nedir?)",
    "Bu zahmetsiz dehanın başkalarının hangi sorununu çözer?",
    "Hangi görev enerjinizi tüketiyor? (Başkasının hediyesine ihtiyaç duyduğun alan nedir?)"
  ]

  const handleSaveAnswers = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ answers_json: answers })
        .eq('id', user.id)

      if (error) throw error

      setIsEditing(false)
      alert('Profiliniz güncellendi!')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Profil güncellenirken hata oluştu.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Profil yükleniyor...</p>
        </div>
      </div>
    )
  }

  // If user exists but no profile data could be loaded
  if (user && !profileData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Profil Bulunamadı</h2>
          <p className="text-gray-600 mb-4">Profiliniz henüz oluşturulmamış veya yüklenemedi.</p>
          <div className="space-x-4">
            <button 
              onClick={() => navigate('/auth')}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Kayıt Sayfasına Dön
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
            >
              Sayfayı Yenile
            </button>
          </div>
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
                ← Back to Dashboard
              </button>
              <h1 className="text-xl font-bold text-gray-900">Profilim</h1>
            </div>
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: profileData?.color || '#4A90E2' }}
                >
                  {profileData?.hex_code ? profileData.hex_code.slice(1, 4).toUpperCase() : '#4A9'}
                </div>
                <span className="text-sm text-gray-700">{profileData?.hex_code || '#4A90E2'}</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-6 lg:px-8">
          
          {/* Profile Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold mr-6"
                  style={{ backgroundColor: profileData?.color || '#4A90E2' }}
                >
                  {profileData?.hex_code ? profileData.hex_code.slice(1, 4).toUpperCase() : '#4A9'}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{profileData?.hex_code || '#4A90E2'}</h2>
                  <p className="text-gray-600">Anonim Kimliğiniz</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 font-medium"
              >
                {isEditing ? 'İptal' : 'Profili Düzenle'}
              </button>
            </div>

            {/* The 4 Soul Questions */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Zahmetsiz Deha Keşfi</h3>
              {questions.map((question, index) => (
                <div key={index}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {index + 1}. {question}
                  </label>
                  {isEditing ? (
                    <textarea
                      value={answers[`question${index + 1}`]}
                      onChange={(e) => setAnswers({
                        ...answers,
                        [`question${index + 1}`]: e.target.value
                      })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      rows="3"
                    />
                  ) : (
                    <p className="text-gray-600 bg-gray-50 p-3 rounded-md">
                      {answers[`question${index + 1}`]}
                    </p>
                  )}
                </div>
              ))}
              
              {isEditing && (
                <div className="flex space-x-3">
                  <button
                    onClick={handleSaveAnswers}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-medium"
                  >
                    Değişiklikleri Kaydet
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 font-medium"
                  >
                    İptal
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* My Projects */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">🎁 Hediyelerim</h3>
              <div className="space-y-4">
                {myGifts.map((gift) => (
                  <div key={gift.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{gift.title}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        gift.status === 'Available' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {gift.status === 'Available' ? 'Mevcut' : gift.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{gift.description}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{new Date(gift.created_at).toLocaleDateString()}</span>
                    </div>
                    <button 
                      onClick={() => navigate(`/gift/${gift.id}`)}
                      className="mt-2 text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                    >
                      Hediyeyi Görüntüle →
                    </button>
                  </div>
                ))}
                {myGifts.length === 0 && (
                  <p className="text-gray-500 text-center py-4">Henüz hediye paylaşmadınız.</p>
                )}
              </div>
            </div>

            {/* My Teams */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">🤝 İşbirliklerim</h3>
              <div className="space-y-4">
                {myCollaborations.map((collaboration) => (
                  <div key={collaboration.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{collaboration.gifts.title}</h4>
                        <p className="text-sm text-gray-600">
                          {collaboration.giver_id === user.id ? 'Hediye Veriyorsunuz' : 'Hediye Alıyorsunuz'}
                        </p>
                      </div>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Aktif
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">İşbirlikçi:</p>
                      <div className="flex items-center text-sm">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2"
                          style={{ 
                            backgroundColor: collaboration.giver_id === user.id 
                              ? collaboration.receiver.color 
                              : collaboration.giver.color 
                          }}
                        >
                          {(collaboration.giver_id === user.id 
                            ? collaboration.receiver.hex_code 
                            : collaboration.giver.hex_code
                          ).slice(1, 3).toUpperCase()}
                        </div>
                        <span className="text-gray-900">
                          {collaboration.giver_id === user.id 
                            ? collaboration.receiver.real_name 
                            : collaboration.giver.real_name}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {myCollaborations.length === 0 && (
                  <p className="text-gray-500 text-center py-4">Henüz aktif işbirliğiniz yok.</p>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}

export default UserProfile