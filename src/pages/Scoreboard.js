import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useI18n } from '../i18n'
import DashboardLayout from '../components/DashboardLayout'
import { nickSuffix } from '../lib/nick'

const font = { fontFamily: "'DM Sans', sans-serif" }
const mono = { fontFamily: "'DM Mono', monospace" }

const Scoreboard = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useI18n()
  const [period, setPeriod] = useState('month')
  const [data, setData] = useState(undefined) // undefined = loading, null = nothing
  const [failed, setFailed] = useState(false)

  const load = useCallback(async () => {
    const { data: res, error } = await supabase.rpc('community_scoreboard', { p_community: id, p_period: period })
    if (error) console.error('community_scoreboard error:', error)
    setFailed(!!error)
    setData(error ? null : res)
  }, [id, period])
  useEffect(() => { load() }, [load])

  const toggleOpen = async () => {
    await supabase.rpc('set_scoreboard_open', { p_community: id, p_open: !data.open })
    load()
  }

  const periods = [
    { value: 'week', label: t.community.sbWeek },
    { value: 'month', label: t.community.sbMonth },
    { value: 'year', label: t.community.sbYear },
    { value: 'all', label: t.community.sbAll },
  ]
  const th = { ...font, fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', textAlign: 'right', padding: '10px 12px', borderBottom: '1px solid var(--border)' }
  const td = { ...mono, fontSize: 16, textAlign: 'right', padding: '12px', borderBottom: '1px solid var(--border)' }

  return (
    <DashboardLayout>
      <button onClick={() => navigate('/dashboard')} style={{ ...font, background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, color: 'var(--text-muted)', padding: 0, marginBottom: 16 }}>
        ← {t.community.sbBack}
      </button>

      {data === undefined ? (
        <p style={{ ...font, color: 'var(--text-muted)' }}>—</p>
      ) : data === null ? (
        <p style={{ ...font, fontSize: 16, color: 'var(--text-muted)' }}>{failed ? t.community.sbFailed : t.community.sbClosed}</p>
      ) : (
        <>
          <h1 style={{ ...font, fontSize: 30, fontWeight: 500, margin: '0 0 4px' }}>{data.name}</h1>
          <p style={{ ...font, fontSize: 16, color: 'var(--text-muted)', margin: '0 0 20px' }}>{t.community.sbTitle}</p>

          {!data.can_view ? (
            <p style={{ ...font, fontSize: 16, color: 'var(--text-muted)' }}>{t.community.sbClosed}</p>
          ) : (
            <>
              {data.is_owner && (
                <label style={{ ...font, display: 'flex', alignItems: 'center', gap: 10, fontSize: 16, marginBottom: 20, cursor: 'pointer' }}>
                  <input type="checkbox" checked={!!data.open} onChange={toggleOpen} style={{ width: 18, height: 18 }} />
                  <span>{t.community.sbOpen}<span style={{ color: 'var(--text-muted)', fontSize: 14 }}> · {t.community.sbOpenHint}</span></span>
                </label>
              )}

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                {periods.map((p) => (
                  <button key={p.value} onClick={() => setPeriod(p.value)} style={{
                    ...font, fontSize: 15, padding: '6px 14px', borderRadius: 999, cursor: 'pointer',
                    border: '1px solid var(--border)',
                    background: period === p.value ? 'var(--user-color)' : 'var(--surface)',
                    color: period === p.value ? 'var(--user-color-text)' : 'var(--text-primary)',
                  }}>{p.label}</button>
                ))}
              </div>

              {data.rows.length === 0 ? (
                <p style={{ ...font, fontSize: 16, color: 'var(--text-muted)' }}>{t.community.sbEmpty}</p>
              ) : (
                <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 420 }}>
                    <thead>
                      <tr>
                        <th style={{ ...th, textAlign: 'left' }}>{t.community.sbPerson}</th>
                        <th style={th}>{t.community.sbGiven}</th>
                        <th style={th}>{t.community.sbReceived}</th>
                        <th style={th}>{t.community.sbOffers}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.rows.map((r) => (
                        <tr key={r.hex} style={{ background: r.you ? 'var(--surface-2)' : 'transparent' }}>
                          <td style={{ ...td, textAlign: 'left' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ width: 18, height: 18, borderRadius: '50%', background: r.hex, display: 'inline-block', flexShrink: 0 }} />
                              <span style={{ fontSize: 15 }}>{r.hex}{nickSuffix(r.nickname)}</span>
                            </span>
                          </td>
                          <td style={td}>{r.given}</td>
                          <td style={td}>{r.received}</td>
                          <td style={td}>{r.offers}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p style={{ ...font, fontSize: 13, color: 'var(--text-muted)', margin: '12px 0 0' }}>{t.community.sbNote}</p>
            </>
          )}
        </>
      )}
    </DashboardLayout>
  )
}

export default Scoreboard
