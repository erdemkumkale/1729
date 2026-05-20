// 1729 — Turkish UI strings
// giftWord: kullanıcı "armağan" veya "şey" seçebilir

const tr = {
  // ─── Dinamik kelime (armağan / şey) ───
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
    trustTeam: 'Güven Takımı',
    receive: 'Al',
    give: 'Ver',
    signOut: 'Çıkış',
  },

  // ─── Dashboard ───
  dashboard: {
    activeCards: 'Aktif Armağan',
    supportGiven: 'Verilen Destek',
    supportReceived: 'Alınan Destek',
    trustTeamSize: 'Güven Takımı',
    recentActivity: 'Son Hareketler',
    noActivity: 'Henüz kimse burada değil.',
    gave: 'Destek verdin.',
    received: 'Destek aldın.',
    quickActions: {
      createCard: 'Armağan Aç',
      createCardDesc: 'Yeni bir armağan kartı oluştur.',
      getSupport: 'Destek Al',
      getSupportDesc: 'Güven takımından destek iste.',
      editQuestions: 'Soruları Düzenle',
      editQuestionsDesc: 'Cevaplarını güncelle.',
      trustTeam: 'Güven Takımı',
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
    newCard: 'Yeni Armağan Aç',
    newCardTitle: 'Yeni Armağan',
    titleLabel: 'Başlık',
    descLabel: 'Açıklama',
    create: 'Oluştur',
    cancel: 'Vazgeç',
    creating: 'Oluşturuluyor',
    empty: 'Henüz bir armağan yok.',
    historyEmpty: 'Henüz kimseye destek vermedin.',
    error: 'Bir şey olmadı. Tekrar dener misin?',
  },

  // ─── Receive (Al) ───
  receive: {
    title: 'Al',
    subtitle: 'Destek al ve geçmişini gör.',
    tabFeed: 'Armağanlar',
    tabHistory: 'Aldıklarım',
    filterTrustTeam: 'Güven Takımı',
    filterTurkey: 'Türkiye',
    filterGlobal: 'Global',
    requestSupport: 'Destek İste',
    requesting: 'Gönderiliyor',
    empty: 'Henüz kimse burada değil.',
    historyEmpty: 'Henüz destek almadın.',
    error: 'Bir şey olmadı. Tekrar dener misin?',
  },

  // ─── Questions (SoruCevap) ───
  questions: {
    title: 'Sorular',
    subtitle: 'Cevaplarını görüntüle ve düzenle.',
    save: 'Kaydet',
    saving: 'Kaydediliyor',
    saved: 'Kaydedildi.',
    createCardLabel: 'Bu armağan için bir kart oluştur.',
    error: 'Bir şey olmadı. Tekrar dener misin?',
  },

  // ─── Trust Team (GuvenTakimi) ───
  trustTeam: {
    title: 'Güven Takımı',
    subtitle: 'Ağını genişlet ve yönet.',
    invite: 'Davet Et',
    empty: 'Henüz güven takımın oluşmadı.',
    emptyHint: 'Birini davet ederek başla.',
    modal: {
      title: 'Davet Oluştur',
      emailLabel: 'E-posta',
      typeLabel: 'Davet tipi',
      typeDiscount: '%50 İndirim',
      typePrepaid: 'Dahil Et (Ücretsiz)',
      generate: 'Kod Oluştur',
      close: 'Kapat',
      codeReady: 'Kod oluşturuldu.',
    },
    relations: {
      invited: 'Seni davet etti.',
      joinedViaYou: 'Senin davetinle katıldı.',
      exchange: 'Armağan alışverişi yaptınız.',
    },
  },

  // ─── Payment ───
  payment: {
    title: 'Abonelik',
    subtitle: 'Platforma giriş için davet kodu gereklidir.',
    promoLabel: 'Davet kodu',
    promoPlaceholder: 'XXXXXX',
    apply: 'Uygula',
    invalidCode: 'Geçersiz kod.',
    invitedBy: (hex) => `${hex} sizi dahil etti.`,
    discountApplied: '%50 indirim uygulandı.',
    complete: (price) => price > 0 ? `Ödemeyi Tamamla ($${price})` : 'Devam Et (Ücretsiz)',
    processing: 'İşleniyor',
    testMode: 'Şu an test modu — gerçek ödeme alınmıyor.',
    error: 'Bir şey olmadı. Tekrar dener misin?',
  },

  // ─── Errors ───
  errors: {
    generic: 'Bir şey olmadı. Tekrar dener misin?',
    dbError: 'Bağlantı kurulamadı.',
  },
}

export default tr
