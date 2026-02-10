import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../contexts/AuthContext'

const Step2Mask = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [hexCode, setHexCode] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    generateHexCode()
  }, [])

  const generateHexCode = async () => {
    // Generate random hex color
    const randomHex = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
    
    // Check if it exists
    const { data } = await supabase
      .from('profiles')
      .select('hex_code')
      .eq('hex_code', randomHex)
      .single()
    
    if (data) {
      // If exists, generate again
      generateHexCode()
    } else {
      setHexCode(randomHex)
    }
  }

  const handleContinue = async () => {
    if (!user) {
      alert('Kullanıcı bulunamadı. Lütfen tekrar giriş yapın.')
      navigate('/onboarding/step1')
      return
    }

    setLoading(true)
    try {
      const fullName = sessionStorage.getItem('onboarding_full_name')
      const email = sessionStorage.getItem('onboarding_email')

      // Create profile with hex code
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: email || user.email,
          full_name: fullName || 'Kullanıcı',
          hex_code: hexCode,
          onboarding_completed: false,
        })

      if (error) throw error

      navigate('/onboarding/step3')
    } catch (error) {
      console.error('Error:', error)
      alert('Hata oluştu: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <div className="text-sm text-purple-200 mb-2">Adım 2/8</div>
            <div className="h-2 w-64 bg-white/20 rounded-full">
              <div className="h-2 w-1/4 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Maskeniz</h1>
          <p className="text-purple-200 text-lg leading-relaxed">
            Burada bir unvan değilsiniz. Bir frekanssınız.<br/>
            Bu renk, gerçeğinizi güvenle ortaya koymanız için maskenizdir.
          </p>
        </div>

        <div className="flex flex-col items-center space-y-6">
          <div 
            className="w-48 h-48 rounded-full shadow-2xl flex items-center justify-center text-white text-2xl font-bold transition-all hover:scale-105"
            style={{ backgroundColor: hexCode }}
          >
            {hexCode}
          </div>

          <div className="text-center">
            <p className="text-white text-xl font-semibold mb-2">Sizin Frekansınız</p>
            <p className="text-purple-200">Bu renk artık sizin kimliğiniz</p>
          </div>

          <button
            onClick={generateHexCode}
            className="px-6 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all"
          >
            🎲 Yeni Renk Oluştur
          </button>

          <button
            onClick={handleContinue}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-lg font-semibold text-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 mt-8"
          >
            {loading ? 'Kaydediliyor...' : 'Bu Maskeyi Kabul Ediyorum →'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Step2Mask
