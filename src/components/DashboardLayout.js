import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../i18n'

const DashboardLayout = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()
  const { t, lang, setLanguage } = useI18n()

  const navigation = [
    { name: t.nav.dashboard, path: '/dashboard' },
    { name: t.nav.questions, path: '/questions' },
    { name: t.nav.trustTeam, path: '/trust-team' },
    { name: t.nav.explore, path: '/receive' },
    { name: t.nav.give, path: '/give' },
  ]

  const isActive = (path) => location.pathname === path
  const hex = profile?.hex_code || null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <nav style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto', padding: '0 32px',
          height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <button
              onClick={() => navigate('/dashboard')}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <div className={`ember-logo${hex ? '' : ' neutral'}`} />
              {hex && <span className="mono">{hex}</span>}
            </button>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              {navigation.map((item) => (
                <Link key={item.path} to={item.path} style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14, fontWeight: 500,
                  color: isActive(item.path) ? 'var(--text-primary)' : 'var(--text-muted)',
                  textDecoration: 'none',
                  padding: '4px 12px',
                  borderBottom: isActive(item.path) ? '2px solid var(--user-color)' : '2px solid transparent',
                  transition: 'color 150ms ease, border-color 150ms ease',
                }}>
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Language toggle */}
            <button
              onClick={() => setLanguage(lang === 'en' ? 'tr' : 'en')}
              style={{
                fontFamily: "'DM Mono', monospace", fontSize: 12,
                color: 'var(--text-muted)', background: 'none', border: '1px solid var(--border)',
                borderRadius: 6, padding: '3px 8px', cursor: 'pointer',
              }}
            >
              {lang === 'en' ? 'TR' : 'EN'}
            </button>

            <button onClick={signOut} style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 13,
              color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer',
            }}>
              {t.nav.signOut}
            </button>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 32px' }}>
        {children}
      </main>
    </div>
  )
}

export default DashboardLayout
