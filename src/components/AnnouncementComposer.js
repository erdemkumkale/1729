import React, { useState } from 'react'
import { postAnnouncement } from '../lib/announcements'

// communityId = null → from #1729 (admin panel). Otherwise the founder writing to the members.
const AnnouncementComposer = ({ communityId, t }) => {
  const [text, setText] = useState('')
  const [email, setEmail] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [isError, setIsError] = useState(false)
  const font = { fontFamily: "'DM Sans', sans-serif" }
  const a = t.announce
  const fromSystem = communityId === null

  const send = async () => {
    if (!text.trim()) return
    setBusy(true)
    setMsg('')
    const res = await postAnnouncement({ communityId, body: text.trim(), important: fromSystem && email, sendEmail: !fromSystem && email })
    setBusy(false)
    if (!res.ok) {
      setIsError(true)
      setMsg(res.error === 'too_soon' ? a.tooSoon : a.error)
      return
    }
    setIsError(false)
    setText('')
    setEmail(false)
    setMsg(res.emailed === 'disabled' ? a.sentEmailOff : res.emailed === 'failed' ? a.sentEmailFailed : a.sent)
  }

  return (
    <div>
      <p style={{ ...font, fontSize: 14, color: 'var(--text-muted)', margin: '0 0 8px', lineHeight: 1.5 }}>
        {fromSystem ? a.hintSystem : a.hint}
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={600}
        rows={3}
        placeholder={a.placeholder}
        style={{ width: '100%', boxSizing: 'border-box', marginBottom: 6 }}
      />
      <p style={{ ...font, fontSize: 13, color: 'var(--text-muted)', margin: '0 0 8px', textAlign: 'right' }}>{text.length}/600</p>
      <label style={{ ...font, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-primary)', marginBottom: 12, cursor: 'pointer' }}>
        <input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} />
        {fromSystem ? a.alsoEmailSystem : a.alsoEmail}
      </label>
      <button className="btn-primary" onClick={send} disabled={busy || !text.trim()} style={{ padding: '8px 18px', fontSize: 15 }}>
        {busy ? a.sending : a.send}
      </button>
      {msg && <p style={{ ...font, fontSize: 14, color: isError ? '#e05c5c' : '#5ca97c', margin: '10px 0 0' }}>{msg}</p>}
    </div>
  )
}

export default AnnouncementComposer
