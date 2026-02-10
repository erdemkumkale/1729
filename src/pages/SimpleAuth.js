import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const SimpleAuth = () => {
  const navigate = useNavigate()
  const { signUp, signIn } = useAuth()
  const [isLogin, setIsLogin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        // Login
        console.log('🔐 Attempting login...')
        await signIn(email, password)
        console.log('✅ Login successful, waiting for profile...')
        
        // Give profile time to load
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Redirect to root - GateKeeper will determine destination
        navigate('/')
      } else {
        // Sign up
        console.log('📝 Attempting signup...')
        await signUp(email, password)
        console.log('✅ Signup successful, waiting for profile...')
        
        // Give profile time to be created
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // Redirect to root - GateKeeper will determine destination
        navigate('/')
      }
    } catch (err) {
      console.error('❌ Auth error:', err)
      setError(err.message || 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Bize Nasıl Yardımcı Olabilirsin?</h1>
          <p className="text-purple-200">Takımlaşma Ekosistemi</p>
        </div>

        <div className="mb-6">
          <div className="flex bg-white/20 rounded-lg p-1">
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 rounded-md transition-all ${
                !isLogin ? 'bg-white text-purple-900 font-semibold' : 'text-white'
              }`}
            >
              Kayıt Ol
            </button>
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 rounded-md transition-all ${
                isLogin ? 'bg-white text-purple-900 font-semibold' : 'text-white'
              }`}
            >
              Giriş Yap
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Tam Adınız
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="Adınız Soyadınız"
              />
            </div>
          )}

          <div>
            <label className="block text-white text-sm font-medium mb-2">
              E-posta
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="ornek@email.com"
            />
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Şifre
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
          >
            {loading ? 'İşleniyor...' : isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
          </button>
        </form>

        <div className="mt-6 text-center text-purple-200 text-sm">
          <p>Gerçek senden eforsuz nasıl bir destek alabiliriz?</p>
        </div>
      </div>
    </div>
  )
}

export default SimpleAuth
