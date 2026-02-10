import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../contexts/AuthContext'

const Step3Payment = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [selectedTier, setSelectedTier] = useState(null)
  const [loading, setLoading] = useState(false)
  const [inviteCode, setInviteCode] = useState(null)
  const [isPrepaid, setIsPrepaid] = useState(false)

  useEffect(() => {
    checkPaymentStatus()
  }, [user])

  const checkPaymentStatus = async () => {
    if (!user) return

    // Check for invite code in URL
    const refCode = searchParams.get('ref')
    if (refCode) {
      const { data } = await supabase
        .from('invitations')
        .select('*')
        .eq('code', refCode)
        .eq('status', 'pending')
        .single()
      
      if (data) {
        setInviteCode(data)
        setSelectedTier('invited')
      }
    }

    // Check if email is in prepaid list
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single()

    if (profile) {
      const { data: prepaid } = await supabase
        .from('prepaid_list')
        .select('*')
        .eq('email', profile.email)
        .eq('used', false)
        .single()
      
      if (prepaid) {
        setIsPrepaid(true)
        setSelectedTier('included')
      }
    }

    if (!refCode && !isPrepaid) {
      setSelectedTier('standard')
    }
  }

  const tiers = [
    {
      id: 'standard',
      name: 'Standart',
      price: '$10',
      discount: 0,
      description: 'Tam fiyat',
      available: true,
    },
    {
      id: 'invited',
      name: 'Davetli',
      price: '$5',
      discount: 50,
      description: 'Davet kodu ile %50 indirim',
      available: !!inviteCode,
    },
    {
      id: 'included',
      name: 'Dahil Edilmiş',
      price: 'ÜCRETSİZ',
      discount: 100,
      description: 'Bir moderatör tarafından ön ödemeli',
      available: isPrepaid,
    },
  ]

  const handlePayment = async () => {
    if (!user || !selectedTier) return

    setLoading(true)
    try {
      // Update profile with payment status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          payment_status: 'paid',
          payment_tier: selectedTier,
        })
        .eq('id', user.id)

      if (profileError) throw profileError

      // If invited, mark invitation as used
      if (selectedTier === 'invited' && inviteCode) {
        await supabase
          .from('invitations')
          .update({
            status: 'used',
            used_by_id: user.id,
            used_at: new Date().toISOString(),
          })
          .eq('id', inviteCode.id)
      }

      // If prepaid, mark as used
      if (selectedTier === 'included') {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', user.id)
          .single()

        await supabase
          .from('prepaid_list')
          .update({ used: true })
          .eq('email', profile.email)
      }

      navigate('/onboarding/step4')
    } catch (error) {
      console.error('Error:', error)
      alert('Hata oluştu: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <div className="text-sm text-purple-200 mb-2">Adım 3/8</div>
            <div className="h-2 w-64 bg-white/20 rounded-full">
              <div className="h-2 w-3/8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Geçiş Ücreti</h1>
          <p className="text-purple-200 text-lg">
            Hediye ekonomisine katılım için sembolik bir katkı
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={`relative p-6 rounded-xl transition-all cursor-pointer ${
                tier.available
                  ? selectedTier === tier.id
                    ? 'bg-white/30 ring-4 ring-purple-400 scale-105'
                    : 'bg-white/10 hover:bg-white/20'
                  : 'bg-white/5 opacity-50 cursor-not-allowed'
              }`}
              onClick={() => tier.available && setSelectedTier(tier.id)}
            >
              {tier.discount > 0 && tier.available && (
                <div className="absolute -top-3 -right-3 bg-gradient-to-r from-green-400 to-emerald-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  %{tier.discount} İndirim
                </div>
              )}
              
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
                <div className="text-4xl font-bold text-purple-200 mb-4">{tier.price}</div>
                <p className="text-purple-300 text-sm">{tier.description}</p>
                
                {!tier.available && (
                  <div className="mt-4 text-red-300 text-sm">
                    Kullanılamaz
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {inviteCode && (
          <div className="bg-green-500/20 border border-green-400 rounded-lg p-4 mb-6">
            <p className="text-green-200 text-center">
              🎉 Davet kodunuz geçerli! %50 indirim uygulandı.
            </p>
          </div>
        )}

        {isPrepaid && (
          <div className="bg-blue-500/20 border border-blue-400 rounded-lg p-4 mb-6">
            <p className="text-blue-200 text-center">
              ✨ Bir moderatör sizin için ödeme yaptı! Ücretsiz katılım hakkınız var.
            </p>
          </div>
        )}

        <button
          onClick={handlePayment}
          disabled={loading || !selectedTier}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-lg font-semibold text-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
        >
          {loading ? 'İşleniyor...' : 'Ödemeyi Tamamla →'}
        </button>

        <p className="text-center text-purple-300 text-sm mt-4">
          * Şu an için simülasyon modu. Gerçek ödeme entegrasyonu yakında.
        </p>
      </div>
    </div>
  )
}

export default Step3Payment
