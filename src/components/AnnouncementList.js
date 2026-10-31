import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchAnnouncements, markAnnouncementsRead } from '../lib/announcements'

// compact = dashboard: only unread ones, a few, with a link to the inbox.
// full   = inbox: everything from the last 30 days; opening it marks them read.
const AnnouncementList = ({ user, t, compact = false }) => {
  const [items, setItems] = useState(null)
  const font = { fontFamily: "'DM Sans', sans-serif" }

  useEffect(() => {
    let active = true
    fetchAnnouncements(user.id, compact ? 5 : 30).then((rows) => {
      if (!active) return
      setItems(rows)
      if (!compact) markAnnouncementsRead(user.id, rows.filter((r) => r.unread).map((r) => r.id))
    })
    return () => { active = false }
  }, [user.id, compact])

  if (items === null) return null
  const shown = compact ? items.filter((i) => i.unread).slice(0, 3) : items
  if (compact && shown.length === 0) return null
  if (!compact && shown.length === 0) return null

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 24, marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
        <h2 style={{ ...font, fontSize: 18, fontWeight: 500, margin: 0 }}>{t.announce.title}</h2>
        {compact && <Link to="/messages" style={{ ...font, fontSize: 14, color: 'var(--text-muted)' }}>{t.announce.viewAll}</Link>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {shown.map((a) => (
          <div key={a.id} style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: 'var(--text-muted)' }}>
                {a.sub_community_id ? (a.community?.name || '') : '#1729'}
              </span>
              {a.unread && (
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--user-color-text)', background: 'var(--user-color)', borderRadius: 999, padding: '1px 8px' }}>{t.announce.new}</span>
              )}
            </div>
            <p style={{ ...font, fontSize: 16, lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>{a.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AnnouncementList
