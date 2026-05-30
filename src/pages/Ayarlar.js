import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../i18n'
import DashboardLayout from '../components/DashboardLayout'

// ─── Helpers ─────────────────────────────────────────────────────

const applyThemeToDom = (theme) => {
  if (!theme || theme === 'system') {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', theme)
  }
}

// ─── Sub-components ──────────────────────────────────────────────

const Section = ({ title, children }) => (
  <div style={{
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: '24px 28px',
    marginBottom: 16,
  }}>
    <p style={{
      fontFamily: "'DM Mono', monospace",
      fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
      color: 'var(--text-muted)',
      margin: '0 0 20px',
    }}>
      {title}
    </p>
    {children}
  </div>
)

const Row = ({ label, hint, last, children }) => (
  <div style={{
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', gap: 16,
    padding: '12px 0',
    borderBottom: last ? 'none' : '1px solid var(--border)',
  }}>
    <div style={{ minWidth: 0, flex: 1 }}>
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 14, fontWeight: 500,
        color: 'var(--text-primary)', margin: 0,
      }}>
        {label}
      </p>
      {hint && (
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 12, color: 'var(--text-muted)',
          margin: '2px 0 0', lineHeight: 1.5,
        }}>
          {hint}
        </p>
      )}
    </div>
    <div style={{ flexShrink: 0 }}>{children}</div>
  </div>
)

const Toggle = ({ checked, onChange }) => (
  <button
    onClick={() => onChange(!checked)}
    style={{
      width: 44, height: 24, borderRadius: 12,
      background: checked ? 'var(--user-color)' : 'var(--surface-2)',
      border: '1px solid var(--border)',
      cursor: 'pointer',
      position: 'relative',
      transition: 'background 200ms ease',
      flexShrink: 0,
      padding: 0,
    }}
  >
    <div style={{
      width: 18, height: 18, borderRadius: '50%',
      background: 'var(--text-primary)',
      position: 'absolute', top: 2,
      left: checked ? 22 : 2,
      transition: 'left 200ms ease',
    }} />
  </button>
)

const SegmentedControl = ({ options, value, onChange }) => (
  <div style={{
    display: 'flex', gap: 2,
    background: 'var(--surface-2)',
    borderRadius: 10, padding: 3,
    border: '1px solid var(--border)',
  }}>
    {options.map(opt => (
      <button
        key={opt.value}
        onClick={() => onChange(opt.value)}
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 13, fontWeight: 500,
          padding: '5px 14px',
          background: value === opt.value ? 'var(--surface)' : 'transparent',
          color: value === opt.value ? 'var(--text-primary)' : 'var(--text-muted)',
          border: value === opt.value ? '1px solid var(--border)' : '1px solid transparent',
          borderRadius: 7,
          cursor: 'pointer',
          transition: 'all 150ms ease',
          whiteSpace: 'nowrap',
        }}
      >
        {opt.label}
      </button>
    ))}
  </div>
)

// ─── Main page ───────────────────────────────────────────────────

const Ayarlar = () => {
  const { user, profile, signOut, refreshProfile } = useAuth()
  const { t, lang, setLanguage } = useI18n()

  // ── Appearance
  const [theme, setTheme]       = useState(profile?.theme || 'dark')
  const [giftWord, setGiftWord] = useState(profile?.gift_word || 'armağan')

  // ── Notification prefs
  const defaults = {
    gift_interest: true,
    new_message: true,
    subscription_expiring: true,
    subscription_expired: true,
    added_to_circle: false,
    gift_quota_empty: false,
  }
  const [notifPrefs, setNotifPrefs]     = useState(defaults)
  const [notifLoading, setNotifLoading] = useState(true)

  // ── Subscription
  const [subscription, setSubscription] = useState(null)

  // ── Account
  const [newPassword, setNewPassword] = useState('')
  const [pwSaving, setPwSaving]       = useState(false)
  const [pwMessage, setPwMessage]     = useState(null)
  const [deleteText, setDeleteText]   = useState('')
  const [deleting, setDeleting]       = useState(false)

  // ── Load notification preferences
  const loadNotifPrefs = useCallback(async () => {
    if (!user) return
    setNotifLoading(true)
    try {
      const { data } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()
      if (data) setNotifPrefs({ ...defaults, ...data })
    } catch {
      // no row → keep defaults
    } finally {
      setNotifLoading(false)
    }
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load subscription info
  const loadSubscription = useCallback(async () => {
    if (!user?.email) return
    try {
      const { data } = await supabase
        .from('invitations')
        .select('*')
        .eq('email', user.email)
        .eq('status', 'used')
        .order('created_at', { ascending: false })
        .limit(1)
      if (data && data.length > 0) setSubscription(data[0])
    } catch {
      // ignore
    }
  }, [user])

  useEffect(() => {
    if (user) {
      loadNotifPrefs()
      loadSubscription()
    }
  }, [user, loadNotifPrefs, loadSubscription])

  // ── Theme
  const handleThemeChange = async (value) => {
    setTheme(value)
    applyThemeToDom(value)
    try {
      await supabase.from('profiles').update({ theme: value }).eq('id', user.id)
    } catch {
      // silent — preference is applied visually regardless
    }
  }

  // ── Gift word
  const handleGiftWordChange = async (value) => {
    setGiftWord(value)
    try {
      await supabase.from('profiles').update({ gift_word: value }).eq('id', user.id)
      // Refresh so the i18n provider re-renders all strings with the new word
      await refreshProfile()
    } catch {
      // silent
    }
  }

  // ── Language
  const handleLanguageChange = async (value) => {
    setLanguage(value)
    try {
      await supabase.from('profiles').update({ language: value }).eq('id', user.id)
    } catch {
      // silent
    }
  }

  // ── Notification toggle
  const handleNotifToggle = async (key, value) => {
    const updated = { ...notifPrefs, [key]: value, updated_at: new Date().toISOString() }
    setNotifPrefs(updated)
    try {
      await supabase.from('notification_preferences').upsert(
        { user_id: user.id, ...updated },
        { onConflict: 'user_id' }
      )
    } catch {
      // revert on error
      setNotifPrefs(prev => ({ ...prev, [key]: !value }))
    }
  }

  // ── Password change
  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (newPassword.length < 6) return
    setPwSaving(true)
    setPwMessage(null)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      setNewPassword('')
      setPwMessage({ type: 'ok', text: t.settings.passwordUpdated })
    } catch {
      setPwMessage({ type: 'err', text: t.settings.error })
    } finally {
      setPwSaving(false)
    }
  }

  // ── Delete account (soft-delete)
  const handleDeleteAccount = async () => {
    if (deleteText !== t.settings.deleteConfirmWord) return
    setDeleting(true)
    try {
      await supabase.from('profiles').update({ payment_status: 'deleted' }).eq('id', user.id)
      await signOut()
    } catch {
      setDeleting(false)
    }
  }

  // ── Subscription display helpers
  const subDaysLeft = subscription?.subscription_ends_at
    ? Math.max(0, Math.ceil((new Date(subscription.subscription_ends_at) - Date.now()) / 86400000))
    : null

  const dateLocale = lang === 'tr' ? 'tr-TR' : 'en-GB'
  const dateOpts   = { day: 'numeric', month: 'long', year: 'numeric' }

  const subStartDate = subscription?.used_at
    ? new Date(subscription.used_at).toLocaleDateString(dateLocale, dateOpts)
    : null

  const subEndDate = subscription?.subscription_ends_at
    ? new Date(subscription.subscription_ends_at).toLocaleDateString(dateLocale, dateOpts)
    : null

  // ── Notification rows
  const notifRequired = [
    { key: 'gift_interest',           label: t.settings.notifGiftInterest,  hint: t.settings.notifGiftInterestHint },
    { key: 'new_message',             label: t.settings.notifNewMessage,    hint: t.settings.notifNewMessageHint },
    { key: 'subscription_expiring',   label: t.settings.notifSubExpiring,   hint: t.settings.notifSubExpiringHint },
    { key: 'subscription_expired',    label: t.settings.notifSubExpired,    hint: t.settings.notifSubExpiredHint },
  ]
  const notifOptional = [
    { key: 'added_to_circle',  label: t.settings.notifAddedToCircle, hint: t.settings.notifAddedToCircleHint },
    { key: 'gift_quota_empty', label: t.settings.notifQuotaEmpty,    hint: t.settings.notifQuotaEmptyHint },
  ]

  const inputStyle = {
    fontFamily: "'DM Sans', sans-serif", fontSize: 14,
    background: 'var(--surface-2)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '8px 12px',
    color: 'var(--text-primary)', outline: 'none', width: 220,
  }

  return (
    <DashboardLayout>
      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 32, fontWeight: 500, marginBottom: 8 }}>
          {t.settings.title}
        </h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
          {t.settings.subtitle}
        </p>
      </div>

      {/* ── 1. Appearance & Language ── */}
      <Section title={t.settings.appearance}>
        <Row label={t.settings.theme}>
          <SegmentedControl
            value={theme}
            onChange={handleThemeChange}
            options={[
              { value: 'dark',   label: t.settings.themeDark },
              { value: 'light',  label: t.settings.themeLight },
              { value: 'system', label: t.settings.themeSystem },
            ]}
          />
        </Row>

        <Row label={t.settings.language}>
          <SegmentedControl
            value={lang}
            onChange={handleLanguageChange}
            options={[
              { value: 'en', label: 'English' },
              { value: 'tr', label: 'Türkçe' },
            ]}
          />
        </Row>

        <Row
          label={t.settings.giftWord}
          hint={t.settings.giftWordNote}
          last
        >
          <SegmentedControl
            value={giftWord}
            onChange={handleGiftWordChange}
            options={[
              { value: 'armağan', label: t.settings.giftWordDefault },
              { value: 'şey',     label: t.settings.giftWordAlt },
            ]}
          />
        </Row>
      </Section>

      {/* ── 2. Subscription ── */}
      <Section title={t.settings.subscription}>
        {subscription ? (
          <>
            <Row label={t.settings.plan}>
              <span className="mono" style={{ color: 'var(--text-muted)' }}>
                {subscription.duration_months
                  ? `${subscription.duration_months} ${lang === 'tr' ? 'aylık' : 'month'}`
                  : '—'}
              </span>
            </Row>

            {subStartDate && (
              <Row label={t.settings.startDate}>
                <span className="mono" style={{ color: 'var(--text-muted)', fontSize: 12 }}>{subStartDate}</span>
              </Row>
            )}

            {subEndDate && (
              <Row label={t.settings.endDate}>
                <span className="mono" style={{ color: 'var(--text-muted)', fontSize: 12 }}>{subEndDate}</span>
              </Row>
            )}

            {subDaysLeft !== null && (
              <Row label={t.settings.daysLeft(subDaysLeft)}>
                <span style={{
                  fontFamily: "'DM Mono', monospace", fontSize: 12,
                  padding: '2px 10px', borderRadius: 6,
                  background: subDaysLeft <= 7 ? 'rgba(240,100,80,0.10)' : 'rgba(80,200,120,0.10)',
                  color:      subDaysLeft <= 7 ? 'rgba(240,100,80,0.9)'  : 'rgba(80,200,120,0.9)',
                }}>
                  {subDaysLeft <= 7 ? '!' : '✓'}
                </span>
              </Row>
            )}

            <Row label={t.settings.type} last>
              <span className="mono" style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                {subscription.funded_by_inviter ? t.settings.typeGifted : t.settings.typeSelf}
              </span>
            </Row>
          </>
        ) : (
          <Row label={t.settings.plan} last>
            <span className="mono" style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
          </Row>
        )}

        <div style={{ marginTop: 16 }}>
          <button
            disabled
            style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
              padding: '8px 18px', borderRadius: 8,
              background: 'var(--surface-2)', color: 'var(--text-muted)',
              border: '1px solid var(--border)',
              cursor: 'not-allowed', opacity: 0.5,
            }}
          >
            {t.settings.managePayment} — {t.settings.comingSoon}
          </button>
        </div>
      </Section>

      {/* ── 3. Email notifications ── */}
      <Section title={t.settings.notifications}>
        {notifLoading ? (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-muted)' }}>—</p>
        ) : (
          <>
            {notifRequired.map((item, i) => (
              <Row
                key={item.key}
                label={item.label}
                hint={item.hint}
                last={i === notifRequired.length - 1 && notifOptional.length === 0}
              >
                <Toggle
                  checked={notifPrefs[item.key] ?? true}
                  onChange={(v) => handleNotifToggle(item.key, v)}
                />
              </Row>
            ))}

            {/* Visual separator between required and optional */}
            <div style={{ height: 8 }} />

            {notifOptional.map((item, i) => (
              <Row
                key={item.key}
                label={item.label}
                hint={item.hint}
                last={i === notifOptional.length - 1}
              >
                <Toggle
                  checked={notifPrefs[item.key] ?? false}
                  onChange={(v) => handleNotifToggle(item.key, v)}
                />
              </Row>
            ))}
          </>
        )}
      </Section>

      {/* ── 4. Account ── */}
      <Section title={t.settings.account}>
        {/* Email */}
        <Row label={t.settings.emailLabel}>
          <span className="mono" style={{ color: 'var(--text-muted)', fontSize: 12 }}>{user?.email}</span>
        </Row>

        {/* Password change */}
        <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14, fontWeight: 500,
            color: 'var(--text-primary)', margin: '0 0 12px',
          }}>
            {t.settings.changePassword}
          </p>
          <form onSubmit={handlePasswordChange} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder={t.settings.newPassword}
              minLength={6}
              style={inputStyle}
            />
            <button
              type="submit"
              disabled={pwSaving || newPassword.length < 6}
              className="btn-primary"
              style={{ fontSize: 13, padding: '8px 18px' }}
            >
              {pwSaving ? '…' : t.settings.updatePassword}
            </button>
          </form>
          {pwMessage && (
            <p style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 13,
              color: pwMessage.type === 'ok' ? 'rgba(80,200,120,0.9)' : 'rgba(240,100,80,0.9)',
              margin: '8px 0 0',
            }}>
              {pwMessage.text}
            </p>
          )}
        </div>

        {/* Danger zone */}
        <div style={{ padding: '16px 0 0' }}>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13, fontWeight: 600,
            color: 'rgba(240,100,80,0.85)',
            margin: '0 0 4px',
          }}>
            {t.settings.dangerZone}
          </p>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13, color: 'var(--text-muted)',
            margin: '0 0 14px',
          }}>
            {t.settings.deleteAccount}
          </p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              value={deleteText}
              onChange={e => setDeleteText(e.target.value)}
              placeholder={t.settings.deleteConfirmPlaceholder}
              style={{
                ...inputStyle,
                fontFamily: "'DM Mono', monospace",
                fontSize: 13,
                border: '1px solid rgba(240,100,80,0.25)',
              }}
            />
            <button
              onClick={handleDeleteAccount}
              disabled={deleteText !== t.settings.deleteConfirmWord || deleting}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13, fontWeight: 500,
                padding: '8px 18px', borderRadius: 8,
                background: deleteText === t.settings.deleteConfirmWord
                  ? 'rgba(240,100,80,0.12)' : 'var(--surface-2)',
                color: deleteText === t.settings.deleteConfirmWord
                  ? 'rgba(240,100,80,0.9)' : 'var(--text-muted)',
                border: `1px solid ${deleteText === t.settings.deleteConfirmWord
                  ? 'rgba(240,100,80,0.35)' : 'var(--border)'}`,
                cursor: deleteText === t.settings.deleteConfirmWord ? 'pointer' : 'not-allowed',
                transition: 'all 150ms ease',
              }}
            >
              {deleting ? '…' : t.settings.confirmDelete}
            </button>
          </div>
        </div>
      </Section>
    </DashboardLayout>
  )
}

export default Ayarlar
