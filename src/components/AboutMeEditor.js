import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../i18n'

const AboutMeEditor = () => {
  const { user } = useAuth()
  const { t } = useI18n()
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(true)
  const [savingIndex, setSavingIndex] = useState(null)
  const [savedIndex, setSavedIndex] = useState(null)

  const questions = [
    { index: 1, question: t.onboarding.screen2.question },
    { index: 2, question: t.onboarding.screen3.question },
    { index: 3, question: t.onboarding.screen4.question },
  ]

  const fetchAnswers = useCallback(async () => {
    if (!user) return
    try {
      const { data } = await supabase.from('onboarding_answers').select('*').eq('user_id', user.id)
      const map = {}
      data?.forEach(item => { map[item.question_index] = item.answer_text })
      setAnswers(map)
    } catch (err) {
      console.error('fetchAnswers error:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { if (user) fetchAnswers() }, [user, fetchAnswers])

  const handleSave = async (index) => {
    setSavingIndex(index)
    try {
      await supabase.from('onboarding_answers').upsert(
        { user_id: user.id, question_index: index, answer_text: answers[index] || '' },
        { onConflict: 'user_id,question_index' }
      )
      setSavedIndex(index)
      setTimeout(() => setSavedIndex(null), 2000)
    } catch (err) {
      console.error('handleSave error:', err)
    } finally {
      setSavingIndex(null)
    }
  }

  if (loading) return null

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: 'var(--text-muted)', margin: 0 }}>{t.questions.subtitle}</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {questions.map((q) => (
          <div key={q.index} style={{ background: 'var(--surface)', borderRadius: 16, padding: 24, border: '1px solid var(--border)' }}>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: 'var(--text-muted)', marginBottom: 8 }}>
              {q.index}
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, color: 'var(--text-primary)', marginBottom: 16 }}>{q.question}</p>
            <textarea
              value={answers[q.index] || ''}
              onChange={(e) => setAnswers({ ...answers, [q.index]: e.target.value })}
              placeholder={t.onboarding.textareaPlaceholder}
            />
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
              <button className="btn-secondary" onClick={() => handleSave(q.index)} disabled={savingIndex === q.index} style={{ padding: '8px 20px', fontSize: 16 }}>
                {savingIndex === q.index ? t.questions.saving : t.questions.save}
              </button>
              {savedIndex === q.index && (
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: 'var(--text-muted)' }}>{t.questions.saved}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

export default AboutMeEditor
