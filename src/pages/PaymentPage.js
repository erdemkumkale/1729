import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'

const PaymentPage = () => {
  const navigate = useNavigate()
  const { user, profile, refreshProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)
  const [promoError, setPromoError] = useState('')
  const [discount, setDiscount] = useState(0)
  const [inviterHex, setInviterHex] = useState('')
  const [promoType, setPromoType] = useState('')

  const basePrice = 10
  const finalPrice = promoType === 'prepaid' ? 0 : basePrice * (1 - discount / 100)

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      setPromoError('Lütfen bir kod girin')
      return
    }

    setLoading(true)
    setPromoError('')

    try {
      console.log('🎟️ Checking promo code:', promoCode)

      // Check invitations table for matching promo_code (without join)
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('promo_code', promoCode.toUpperCase())
        .eq('status', 'pending')
        .maybeSingle()

      if (error) {
        console.error('❌ Database error:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        setPromoError(`Veritabanı hatası: ${error.message}`)
        setLoading(false)
        return
      }

      console.log('📊 Query result:', data)

      if (!data) {
        console.log('❌ No matching promo code found')
        setPromoError('Geçersiz kod')
        setLoading(false)
        return
      }

      console.log('✅ Valid promo code found:', data)

      // Check if type column exists and has value
      if (!data.type) {
        console.error('❌ Promo code missing type field')
        setPromoError('Kod yapılandırması hatalı (type eksik)')
        setLoading(false)
        return
      }

      // If prepaid, fetch inviter's hex code separately
      let inviterHexCode = '#??????'
      if (data.type === 'prepaid' && data.inviter_id) {
        const { data: inviterData } = await supabase
          .from('profiles')
          .select('hex_code')
          .eq('id', data.inviter_id)
          .single()
        
        if (inviterData?.hex_code) {
          inviterHexCode = inviterData.hex_code
        }
      }

      // Apply discount based on type
      if (data.type === 'discount_50') {
        setDiscount(50)
        setPromoType('discount_50')
        setPromoApplied(true)
        console.log('✅ Applied 50% discount')
      } else if (data.type === 'prepaid') {
        setDiscount(100)
        setPromoType('prepaid')
        setInviterHex(inviterHexCode)
        setPromoApplied(true)
        console.log('✅ Applied prepaid (free)')
      } else {
        console.error('❌ Unknown promo type:', data.type)
        setPromoError('Geçersiz kod tipi')
        setLoading(false)
        return
      }

      // Mark invitation as used
      const { error: updateError } = await supabase
        .from('invitations')
        .update({ 
          status: 'used',
          used_by: user.id,
          used_at: new Date().toISOString()
        })
        .eq('promo_code', promoCode.toUpperCase())

      if (updateError) {
        console.error('⚠️ Warning: Could not mark invitation as used:', updateError)
        // Don't fail - discount is already applied
      }

      console.log('✅ Promo code applied successfully')

    } catch (error) {
      console.error('❌ Unexpected error:', error)
      console.error('Error stack:', error.stack)
      setPromoError(`Beklenmeyen hata: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCompletePayment = async () => {
    if (!user) {
      alert('Kullanıcı bulunamadı. Lütfen tekrar giriş yapın.')
      navigate('/login')
      return
    }

    setLoading(true)
    
    try {
      console.log('💳 Processing payment for user:', user.id)
      
      // Update payment_status in profiles table
      const { error } = await supabase
        .from('profiles')
        .update({ 
          payment_status: 'paid',
          payment_tier: promoType || 'standard',
          payment_amount: finalPrice
        })
        .eq('id', user.id)

      if (error) {
        console.error('❌ Payment update error:', error)
        throw error
      }

      console.log('✅ Payment status updated successfully')
      
      // Refresh profile to get updated payment_status
      await refreshProfile()
      
      // Wait a moment for state to update
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Redirect to onboarding
      console.log('➡️ Redirecting to onboarding...')
      navigate('/onboarding')
      
    } catch (error) {
      console.error('❌ Error completing payment:', error)
      alert('Ödeme işlenirken hata oluştu: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Main Card */}
        <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Abonelik</h1>
            <p className="text-gray-600 text-sm leading-relaxed">
              Takımlaşma ekosistemine giriş için ilk filtremiz, ekosistemin sürdürülebilirliğini sağlamak adına abonelik ücreti.
            </p>
          </div>

          {/* Price Display */}
          <div className="bg-indigo-50 rounded-xl p-6 mb-6 text-center">
            {promoApplied && discount > 0 && (
              <div className="text-gray-500 line-through text-2xl mb-2">
                ${basePrice} / Ay
              </div>
            )}
            <div className="text-5xl font-bold text-indigo-600 mb-2">
              ${finalPrice}
              {finalPrice > 0 && <span className="text-2xl text-gray-600"> / Ay</span>}
            </div>
            
            {promoType === 'prepaid' && (
              <div className="mt-4 bg-green-100 border border-green-300 rounded-lg p-3">
                <p className="text-green-800 text-sm font-medium">
                  {inviterHex} sizi dahil etti.
                </p>
              </div>
            )}
            
            {promoType === 'discount_50' && (
              <div className="mt-4 bg-blue-100 border border-blue-300 rounded-lg p-3">
                <p className="text-blue-800 text-sm font-medium">
                  %50 indirim uygulandı!
                </p>
              </div>
            )}
          </div>

          {/* Promo Code Input */}
          {!promoApplied && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Davet veya Dahil Etme Kodu
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => {
                    setPromoCode(e.target.value.toUpperCase())
                    setPromoError('')
                  }}
                  placeholder="XXXXXX"
                  maxLength={6}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                />
                <button
                  onClick={handleApplyPromo}
                  disabled={loading || !promoCode.trim()}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Uygula
                </button>
              </div>
              {promoError && (
                <p className="mt-2 text-sm text-red-600">{promoError}</p>
              )}
            </div>
          )}

          {/* Complete Payment Button */}
          <button
            onClick={handleCompletePayment}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                İşleniyor...
              </span>
            ) : (
              `Ödemeyi Tamamla ${finalPrice > 0 ? `($${finalPrice})` : '(Ücretsiz)'} →`
            )}
          </button>

          <p className="text-center text-gray-500 text-xs mt-4">
            * Şu an test modu - gerçek ödeme alınmıyor
          </p>
        </div>

        {/* User Info */}
        <div className="mt-4 text-center">
          <div className="inline-flex items-center space-x-2 bg-white rounded-lg px-4 py-2 shadow-sm border border-gray-200">
            <div 
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: profile?.hex_code || '#9CA3AF' }}
            >
              {profile?.hex_code ? profile.hex_code.slice(1, 4).toUpperCase() : '...'}
            </div>
            <span className="text-sm text-gray-600">{profile?.email}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentPage
