import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../components/Logo'

// ─── Static CSS injected once ────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&family=DM+Mono:wght@400&display=swap');

  .lp-root {
    --bg:  #0A0A09;
    --bg2: #1A1A18;
    --t:   #F2EEE8;
    --t2:  #C4BFB8;
    --t3:  #8F8A84;
    --f-sans: 'DM Sans', sans-serif;
    --f-mono: 'DM Mono', monospace;

    background: var(--bg);
    color: var(--t);
    font-family: var(--f-sans);
    font-weight: 400;
    font-size: 19px;
    line-height: 1.7;
    min-height: 100vh;
  }

  .lp-nav {
    display: flex; justify-content: space-between; align-items: center;
    max-width: 760px; margin: 0 auto; padding: 24px 24px;
  }
  .lp-logo { display: flex; align-items: center; gap: 12px; text-decoration: none; color: var(--t); }
  .lp-logo-text { font-family: var(--f-mono); font-size: 18px; letter-spacing: 0.08em; }
  .lp-nav-right { display: flex; align-items: center; gap: 20px; }
  .lp-nav-link { font-size: 16px; color: var(--t2); text-decoration: none; }
  .lp-nav-link:hover { color: var(--t); }
  .lp-lang-toggle { display: flex; gap: 2px; }
  .lp-lang-btn {
    background: none; border: none; font-family: var(--f-mono); font-size: 15px;
    color: var(--t3); cursor: pointer; padding: 4px 8px; border-radius: 4px;
  }
  .lp-lang-btn.active { color: var(--t); }

  .lp-main { max-width: 760px; margin: 0 auto; padding: 0 24px 80px; }

  .lp-hero { padding: 56px 0 40px; }
  .lp-h1 { font-size: 56px; font-weight: 700; line-height: 1.1; margin: 20px 0 24px; letter-spacing: -0.01em; }
  .lp-definition { font-size: 26px; line-height: 1.5; color: var(--t); max-width: 680px; margin: 0 0 32px; }
  .lp-cta-row { display: flex; flex-wrap: wrap; align-items: center; gap: 20px; }
  .lp-cta {
    display: inline-block; background: var(--t); color: var(--bg);
    padding: 16px 36px; font-size: 18px; font-weight: 500; text-decoration: none; border-radius: 6px;
  }
  .lp-cta:hover { opacity: 0.88; }
  .lp-cta-sub { font-size: 16px; color: var(--t3); margin: 16px 0 0; }
  .lp-link { color: var(--t); }

  .lp-section { padding: 40px 0 8px; border-top: 1px solid var(--bg2); margin-top: 40px; }
  .lp-h2 { font-size: 32px; font-weight: 700; margin: 0 0 24px; line-height: 1.25; }

  .lp-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 20px; }
  .lp-list li { color: var(--t2); }
  .lp-list strong { color: var(--t); font-weight: 700; }

  .lp-steps { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 18px; counter-reset: step; }
  .lp-steps li { display: grid; grid-template-columns: 40px 1fr; gap: 12px; color: var(--t2); }
  .lp-steps li::before {
    counter-increment: step; content: counter(step);
    font-family: var(--f-mono); font-size: 18px; color: var(--t); padding-top: 1px;
  }
  .lp-steps strong { color: var(--t); font-weight: 700; }

  .lp-text { color: var(--t2); margin: 0; }

  .lp-footer {
    max-width: 760px; margin: 0 auto; padding: 32px 24px; border-top: 1px solid var(--bg2);
    display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;
    font-size: 15px; color: var(--t3);
  }
  .lp-footer a { color: var(--t2); text-decoration: none; }

  @media (max-width: 768px) {
    .lp-root { font-size: 18px; }
    .lp-nav { padding: 16px 20px; }
    .lp-main { padding: 0 20px 56px; }
    .lp-hero { padding: 32px 0 24px; }
    .lp-h1 { font-size: 44px; }
    .lp-definition { font-size: 22px; }
    .lp-h2 { font-size: 28px; }
    .lp-footer { padding: 24px 20px; }
  }
`

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

  useEffect(() => {
    const id = 'lp-css'
    const existing = document.getElementById(id)
    if (existing) existing.remove()
    const style = document.createElement('style')
    style.id = id
    style.textContent = CSS
    document.head.appendChild(style)
  }, [])

  const principles = [
    {
      term: T('Anonim.', 'Anonymous.'),
      text: T(
        'Kimsenin adı, unvanı, geçmişi görünmez. Herkes bir renktir. Böylece vermek için çekinmeni gerektiren bir şey kalmaz.',
        'No one’s name, title or history is visible. Everyone is a colour. Nothing is left that would make you hesitate to give.'
      ),
    },
    {
      term: T('Karşılıksız.', 'Unconditional.'),
      text: T(
        'Armağan karşılık beklemeden verilir. Borç ve takas oluşmaz.',
        'A gift is given without expecting anything back. No debt, no trade.'
      ),
    },
    {
      term: T('Topluluk için.', 'For the community.'),
      text: T(
        'Amaç kişisel kazanç değil, topluluğu güçlendirmektir.',
        'The aim is not personal gain. It is to strengthen the community.'
      ),
    },
    {
      term: T('Sınır sende.', 'The limit is yours.'),
      text: T(
        'İlk sınırı ortak alanın kuralları çizer. Tanışmak ya da kendini açmak sana kalmıştır; istediğin ölçüde, istediğin zaman.',
        'The rules of the shared space draw the first limit. Getting to know someone or opening up is up to you, as much as you want, whenever you want.'
      ),
    },
  ]

  const steps = [
    {
      title: T('Topluluğunu kur ya da davetle katıl.', 'Found your community or join by invitation.'),
      text: T('Kurarsan güvendiğin en az iki kişiyi davet edersin. Davet edilirsen doğrudan o topluluğa girersin.',
              'If you found one, you invite at least two people you trust. If you are invited, you join that community directly.'),
    },
    {
      title: T('Dört soruyu yanıtla.', 'Answer four questions.'),
      text: T('Yanıtlarından armağan kartın oluşur. Neye ihtiyaç duyduğun da yanıtlarından anlaşılır, ilan etmen gerekmez.',
              'Your gift card is made from your answers. What you need also shows in your answers; you never have to announce it.'),
    },
    {
      title: T('Armağan kartlarına bak.', 'Browse gift cards.'),
      text: T('Topluluğundaki kartları görürsün. İhtiyacın olanı iste.',
              'You see the cards in your community. Ask for what you need.'),
    },
    {
      title: T('Yazışın, armağan elden ele geçsin.', 'Talk, and let the gift change hands.'),
      text: T('İki taraf site içinde yazışır. Kargo ya da buluşma gibi ayrıntıları kendiniz halledersiniz.',
              'The two of you talk inside the site. You sort out details like shipping or meeting yourselves.'),
    },
    {
      title: T('"Teslim aldım" de.', 'Mark it as received.'),
      text: T('İstersen veren kişiyi güven çemberine ekle.',
              'If you like, add the giver to your trust circle.'),
    },
  ]

  return (
    <div className="lp-root">
      <nav className="lp-nav">
        <a href="/" className="lp-logo">
          <Logo size={30} centerColor="#fff" style={{ display: 'block', flexShrink: 0 }} />
          <span className="lp-logo-text">1729</span>
        </a>
        <div className="lp-nav-right">
          <Link to="/manifesto" className="lp-nav-link">{T('Manifesto', 'Manifesto')}</Link>
          <Link to="/fiyat" className="lp-nav-link">{T('Fiyat', 'Pricing')}</Link>
          <Link to="/login" className="lp-nav-link">{T('Giriş', 'Sign in')}</Link>
          <div className="lp-lang-toggle">
            <button className={`lp-lang-btn${lang === 'tr' ? ' active' : ''}`} onClick={() => handleLang('tr')}>TR</button>
            <button className={`lp-lang-btn${lang === 'en' ? ' active' : ''}`} onClick={() => handleLang('en')}>EN</button>
          </div>
        </div>
      </nav>

      <main className="lp-main">
        <div className="lp-hero">
          <h1 className="lp-h1">1729</h1>
          <p className="lp-definition">
            {T(
              '1729, bir topluluğun içinde insanların birbirine karşılıksız armağan verdiği, anonim bir ortak alandır.',
              '1729 is an anonymous shared space where people inside a community give each other gifts, with nothing expected in return.'
            )}
          </p>
          <div className="lp-cta-row">
            <Link to="/login?mode=signup" className="lp-cta">{T('Katıl', 'Join')}</Link>
            <Link to="/login" className="lp-link">{T('Zaten üyeyim, giriş yap', 'I already have an account')}</Link>
          </div>
          <p className="lp-cta-sub">
            {T('Davet aldıysan e-postandaki linke tıkla. Almadıysan kendi topluluğunu kurarak başlayabilirsin.',
               'Got an invitation? Open the link in your email. If not, you can start by founding your own community.')}
          </p>
        </div>

        <section className="lp-section">
          <h2 className="lp-h2">{T('Neden böyle?', 'Why is it built this way?')}</h2>
          <ul className="lp-list">
            {principles.map((p) => (
              <li key={p.term}><strong>{p.term}</strong> {p.text}</li>
            ))}
          </ul>
          <p className="lp-text" style={{ marginTop: 20 }}>
            {T(
              'Pazarda ödersin ve hesap kapanır. Armağan öyle değil: dolaşmaya devam eder. Sana verene geri vermek zorunda değilsin. Önemli olan hesap değil, aramızdaki bağ.',
              'In a market you pay and the account is settled. A gift is different: it keeps moving. You do not have to give back to the one who gave to you. What matters is the bond, not the balance.'
            )}{' '}
            <Link to="/manifesto" className="lp-link">{T('Manifesto\'yu oku', 'Read the manifesto')}</Link>
          </p>
        </section>

        <section className="lp-section">
          <h2 className="lp-h2">{T('Nasıl çalışır?', 'How does it work?')}</h2>
          <ol className="lp-steps">
            {steps.map((s) => (
              <li key={s.title}>
                <div><strong>{s.title}</strong> {s.text}</div>
              </li>
            ))}
          </ol>
        </section>

        <section className="lp-section">
          <h2 className="lp-h2">{T('Ücret', 'Price')}</h2>
          <p className="lp-text">
            {T('Ocak 2027 sonuna kadar ücretsiz.', 'Free until the end of January 2027.')}{' '}
            <Link to="/fiyat" className="lp-link">{T('Ayrıntılar', 'Details')}</Link>
          </p>
        </section>
      </main>

      <footer className="lp-footer">
        <a href="mailto:hello@1729.eco">hello@1729.eco</a>
        <Link to="/iletisim">{T('İletişim', 'Contact')}</Link>
        <span>1729 © 2026</span>
      </footer>
    </div>
  )
}

export default LandingPage
