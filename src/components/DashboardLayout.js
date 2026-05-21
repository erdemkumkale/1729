import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../i18n'

// Gear icon for Settings
const GearIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
    <path d="M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M13.3 6.7 12.2 5l-1.5.5a4 4 0 0 0-.7-.4L9.7 3.5h-3.4L6 5.1a4 4 0 0 0-.7.4L3.8 5 2.7 6.7l1.2 1a3.9 3.9 0 0 0 0 .6l-1.2 1L3.8 11l1.5-.5c.2.2.4.3.7.4l.3 1.6h3.4l.3-1.6c.3-.1.5-.2.7-.4l1.5.5 1.1-1.7-1.2-1a3.9 3.9 0 0 0 0-.6l1.2-1Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
  </svg>
)

const DashboardLayout = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()
  const { t, lang, setLanguage } = useI18n()

  const navigation = [
    { name: t.nav.dashboard,   path: '/dashboard'   },
    { name: t.nav.explore,     path: '/receive'     },
    { name: t.nav.give,        path: '/give'        },
    { name: t.nav.trustTeam,   path: '/trust-team'  },
    { name: t.nav.questions,   path: '/questions'   },
  ]

  const isActive = (path) => location.pathname === path
  const hex = profile?.hex_code || null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      {/* ── Top nav ──────────────────────────────────────────── */}
      <nav style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto', padding: '0 20px',
          height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {/* Left: identity + nav links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, minWidth: 0 }}>
            {/* User hex circle → home */}
            <button
              onClick={() => navigate('/dashboard')}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: hex || 'var(--text-muted)',
                boxShadow: hex ? '0 0 10px var(--user-color-glow)' : 'none',
              }} />
              <span className="mono nav-hex-label" style={{ fontSize: 13 }}>{hex}</span>
            </button>

            {/* Nav links — hidden on mobile */}
            <div className="nav-links">
              {navigation.map((item) => (
                <Link key={item.path} to={item.path} style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14, fontWeight: 500,
                  color: isActive(item.path) ? 'var(--text-primary)' : 'var(--text-muted)',
                  textDecoration: 'none',
                  padding: '4px 10px',
                  borderBottom: isActive(item.path) ? '2px solid var(--user-color)' : '2px solid transparent',
                  transition: 'color 150ms ease, border-color 150ms ease',
                  whiteSpace: 'nowrap',
                }}>
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Right: language + settings + sign out */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <button
              onClick={() => setLanguage(lang === 'en' ? 'tr' : 'en')}
              style={{
                fontFamily: "'DM Mono', monospace", fontSize: 11,
                color: 'var(--text-muted)', background: 'none', border: '1px solid var(--border)',
                borderRadius: 6, padding: '3px 8px', cursor: 'pointer',
              }}
            >
              {lang === 'en' ? 'TR' : 'EN'}
            </button>
            <Link
              to="/settings"
              title={t.nav.settings}
              style={{
                display: 'flex', alignItems: 'center',
                color: isActive('/settings') ? 'var(--text-primary)' : 'var(--text-muted)',
                transition: 'color 150ms ease',
              }}
            >
              <GearIcon />
            </Link>
            <button onClick={signOut} style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 13,
              color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer',
            }}>
              {t.nav.signOut}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Main content ─────────────────────────────────────── */}
      <main className="dashboard-main" style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 20px' }}>
        {children}
      </main>

      {/* ── Bottom nav — mobile only ──────────────────────────── */}
      <nav className="nav-bottom">
        {navigation.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-bottom-link${isActive(item.path) ? ' active' : ''}`}
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </div>
  )
}

export default DashboardLayout
