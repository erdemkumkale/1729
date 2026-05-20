// 1729 — Turkish UI strings (secondary language)
// Keep in sync with en.js structure

const tr = {
  // ─── Dinamik kelime ───
  giftWord: 'armağan',

  // ─── Auth ───
  auth: {
    signup: 'Kayıt Ol',
    login: 'Giriş Yap',
    email: 'E-posta',
    password: 'Şifre',
    processing: 'İşleniyor',
    error: 'Bir şey olmadı. Tekrar dener misin?',
  },

  // ─── Onboarding ───
  onboarding: {
    screen1: {
      headline: 'Burada adın yok. Unvanın yok. Geçmişin yok. Sadece sen varsın.',
      cta: 'Hazırım',
    },
    screen2: {
      atmospheric: 'Burada kimse seni izlemiyor.',
      question: 'Kanıtlayacak hiçbir şeyin ve yapmak zorunda olduğun hiçbir şey olmasaydı — vaktini neyle geçirmekten en çok keyif alırdın?',
      cta: 'Devam',
    },
    screen3: {
      atmospheric: 'Bu bir yetenek testi değil.',
      question: 'Hangi konuda hile yapıyorsun? Senin için oyun olan, başkası için iş olan nedir?',
      cta: 'Devam',
    },
    screen4: {
      atmospheric: 'Almak da bir cesaret işidir.',
      question: 'Hangi görev enerjini tüketiyor? Başkasının armağanına ihtiyaç duyduğun alan nedir?',
      cta: 'Devam',
    },
    screen5: {
      text: 'Son soru biraz farklı.\nCevabın bir kart olacak.\nBiri görebilecek. Talep edebilecek.\nSen de istersen vereceksin — istersen vermeyeceksin.\nAma şimdi sadece dürüstçe yaz.',
      cta: 'Devam',
    },
    screen6: {
      question: 'Eforsuzca verebileceğin dehan nedir?',
      optionalLabel: 'İsteğe bağlı',
      optionalPlaceholder: 'Bunu neden sen veriyorsun, başkası değil?',
      cta: 'Armağanımı Oluştur',
    },
    screen7: {
      ready: 'Armağanın hazır.',
      cta: 'Devam Et',
    },
    saving: 'Kaydediliyor',
    textareaPlaceholder: 'Buraya yaz.',
  },

  // ─── Nav ───
  nav: {
    dashboard: 'Panel',
    questions: 'Sorular',
    trustTeam: 'Çevre',
    explore: 'Keşfet',
    give: 'Ver',
    signOut: 'Çıkış',
  },

  // ─── Dashboard ───
  dashboard: {
    activeCards: 'Aktif Armağan',
    supportGiven: 'Verilen Armağan',
    supportReceived: 'Alınan Armağan',
    trustTeamSize: 'Çevre Büyüklüğü',
    recentActivity: 'Son Hareketler',
    noActivity: 'Henüz kimse burada değil.',
    gave: 'Bir armağan verdin.',
    received: 'Bir armağan aldın.',
    quickActions: {
      createCard: 'Yeni Armağan',
      createCardDesc: 'Yeni bir armağan kartı oluştur.',
      explore: 'Keşfet',
      exploreDesc: 'Çevrenden ve ötesinden armağanlara göz at.',
      editQuestions: 'Soruları Düzenle',
      editQuestionsDesc: 'Cevaplarını güncelle.',
      trustTeam: 'Çevre',
      trustTeamDesc: 'Ağını genişlet.',
    },
  },

  // ─── Give (Ver) ───
  give: {
    title: 'Ver',
    subtitle: 'Armağan kartlarını yönet.',
    tabMy: 'Armağanlarım',
    tabHistory: 'Verdiklerim',
    cardActive: 'Açık',
    cardInactive: 'Kapalı',
    newCard: 'Yeni Armağan',
    newCardTitle: 'Yeni Armağan',
    titleLabel: 'Başlık',
    descLabel: 'Açıklama',
    create: 'Oluştur',
    cancel: 'Vazgeç',
    creating: 'Oluşturuluyor',
    empty: 'Henüz bir armağan yok.',
    historyEmpty: 'Henüz kimseye armağan vermedin.',
    error: 'Bir şey olmadı. Tekrar dener misin?',
  },

  // ─── Explore (Al) ───
  explore: {
    title: 'Keşfet',
    subtitle: 'Çevrenden ve ötesinden armağanlara göz at.',
    tabFeed: 'Armağanlar',
    tabHistory: 'Aldıklarım',
    filterTrustTeam: 'Çevre',
    filterTurkey: 'Türkiye',
    filterGlobal: 'Global',
    requestSupport: 'İste',
    requesting: 'Gönderiliyor',
    empty: 'Henüz kimse burada değil.',
    historyEmpty: 'Henüz armağan almadın.',
    error: 'Bir şey olmadı. Tekrar dener misin?',
  },

  // ─── Questions (SoruCevap) ───
  questions: {
    title: 'Sorular',
    subtitle: 'Cevaplarını görüntüle ve düzenle.',
    save: 'Kaydet',
    saving: 'Kaydediliyor',
    saved: 'Kaydedildi.',
    createCardLabel: 'Bu cevaptan armağan kartı oluştur.',
    error: 'Bir şey olmadı. Tekrar dener misin?',
  },

  // ─── Circle (GuvenTakimi) ───
  trustTeam: {
    title: 'Çevre',
    subtitle: 'Ağını genişlet ve yönet.',
    invite: 'Davet Et',
    empty: 'Çevren henüz boş.',
    emptyHint: 'Birini davet ederek başla.',
    modal: {
      title: 'Davet Oluştur',
      emailLabel: 'E-posta',
      typeLabel: 'Davet tipi',
      typeDiscount: '%50 İndirim',
      typePrepaid: 'Armağan erişimi (onlara ücretsiz)',
      generate: 'Kod Oluştur',
      close: 'Kapat',
      codeReady: 'Kod hazır.',
    },
    relations: {
      invited: 'Seni davet etti.',
      joinedViaYou: 'Senin davetinle katıldı.',
      exchange: 'Armağan alışverişi yaptınız.',
    },
  },

  // ─── Payment ───
  payment: {
    title: 'Üyelik',
    subtitle: 'Katılmak için davet kodu gereklidir.',
    promoLabel: 'Davet kodu',
    promoPlaceholder: 'XXXXXX',
    apply: 'Uygula',
    invalidCode: 'Geçersiz kod.',
    invitedBy: (hex) => `${hex} sizi davet etti.`,
    discountApplied: '%50 indirim uygulandı.',
    complete: (price) => price > 0 ? `Devam ($${price})` : 'Devam Et (ücretsiz)',
    processing: 'İşleniyor',
    testMode: 'Test modu — gerçek ödeme alınmıyor.',
    error: 'Bir şey olmadı. Tekrar dener misin?',
  },

  // ─── Language selector ───
  language: {
    label: 'Dil',
    en: 'English',
    tr: 'Türkçe',
  },

  // ─── Errors ───
  errors: {
    generic: 'Bir şey olmadı. Tekrar dener misin?',
    dbError: 'Bağlantı kurulamadı.',
  },
}

export default tr
