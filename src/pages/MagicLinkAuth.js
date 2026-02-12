import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

const MagicLinkAuth = () => {
  const { signInWithMagicLink } = useAuth()
  const [email, setEmail] = useState('')
  const [promoCode, setPromoCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signInWithMagicLink(email, promoCode || null)
      setSent(true)
    } catch (err) {
      console.error('❌ Magic link error:', err)
      setError(err.message || 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">E-postanızı Kontrol Edin</h2>
            <p className="text-purple-200">
              <span className="font-medium">{email}</span> adresine giriş bağlantısı gönderdik.
            </p>
          </div>
          
          <div className="bg-white/10 rounded-lg p-4 mb-6">
            <p className="text-sm text-purple-200 mb-2">
              📧 E-postanızdaki bağlantıya tıklayarak sisteme giriş yapabilirsiniz.
            </p>
            <p className="text-xs text-purple-300">
              Bağlantı 1 saat geçerlidir.
            </p>
          </div>

          <button
            onClick={() => {
              setSent(false)
              setEmail('')
            }}
            className="text-purple-200 hover:text-white text-sm"
          >
            ← Farklı e-posta ile dene
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Hoş Geldiniz</h1>
          <p className="text-purple-200">Şifresiz giriş yapın</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              E-posta Adresiniz
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
              Referans Kodu (İsteğe Bağlı)
            </label>
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="Örn: SAVE50"
              maxLength={6}
            />
            <p className="text-purple-300 text-xs mt-1">
              Bir referans kodunuz varsa buraya girin
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
          >
            {loading ? 'Gönderiliyor...' : 'Giriş Bağlantısı Gönder'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-purple-200 text-sm">
            E-postanıza gönderilecek bağlantı ile tek tıkla giriş yapabilirsiniz.
          </p>
          <p className="text-purple-300 text-xs mt-2">
            Şifre gerektirmez, güvenli ve hızlıdır.
          </p>
        </div>
      </div>
    </div>
  )
}

export default MagicLinkAuth
