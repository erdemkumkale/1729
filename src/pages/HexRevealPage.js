import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const HexRevealPage = () => {
  const navigate = useNavigate()
  const { profile, refreshHexCode, markHexAsSeen } = useAuth()
  const [loading, setLoading] = useState(false)
  const [currentHex, setCurrentHex] = useState(profile?.hex_code)

  const handleRefresh = async () => {
    setLoading(true)
    try {
      const newHex = await refreshHexCode()
      setCurrentHex(newHex)
    } catch (error) {
      alert('Hata: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async () => {
    setLoading(true)
    try {
      await markHexAsSeen()
      navigate('/payment')
    } catch (error) {
      alert('Hata: ' + error.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Main Card */}
        <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Senin Masken
            </h1>
            <p className="text-gray-600">
              Buradaki mottomuz takım olmak
            </p>
          </div>

          {/* Hex Color Display */}
          <div className="flex flex-col items-center mb-8">
            <div 
              className="w-48 h-48 rounded-2xl shadow-lg mb-6 flex items-center justify-center transform hover:scale-105 transition-transform duration-300"
              style={{ backgroundColor: currentHex || '#6366f1' }}
            >
              <span className="text-white text-5xl font-bold drop-shadow-lg">
                {currentHex?.slice(1, 4).toUpperCase() || '???'}
              </span>
            </div>
            
            <div className="bg-gray-100 px-6 py-3 rounded-lg border border-gray-300">
              <span className="text-gray-900 text-2xl font-mono font-bold">
                {currentHex || '#??????'}
              </span>
            </div>
          </div>

          {/* Philosophy Text */}
          <div className="bg-indigo-50 rounded-xl p-6 mb-8 border border-indigo-100">
            <p className="text-gray-700 leading-relaxed text-center">
              Din, dil, ırk, etnik köken, cinsiyet vb. her ötekileştirme sembolünden arınarak 
              birbirimize destek için buradayız. 
              <span className="text-indigo-600 font-semibold"> Bu renk senin buradaki adın.</span>
              <br /><br />
              Kabul ediyor musun?
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex-1 bg-white text-indigo-600 py-4 px-6 rounded-lg font-semibold hover:bg-gray-50 transition-all border-2 border-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '🔄 Yenileniyor...' : '🔄 Yenile / Başka Renk Seç'}
            </button>
            <button
              onClick={handleAccept}
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Kaydediliyor...' : '✓ Kabul Ediyorum ve Devam Et'}
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm">
            Zahmetsiz Deha - Takım Ekosistemi
          </p>
        </div>
      </div>
    </div>
  )
}

export default HexRevealPage
