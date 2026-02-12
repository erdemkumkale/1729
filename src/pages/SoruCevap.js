import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import DashboardLayout from '../components/DashboardLayout'

const questions = [
  {
    index: 1,
    question: "Kanıtlayacak hiçbir şeyiniz ve yapmak zorunda olduğunuz hiçbir şey olmasaydı; vaktinizi neyle meşgul etmekten en çok keyif alırdınız?"
  },
  {
    index: 2,
    question: "Hangi konuda hile yapıyorsunuz? (Senin için oyun olan, başkası için iş olan şey nedir?)"
  },
  {
    index: 3,
    question: "Hangi görev enerjinizi tüketiyor? (Başkasının hediyesine ihtiyaç duyduğunuz alan nedir?)"
  },
  {
    index: 4,
    question: "Takımlaşma adına eforsuzca verebileceğin dehan nedir?",
    hasCheckbox: true
  }
]

const SoruCevap = () => {
  const { user } = useAuth()
  const [answers, setAnswers] = useState({})
  const [createGiftCard, setCreateGiftCard] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchAnswers = useCallback(async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('onboarding_answers')
        .select('*')
        .eq('user_id', user.id)

      if (error) throw error

      const answersMap = {}
      data?.forEach(item => {
        answersMap[item.question_index] = {
          text: item.answer_text,
          createCard: item.create_gift_card || false
        }
      })
      
      setAnswers(answersMap)
      setCreateGiftCard(answersMap[4]?.createCard || false)
    } catch (error) {
      console.error('Error fetching answers:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchAnswers()
    }
  }, [user, fetchAnswers])

  const handleSave = async (questionIndex) => {
    setSaving(true)
    try {
      const answerText = answers[questionIndex]?.text || ''
      const shouldCreateCard = questionIndex === 4 ? createGiftCard : false

      // Save answer
      const { error } = await supabase
        .from('onboarding_answers')
        .upsert({
          user_id: user.id,
          question_index: questionIndex,
          answer_text: answerText,
          create_gift_card: shouldCreateCard
        }, {
          onConflict: 'user_id,question_index'
        })

      if (error) throw error

      // If Question 4 and checkbox is checked, create gift card
      if (questionIndex === 4 && shouldCreateCard && answerText) {
        const title = answerText.split(' ').slice(0, 5).join(' ')
        
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
          console.error('Error creating gift:', giftError)
          alert('Cevap kaydedildi ama kart oluşturulamadı: ' + giftError.message)
        } else {
          alert('Cevap kaydedildi ve destek kartı oluşturuldu!')
        }
      } else {
        alert('Cevap kaydedildi!')
      }
    } catch (error) {
      console.error('Error saving answer:', error)
      alert('Hata: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const updateAnswer = (index, text) => {
    setAnswers({
      ...answers,
      [index]: { ...answers[index], text }
    })
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Soru/Cevap</h1>
          <p className="text-gray-600">Cevaplarını görüntüle ve düzenle</p>
        </div>

        <div className="space-y-6">
          {questions.map((q) => (
            <div key={q.index} className="bg-white rounded-lg shadow p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Soru {q.index}
                </h3>
                <p className="text-gray-700">{q.question}</p>
              </div>

              <textarea
                value={answers[q.index]?.text || ''}
                onChange={(e) => updateAnswer(q.index, e.target.value)}
                className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="Cevabınızı buraya yazın..."
              />

              {q.hasCheckbox && (
                <div className="mt-4 flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="create-gift-card"
                    checked={createGiftCard}
                    onChange={(e) => setCreateGiftCard(e.target.checked)}
                    className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="create-gift-card" className="text-sm text-gray-700">
                    Bu becerim için verilecek bir kart oluştur
                  </label>
                </div>
              )}

              <div className="mt-4">
                <button
                  onClick={() => handleSave(q.index)}
                  disabled={saving}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default SoruCevap
