import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import DashboardLayout from '../components/DashboardLayout'
import tr from '../strings/tr'

const questions = [
  { index: 1, question: tr.onboarding.screen2.question },
  { index: 2, question: tr.onboarding.screen3.question },
  { index: 3, question: tr.onboarding.screen4.question },
  { index: 4, question: tr.onboarding.screen6.question },
]

const SoruCevap = () => {
  const { user } = useAuth()
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(true)
  const [savingIndex, setSavingIndex] = useState(null)
  const [savedIndex, setSavedIndex] = useState(null)

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

  if (loading) return (
    <DashboardLayout>
      <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--user-color)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 32, fontWeight: 500, marginBottom: 8 }}>{tr.questions.title}</h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>{tr.questions.subtitle}</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {questions.map((q) => (
          <div key={q.index} style={{
            background: 'var(--surface)', borderRadius: 16, padding: 24,
            border: '1px solid var(--border)',
          }}>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
              {q.index < 4 ? `Soru ${q.index}` : tr.give.newCard}
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: 'var(--text-primary)', marginBottom: 16 }}>
              {q.question}
            </p>
            <textarea
              value={answers[q.index] || ''}
              onChange={(e) => setAnswers({ ...answers, [q.index]: e.target.value })}
              placeholder={tr.onboarding.textareaPlaceholder}
            />
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                className="btn-secondary"
                onClick={() => handleSave(q.index)}
                disabled={savingIndex === q.index}
                style={{ padding: '8px 20px', fontSize: 14 }}
              >
                {savingIndex === q.index ? tr.questions.saving : tr.questions.save}
              </button>
              {savedIndex === q.index && (
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-muted)' }}>
                  {tr.questions.saved}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  )
}

export default SoruCevap
