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
      trustTeamDesc: 'Çevreni ve davetlerini yönet.',
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
    filterCommunity: 'Topluluk',
    filterGlobal: 'Global',
    requestSupport: 'İste',
    requesting: 'Gönderiliyor',
    empty: 'Henüz kimse burada değil.',
    historyEmpty: 'Henüz armağan almadın.',
    error: 'Bir şey olmadı. Tekrar dener misin?',
    markReceived: 'Teslim aldım',
    addToCircle: 'Güven çemberine ekle?',
    addToCircleHint: 'Bu kişiden armağan aldın. Güven çemberine eklemek ister misin?',
    addToCircleYes: 'Ekle',
    addToCircleSkip: 'Geç',
    added: 'Eklendi.',
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
    subtitle: 'Güven çemberin ve davet ettiklerin.',
    tabCircle: 'Güven Çemberi',
    tabInvited: 'Davet Ettiklerim',
    invite: 'Davet Et',
    emptyCircle: 'Güven çemberin boş.',
    emptyCircleHint: 'Bir armağan aldıktan sonra "teslim aldım" diyerek o kişiyi buraya ekleyebilirsin.',
    emptyInvited: 'Henüz kimseyi davet etmedin.',
    subscriptionActive: 'Aktif',
    subscriptionEnded: 'Sona erdi',
    subscriptionPending: 'Beklemede',
    daysLeft: (n) => `${n} gün kaldı`,
    endSubscription: 'Sonlandır',
    gaveGift: 'sana armağan verdi',
    modal: {
      title: 'Birini davet et',
      step1: 'E-postası',
      step2: 'Süre',
      step3: 'Topluluk',
      step4: 'Kod',
      emailLabel: 'E-posta adresi',
      emailPlaceholder: 'isim@ornek.com',
      duration1: '1 ay',
      duration6: '6 ay',
      duration12: '12 ay',
      communityNew: 'Yeni topluluk',
      communityGeneral: 'Genel (topluluksuz)',
      communityExisting: 'Mevcut topluluk',
      communityNameLabel: 'Topluluk adı',
      membersAwareLabel: 'Üyeler bir isimli grubun parçası olduklarını bilsin',
      next: 'Devam',
      back: 'Geri',
      generate: 'Kod Oluştur',
      codeReady: 'Bu kodu paylaş',
      codeHint: 'Katılmak için bu koda ihtiyaçları var.',
      copy: 'Kopyala',
      copied: 'Kopyalandı!',
      close: 'Tamam',
    },
  },

  // ─── Payment ───
  payment: {
    title: '1729\'a Katıl',
    subtitle: 'Devam etmek için davet kodu gerekli.',
    codeLabel: 'Davet kodu',
    codePlaceholder: 'XXXXXX',
    apply: 'Uygula',
    invalidCode: 'Geçersiz veya kullanılmış kod.',
    codeAccepted: 'Kod kabul edildi.',
    requireCode: 'Davet kodu gereklidir.',
    continue: 'Devam Et',
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
