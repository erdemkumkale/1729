import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import Logo from '../components/Logo'

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400&family=DM+Mono:wght@300&display=swap');

  .cp-root {
    --bg:     #0A0A09;
    --bg2:    #111110;
    --t:      #EDE9E3;
    --t2:     #A09C96;
    --t3:     #6B6762;
    --accent: #C8B89A;
    --f-serif: 'DM Serif Display', serif;
    --f-sans:  'DM Sans', sans-serif;
    --f-mono:  'DM Mono', monospace;

    background: var(--bg);
    color: var(--t);
    font-family: var(--f-sans);
    font-weight: 300;
    line-height: 1.7;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .cp-nav {
    padding: 24px 48px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    flex-shrink: 0;
  }

  .cp-logo {
    display: flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
  }

  .cp-logo-circle {
    width: 26px; height: 26px;
    background: #fff;
    border-radius: 50%;
  }

  .cp-logo-text {
    font-family: var(--f-mono);
    font-size: 13px;
    color: var(--t);
    letter-spacing: 0.1em;
  }

  .cp-back {
    font-family: var(--f-mono);
    font-size: 12px;
    color: var(--t3);
    text-decoration: none;
    letter-spacing: 0.06em;
    transition: color 0.2s;
  }

  .cp-back:hover { color: var(--t2); }

  .cp-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 80px 48px;
    max-width: 600px;
    margin: 0 auto;
    width: 100%;
    box-sizing: border-box;
  }

  .cp-label {
    font-family: var(--f-mono);
    font-size: 10px;
    color: var(--t3);
    letter-spacing: 0.15em;
    text-transform: uppercase;
    margin-bottom: 40px;
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .cp-label::after {
    content: '';
    width: 48px;
    height: 1px;
    background: var(--t3);
  }

  .cp-form-group { margin-bottom: 20px; }

  .cp-form-label {
    font-family: var(--f-mono);
    font-size: 9px;
    color: var(--t3);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    display: block;
    margin-bottom: 8px;
  }

  .cp-form-input,
  .cp-form-textarea {
    width: 100%;
    background: var(--bg2);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 0;
    padding: 14px 16px;
    font-size: 15px;
    color: var(--t);
    font-family: var(--f-sans);
    font-weight: 300;
    outline: none;
    transition: border-color 0.2s;
    resize: none;
    box-sizing: border-box;
  }

  .cp-form-input::placeholder,
  .cp-form-textarea::placeholder { color: var(--t3); }

  .cp-form-input:focus,
  .cp-form-textarea:focus { border-color: var(--accent); }

  .cp-form-textarea { height: 160px; }

  .cp-submit {
    display: inline-flex;
    align-items: center;
    gap: 14px;
    background: none;
    border: 1px solid var(--t2);
    padding: 14px 28px;
    font-family: var(--f-mono);
    font-size: 11px;
    color: var(--t);
    letter-spacing: 0.08em;
    cursor: pointer;
    transition: all 0.2s;
    margin-top: 8px;
    text-transform: uppercase;
  }

  .cp-submit:hover, .cp-submit.sent {
    border-color: var(--accent);
    color: var(--accent);
  }

  .cp-submit:disabled { opacity: 0.5; cursor: default; }
  .cp-submit::after { content: '→'; font-size: 15px; }

  .cp-success {
    font-family: var(--f-mono);
    font-size: 13px;
    color: var(--t2);
    margin-top: 24px;
    letter-spacing: 0.04em;
  }

  .cp-error {
    font-family: var(--f-mono);
    font-size: 11px;
    color: rgba(240,100,80,0.8);
    margin-top: 12px;
  }

  @media (max-width: 768px) {
    .cp-nav  { padding: 16px 20px; }
    .cp-main { padding: 60px 20px; }
  }
`

const ContactPage = () => {
  const [lang] = useState(() => {
    const stored = localStorage.getItem('1729_lang')
    if (stored) return stored
    const browser = navigator.language?.slice(0, 2).toLowerCase()
    return browser === 'tr' ? 'tr' : 'en'
  })

  const [email, setEmail]     = useState('')
  const [message, setMessage] = useState('')
  const [formState, setFormState] = useState('idle')

  const T = (tr, en) => lang === 'tr' ? tr : en

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setFormState('sending')
    try {
      const { error } = await supabase.from('waitlist').insert({
        email: email.trim(),
        message: message.trim() || null,
        lang,
      })
      if (error) throw error
      setFormState('sent')
    } catch {
      setFormState('error')
    }
  }

  useEffect(() => {
    const id = 'cp-css'
    if (!document.getElementById(id)) {
      const style = document.createElement('style')
      style.id = id
      style.textContent = CSS
      document.head.appendChild(style)
    }
  }, [])

  return (
    <div className="cp-root">
      <nav className="cp-nav">
        <Link to="/" className="cp-logo">
          <Logo size={28} centerColor="#fff" style={{ display: 'block', flexShrink: 0 }} />
          <span className="cp-logo-text">1729</span>
        </Link>
        <Link to="/" className="cp-back">← {T('Geri', 'Back')}</Link>
      </nav>

      <main className="cp-main">
        <div className="cp-label">{T('İletişim', 'Contact')}</div>

        {formState === 'sent' ? (
          <p className="cp-success">{T('Mesajın ulaştı.', 'Your message arrived.')}</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="cp-form-group">
              <label className="cp-form-label">{T('E-posta', 'Email')}</label>
              <input
                type="email"
                className="cp-form-input"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={T('sen@ornek.com', 'you@example.com')}
              />
            </div>
            <div className="cp-form-group">
              <label className="cp-form-label">{T('Mesaj', 'Message')}</label>
              <textarea
                className="cp-form-textarea"
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className={`cp-submit${formState === 'sent' ? ' sent' : ''}`}
              disabled={formState === 'sending'}
            >
              {formState === 'sending' ? '...' : T('GÖNDER', 'SEND')}
            </button>
            {formState === 'error' && (
              <p className="cp-error">{T('Bir şey olmadı. Tekrar dener misin?', 'Something went wrong. Try again?')}</p>
            )}
          </form>
        )}
      </main>
    </div>
  )
}

export default ContactPage
