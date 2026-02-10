import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const Step8Dashboard = () => {
  const navigate = useNavigate()

  useEffect(() => {
    // Show welcome animation then redirect to main dashboard
    const timer = setTimeout(() => {
      navigate('/dashboard')
    }, 3000)

    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white/10 backdrop-blur-lg rounded-2xl p-12 shadow-2xl text-center">
        <div className="mb-8">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-5xl font-bold text-white mb-4">Hoş Geldiniz!</h1>
          <p className="text-2xl text-purple-200 mb-6">
            Zahmetsiz Deha Ekosistemine Katıldınız
          </p>
        </div>

        <div className="space-y-4 text-left bg-white/20 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <div className="text-2xl">✅</div>
            <div>
              <h3 className="text-white font-semibold">Maskeniz Hazır</h3>
              <p className="text-purple-200 text-sm">Frekansınızla tanınacaksınız</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="text-2xl">✅</div>
            <div>
              <h3 className="text-white font-semibold">Ruh Sorularınız Kaydedildi</h3>
              <p className="text-purple-200 text-sm">Zahmetsiz dehanız belirlendi</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="text-2xl">✅</div>
            <div>
              <h3 className="text-white font-semibold">Hediye Ekonomisine Hazırsınız</h3>
              <p className="text-purple-200 text-sm">Vermeye ve almaya başlayabilirsiniz</p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="text-purple-200 mt-4">Kontrol panelinize yönlendiriliyorsunuz...</p>
        </div>
      </div>
    </div>
  )
}

export default Step8Dashboard
