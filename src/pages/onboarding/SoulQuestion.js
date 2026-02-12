import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../contexts/AuthContext'

const questions = [
  {
    id: 1,
    question: "Kanıtlayacak hiçbir şeyiniz ve yapmak zorunda olduğunuz hiçbir şey olmasaydı; vaktinizi neyle meşgul etmekten en çok keyif alırdınız?",
    philosophy: "Bu soru, toplumsal beklentilerin ve hayatta kalma kaygısının ötesinde, özünüzde kim olduğunuzu keşfetmenizi sağlar. Gerçek tutkularınız nerede?",
    placeholder: "Örnek: Müzik yapardım, hikayeler yazardım, insanları dinlerdim..."
  },
  {
    id: 2,
    question: "Hangi konuda hile yapıyorsunuz? (Senin için oyun olan, başkası için iş olan şey nedir?)",
    philosophy: "Zahmetsiz Deha budur. Başkalarının saatlerce uğraştığı şeyi siz nefes alır gibi yapıyorsunuz. Bu sizin haksız avantajınız.",
    placeholder: "Örnek: İnsanları anlamak, karmaşık şeyleri basitleştirmek, tasarım yapmak..."
  },
  {
    id: 3,
    question: "Bu zahmetsiz dehanın başkalarının hangi sorununu çözer?",
    philosophy: "Hediyeniz sadece sizin için değil. Başkalarının hayatını nasıl kolaylaştırabilir? Değer burada ortaya çıkar.",
    placeholder: "Örnek: İnsanların kendilerini ifade etmelerine yardımcı olur, karmaşık projeleri organize eder..."
  },
  {
    id: 4,
    question: "Hangi görev enerjinizi tüketiyor? (Başkasının hediyesine ihtiyaç duyduğunuz alan nedir?)",
    philosophy: "Kimse her şeyde iyi olamaz. Sizin için zor olan, başkası için kolay olabilir. Denge yasası böyle işler.",
    placeholder: "Örnek: Teknik işler, detaylı planlama, sosyal medya yönetimi..."
  }
]

const SoulQuestion = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { step } = useParams()
  const questionIndex = parseInt(step) - 4 // step 4 = question 0
  const currentQuestion = questions[questionIndex]
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadExistingAnswer()
  }, [questionIndex])

  const loadExistingAnswer = async () => {
    if (!user) return

    const { data } = await supabase
      .from('onboarding_answers')
      .select('answer_text')
      .eq('user_id', user.id)
      .eq('question_id', currentQuestion.id)
      .single()

    if (data) {
      setAnswer(data.answer_text)
    }
  }

  const handleContinue = async () => {
    if (!answer.trim()) {
      alert('Lütfen soruyu cevaplayın')
      return
    }

    setLoading(true)
    try {
      // Save answer
      const { error } = await supabase
        .from('onboarding_answers')
        .upsert({
          user_id: user.id,
          question_id: currentQuestion.id,
          answer_text: answer,
        })

      if (error) throw error

      // Navigate to next step
      if (questionIndex < 3) {
        navigate(`/onboarding/step${parseInt(step) + 1}`)
      } else {
        // Last question, mark onboarding as complete
        await supabase
          .from('profiles')
          .update({ onboarding_completed: true })
          .eq('id', user.id)
        
        navigate('/onboarding/step8')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Hata oluştu: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    if (questionIndex > 0) {
      navigate(`/onboarding/step${parseInt(step) - 1}`)
    } else {
      navigate('/onboarding/step3')
    }
  }

  if (!currentQuestion) {
    return <div>Soru bulunamadı</div>
  }

  const progress = ((parseInt(step) - 3) / 5) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <div className="text-sm text-purple-200 mb-2">Adım {step}/8 - Ruh Sorusu {questionIndex + 1}/4</div>
            <div className="h-2 w-64 bg-white/20 rounded-full">
              <div 
                className="h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="bg-white/20 rounded-xl p-6 mb-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              {currentQuestion.question}
            </h2>
            <p className="text-purple-200 leading-relaxed">
              {currentQuestion.philosophy}
            </p>
          </div>

          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={currentQuestion.placeholder}
            className="w-full h-48 px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
          />
        </div>

        <div className="flex space-x-4">
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all"
          >
            ← Geri
          </button>
          <button
            onClick={handleContinue}
            disabled={loading || !answer.trim()}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
          >
            {loading ? 'Kaydediliyor...' : questionIndex < 3 ? 'Devam Et →' : 'Tamamla →'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default SoulQuestion
