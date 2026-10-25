import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../components/Logo'

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&family=DM+Mono:wght@400&display=swap');

  .mp-root {
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
    font-size: 19px;
    line-height: 1.7;
    min-height: 100vh;
  }

  .mp-nav {
    display: flex; justify-content: space-between; align-items: center;
    max-width: 760px; margin: 0 auto; padding: 24px 24px;
  }
  .mp-logo { display: flex; align-items: center; gap: 12px; text-decoration: none; color: var(--t); }
  .mp-logo-text { font-family: var(--f-mono); font-size: 18px; letter-spacing: 0.08em; }
  .mp-nav-right { display: flex; align-items: center; gap: 20px; }
  .mp-nav-link { font-size: 16px; color: var(--t2); text-decoration: none; }
  .mp-nav-link:hover { color: var(--t); }
  .mp-lang-toggle { display: flex; gap: 2px; }
  .mp-lang-btn {
    background: none; border: none; font-family: var(--f-mono); font-size: 15px;
    color: var(--t3); cursor: pointer; padding: 4px 8px; border-radius: 4px;
  }
  .mp-lang-btn.active { color: var(--t); }

  .mp-body { max-width: 760px; margin: 0 auto; padding: 24px 24px 80px; }
  .mp-h1 { font-size: 44px; font-weight: 700; line-height: 1.15; margin: 16px 0 16px; letter-spacing: -0.01em; }
  .mp-lead { font-size: 24px; line-height: 1.5; color: var(--t); margin: 0 0 8px; }

  .mp-section { padding: 36px 0 4px; border-top: 1px solid var(--bg2); margin-top: 36px; }
  .mp-h2 { font-size: 30px; font-weight: 700; margin: 0 0 20px; line-height: 1.25; }
  .mp-p { color: var(--t2); margin: 0 0 18px; }
  .mp-p strong, .mp-list strong, .mp-steps strong { color: var(--t); font-weight: 700; }

  .mp-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 18px; color: var(--t2); }

  .mp-steps { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 16px; counter-reset: step; color: var(--t2); }
  .mp-steps li { display: grid; grid-template-columns: 40px 1fr; gap: 12px; }
  .mp-steps li::before { counter-increment: step; content: counter(step); font-family: var(--f-mono); font-size: 18px; color: var(--t); padding-top: 1px; }

  .mp-example { background: #121211; border: 1px solid var(--bg2); border-radius: 10px; padding: 20px 22px; margin: 0 0 16px; }
  .mp-example-head { font-family: var(--f-mono); font-size: 16px; color: var(--t); margin: 0 0 12px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .mp-dot { width: 14px; height: 14px; border-radius: 50%; display: inline-block; }
  .mp-example p { color: var(--t2); margin: 0 0 12px; }
  .mp-example p:last-child { margin: 0; color: var(--t); font-weight: 500; }

  .mp-cta-wrap { padding: 40px 0 0; border-top: 1px solid var(--bg2); margin-top: 40px; }
  .mp-cta {
    display: inline-block; background: var(--t); color: var(--bg);
    padding: 16px 36px; font-size: 18px; font-weight: 500; text-decoration: none; border-radius: 6px;
  }
  .mp-cta:hover { opacity: 0.88; }

  .mp-footer {
    max-width: 760px; margin: 0 auto; padding: 32px 24px; border-top: 1px solid var(--bg2);
    display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;
    font-size: 15px; color: var(--t3);
  }
  .mp-footer a { color: var(--t2); text-decoration: none; }

  @media (max-width: 768px) {
    .mp-root { font-size: 18px; }
    .mp-nav { padding: 16px 20px; }
    .mp-body { padding: 16px 20px 56px; }
    .mp-h1 { font-size: 36px; }
    .mp-lead { font-size: 21px; }
    .mp-h2 { font-size: 26px; }
    .mp-footer { padding: 24px 20px; }
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
    const existing = document.getElementById(id)
    if (existing) existing.remove()
    const style = document.createElement('style')
    style.id = id
    style.textContent = CSS
    document.head.appendChild(style)
  }, [])

  const steps = [
    T(<span><strong>Topluluğunu kur ya da davetle katıl.</strong> Kurarsan güvendiğin en az iki kişiyi davet edersin.</span>,
      <span><strong>Found your community or join by invitation.</strong> If you found one, you invite at least two people you trust.</span>),
    T(<span><strong>Dört soruyu yanıtla.</strong> Yanıtlarından armağan kartın oluşur. Neye ihtiyaç duyduğun da yanıtlarından anlaşılır.</span>,
      <span><strong>Answer four questions.</strong> Your gift card is made from your answers. What you need also shows in them.</span>),
    T(<span><strong>Kartlara bak.</strong> Topluluğundaki armağan kartlarından ihtiyacın olanı iste.</span>,
      <span><strong>Browse the cards.</strong> Ask for what you need from the gift cards in your community.</span>),
    T(<span><strong>Yazışın.</strong> İki taraf site içinde konuşur, ayrıntıları kendiniz halledersiniz.</span>,
      <span><strong>Talk.</strong> The two of you talk inside the site and sort out the details yourselves.</span>),
    T(<span><strong>"Teslim aldım" de.</strong> İstersen veren kişiyi güven çemberine ekle.</span>,
      <span><strong>Mark it as received.</strong> If you like, add the giver to your trust circle.</span>),
  ]

  return (
    <div className="mp-root">
      <nav className="mp-nav">
        <Link to="/ana-sayfa" className="mp-logo">
          <Logo size={30} centerColor="#fff" style={{ display: 'block', flexShrink: 0 }} />
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
        <h1 className="mp-h1">{T('Manifesto', 'Manifesto')}</h1>
        <p className="mp-lead">
          {T(
            '1729, bir topluluğun içinde insanların birbirine karşılıksız armağan verdiği, anonim bir platformdur. Bu sayfa, bunun neden böyle kurulduğunu anlatır.',
            '1729 is an anonymous platform where people inside a community give each other gifts, with nothing expected in return. This page explains why it is built this way.'
          )}
        </p>

        <section className="mp-section">
          <h2 className="mp-h2">{T('Herkesin verebileceği bir şey var.', 'Everyone has something to give.')}</h2>
          <p className="mp-p">
            {T(
              'Çoğumuz verebileceğimiz şeyi fark etmeden her gün kullanırız. Bir beceri, bir bilgi, bir deneyim, bir bakış açısı. 1729 bunu görünür kılar ve topluluğa sunmayı kolaylaştırır.',
              'Most of us use what we can give every day without noticing. A skill, some knowledge, an experience, a point of view. 1729 makes it visible and makes it easy to offer to a community.'
            )}
          </p>
        </section>

        <section className="mp-section">
          <h2 className="mp-h2">{T('Bu yeni bir fikir değil.', 'This is not a new idea.')}</h2>
          <p className="mp-p">
            {T(
              <span>Binlerce yıl boyunca insanlar parasız paylaştı. Anadolu'da buna <strong>imece</strong> denirdi. Komşunun tarlasını birlikte sürerdin, karşılık beklenmezdi. Sıra sana geldiğinde aynısı yapılırdı. Bu nostalji değil, yüzyıllarca işleyen bir düzendi.</span>,
              <span>For thousands of years people shared without money. In Anatolia this was called <strong>imece</strong>. You plowed your neighbour's field together and expected nothing back. When your turn came, the same was done for you. This is not nostalgia. It was an order that worked for centuries.</span>
            )}
          </p>
          <p className="mp-p">
            {T(
              <span>Ama bir sınırı vardı: yaklaşık <strong>150 kişi</strong>. Antropolog Robin Dunbar'a göre insan, gerçek ilişki olarak ancak bu kadar kişiyi taşıyabilir. Güven kişiseldi: "Onu tanıyorum, ona güveniyorum." Bu yüzden imece köyde işledi, büyük şehirde işlemedi.</span>,
              <span>But it had a limit: about <strong>150 people</strong>. According to anthropologist Robin Dunbar, that is how many real relationships a person can hold. Trust was personal: "I know them, I trust them." That is why imece worked in the village and not in the big city.</span>
            )}
          </p>
        </section>

        <section className="mp-section">
          <h2 className="mp-h2">{T('Güven kişiden kurala geçti.', 'Trust moved from people to rules.')}</h2>
          <p className="mp-p">
            {T(
              <span>Wikipedia 2001'de yayına girdi. Kimse birbirini tanımıyordu, kimse para almıyordu. Yine de <strong>7 milyon makale, 300 dil</strong> ortaya çıktı. Linux, Stack Overflow ve açık kaynak dünyasının tamamı aynı şekilde çalışıyor.</span>,
              <span>Wikipedia launched in 2001. Nobody knew each other and nobody was paid. Yet <strong>7 million articles in 300 languages</strong> emerged. Linux, Stack Overflow and the whole open-source world work the same way.</span>
            )}
          </p>
          <p className="mp-p">
            {T(
              'İnsanlar artık "onu tanıyorum" demiyor, "bu sistemin kurallarına güveniyorum" diyor. Armağan ekonomisi geri döndü ve 150 kişilik sınır aşıldı.',
              'People no longer say "I know them". They say "I trust the rules of this system". The gift economy came back and the limit of 150 was broken.'
            )}
          </p>
        </section>

        <section className="mp-section">
          <h2 className="mp-h2">{T('1729\'un kuralları', 'The rules of 1729')}</h2>
          <p className="mp-p">
            {T('Platform ilk sınırları çizer. Bunlar herkes için aynıdır.', 'The platform draws the first limits. They are the same for everyone.')}
          </p>
          <ul className="mp-list">
            <li>
              {T(
                <span><strong>Anonimlik.</strong> Ad, unvan, yüz ve geçmiş görünmez. Herkes bir renktir. Statü, tanınma ve takipçi işin içine girdiği anda armağan biter, başka bir şey başlar. Anonimlik, herkesin çekinmeden verebilmesi için konan sınırdır.</span>,
                <span><strong>Anonymity.</strong> Name, title, face and history are not visible. Everyone is a colour. The moment status, recognition and followers enter, the gift ends and something else begins. Anonymity is the limit that lets everyone give without hesitation.</span>
              )}
            </li>
            <li>
              {T(
                <span><strong>Karşılıksızlık.</strong> Armağan karşılık beklemeden verilir. Fiyat, pazarlık, borç ve takas yoktur.</span>,
                <span><strong>No return.</strong> A gift is given expecting nothing back. No price, no bargaining, no debt, no trade.</span>
              )}
            </li>
            <li>
              {T(
                <span><strong>Topluluk.</strong> Veren topluluğa verir, alan topluluktan alır. Amaç kişisel kazanç değil, topluluğu güçlendirmektir.</span>,
                <span><strong>Community.</strong> The giver gives to the community and the receiver takes from it. The aim is not personal gain. It is to strengthen the community.</span>
              )}
            </li>
            <li>
              {T(
                <span><strong>Sınır sende.</strong> Tanışmak ya da kendini açmak sana kalmıştır. Bunu istediğin ölçüde, istediğin zaman genişletirsin.</span>,
                <span><strong>The limit is yours.</strong> Getting to know someone or opening up is your choice. You widen it as much as you want, whenever you want.</span>
              )}
            </li>
          </ul>
        </section>

        <section className="mp-section">
          <h2 className="mp-h2">{T('Nasıl işler?', 'How does it work?')}</h2>
          <ol className="mp-steps">
            {steps.map((s, i) => <li key={i}><div>{s}</div></li>)}
          </ol>
        </section>

        <section className="mp-section">
          <h2 className="mp-h2">{T('İki örnek', 'Two examples')}</h2>
          <p className="mp-p">{T('Bu iki örnek, 1729\'un nasıl işlediğini gösterir.', 'These two examples show how 1729 works.')}</p>

          <div className="mp-example">
            <p className="mp-example-head">
              <span className="mp-dot" style={{ background: '#7A9E4F' }} />#7A9E4F
              <span>↔</span>
              <span className="mp-dot" style={{ background: '#6B3FA0' }} />#6B3FA0
            </p>
            <p>
              {T(
                <><strong>#7A9E4F</strong> 35 yıl acil serviste çalıştı, şimdi emekli. <strong>#6B3FA0</strong> avukat. Hastaneye gitmeden önce doktora ne soracağını bilmiyor. #7A9E4F'in kartını buluyor: <em>"Hastane öncesi veya sonrası konuşalım."</em> Bir saat konuşuyorlar.</>,
                <><strong>#7A9E4F</strong> worked 35 years in emergency rooms and is now retired. <strong>#6B3FA0</strong> is a lawyer who does not know what to ask the doctor before a hospital visit. #6B3FA0 finds #7A9E4F's card: <em>"Let's talk before or after your appointment."</em> They talk for an hour.</>
              )}
            </p>
            <p>
              {T(
                <>Sonra #7A9E4F, #6B3FA0'ın kartını görüyor: <em>"İmzalamadan önce sözleşmenize bakayım."</em> Annesinin kira sözleşmesi aylardır aklında.</>,
                <>Then #7A9E4F sees #6B3FA0's card: <em>"I'll review your contract before you sign."</em> A lease for their mother has been on their mind for months.</>
              )}
            </p>
            <p>{T('İkisi de birbirinin kim olduğunu bilmiyor. İkisi de bir şey aldı.', 'Neither knows who the other is. Both received something real.')}</p>
          </div>

          <div className="mp-example">
            <p className="mp-example-head">
              <span className="mp-dot" style={{ background: '#D4A017' }} />#D4A017
              <span>↔</span>
              <span className="mp-dot" style={{ background: '#3D7AB8' }} />#3D7AB8
            </p>
            <p>
              {T(
                <><strong>#D4A017</strong> barista. <strong>#3D7AB8</strong> muhasebeci, stresli ve sıkışmış. #D4A017'nin kartını buluyor: <em>"Evde daha iyi kahve için 30 dakika."</em> Yarım saat sonra rahatlıyor.</>,
                <><strong>#D4A017</strong> is a barista. <strong>#3D7AB8</strong> is an accountant, stressed and stuck. #3D7AB8 finds #D4A017's card: <em>"30 minutes for better coffee at home."</em> Half an hour later they feel lighter.</>
              )}
            </p>
            <p>
              {T(
                <>Sonra #D4A017, #3D7AB8'in kartını görüyor: <em>"Vergi beyannamesi öncesi bir saat konuşalım."</em> Tam ihtiyacı olan şey bu.</>,
                <>Then #D4A017 sees #3D7AB8's card: <em>"Let's talk for an hour before your tax return."</em> It is exactly what they needed.</>
              )}
            </p>
            <p>{T('Sistem bunu planlamadı. Sadece alan açtı.', 'The system did not plan this. It only opened the space.')}</p>
          </div>
        </section>

        <section className="mp-section">
          <h2 className="mp-h2">{T('1729 ne değildir?', 'What 1729 is not')}</h2>
          <ul className="mp-list">
            <li>{T(<span><strong>Sosyal medya değildir.</strong> Takipçi, beğeni ve algoritma yoktur.</span>, <span><strong>It is not social media.</strong> There are no followers, likes or algorithm.</span>)}</li>
            <li>{T(<span><strong>Pazar yeri değildir.</strong> Fiyat, pazarlık ve rekabet yoktur.</span>, <span><strong>It is not a marketplace.</strong> There is no price, bargaining or competition.</span>)}</li>
            <li>{T(<span><strong>Yardım kuruluşu değildir.</strong> Veren güçlü, alan zayıf değildir. Herkes hem verir hem alır.</span>, <span><strong>It is not a charity.</strong> The giver is not strong and the receiver is not weak. Everyone gives and everyone receives.</span>)}</li>
          </ul>
        </section>

        <section className="mp-section">
          <h2 className="mp-h2">{T('Neden 1729?', 'Why 1729?')}</h2>
          <p className="mp-p">
            {T(
              <span>1729 sayısı, matematikçi Srinivasa Ramanujan'ın anısına <strong>Ramanujan sayısı</strong> olarak anılır. Sıradan görünen bir sayı, aslında sıradan değildir. İnsanlar için de böyle. <strong>Hiçbirimiz sıradan değiliz.</strong> Sadece doğru kişilerle ve doğru topluluklarla karşılaştığımızda bunu görebiliyor ve gösterebiliyoruz. 1729 bunun için var.</span>,
              <span>The number 1729 is known as the <strong>Ramanujan number</strong>, in memory of the mathematician Srinivasa Ramanujan. A number that looks ordinary is not ordinary. The same is true of people. <strong>None of us is ordinary.</strong> We only see it, and show it, when we meet the right people and the right communities. That is what 1729 is for.</span>
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

export default ManifestoPage
