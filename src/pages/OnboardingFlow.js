import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'

const questions_OLD = [
import { ONBOARDING_QUESTIONS } from '../constants/content'
  {
    index: 1,
    question: "Kanıtlayacak hiçbir şeyiniz ve yapmak *zorunda* olduğunuz hiçbir şey olmasaydı, varlığınız neyle meşgul olurdu?",
    philosophy: "Bu soru, toplumsal beklentilerin ve hayatta kalma kaygısının ötesinde, özünüzde kim olduğunuzu keşfetmenizi sağlar.",
    placeholder: "Örn: Müzik yapardım, hikayeler yazardım..."
  },
  {
    index: 2,
    question: "Hangi konuda hile yapıyorsunuz? (Senin için oyun olan, başkası için iş olan şey nedir?)",
    philosophy: "Zahmetsiz Deha budur. Başkalarının saatlerce uğraştığı şeyi siz nefes alır gibi yapıyorsunuz.",
    placeholder: "Örn: İnsanları anlamak, tasarım yapmak..."
  },
  {
    index: 3,
    question: "Hangi görev enerjinizi tüketiyor? (Başkasının hediyesine ihtiyaç duyduğunuz alan nedir?)",
    philosophy: "Kimse her şeyde iyi olamaz. Sizin için zor olan, başkası için kolay olabilir.",
    placeholder: "Örn: Teknik işler, detaylı planlama..."
  },
  {
    index: 4,
    question: "Takımlaşma adına eforsuzca verebileceğin dehan nedir?",
    philosophy: "Bu zahmetsiz dehanın başkalarının hangi sorununu çözer? Hediyeniz sadece sizin için değil.",
    placeholder: "Örn: İnsanların kendilerini ifade etmelerine yardımcı olur...",
    hasCheckbox: true
  }
]

const OnboardingFlow = () => {
  const navigate = useNavigate()
  const { user, profile, refreshProfile } = useAuth()
  const [step, setStep] = useState(1) // 1-4 = questions (no payment here)
  const [answers, setAnswers] = useState({})
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [createGiftCard, setCreateGiftCard] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Debug: Log when component mounts
  React.useEffect(() => {
    console.log('📋 OnboardingFlow mounted:', {
      userId: user?.id,
      currentStep: step,
      profileStatus: profile
    })
  }, [user, step, profile])

  const handleQuestionSubmit = async () => {
    if (!currentAnswer.trim()) {
      alert('Lütfen soruyu cevaplayın')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const questionIndex = step // step 1 = question 1
      const shouldCreateCard = questionIndex === 4 ? createGiftCard : false
      
      console.log(`💾 Saving answer for question ${questionIndex}...`)
      console.log('User ID:', user?.id)
      console.log('Answer text:', currentAnswer.substring(0, 50) + '...')
      console.log('Create gift card:', shouldCreateCard)

      // Save answer with create_gift_card flag
      const { data, error: insertError } = await supabase
        .from('onboarding_answers')
        .upsert({
          user_id: user.id,
          question_index: questionIndex,
          answer_text: currentAnswer,
          create_gift_card: shouldCreateCard
        }, {
          onConflict: 'user_id,question_index'
        })
        .select()

      if (insertError) {
        console.error('❌ Database error:', insertError)
        console.error('Error code:', insertError.code)
        console.error('Error message:', insertError.message)
        console.error('Error details:', insertError.details)
        
        // Show user-friendly error
        setError(`Veritabanı hatası: ${insertError.message}`)
        alert(`Hata oluştu: ${insertError.message}\n\nLütfen Supabase'de fix-onboarding-table.sql dosyasını çalıştırdığınızdan emin olun.`)
        setLoading(false)
        return
      }

      console.log(`✅ Answer ${questionIndex} saved successfully:`, data)

      // If Question 4 and checkbox is checked, create gift card
      if (questionIndex === 4 && shouldCreateCard) {
        console.log('🎁 Creating gift card from answer...')
        await createGiftCardFromAnswer(currentAnswer)
      }

      // Save to local state
      const newAnswers = { ...answers, [questionIndex]: currentAnswer }
      setAnswers(newAnswers)
      
      // Check if this is the last question
      if (step >= 4) {
        console.log('🎉 All questions answered! Completing onboarding...')
        await completeOnboarding()
      } else {
        // Move to next question
        console.log(`➡️ Moving from question ${step} to ${step + 1}`)
        setCurrentAnswer('') // Clear input for next question
        setCreateGiftCard(false) // Reset checkbox
        setStep(prevStep => prevStep + 1) // Use functional update to ensure state changes
        setLoading(false)
      }
      
    } catch (error) {
      console.error('❌ Unexpected error in handleQuestionSubmit:', error)
      setError(error.message)
      alert('Beklenmeyen hata: ' + error.message)
      setLoading(false)
    }
  }

  const createGiftCardFromAnswer = async (answerText) => {
    try {
      // Extract first 5 words for title
      const words = answerText.trim().split(/\s+/)
      const title = words.slice(0, 5).join(' ')
      
      console.log('Creating gift card:', { title, description: answerText })

      const { error: giftError } = await supabase
        .from('gifts')
        .insert({
          creator_id: user.id,
          title: title,
          description: answerText,
          visibility: 'global',
          status: 'active',
          is_active: true
        })

      if (giftError) {
        console.error('❌ Error creating gift card:', giftError)
        // Don't block onboarding if gift creation fails
        alert('Cevap kaydedildi ama destek kartı oluşturulamadı: ' + giftError.message)
      } else {
        console.log('✅ Gift card created successfully')
      }
    } catch (error) {
      console.error('❌ Error in createGiftCardFromAnswer:', error)
    }
  }

  const completeOnboarding = async () => {
    setLoading(true)
    try {
      console.log('📝 Marking onboarding as completed...')
      
      // Mark onboarding as completed
      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id)

      if (error) {
        console.error('❌ Error updating profile:', error)
        throw error
      }

      console.log('✅ Onboarding completed successfully')
      
      // Refresh profile to get updated status
      await refreshProfile()
      
      // Wait a moment for state to update
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Redirect to dashboard
      console.log('🎯 Redirecting to dashboard...')
      navigate('/dashboard')
      
    } catch (error) {
      console.error('❌ Error completing onboarding:', error)
      alert('Hata: ' + error.message)
      setLoading(false)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setCurrentAnswer('') // Clear current answer
      setCreateGiftCard(false) // Reset checkbox
      setStep(step - 1)
    }
  }

  // Questions only (no payment step)
  const currentQuestion = ONBOARDING_QUESTIONS[step - 1]
  const progress = (step / 4) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <div className="text-sm text-purple-200 mb-2">
              Ruh Sorusu {step}/4
            </div>
            <div className="h-2 w-64 bg-white/20 rounded-full">
              <div 
                className="h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          {error && (
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6">
              <p className="text-red-200 text-sm">
                ⚠️ {error}
              </p>
              <p className="text-red-300 text-xs mt-2">
                Tarayıcı konsolunu (F12) açın ve hata detaylarını kontrol edin.
              </p>
            </div>
          )}

          <div className="bg-white/20 rounded-xl p-6 mb-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              {currentQuestion.question}
            </h2>
            <p className="text-purple-200 leading-relaxed">
              {currentQuestion.philosophy}
            </p>
          </div>

          <textarea
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            placeholder={currentQuestion.placeholder}
            className="w-full h-48 px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
          />

          {/* Checkbox for Question 4 */}
          {currentQuestion.hasCheckbox && (
            <div className="mt-4 flex items-start space-x-3 bg-white/10 rounded-lg p-4">
              <input
                type="checkbox"
                id="create-gift-card"
                checked={createGiftCard}
                onChange={(e) => setCreateGiftCard(e.target.checked)}
                className="mt-1 h-5 w-5 text-purple-600 focus:ring-purple-500 border-white/30 rounded"
              />
              <label htmlFor="create-gift-card" className="text-white text-sm cursor-pointer">
                Bu becerim için verilecek bir kart oluştur
              </label>
            </div>
          )}
        </div>

        <div className="flex space-x-4">
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all"
          >
            ← Geri
          </button>
          <button
            onClick={handleQuestionSubmit}
            disabled={loading || !currentAnswer.trim()}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
          >
            {loading ? 'Kaydediliyor...' : step < 4 ? 'Devam Et →' : 'Tamamla →'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default OnboardingFlow
