import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../components/Logo'

// ─── Static CSS injected once ────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400&family=DM+Mono:wght@300&display=swap');

  .lp-root {
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
    overflow-x: hidden;
    min-height: 100vh;
  }

  /* ── NAV ── */
  .lp-nav {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 100;
    padding: 24px 48px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(to bottom, #0A0A09 60%, transparent);
  }

  .lp-logo {
    display: flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
  }

  .lp-logo-text {
    font-family: var(--f-mono);
    font-size: 13px;
    font-weight: 300;
    color: var(--t);
    letter-spacing: 0.1em;
  }

  .lp-nav-right {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .lp-nav-link {
    font-family: var(--f-mono);
    font-size: 13px;
    color: var(--t);
    text-decoration: none;
    letter-spacing: 0.06em;
    transition: opacity 0.2s;
    opacity: 0.7;
  }

  .lp-nav-link:hover { opacity: 1; }

  .lp-lang-toggle { display: flex; gap: 2px; }

  .lp-lang-btn {
    background: none;
    border: none;
    font-family: var(--f-mono);
    font-size: 13px;
    color: var(--t);
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: opacity 0.2s;
    letter-spacing: 0.05em;
    opacity: 0.45;
  }

  .lp-lang-btn.active { opacity: 1; }
  .lp-lang-btn:hover  { opacity: 0.8; }

  /* ── HERO ── */
  .lp-hero {
    min-height: 92vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 120px 32px 80px;
  }

  .lp-hero-logo {
    margin-bottom: 28px;
    opacity: 0.95;
  }

  .lp-hero-intro {
    font-size: 17px;
    color: var(--t2);
    line-height: 1.75;
    max-width: 560px;
    margin: 0 auto 56px;
  }

  .lp-hero-question {
    font-family: var(--f-serif);
    font-size: clamp(30px, 5vw, 48px);
    font-weight: 400;
    line-height: 1.3;
    letter-spacing: -0.01em;
    color: var(--t);
    max-width: 800px;
    margin: 0 auto 28px;
  }

  .lp-hero-after {
    font-size: 18px;
    color: var(--t2);
    line-height: 1.7;
    max-width: 560px;
    margin: 0 auto 44px;
  }

  .lp-hero-cta {
    display: inline-block;
    background: var(--t);
    color: var(--bg);
    border: none;
    padding: 16px 32px;
    font-family: var(--f-mono);
    font-size: 13px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    text-decoration: none;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .lp-hero-cta:hover { opacity: 0.85; }

  /* ── SECTIONS ── */
  .lp-section {
    padding: 80px 48px;
    max-width: 680px;
    margin: 0 auto;
  }

  .lp-section p {
    font-size: 18px;
    color: var(--t2);
    line-height: 1.85;
    margin-bottom: 24px;
  }
  .lp-section p:last-child { margin-bottom: 0; }

  /* ── STEPS ── */
  .lp-steps-wrap {
    padding: 40px 48px 100px;
    max-width: 680px;
    margin: 0 auto;
  }

  .lp-steps-label {
    font-family: var(--f-mono);
    font-size: 10px;
    color: var(--t3);
    letter-spacing: 0.15em;
    text-transform: uppercase;
    margin-bottom: 32px;
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .lp-steps-label::after {
    content: '';
    width: 48px;
    height: 1px;
    background: var(--t3);
  }

  .lp-step {
    display: grid;
    grid-template-columns: 40px 1fr;
    gap: 20px;
    padding: 24px 0;
    border-top: 1px solid var(--bg2);
  }
  .lp-step:last-child { border-bottom: 1px solid var(--bg2); }

  .lp-step-num {
    font-family: var(--f-mono);
    font-size: 12px;
    color: var(--t3);
    letter-spacing: 0.08em;
    padding-top: 4px;
  }

  .lp-step-title {
    font-family: var(--f-serif);
    font-size: 23px;
    color: var(--t);
    margin-bottom: 10px;
    line-height: 1.35;
    font-weight: 400;
  }

  .lp-step-desc {
    font-size: 17px;
    color: var(--t2);
    line-height: 1.8;
  }

  /* ── FOOTER ── */
  .lp-footer {
    padding: 40px 48px;
    border-top: 1px solid var(--bg2);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .lp-footer-mail {
    font-family: var(--f-mono);
    font-size: 12px;
    color: var(--t2);
    text-decoration: none;
    letter-spacing: 0.04em;
    transition: color 0.2s;
  }

  .lp-footer-mail:hover { color: var(--accent); }

  .lp-footer-copy {
    font-family: var(--f-mono);
    font-size: 10px;
    color: var(--t3);
    letter-spacing: 0.06em;
  }

  /* ── FADE-IN ── */
  .lp-fade {
    opacity: 0;
    transform: translateY(16px);
    transition: opacity 0.9s ease, transform 0.9s ease;
  }
  .lp-fade.visible { opacity: 1; transform: none; }

  /* ── RESPONSIVE ── */
  @media (max-width: 768px) {
    .lp-nav         { padding: 14px 18px; }
    .lp-nav-right   { gap: 12px; }
    .lp-nav-link    { font-size: 12px; }
    .lp-lang-btn    { font-size: 12px; padding: 4px 6px; }
    .lp-logo-text   { font-size: 12px; }

    .lp-hero        { padding: 96px 20px 64px; min-height: auto; }
    .lp-hero-intro  { font-size: 15px; margin-bottom: 36px; }
    .lp-hero-question { font-size: 26px; line-height: 1.35; }
    .lp-hero-after  { font-size: 16px; margin-bottom: 32px; }
    .lp-hero-cta    { padding: 14px 24px; font-size: 12px; }

    .lp-section     { padding: 48px 20px; }
    .lp-section p   { font-size: 17px; line-height: 1.8; margin-bottom: 22px; }

    .lp-steps-wrap  { padding: 24px 20px 64px; }
    .lp-step        { grid-template-columns: 32px 1fr; gap: 14px; padding: 22px 0; }
    .lp-step-num    { font-size: 11px; padding-top: 4px; }
    .lp-step-title  { font-size: 20px; }
    .lp-step-desc   { font-size: 16px; }

    .lp-footer      { flex-direction: column; gap: 16px; padding: 28px 20px; text-align: center; }
  }
`

// ─── Fade-in hook ────────────────────────────────────────────────

function useFadeIn() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) el.classList.add('visible') },
      { threshold: 0.08 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return ref
}

// ─── Sub-components ──────────────────────────────────────────────

const FadeDiv = ({ className = '', children, style }) => {
  const ref = useFadeIn()
  return <div ref={ref} className={`lp-fade${className ? ' ' + className : ''}`} style={style}>{children}</div>
}

// ─── Main component ──────────────────────────────────────────────

const LandingPage = () => {
  const [lang, setLang] = useState(() => {
    const stored = localStorage.getItem('1729_lang')
    if (stored) return stored
    const browser = navigator.language?.slice(0, 2).toLowerCase()
    return browser === 'tr' ? 'tr' : 'en'
  })

  const T = (tr, en) => lang === 'tr' ? tr : en

  const handleLang = (l) => {
    setLang(l)
    localStorage.setItem('1729_lang', l)
  }

  // Inject CSS once
  useEffect(() => {
    const id = 'lp-css'
    if (!document.getElementById(id)) {
      const style = document.createElement('style')
      style.id = id
      style.textContent = CSS
      document.head.appendChild(style)
    }
  }, [])

  const steps = [
    {
      num:   '01',
      title: T('Biri çemberi kurar', 'Someone opens the circle'),
      desc:  T(
        'İlk ayı üstlenir, davet eder. Yönetici odur, gerektiğinde çıkarabilir. İlk aydan sonra herkes kendi katılımını sürdürür.',
        'They cover the first month and send invites. They are the steward and can remove members if needed. After the first month, everyone keeps their own membership going.'
      ),
    },
    {
      num:   '02',
      title: T('Herkes kendini tanıtır', 'Everyone introduces themselves'),
      desc:  T(
        'Dört soru, dördüncüden armağan kartın oluşur. Düzenleyebilir, yeni kart ekleyebilirsin.',
        'Four questions; the fourth becomes your gift card. You can edit it or add new cards.'
      ),
    },
    {
      num:   '03',
      title: T('Çember döner', 'The circle turns'),
      desc:  T(
        'İhtiyacın olan desteği alırsın ya da biri senin armağanına uzanır. Veren de sen, alan da.',
        'You receive the support you need, or someone reaches for your gift. You are the giver and the receiver.'
      ),
    },
  ]

  return (
    <div className="lp-root">

      {/* ── Nav ── */}
      <nav className="lp-nav">
        <a href="/" className="lp-logo">
          <Logo size={26} centerColor="#fff" style={{ display: 'block', flexShrink: 0 }} />
          <span className="lp-logo-text">1729</span>
        </a>
        <div className="lp-nav-right">
          <Link to="/manifesto" className="lp-nav-link">
            {T('Manifesto', 'Manifesto')}
          </Link>
          <Link to="/login" className="lp-nav-link">
            {T('Giriş', 'Sign in')}
          </Link>
          <div className="lp-lang-toggle">
            <button className={`lp-lang-btn${lang === 'tr' ? ' active' : ''}`} onClick={() => handleLang('tr')}>TR</button>
            <button className={`lp-lang-btn${lang === 'en' ? ' active' : ''}`} onClick={() => handleLang('en')}>EN</button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div className="lp-hero">
        <Logo size={64} centerColor="#fff" style={{ display: 'block' }} />
        <p className="lp-hero-intro" style={{ marginTop: 28 }}>
          {T(
            '1729, güvendiğin küçük bir çemberde kimin neyi kolayca verebileceğini, kimin neye ihtiyacı olduğunu görünür kılmak için tasarlandı.',
            "1729 is designed to make visible — inside a small circle you trust — who can easily give what, and who needs what."
          )}
        </p>

        <FadeDiv style={{ width: '100%' }}>
          <h1 className="lp-hero-question">
            {T(
              'Güvendiğin o topluluktan biri kapını çalsa, senden bir şey istese, destek olur muydun?',
              'If someone from a community you trust knocked on your door and asked you for something — would you help?'
            )}
          </h1>
          <p className="lp-hero-after">
            {T('Cevabın evetse, içeride buluşalım.', "If your answer is yes, let's meet inside.")}
          </p>
          <Link to="/login" className="lp-hero-cta">
            {T('Davetinle gir', 'Enter with your invite')}
          </Link>
        </FadeDiv>
      </div>

      {/* ── İki paragraf: perspektif + ego yok ── */}
      <div className="lp-section">
        <FadeDiv>
          <p>
            {T(
              'Topluluktaki biri sana diğerlerinden daha mı yakın? Hepimiz için öyle. Ama burada biraz daha geniş bakmayı deniyoruz: o topluluk seni yansıtıyor. Birine destek olmak, topluluğa destek olmaktır.',
              "Is someone in the community closer to you than the others? That's true for all of us. But here we try to look a little wider: the community reflects you. Helping one person is helping the community."
            )}
          </p>
          <p>
            {T(
              'İçeride egonu dürtecek bir şey yok. İsmin yok, cinsiyetin yok, yaşın yok, yüzün yok. Sadece bir renk kodusun. Yalnızca katmak istediğin şeyi katarsın, fazlasını değil. Sınırları sen belirlersin, ne kadar koyduğunu kimse bilmez.',
              "There's nothing inside to poke your ego. No name, no gender, no age, no face. You are just a color code. You contribute only what you want to contribute, nothing more. You set the limits, and no one knows how much you gave."
            )}
          </p>
        </FadeDiv>
      </div>

      {/* ── Nasıl çalışır (3 adım, sade) ── */}
      <div className="lp-steps-wrap">
        <div className="lp-steps-label">{T('Nasıl çalışır', 'How it works')}</div>
        <FadeDiv>
          {steps.map((s) => (
            <div key={s.num} className="lp-step">
              <div className="lp-step-num">{s.num}</div>
              <div>
                <div className="lp-step-title">{s.title}</div>
                <p className="lp-step-desc">{s.desc}</p>
              </div>
            </div>
          ))}
        </FadeDiv>
      </div>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <a href="mailto:hello@1729.eco" className="lp-footer-mail">hello@1729.eco</a>
        <Link to="/iletisim" className="lp-footer-mail" style={{ opacity: 0.6 }}>
          {T('İletişim', 'Contact')}
        </Link>
        <span className="lp-footer-copy">1729 © 2026</span>
      </footer>

    </div>
  )
}

export default LandingPage
