import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../components/Logo'
import { CSS } from './ManifestoPage'

const PricingPage = () => {
  const [lang, setLang] = useState(() => {
    const stored = localStorage.getItem('1729_lang')
    if (stored) return stored
    return navigator.language?.slice(0, 2).toLowerCase() === 'tr' ? 'tr' : 'en'
  })
  const T = (tr, en) => (lang === 'tr' ? tr : en)

  const handleLang = (l) => {
    setLang(l)
    localStorage.setItem('1729_lang', l)
  }

  useEffect(() => {
    const id = 'mp-css'
    const existing = document.getElementById(id)
    if (existing) existing.remove()
    const style = document.createElement('style')
    style.id = id
    style.textContent = CSS
    document.head.appendChild(style)
  }, [])

  return (
    <div className="mp-root">
      <nav className="mp-nav">
        <Link to="/ana-sayfa" className="mp-logo">
          <Logo size={30} centerColor="#fff" style={{ display: 'block', flexShrink: 0 }} />
          <span className="mp-logo-text">1729</span>
        </Link>
        <div className="mp-nav-right">
          <Link to="/manifesto" className="mp-nav-link">{T('Manifesto', 'Manifesto')}</Link>
          <Link to="/login" className="mp-nav-link">{T('Giriş', 'Sign in')}</Link>
          <div className="mp-lang-toggle">
            <button className={`mp-lang-btn${lang === 'tr' ? ' active' : ''}`} onClick={() => handleLang('tr')}>TR</button>
            <button className={`mp-lang-btn${lang === 'en' ? ' active' : ''}`} onClick={() => handleLang('en')}>EN</button>
          </div>
        </div>
      </nav>

      <div className="mp-body">
        <h1 className="mp-h1">{T('Fiyat', 'Pricing')}</h1>
        <p className="mp-lead">
          {T(
            'Armağanlar hiçbir zaman fiyatlanmaz. Vermek de almak da ücretsizdir.',
            'Gifts are never priced. Giving and receiving are both free.'
          )}
        </p>

        <section className="mp-section">
          <h2 className="mp-h2">{T('Neden bir ücret var?', 'Why is there a fee?')}</h2>
          <p className="mp-p">
            {T(
              'Ücret armağan için değil, bu ortak alanda yer almak için. Sunucuların, e-postaların ve geliştirmenin masrafını üyeler birlikte karşılar. Reklam yok, veri satışı yok.',
              'The fee is not for the gifts. It is for having a place in this shared space. Members together cover the cost of the servers, the e-mails and the development. No ads, no selling of data.'
            )}
          </p>
        </section>

        <section className="mp-section">
          <h2 className="mp-h2">{T('Ne kadar?', 'How much?')}</h2>
          <ul className="mp-list">
            <li>
              <strong>{T('Ayda 2 dolar.', '2 dollars a month.')}</strong>{' '}
              {T('6 ya da 12 aylık ödersin: 12 dolar ya da 24 dolar.', 'You pay for 6 or 12 months: 12 dollars or 24 dollars.')}
            </li>
            <li>
              <strong>{T('Başkalarını ekliyorsan yarı fiyat.', 'Half price when you add others.')}</strong>{' '}
              {T(
                'Bir topluluk kurup başkalarını ekliyorsan, eklediğin her kişi için ayda 1 dolar. Davet edilen kişi, kimin ödediğini bilmez.',
                'If you found a community and add others, it is 1 dollar a month for each person you add. The person you add does not know who paid.'
              )}
            </li>
          </ul>
        </section>

        <section className="mp-section">
          <h2 className="mp-h2">{T('Şimdi', 'Right now')}</h2>
          <p className="mp-p">
            {T(
              <span><strong>Ocak 2027 sonuna kadar ücretsiz.</strong> Pilot süresince kimseden ödeme istenmez. Ödeme açılmadan önce üyelere haber veririz.</span>,
              <span><strong>Free until the end of January 2027.</strong> Nobody is asked to pay during the pilot. We will tell members before payment opens.</span>
            )}
          </p>
        </section>

        <div className="mp-cta-wrap">
          <Link to="/login?mode=signup" className="mp-cta">{T('Katıl', 'Join')}</Link>
        </div>
      </div>

      <footer className="mp-footer">
        <a href="mailto:hello@1729.eco">hello@1729.eco</a>
        <span>1729 © 2026</span>
      </footer>
    </div>
  )
}

export default PricingPage
