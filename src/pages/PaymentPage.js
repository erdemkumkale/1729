import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../i18n'

const PaymentPage = () => {
  const navigate = useNavigate()
  const { user, profile, refreshProfile } = useAuth()
  const { t } = useI18n()
  const [code, setCode] = useState('')
  const [promoData, setPromoData] = useState(null)
  const [codeError, setCodeError] = useState('')
  const [loading, setLoading] = useState(false)
  const [completing, setCompleting] = useState(false)

  const handleApplyCode = async () => {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return
    setLoading(true)
    setCodeError('')
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('promo_code', trimmed)
        .eq('status', 'pending')
        .maybeSingle()
      if (error || !data) {
        setCodeError(t.payment.invalidCode)
        return
      }
      setPromoData(data)
    } catch (err) {
      console.error('handleApplyCode error:', err)
      setCodeError(t.payment.error)
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async () => {
    if (!promoData) return
    setCompleting(true)
    try {
      await supabase
        .from('profiles')
        .update({ payment_status: 'paid' })
        .eq('id', user.id)

      await supabase
        .from('invitations')
        .update({
          status: 'used',
          used_by: user.id,
          used_at: new Date().toISOString(),
        })
        .eq('id', promoData.id)

      if (promoData.sub_community_id) {
        await supabase
          .from('sub_community_members')
          .upsert(
            { sub_community_id: promoData.sub_community_id, user_id: user.id },
            { onConflict: 'sub_community_id,user_id' }
          )
      }

      await refreshProfile()
      navigate('/onboarding')
    } catch (err) {
      console.error('handleComplete error:', err)
    } finally {
      setCompleting(false)
    }
  }

  const label = { fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }
  const muted = { fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--background)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{ maxWidth: 400, width: '100%' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <img src="/logo.svg" alt="1729" style={{ width: 40, height: 40, borderRadius: 6, margin: '0 auto 16px' }} />
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>1729</p>
        </div>

        <div style={{ background: 'var(--surface)', borderRadius: 20, padding: 32, border: '1px solid var(--border)' }}>
          {!promoData ? (
            <>
              <h1 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 24, fontWeight: 500, marginBottom: 8 }}>{t.payment.title}</h1>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-muted)', marginBottom: 32 }}>{t.payment.subtitle}</p>

              <div style={{ marginBottom: 16 }}>
                <label style={label}>{t.payment.codeLabel}</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.toUpperCase())
                      setCodeError('')
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyCode()}
                    placeholder={t.payment.codePlaceholder}
                    maxLength={6}
                    style={{ flex: 1, fontFamily: "'DM Mono', monospace", letterSpacing: 4, fontSize: 18, textAlign: 'center' }}
                  />
                  <button
                    className="btn-primary"
                    onClick={handleApplyCode}
                    disabled={loading || !code.trim()}
                    style={{ flexShrink: 0 }}
                  >
                    {loading ? '…' : t.payment.apply}
                  </button>
                </div>
                {codeError && (
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#e05c5c', marginTop: 8 }}>{codeError}</p>
                )}
              </div>

              <p style={{ ...muted, marginTop: 24, fontSize: 12 }}>{t.payment.testMode}</p>
            </>
          ) : (
            <>
              {/* Code accepted state */}
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: 'rgba(80,200,120,0.15)', border: '2px solid rgba(80,200,120,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px', fontSize: 22,
                }}>✓</div>
                <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 20, fontWeight: 500, marginBottom: 8, color: 'var(--text-primary)' }}>
                  {t.payment.codeAccepted}
                </h2>
                {promoData.duration_months && (
                  <p style={muted}>
                    {promoData.duration_months === 1 && '1 month access'}
                    {promoData.duration_months === 6 && '6 months access'}
                    {promoData.duration_months === 12 && '12 months access'}
                  </p>
                )}
              </div>

              <button
                className="btn-primary"
                onClick={handleComplete}
                disabled={completing}
                style={{ width: '100%' }}
              >
                {completing ? t.payment.processing : t.payment.continue}
              </button>

              <p style={{ ...muted, marginTop: 16, fontSize: 12 }}>{t.payment.testMode}</p>
            </>
          )}
        </div>

        {/* User info */}
        {profile && (
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: profile.hex_code || 'var(--text-muted)', flexShrink: 0 }} />
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-muted)' }}>
                {profile.email || user?.email}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PaymentPage
