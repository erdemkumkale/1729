import React, { useState, useEffect } from 'react'

const seenKey = (userId) => `tour_seen_${userId}`

export const hasSeenTour = (userId) => {
  try { return localStorage.getItem(seenKey(userId)) === '1' } catch { return false }
}

const markSeen = (userId) => {
  try { localStorage.setItem(seenKey(userId), '1') } catch { /* private mode: tour may show again */ }
}

// Short first-visit tour. Each step may point at a menu item (data-tour="<path>") and highlights it.
export default function WelcomeTour({ userId, t, onClose }) {
  const [step, setStep] = useState(0)
  const steps = t.tour.steps
  const current = steps[step]
  const last = step === steps.length - 1

  useEffect(() => {
    const nodes = current.target ? document.querySelectorAll(`[data-tour="${current.target}"]`) : []
    nodes.forEach((n) => n.classList.add('tour-highlight'))
    return () => nodes.forEach((n) => n.classList.remove('tour-highlight'))
  }, [current])

  const finish = () => {
    markSeen(userId)
    onClose()
  }

  const font = { fontFamily: "'DM Sans', sans-serif" }
  return (
    <div className="tour-card" role="dialog" aria-label={t.tour.label}>
      <p style={{ ...font, fontSize: 14, color: 'var(--text-muted)', margin: '0 0 6px' }}>
        {step + 1} / {steps.length}
      </p>
      <h3 style={{ ...font, fontSize: 20, fontWeight: 500, margin: '0 0 8px' }}>{current.title}</h3>
      <p style={{ ...font, fontSize: 17, lineHeight: 1.55, margin: '0 0 16px' }}>{current.body}</p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={finish} style={{ ...font, background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, color: 'var(--text-muted)', padding: '8px 4px' }}>
          {t.tour.skip}
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          {step > 0 && (
            <button className="btn-secondary" onClick={() => setStep(step - 1)} style={{ padding: '8px 16px', fontSize: 15 }}>{t.tour.back}</button>
          )}
          <button className="btn-primary" onClick={() => (last ? finish() : setStep(step + 1))} style={{ padding: '8px 18px', fontSize: 15 }}>
            {last ? t.tour.done : t.tour.next}
          </button>
        </div>
      </div>
    </div>
  )
}
