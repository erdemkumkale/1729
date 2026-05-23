import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

// ─── Static CSS injected once ────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400&family=DM+Mono:wght@300&display=swap');

  .lp-root {
    --bg:     #0A0A09;
    --bg2:    #111110;
    --bg3:    #181817;
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

  .lp-logo-circle {
    width: 26px; height: 26px;
    background: #fff;
    border-radius: 50%;
    flex-shrink: 0;
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
    color: var(--t2);
    text-decoration: none;
    letter-spacing: 0.06em;
    transition: color 0.2s;
  }

  .lp-nav-link:hover { color: var(--t); }

  .lp-lang-toggle { display: flex; gap: 2px; }

  .lp-lang-btn {
    background: none;
    border: none;
    font-family: var(--f-mono);
    font-size: 13px;
    color: var(--t2);
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: color 0.2s;
    letter-spacing: 0.05em;
  }

  .lp-lang-btn.active { color: var(--t); }
  .lp-lang-btn:hover  { color: var(--t); }

  /* ── HERO ── */
  .lp-hero {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 0 48px 80px;
    position: relative;
    overflow: hidden;
  }

  .lp-hero-bg-number {
    font-family: var(--f-mono);
    font-size: clamp(120px, 22vw, 280px);
    font-weight: 300;
    color: var(--t3);
    line-height: 0.85;
    letter-spacing: -0.02em;
    position: absolute;
    top: 50%;
    left: 48px;
    transform: translateY(-55%);
    pointer-events: none;
    user-select: none;
    opacity: 0.5;
  }

  .lp-hero-content {
    position: relative;
    z-index: 1;
    max-width: 600px;
  }

  .lp-hero-tagline {
    font-family: var(--f-serif);
    font-size: clamp(32px, 4.5vw, 56px);
    font-weight: 400;
    line-height: 1.2;
    letter-spacing: -0.02em;
    margin-bottom: 28px;
    color: var(--t);
  }

  .lp-hero-tagline em {
    font-style: italic;
    color: var(--accent);
  }

  .lp-hero-sub {
    font-size: 16px;
    color: var(--t2);
    line-height: 1.75;
    max-width: 460px;
    margin-bottom: 48px;
  }

  .lp-scroll-hint {
    font-family: var(--f-mono);
    font-size: 10px;
    color: var(--t3);
    letter-spacing: 0.12em;
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .lp-scroll-hint::before {
    content: '';
    display: block;
    width: 40px;
    height: 1px;
    background: var(--t3);
  }

  /* ── SECTIONS ── */
  .lp-section {
    padding: 120px 48px;
    max-width: 1100px;
    margin: 0 auto;
  }

  .lp-section-label {
    font-family: var(--f-mono);
    font-size: 10px;
    color: var(--t3);
    letter-spacing: 0.15em;
    text-transform: uppercase;
    margin-bottom: 56px;
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .lp-section-label::after {
    content: '';
    width: 48px;
    height: 1px;
    background: var(--t3);
  }

  .lp-text-block { max-width: 620px; }

  .lp-text-block p {
    font-size: 16px;
    color: var(--t2);
    line-height: 1.8;
    margin-bottom: 24px;
  }

  .lp-text-block p:last-child { margin-bottom: 0; }
  .lp-text-block strong { color: var(--t); font-weight: 400; }

  .lp-pull-quote {
    font-family: var(--f-serif);
    font-size: clamp(24px, 3.5vw, 38px);
    color: var(--t);
    line-height: 1.3;
    letter-spacing: -0.01em;
    margin: 64px 0;
    padding-left: 28px;
    border-left: 1px solid var(--accent);
    max-width: 680px;
  }

  /* ── HEX ROW ── */
  .lp-hex-row {
    display: flex;
    gap: 14px;
    margin: 48px 0;
    flex-wrap: wrap;
    align-items: flex-end;
  }

  .lp-hex-dot-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .lp-hex-circle {
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.07);
  }

  .lp-hex-label {
    font-family: var(--f-mono);
    font-size: 8px;
    color: var(--t3);
    letter-spacing: 0.04em;
  }

  /* ── ENCOUNTERS ── */
  .lp-encounters {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2px;
    margin-top: 56px;
  }

  .lp-encounter {
    background: var(--bg2);
    padding: 36px 32px;
  }

  .lp-enc-hex-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
  }

  .lp-enc-dot {
    width: 36px; height: 36px;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.08);
    flex-shrink: 0;
  }

  .lp-enc-code {
    font-family: var(--f-mono);
    font-size: 9px;
    color: var(--t3);
    letter-spacing: 0.05em;
  }

  .lp-enc-arrow { font-size: 16px; color: var(--t3); margin: 0 4px; }

  .lp-encounter-story {
    font-size: 15px;
    color: var(--t2);
    line-height: 1.8;
  }

  .lp-encounter-story strong { color: var(--t); font-weight: 400; }

  .lp-encounter-end {
    font-size: 12px;
    color: var(--t3);
    font-family: var(--f-mono);
    margin-top: 20px;
    letter-spacing: 0.04em;
  }

  /* ── STEPS ── */
  .lp-steps {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2px;
    margin-top: 56px;
  }

  .lp-step { background: var(--bg2); padding: 32px; }

  .lp-step-num {
    font-family: var(--f-mono);
    font-size: 9px;
    color: var(--t3);
    letter-spacing: 0.12em;
    margin-bottom: 14px;
    text-transform: uppercase;
  }

  .lp-step-title {
    font-family: var(--f-serif);
    font-size: 21px;
    color: var(--t);
    margin-bottom: 10px;
    line-height: 1.3;
  }

  .lp-step-desc { font-size: 14px; color: var(--t2); line-height: 1.75; }

  /* ── INVITE ── */
  .lp-invite {
    background: var(--bg2);
    padding: 120px 48px;
    position: relative;
    overflow: hidden;
  }

  .lp-invite::before {
    content: '';
    position: absolute;
    top: -120px; right: -120px;
    width: 480px; height: 480px;
    border-radius: 50%;
    border: 1px solid var(--t3);
    opacity: 0.25;
  }

  .lp-invite::after {
    content: '';
    position: absolute;
    top: -60px; right: -60px;
    width: 280px; height: 280px;
    border-radius: 50%;
    border: 1px solid var(--t3);
    opacity: 0.15;
  }

  .lp-invite-inner {
    max-width: 1100px;
    margin: 0 auto;
    position: relative;
    z-index: 1;
  }

  .lp-invite-title {
    font-family: var(--f-serif);
    font-size: clamp(36px, 5.5vw, 60px);
    line-height: 1.15;
    letter-spacing: -0.02em;
    max-width: 520px;
    margin-bottom: 20px;
    color: var(--t);
    font-weight: 400;
  }

  .lp-invite-desc {
    font-size: 15px;
    color: var(--t2);
    max-width: 440px;
    line-height: 1.75;
    margin-bottom: 48px;
  }

  /* ── FORM ── */
  .lp-form { max-width: 480px; }
  .lp-form-group { margin-bottom: 14px; }

  .lp-form-label {
    font-family: var(--f-mono);
    font-size: 9px;
    color: var(--t3);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    display: block;
    margin-bottom: 8px;
  }

  .lp-form-input,
  .lp-form-textarea {
    width: 100%;
    background: var(--bg);
    border: 1px solid var(--t3);
    border-radius: 0;
    padding: 12px 16px;
    font-size: 14px;
    color: var(--t);
    font-family: var(--f-sans);
    font-weight: 300;
    outline: none;
    transition: border-color 0.2s;
    resize: none;
  }

  .lp-form-input::placeholder,
  .lp-form-textarea::placeholder { color: var(--t3); }

  .lp-form-input:focus,
  .lp-form-textarea:focus { border-color: var(--accent); }

  .lp-form-textarea { height: 130px; }

  .lp-form-submit {
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

  .lp-form-submit:hover,
  .lp-form-submit.sent {
    border-color: var(--accent);
    color: var(--accent);
  }

  .lp-form-submit:disabled { opacity: 0.6; cursor: default; }
  .lp-form-submit::after { content: '→'; font-size: 15px; }

  /* ── RAMANUJAN ── */
  .lp-ramanujan {
    padding: 80px 48px;
    max-width: 1100px;
    margin: 0 auto;
    border-top: 1px solid var(--t3);
    display: flex;
    gap: 64px;
    align-items: flex-start;
  }

  .lp-ramanujan-num {
    font-family: var(--f-mono);
    font-size: 52px;
    font-weight: 300;
    color: var(--t3);
    flex-shrink: 0;
    line-height: 1;
  }

  .lp-ramanujan-text {
    font-size: 13px;
    color: var(--t3);
    line-height: 1.75;
    max-width: 500px;
  }

  .lp-ramanujan-text strong { color: var(--t2); font-weight: 400; }

  /* ── FOOTER ── */
  .lp-footer {
    padding: 40px 48px;
    border-top: 1px solid var(--t3);
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
    transform: translateY(24px);
    transition: opacity 0.9s ease, transform 0.9s ease;
  }

  .lp-fade.visible { opacity: 1; transform: none; }

  /* ── RESPONSIVE ── */
  @media (max-width: 768px) {
    .lp-nav         { padding: 16px 20px; }
    .lp-nav-right   { gap: 14px; }
    .lp-nav-link    { font-size: 12px; }
    .lp-lang-btn    { font-size: 12px; padding: 4px 6px; }
    .lp-hero        { padding: 0 20px 60px; }
    .lp-hero-bg-number { left: 20px; font-size: 30vw; }
    .lp-section     { padding: 72px 20px; }
    .lp-encounters  { grid-template-columns: 1fr; }
    .lp-steps       { grid-template-columns: 1fr; }
    .lp-invite      { padding: 80px 24px; }
    .lp-ramanujan   { flex-direction: column; gap: 20px; padding: 56px 24px; }
    .lp-footer      { flex-direction: column; gap: 16px; padding: 32px 24px; text-align: center; }
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
    return () => {
      // Don't remove — causes flash if navigating back
    }
  }, [])

  const hexDots = [
    { color: '#8B4513', size: 52 },
    { color: '#C67B2A', size: 44 },
    { color: '#7A9E4F', size: 48 },
    { color: '#D4A017', size: 40 },
    { color: '#6B3FA0', size: 56 },
    { color: '#E8623A', size: 44 },
    { color: '#C43B6E', size: 48 },
    { color: '#3D7AB8', size: 42 },
  ]

  return (
    <div className="lp-root">

      {/* ── Nav ── */}
      <nav className="lp-nav">
        <a href="/" className="lp-logo">
          <div className="lp-logo-circle" />
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
        <div className="lp-hero-bg-number">1729</div>
        <FadeDiv className="lp-hero-content">
          <h1 className="lp-hero-tagline">
            {T(
              <>{`Hepimiz dev bir`}<br /><em>{`puzzle'ın parçasıyız.`}</em></>,
              <>{'We are all pieces'}<br />{'of a '}<em>{'giant puzzle.'}</em></>
            )}
          </h1>
          <p className="lp-hero-sub">
            {T(
              'Her birimizin yeri çok özel. Ama bir diğeriyle temas kurup bir şeyler ortaya çıkarmadan bu ilişki ağını göremiyoruz.',
              "Each of us has a unique place. But we can't see the web of connection until we touch someone else and something emerges."
            )}
          </p>
          <div className="lp-scroll-hint">{T('AŞAĞI KAY', 'SCROLL')}</div>
        </FadeDiv>
      </div>

      {/* ── Bölüm 1: Sistem ── */}
      <div className="lp-section">
        <div className="lp-section-label">{T('Nerede kayboldu?', 'Where did it go?')}</div>
        <FadeDiv className="lp-text-block">
          <p>
            {T(
              <span>Mevcut sistem o kadar farklı bir yöne gitmiş ki <strong>puzzle parçası olduğumuz gerçeğini tamamen görmez olduk.</strong> Unvanlar verildi. Hiyerarşiler kuruldu. Kimin ne kadar değerli olduğuna karar verildi — kim olduğuna göre, ne yapabileceğine göre değil.</span>,
              <span>The current system has gone so far in a different direction that <strong>we've completely lost sight of the fact that we are puzzle pieces.</strong> Titles were given. Hierarchies were built. Someone decided who was valuable — based on position, not on what they could truly give.</span>
            )}
          </p>
          <p>
            {T(
              'Bu sistem son 250 yılda kuruldu. Doğal değil — inşa edildi. Ve bir şeyi hiç çözemedi: yalnızlığı. Anlamı. Gerçek bağı.',
              "This system was built in the last 250 years. It isn't natural — it was constructed. And it never solved one thing: loneliness. Meaning. Real connection."
            )}
          </p>
          <div className="lp-pull-quote">
            {T(
              <>Önce ikili takımlardan başlıyoruz.<br />Isınma turlarından. Sonra daha büyük şeyler.</>,
              <>We start with pairs.<br />Warm-up rounds. Then bigger things.</>
            )}
          </div>
          <p>
            {T(
              'En basit halinle, en eforsuz halinle — aileye, topluluğa, kente, dünyaya ne katmaktan en çok keyif alırsın? Bunu bul. Bunu paylaş. Biri seni duyacak.',
              "In your simplest form, your most effortless form — what do you most enjoy contributing to your family, community, city, world? Find it. Share it. Someone will hear you."
            )}
          </p>
        </FadeDiv>
      </div>

      {/* ── Bölüm 2: Kimlik ── */}
      <div className="lp-section" style={{ paddingTop: 0 }}>
        <div className="lp-section-label">{T('Kimlik', 'Identity')}</div>
        <FadeDiv>
          <p className="lp-text-block" style={{ fontSize: 15, color: 'var(--t2)', marginBottom: 32 }}>
            {T(
              'Burada isim yok. Unvan yok. Geçmiş yok. Herkes bir hex renk koduyla temsil ediliyor. Kimlik paylaşmak tamamen sana kalmış — platform zorlamaz, teşvik etmez.',
              'No names. No titles. No history. Everyone is a hex color code. Sharing your identity is entirely your choice — the platform neither forces nor encourages it.'
            )}
          </p>

          <div className="lp-hex-row">
            {hexDots.map(({ color, size }) => (
              <div key={color} className="lp-hex-dot-item">
                <div className="lp-hex-circle" style={{ width: size, height: size, background: color }} />
                <span className="lp-hex-label">{color}</span>
              </div>
            ))}
          </div>
        </FadeDiv>

        {/* Encounters */}
        <FadeDiv className="lp-encounters">
          <div className="lp-encounter">
            <div className="lp-enc-hex-row">
              <div className="lp-enc-dot" style={{ background: '#7A9E4F' }} />
              <span className="lp-enc-code">#7A9E4F</span>
              <span className="lp-enc-arrow">↔</span>
              <div className="lp-enc-dot" style={{ background: '#6B3FA0' }} />
              <span className="lp-enc-code">#6B3FA0</span>
            </div>
            <p className="lp-encounter-story">
              {T(
                <><strong>#7A9E4F</strong> 35 yıl acil serviste çalıştı. Şimdi emekli. Platformda kimse bunu bilmiyor.<br /><br /><strong>#6B3FA0</strong> avukat. Hastaneye gitmeden önce kafası karışık, doktora ne soracağını bilmiyor. #7A9E4F'in armağanını buluyor: <em>"Hastane öncesi veya sonrası konuşalım."</em><br /><br />Bir saat konuşuyorlar. Sonra #6B3FA0'ın armağanını görüyor: <em>"İmzalamadan önce sözleşmenize bakayım."</em> Annesinin kira sözleşmesi var, aydır kafasında.</>,
                <><strong>#7A9E4F</strong> spent 35 years in emergency rooms. Now retired. Nobody on the platform knows this.<br /><br /><strong>#6B3FA0</strong> is a lawyer. About to go to the hospital, doesn't know what to ask the doctor. Finds #7A9E4F's gift: <em>"Let's talk before or after your appointment."</em><br /><br />One hour later, #6B3FA0 walks in knowing exactly what to say. Then notices <em>"I'll review your contract before you sign."</em> There's a lease situation that's been on her mind for months.</>
              )}
            </p>
            <div className="lp-encounter-end">
              {T("İkisi de birbirinin kim olduğunu bilmiyor. İkisi de bir şey aldı.", "Neither knows who the other is. Both received something real.")}
            </div>
          </div>

          <div className="lp-encounter">
            <div className="lp-enc-hex-row">
              <div className="lp-enc-dot" style={{ background: '#D4A017' }} />
              <span className="lp-enc-code">#D4A017</span>
              <span className="lp-enc-arrow">↔</span>
              <div className="lp-enc-dot" style={{ background: '#3D7AB8' }} />
              <span className="lp-enc-code">#3D7AB8</span>
            </div>
            <p className="lp-encounter-story">
              {T(
                <><strong>#D4A017</strong> barista. Kahve demlemeyi seviyor ama hayatın geri kalanında kaybolmuş.<br /><br /><strong>#3D7AB8</strong> muhasebeci. Stresli, sıkışmış, küçük bir nefese ihtiyacı var. #D4A017'nin armağanını buluyor: <em>"Evde daha iyi kahve için 30 dakika."</em><br /><br />Otuz dakika sonra #3D7AB8 farklı bir şey hissediyor. Sonra #3D7AB8'in armağanını görüyor: <em>"Vergi beyannamesi öncesi bir saat konuşalım."</em> #D4A017'nin tam ihtiyacı olan şey bu.</>,
                <><strong>#D4A017</strong> is a barista. Passionate about coffee, lost about everything else.<br /><br /><strong>#3D7AB8</strong> is an accountant. Stressed, stuck, needing a small breath. Finds #D4A017's gift: <em>"30 minutes for better coffee at home."</em><br /><br />Thirty minutes later, #3D7AB8 feels something shift. Then notices <em>"Let's talk before your tax return."</em> Exactly what #D4A017 needed.</>
              )}
            </p>
            <div className="lp-encounter-end">
              {T("Sistem bunu planlamadı. Sadece alan açtı.", "The system didn't plan this. It just opened the space.")}
            </div>
          </div>
        </FadeDiv>
      </div>

      {/* ── Bölüm 3: Nasıl çalışır ── */}
      <div className="lp-section" style={{ paddingTop: 0 }}>
        <div className="lp-section-label">{T('Nasıl çalışır', 'How it works')}</div>
        <FadeDiv className="lp-steps">
          {[
            {
              num:   T('01 — HEDİYEN', '01 — YOUR GIFT'),
              title: T('Eforsuzca verebileceğin şey ne?', 'What can you give effortlessly?'),
              desc:  T('Sana oyun gibi gelen ama başkasına değer katan şeyi paylaşırsın. Karşılık beklemeden. Fiyat koymadan.', "You share what feels like play to you but could change someone else's life. Without expecting anything back. Without a price tag."),
            },
            {
              num:   T('02 — GÜVEN ÇEMBERİ', '02 — TRUST CIRCLE'),
              title: T('Yavaş ama gerçek büyür.', 'Grows slowly. Grows real.'),
              desc:  T('Birinden bir şey aldığında güven çemberin genişler. Zorla değil — seninle. Davet ettiğin kişiler topluluğunu oluşturur.', 'When you receive something from someone, your trust circle expands. Not by force — by your choice. The people you invite form your community.'),
            },
            {
              num:   T('03 — ANONİMLİK', '03 — ANONYMITY'),
              title: T('Ego işin içine girmiyor.', 'No ego in the equation.'),
              desc:  T('Herkes hex rengiyle görünür. Kimlik paylaşmak tamamen sana kalmış. Platform zorlamaz, teşvik etmez.', "Everyone appears as a hex color. Sharing your identity is entirely your choice. The platform neither forces nor encourages it."),
            },
            {
              num:   T('04 — DÖNGÜ', '04 — THE LOOP'),
              title: T('Kapanmıyor — büyüyor.', "Doesn't close — grows."),
              desc:  T('Veren topluluğa veriyor. Alan topluluktan alıyor. Doğrudan alışveriş yok. Döngü büyüdükçe herkes kazanıyor.', 'The giver gives to the community. The receiver takes from the community. No direct exchange. As the loop grows, everyone gains.'),
            },
          ].map((step, i) => (
            <div key={i} className="lp-step">
              <div className="lp-step-num">{step.num}</div>
              <div className="lp-step-title">{step.title}</div>
              <p className="lp-step-desc">{step.desc}</p>
            </div>
          ))}
        </FadeDiv>
      </div>


      {/* ── Ramanujan ── */}
      <FadeDiv className="lp-ramanujan">
        <div className="lp-ramanujan-num">1729</div>
        <div className="lp-ramanujan-text">
          {T(
            <span>Hintli matematikçi Ramanujan, bir hastane odasında yatıyordu. Ziyaretine gelen arkadaşı "1729 numaralı taksiye bindim, sıradan bir sayı" dedi. Ramanujan hemen cevapladı: <strong>"Hayır. İki farklı şekilde iki küpün toplamı olarak ifade edilebilen en küçük sayı."</strong><br /><br />Görünüşte sıradan. İçinde derin bir şey saklı. Tıpkı her insanın içinde taşıdığı hediye gibi.</span>,
            <span>Mathematician Ramanujan was lying in a hospital bed. His friend said "I came in taxi number 1729, rather a dull number." Ramanujan replied immediately: <strong>"No. It is the smallest number expressible as the sum of two cubes in two different ways."</strong><br /><br />Ordinary on the surface. Extraordinary within. Just like the gift every person carries.</span>
          )}
        </div>
      </FadeDiv>

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
