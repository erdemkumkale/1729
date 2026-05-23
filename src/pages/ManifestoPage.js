import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const MANIFESTO_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400&family=DM+Mono:wght@300&display=swap');

  .mp-root {
    --bg:     #0A0A09;
    --bg2:    #111110;
    --t:      #EDE9E3;
    --t2:     #7A7670;
    --t3:     #3A3835;
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
  }

  .mp-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    padding: 24px 48px;
    display: flex; justify-content: space-between; align-items: center;
    background: linear-gradient(to bottom, #0A0A09 60%, transparent);
  }

  .mp-logo { display: flex; align-items: center; gap: 12px; text-decoration: none; }
  .mp-logo-circle { width: 26px; height: 26px; background: #fff; border-radius: 50%; flex-shrink: 0; }
  .mp-logo-text { font-family: var(--f-mono); font-size: 13px; font-weight: 300; color: var(--t); letter-spacing: 0.1em; }

  .mp-nav-right { display: flex; align-items: center; gap: 20px; }

  .mp-nav-link {
    font-family: var(--f-mono); font-size: 11px; color: var(--t3);
    text-decoration: none; letter-spacing: 0.08em; transition: color 0.2s;
  }
  .mp-nav-link:hover { color: var(--t2); }

  .mp-lang-toggle { display: flex; gap: 2px; }
  .mp-lang-btn {
    background: none; border: none; font-family: var(--f-mono); font-size: 11px;
    color: var(--t3); cursor: pointer; padding: 4px 8px; border-radius: 4px;
    transition: color 0.2s; letter-spacing: 0.05em;
  }
  .mp-lang-btn.active { color: var(--t); }

  .mp-body {
    max-width: 680px;
    margin: 0 auto;
    padding: 160px 48px 120px;
  }

  .mp-eyebrow {
    font-family: var(--f-mono); font-size: 10px; color: var(--t3);
    letter-spacing: 0.15em; text-transform: uppercase;
    margin-bottom: 48px; display: flex; align-items: center; gap: 16px;
  }
  .mp-eyebrow::after { content: ''; width: 48px; height: 1px; background: var(--t3); }

  .mp-title {
    font-family: var(--f-serif);
    font-size: clamp(36px, 5vw, 52px);
    font-weight: 400; line-height: 1.2; letter-spacing: -0.02em;
    margin-bottom: 72px; color: var(--t);
  }
  .mp-title em { font-style: italic; color: var(--accent); }

  .mp-section { margin-bottom: 64px; }

  .mp-section-title {
    font-family: var(--f-serif); font-size: 22px; color: var(--t);
    font-weight: 400; margin-bottom: 20px; line-height: 1.3;
  }

  .mp-p { font-size: 16px; color: var(--t2); line-height: 1.85; margin-bottom: 18px; }
  .mp-p:last-child { margin-bottom: 0; }
  .mp-p strong { color: var(--t); font-weight: 400; }

  .mp-divider { width: 48px; height: 1px; background: var(--t3); margin: 56px 0; }

  .mp-pull {
    font-family: var(--f-serif);
    font-size: clamp(20px, 3vw, 28px);
    color: var(--t); line-height: 1.4;
    padding-left: 24px; border-left: 1px solid var(--accent);
    margin: 56px 0;
  }

  .mp-list {
    list-style: none; padding: 0; margin: 0 0 18px;
  }
  .mp-list li {
    font-size: 16px; color: var(--t2); line-height: 1.85;
    padding-left: 20px; position: relative; margin-bottom: 10px;
  }
  .mp-list li::before {
    content: '—'; position: absolute; left: 0;
    color: var(--t3); font-family: var(--f-mono); font-size: 12px;
  }
  .mp-list li strong { color: var(--t); font-weight: 400; }

  .mp-ending {
    font-family: var(--f-serif);
    font-size: clamp(20px, 3vw, 26px);
    color: var(--t); line-height: 1.5;
    margin-top: 72px;
  }
  .mp-ending em { font-style: italic; color: var(--accent); }

  .mp-footer {
    padding: 40px 48px; border-top: 1px solid var(--t3);
    display: flex; justify-content: space-between; align-items: center;
  }
  .mp-footer-mail {
    font-family: var(--f-mono); font-size: 12px; color: var(--t2);
    text-decoration: none; letter-spacing: 0.04em; transition: color 0.2s;
  }
  .mp-footer-mail:hover { color: var(--accent); }
  .mp-footer-copy { font-family: var(--f-mono); font-size: 10px; color: var(--t3); letter-spacing: 0.06em; }

  @media (max-width: 768px) {
    .mp-nav  { padding: 20px 24px; }
    .mp-nav-link { display: none; }
    .mp-body { padding: 120px 24px 80px; }
    .mp-footer { flex-direction: column; gap: 16px; padding: 32px 24px; text-align: center; }
  }
`

const ManifestoPage = () => {
  const [lang, setLang] = useState(() => {
    const stored = localStorage.getItem('1729_lang')
    if (stored) return stored
    return navigator.language?.slice(0, 2).toLowerCase() === 'tr' ? 'tr' : 'en'
  })

  const T = (tr, en) => lang === 'tr' ? tr : en

  const handleLang = (l) => {
    setLang(l)
    localStorage.setItem('1729_lang', l)
  }

  useEffect(() => {
    const id = 'mp-css'
    if (!document.getElementById(id)) {
      const style = document.createElement('style')
      style.id = id
      style.textContent = MANIFESTO_CSS
      document.head.appendChild(style)
    }
  }, [])

  return (
    <div className="mp-root">

      {/* ── Nav ── */}
      <nav className="mp-nav">
        <Link to="/" className="mp-logo">
          <div className="mp-logo-circle" />
          <span className="mp-logo-text">1729</span>
        </Link>
        <div className="mp-nav-right">
          <Link to="/login" className="mp-nav-link">{T('Giriş', 'Sign in')}</Link>
          <div className="mp-lang-toggle">
            <button className={`mp-lang-btn${lang === 'tr' ? ' active' : ''}`} onClick={() => handleLang('tr')}>TR</button>
            <button className={`mp-lang-btn${lang === 'en' ? ' active' : ''}`} onClick={() => handleLang('en')}>EN</button>
          </div>
        </div>
      </nav>

      <div className="mp-body">
        <div className="mp-eyebrow">{T('Manifesto', 'Manifesto')}</div>

        <h1 className="mp-title">
          {T(
            <>1729 — <em>Güven Çemberleri</em></>,
            <>1729 — <em>Trust Circles</em></>
          )}
        </h1>

        {/* ── 1 ── */}
        <div className="mp-section">
          <p className="mp-p">
            {T(
              <><strong>Herkesin biricik bir hediyesi var.</strong> Çoğumuz bunu fark etmeden her gün kullanıyoruz. Belki bundan geçimimizi sağlıyoruz, belki de hiç farkında değiliz. Hepimiz dev bir puzzle'ın parçasıyız — ama bir diğeriyle temas kurup bir şeyler ortaya çıkarmadan bu ilişki ağını göremiyoruz.</>,
              <><strong>Everyone carries a singular gift.</strong> Most of us use it every day without noticing. Maybe we make our living from it, or maybe we're not even aware. We are all pieces of a giant puzzle — but we can't see the web of connection until we touch someone else and something emerges.</>
            )}
          </p>
        </div>

        <div className="mp-divider" />

        {/* ── 2 ── */}
        <div className="mp-section">
          <h2 className="mp-section-title">{T('İnsanlık her zaman böyle yaşamadı.', 'Humanity didn\'t always live this way.')}</h2>
          <p className="mp-p">
            {T(
              'Binlerce yıl boyunca, para yoktu. Mülkiyet bugünkü anlamıyla yoktu. Yine de insanlar yaşıyor, üretiyor, paylaşıyor, topluluk kuruyordu.',
              "For thousands of years, there was no money. Property didn't exist in today's sense. And yet people lived, produced, shared, built community."
            )}
          </p>
          <p className="mp-p">
            {T(
              <span>Anadolu'da buna <strong>imece</strong> denirdi. Komşunun tarlasını birlikte sürerdin. Karşılık beklenmezdi — ama herkes bilirdi ki sırası geldiğinde aynı şey kendisi için de yapılacak. Esnaf, yeterince kazandığında dükkânını kapatırdı — başkasının da kazanması için. Zengin, servetini vakfederdi — hastane, çeşme, aşevi olarak topluluğa akardı.</span>,
              <span>In Anatolia, this was called <strong>imece</strong>. You plowed your neighbor's field together. No return was expected — but everyone knew that when their turn came, the same would be done for them. A craftsman would close his shop when he'd earned enough — so others could earn too. The wealthy would endow their fortunes — hospitals, fountains, soup kitchens flowing back into the community.</span>
            )}
          </p>
          <p className="mp-p">
            {T(
              'Bu romantik bir nostalji değil. Yüzyıllarca işleyen, somut, ekonomik bir sistemdi.',
              "This isn't romantic nostalgia. It was a concrete, working economic system that functioned for centuries."
            )}
          </p>

          <div className="mp-pull">
            {T(
              'Ama bir sınırı vardı: yaklaşık 150 kişi.',
              'But it had a limit: roughly 150 people.'
            )}
          </div>

          <p className="mp-p">
            {T(
              <span>Antropolog Robin Dunbar'ın araştırmaları gösterdi ki insan beyni, gerçek ilişki olarak taşıyabileceği kişi sayısında doğal bir sınıra sahip. Güven kişiseldi. <strong>"Onu tanıyorum, ona güveniyorum"</strong> olmadan armağan döngüsü çalışmıyordu. Bu yüzden imece köyde işliyordu, milyonluk şehirde değil.</span>,
              <span>Anthropologist Robin Dunbar's research showed that the human brain has a natural limit to how many people it can hold as real relationships. Trust was personal. Without <strong>"I know them, I trust them"</strong>, the gift loop didn't work. That's why imece worked in the village, not in the million-person city.</span>
            )}
          </p>
        </div>

        <div className="mp-divider" />

        {/* ── 3 ── */}
        <div className="mp-section">
          <h2 className="mp-section-title">{T('Sonra bir şey değişti.', 'Then something changed.')}</h2>
          <p className="mp-p">
            {T(
              <span>Wikipedia 2001'de yayına girdi. Hiç kimse birbirini tanımıyordu. Hiç kimse para almıyordu. Yine de <strong>7 milyon makale, 300 dil, insanlık tarihinin en büyük ansiklopedisi</strong> ortaya çıktı.</span>,
              <span>Wikipedia launched in 2001. Nobody knew each other. Nobody was paid. And yet — <strong>7 million articles, 300 languages, the largest encyclopedia in human history</strong> emerged.</span>
            )}
          </p>
          <p className="mp-p">
            {T(
              'Linux, Stack Overflow, açık kaynak yazılım dünyasının tamamı aynı şekilde çalışıyor. Milyonlarca insan, birbirini hiç görmeden, karşılık beklemeden, muazzam şeyler üretiyor.',
              "Linux, Stack Overflow, the entire open-source world works the same way. Millions of people, never meeting each other, expecting nothing back, producing extraordinary things."
            )}
          </p>

          <div className="mp-pull">
            {T(
              <>Güven kişiden mekanizmaya taşındı.<br />Ve bu değişim, Dunbar'ın 150 kişilik sınırını parçaladı.</>,
              <>Trust moved from person to mechanism.<br />And that shift shattered Dunbar's limit of 150.</>
            )}
          </div>

          <p className="mp-p">
            {T(
              'Artık "onu tanıyorum, ona güveniyorum" değil — "bu sistemin kurallarına güveniyorum." Armağan ekonomisi geri döndü, ama bu sefer küresel ölçekte.',
              "No longer \"I know them, I trust them\" — but \"I trust the rules of this system.\" The gift economy returned, but this time at global scale."
            )}
          </p>
        </div>

        <div className="mp-divider" />

        {/* ── 4 ── */}
        <div className="mp-section">
          <h2 className="mp-section-title">{T('1729 bu zemin üzerine kuruluyor.', '1729 is built on this foundation.')}</h2>
          <p className="mp-p">
            {T(
              <span>Kapitalizm muazzam bir şey başardı: birbirini hiç tanımayan insanların işbirliği yapmasını mümkün kıldı. Ama kapitalizmin yapamadığı şeyler var. <strong>Anlam üretemiyor. Gerçek bağ kuramıyor. Yalnızlığı çözemiyor.</strong> Bir insanın sahip olduğu biricik hediyeyi fiyatlandıramıyor — çünkü fiyatlandırılmaması gerekiyor.</span>,
              <span>Capitalism achieved something extraordinary: it made cooperation possible between people who'd never met. But there are things capitalism can't do. <strong>It can't generate meaning. It can't build real connection. It can't solve loneliness.</strong> It can't price the singular gift a person carries — because it shouldn't be priced.</span>
            )}
          </p>
          <p className="mp-p">
            {T(
              '1729 bu boşluğa giriyor. Kapitalizmin rakibi olarak değil — onun yanında, onun yapamadığı işleri yapan, paralel bir katman olarak.',
              "1729 enters this gap. Not as capitalism's rival — but beside it, as a parallel layer that does what it cannot."
            )}
          </p>
        </div>

        <div className="mp-divider" />

        {/* ── 5 ── */}
        <div className="mp-section">
          <h2 className="mp-section-title">{T('Nasıl çalışıyor?', 'How does it work?')}</h2>
          <ul className="mp-list">
            <li>
              {T(
                <span><strong>Bir armağanın var.</strong> Belki bir beceri, bir bilgi, bir deneyim, bir bakış açısı. Topluluğa sunuyorsun. Karşılık beklemeden. Fiyat koymadan.</span>,
                <span><strong>You have a gift.</strong> Maybe a skill, a knowledge, an experience, a perspective. You offer it to the community. Without expecting anything back. Without a price.</span>
              )}
            </li>
            <li>
              {T(
                <span><strong>Başka birinin armağanı sana geliyor.</strong> Veren ile alan arasında doğrudan bir ilişki yok — veren topluluğa veriyor, alan topluluktan alıyor. Döngü kapanmıyor, büyüyor.</span>,
                <span><strong>Someone else's gift comes to you.</strong> No direct relationship between giver and receiver — the giver gives to the community, the receiver takes from the community. The loop doesn't close, it grows.</span>
              )}
            </li>
            <li>
              {T(
                <span><strong>Anonim çalışıyor.</strong> Çünkü ego işin içine girdiği an her şey değişiyor — statü, tanınma, takipçi sayısı devreye giriyor. Bunlar girdiğinde armağan kalmıyor, başka bir şey başlıyor.</span>,
                <span><strong>It runs anonymous.</strong> Because the moment ego enters — status, recognition, follower count take over. When that happens, the gift is gone and something else begins.</span>
              )}
            </li>
            <li>
              {T(
                <span><strong>Önce ikili takımlardan başlıyoruz.</strong> En basit halinle, en eforsuz halinle — aileye, topluluğa, kente, dünyaya ne katmaktan en çok keyif alırsın? Bunu bul. Bunu paylaş. Biri seni duyacak. Isınma turlarından başlıyoruz — sonra daha büyük takımlar geliyor.</span>,
                <span><strong>We start with pairs.</strong> In your simplest form, your most effortless form — what do you most enjoy contributing to your family, community, city, world? Find it. Share it. Someone will hear you. We start with warm-up rounds — then larger teams come.</span>
              )}
            </li>
          </ul>
        </div>

        <div className="mp-divider" />

        {/* ── 6 ── */}
        <div className="mp-section">
          <h2 className="mp-section-title">{T('Bu ne değil?', 'What this is not.')}</h2>
          <ul className="mp-list">
            <li>{T(<span><strong>Sosyal medya değil.</strong> Burada takipçi yok, beğeni yok, algoritma yok.</span>, <span><strong>Not social media.</strong> No followers, no likes, no algorithm.</span>)}</li>
            <li>{T(<span><strong>Pazar yeri değil.</strong> Burada fiyat yok, pazarlık yok, rekabet yok.</span>, <span><strong>Not a marketplace.</strong> No price, no negotiation, no competition.</span>)}</li>
            <li>{T(<span><strong>Yardım platformu değil.</strong> Burada veren güçlü, alan zayıf değil. Herkes hem veriyor hem alıyor.</span>, <span><strong>Not a charity platform.</strong> The giver isn't strong and the receiver isn't weak. Everyone gives and everyone receives.</span>)}</li>
          </ul>
        </div>

        <div className="mp-divider" />

        {/* ── 7: Ramanujan ── */}
        <div className="mp-section">
          <h2 className="mp-section-title">{T('Neden 1729?', 'Why 1729?')}</h2>
          <p className="mp-p">
            {T(
              <span>Hintli matematikçi Srinivasa Ramanujan, bir hastane odasında yatıyordu. Ziyaretine gelen arkadaşı <em>"1729 numaralı taksiye bindim, sıradan bir sayı"</em> dedi. Ramanujan hemen cevapladı: <strong>"Hayır. İki farklı şekilde iki küpün toplamı olarak ifade edilebilen en küçük sayı."</strong></span>,
              <span>Mathematician Srinivasa Ramanujan was lying in a hospital bed. His visiting friend said <em>"I came in taxi number 1729, rather a dull number."</em> Ramanujan replied immediately: <strong>"No. It is the smallest number expressible as the sum of two cubes in two different ways."</strong></span>
            )}
          </p>
          <p className="mp-p">
            {T(
              'Görünüşte sıradan. İçinde derin bir şey saklı. Tıpkı her insanın içinde taşıdığı hediye gibi. Tıpkı topluluklar kurulduğunda ortaya çıkan o görünmez güç gibi.',
              "Ordinary on the surface. Extraordinary within. Just like the gift every person carries. Just like the invisible force that emerges when communities form."
            )}
          </p>
        </div>

        {/* ── Ending ── */}
        <div className="mp-ending">
          {T(
            <><em>Sen de varsan,</em><br />bekleriz.</>,
            <><em>If you're one of us,</em><br />we're waiting.</>
          )}
        </div>
      </div>

      <footer className="mp-footer">
        <a href="mailto:hello@1729.eco" className="mp-footer-mail">hello@1729.eco</a>
        <span className="mp-footer-copy">1729 © 2026</span>
      </footer>

    </div>
  )
}

export default ManifestoPage
