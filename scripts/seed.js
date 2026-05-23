/**
 * 1729 — Seed Script
 * node scripts/seed.js
 *
 * Gereksinimler:
 *   npm install @supabase/supabase-js
 *
 * Çalıştırılacak ortam değişkenleri:
 *   SUPABASE_URL=https://bwrdhplnxrcrxqpttugq.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
 *
 * veya doğrudan aşağıdaki sabitleri doldur.
 */

const { createClient } = require('@supabase/supabase-js')

// ─── Config ──────────────────────────────────────────────────────

const SUPABASE_URL             = process.env.SUPABASE_URL             || 'https://bwrdhplnxrcrxqpttugq.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌  SUPABASE_SERVICE_ROLE_KEY eksik')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ─── Sub-communities ─────────────────────────────────────────────

const COMMUNITIES = [
  { slug: 'yapanlar',    name: 'Yapanlar',    founder: 'ahmet@test1729.com' },
  { slug: 'dusununler', name: 'Düşünenler',  founder: 'deniz@test1729.com' },
]

// ─── Users ───────────────────────────────────────────────────────

const USERS = [
  {
    email:     'ahmet@test1729.com',
    password:  'Test1729!',
    hex:       '#8B4513',
    lang:      'tr',
    community: 'yapanlar',
    answers: [
      "Sabah erken kalkar, garajıma geçerim. Yanımda çay, önümde bozuk bir şey. Saatler nasıl geçiyor anlamam.",
      "İnsanlar elektronik cihaz bozulunca servis parasına razı oluyor. Ben bakıyorum, çoğu zaman 5 dakikada anlıyorum sorununu.",
      "Bilgisayarda bir şey doldurmam gerektiğinde içim sıkışıyor. E-devlet, online form, PDF imzalama... bunlar beni bitiriyor.",
    ],
    gift: {
      title: "Bozuk elektronik cihazınıza bakayım",
      description: "Elinizdeki bozuk elektronik cihaza bakarım — telefon, küçük ev aleti, ne olursa. Tamir edilebilir mi değil mi, 15 dakikada söylerim. Tamir mümkünse nasıl yapılır onu da anlatırım.",
    },
  },
  {
    email:     'selin@test1729.com',
    password:  'Test1729!',
    hex:       '#C67B2A',
    lang:      'tr',
    community: 'yapanlar',
    answers: [
      "Mutfakta bir şeyler denerken. Özellikle fermantasyon — günlerce bekleyip sonucu görmek. Zamanı unutuyorum.",
      "Evde ekmek yapmak zor diyorlar. Benim için nefes almak gibi. Hamuru hissediyorum, ne zaman hazır olduğunu biliyorum.",
      "Fiyat koymak. Kaç saat uğraştım, malzeme ne kadara geldi, bunu bir rakama çevirmek içimden gelmiyor.",
    ],
    gift: {
      title: "Ekşi maya ekmeği yapmasını öğretirim",
      description: "Başlangıç mayasını nasıl beslenir, hamur nasıl anlaşılır — video çağrısında 45 dakikada aktarırım.",
    },
  },
  {
    email:     'marcus@test1729.com',
    password:  'Test1729!',
    hex:       '#2E6B9E',
    lang:      'en',
    community: 'yapanlar',
    answers: [
      "Walking around with my camera, no destination. Sometimes 6 hours pass and I haven't noticed.",
      "People stress about composition, lighting, the right moment. I just feel it. I can't explain how, I just see it before it happens.",
      "Anything bureaucratic in Turkey. Tax offices, notaries, official documents. I get lost and anxious.",
    ],
    gift: {
      title: "Honest feedback on your photos",
      description: "I'll give you honest feedback on 10 of your photos. Not technical jargon — I'll tell you what's working, what's not, and why. Portrait, street, product, whatever.",
    },
  },
  {
    email:     'fatma@test1729.com',
    password:  'Test1729!',
    hex:       '#7A9E4F',
    lang:      'tr',
    community: 'yapanlar',
    answers: [
      "Komşularımla oturup konuşmak. Özellikle hasta olan, yalnız olan. Yanında olmak, dinlemek.",
      "İnsanlar ağrıyı, belirtiyi anlatamıyor doktora. Ben bir bakıyorum, tablo çıkıyor. 35 yıl acil serviste böyle baktım.",
      "Akıllı telefon. WhatsApp'ı zar zor kullanıyorum. Uygulama indir, güncelle — bunlar beni yoruyor.",
    ],
    gift: {
      title: "Hastane öncesi veya sonrası konuşalım",
      description: "Doktorun söylediklerini anlamanıza, doğru soruları sormanıza yardım ederim. Hemşire gözüyle bakarım. Hukuki tavsiye değil, bilinçli bir göz.",
    },
  },
  {
    email:     'kerem@test1729.com',
    password:  'Test1729!',
    hex:       '#D4A017',
    lang:      'tr',
    community: 'yapanlar',
    answers: [
      "Sabah vardiyasından önce, kimse yokken, farklı demleme yöntemlerini deniyorum. O sessizlikte bir şeyler keşfetmek.",
      "Arkadaşlarım kahve yapmayı zor buluyor. Su sıcaklığı, öğütme kalınlığı, bekleme süresi — bunlar hissediliyor, formül değil.",
      "CV yazmak, mülakat hazırlamak, 'kendinizi anlatın' sorusu. Ne yapacağımı bilmiyorum.",
    ],
    gift: {
      title: "Evde daha iyi kahve için 30 dakika",
      description: "Hangi ekipman, hangi çekirdek, nasıl demlenir — 30 dakikalık video çağrısında pratik olarak anlatırım.",
    },
  },
  {
    email:     'deniz@test1729.com',
    password:  'Test1729!',
    hex:       '#6B3FA0',
    lang:      'tr',
    community: 'dusununler',
    answers: [
      "Müzik dinleyerek yürümek. Saatlerce. Bir de ahşap işleriyle uğraşmak — tamamen farklı bir his.",
      "Sözleşmeleri okumak. İnsanlar sayfalar dolusu metinden bunalıyor. Ben bir bakıyorum, nerede risk var hemen görüyorum.",
      "Müzikle, sanatla, yaratıcı insanlarla dolu olmayan günler. Hukuk dünyası çok kapalı.",
    ],
    gift: {
      title: "İmzalamadan önce sözleşmenize bakayım",
      description: "Kira, iş, freelance anlaşması — ne olursa. Tehlikeli maddeleri işaretler, sormanız gereken soruları hazırlarım. Hukuki tavsiye değil, bilinçli bir göz.",
    },
  },
  {
    email:     'sarah@test1729.com',
    password:  'Test1729!',
    hex:       '#E8623A',
    lang:      'en',
    community: 'dusununler',
    answers: [
      "Reading about systems, how things connect. And cooking for people. Both feel like solving puzzles.",
      "Seeing the real problem behind what people say they want. Someone asks for X, I immediately see they need Y.",
      "Turkish bureaucracy and daily life logistics. Finding the right doctor, dealing with landlords. Exhausting.",
    ],
    gift: {
      title: "Think through your product problem with me",
      description: "Not a consultant pitch — a 45-minute conversation where I ask the right questions and help you see what you might be missing.",
    },
  },
  {
    email:     'murat@test1729.com',
    password:  'Test1729!',
    hex:       '#4A8B6F',
    lang:      'tr',
    community: 'dusununler',
    answers: [
      "Balık tutmak. Sabahın köründe, kimse yokken. Bir de insanlarla uzun, derin sohbetler.",
      "Takımda gergin bir an var, herkes ne yapacağını bilmiyor. Ben bir şey söylüyorum, hava değişiyor.",
      "Raporlar, sunumlar, Excel dosyaları — görsel düzenleme, hizalama. Saatlerimi alıyor.",
    ],
    gift: {
      title: "Zor bir konuşma öncesi düşünmenize yardım ederim",
      description: "İşten çıkarma, zam talebi, ekiple çatışma — ne olursa. Nasıl çerçevelenir, ne söylenir. Bir saat konuşuruz.",
    },
  },
  {
    email:     'zeynep@test1729.com',
    password:  'Test1729!',
    hex:       '#C43B6E',
    lang:      'tr',
    community: 'dusununler',
    answers: [
      "Veri setleriyle baş başa kalmak ve içinde bir hikaye bulmak. Bir de dans.",
      "Dağınık veriyi düzenlemek. Kimse ne yapacağını bilmiyor. Ben 20 dakikada anlamlı bir şey çıkarıyorum.",
      "Sunum yapmak. Veriyi anlıyorum ama odadaki insanlara aktarmak — bu kısımda donup kalıyorum.",
    ],
    gift: {
      title: "Verinize birlikte bakalım",
      description: "Excel veya Google Sheets — getirin, birlikte bakalım. Temizleme, görselleştirme, basit analiz. Bir oturum, pratik çıktı.",
    },
  },
  {
    email:     'can@test1729.com',
    password:  'Test1729!',
    hex:       '#3D7AB8',
    lang:      'tr',
    community: 'dusununler',
    answers: [
      "Kitap okumak, özellikle tarih. Bir de yemek pişirmek — tarif takip etmeden.",
      "Vergi beyannamesi, muhasebe kaydı — insanlar bunları görünce paniğe kapılıyor. Benim için bulmaca gibi.",
      "Çatışmalı durumları yönetmek. Müşteri sinirli geldiğinde — o anlarda ne yapacağımı bilmiyorum.",
    ],
    gift: {
      title: "Vergi beyannamesi öncesi bir saat konuşalım",
      description: "Serbest çalışıyorsanız veya küçük bir işiniz varsa — nelere dikkat etmeli, hangi giderler düşülür, nerede hata yapılıyor. Pratik bilgi, gereksiz panik olmadan.",
    },
  },
]

// ─── Trust circle pairs (bidirectional) ──────────────────────────

const TRUST_PAIRS = [
  ['ahmet@test1729.com', 'deniz@test1729.com'],
  ['kerem@test1729.com', 'can@test1729.com'],
  ['fatma@test1729.com', 'murat@test1729.com'],
]

// ─── Helpers ─────────────────────────────────────────────────────

const log = (emoji, msg) => console.log(`${emoji}  ${msg}`)

// ─── Main ────────────────────────────────────────────────────────

async function seed() {
  log('🌱', 'Seed başlıyor...\n')

  // ── 1. Mevcut test kullanıcılarını çek (atlama için)
  const { data: existingUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const existingEmails = new Set((existingUsers?.users || []).map(u => u.email))

  // ── 2. Auth kullanıcıları oluştur
  const userIdMap = {} // email → uuid

  for (const u of USERS) {
    if (existingEmails.has(u.email)) {
      // Zaten var — ID'yi çek
      const found = existingUsers.users.find(eu => eu.email === u.email)
      userIdMap[u.email] = found.id
      log('⏭️ ', `Atlandı (mevcut): ${u.email}`)
      continue
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
    })

    if (error) {
      log('❌', `Auth oluşturulamadı: ${u.email} — ${error.message}`)
      continue
    }

    userIdMap[u.email] = data.user.id
    log('👤', `Auth oluşturuldu: ${u.email} (${data.user.id})`)
  }

  // ── 3. Profiles
  for (const u of USERS) {
    const uid = userIdMap[u.email]
    if (!uid) continue

    const { error } = await supabase.from('profiles').upsert({
      id:                   uid,
      email:                u.email,
      hex_code:             u.hex,
      payment_status:       'paid',
      onboarding_completed: true,
      theme:                'dark',
    }, { onConflict: 'id' })

    if (error) log('❌', `Profile hatası: ${u.email} — ${error.message}`)
    else       log('✅', `Profile: ${u.email}`)
  }

  // ── 4. Onboarding answers
  for (const u of USERS) {
    const uid = userIdMap[u.email]
    if (!uid) continue

    for (let i = 0; i < u.answers.length; i++) {
      const { error } = await supabase.from('onboarding_answers').upsert({
        user_id:        uid,
        question_index: i + 1,
        answer_text:    u.answers[i],
      }, { onConflict: 'user_id,question_index' })

      if (error) log('❌', `Answer Q${i+1} hatası: ${u.email} — ${error.message}`)
    }
    log('📝', `Onboarding cevapları: ${u.email}`)
  }

  // ── 5. Gifts
  for (const u of USERS) {
    const uid = userIdMap[u.email]
    if (!uid) continue

    // Zaten var mı?
    const { data: existing } = await supabase
      .from('gifts')
      .select('id')
      .eq('creator_id', uid)
      .limit(1)

    if (existing && existing.length > 0) {
      log('⏭️ ', `Gift mevcut: ${u.email}`)
      continue
    }

    const { error } = await supabase.from('gifts').insert({
      creator_id:  uid,
      title:       u.gift.title,
      description: u.gift.description,
      visibility:  'global',
      is_active:   true,
    })

    if (error) log('❌', `Gift hatası: ${u.email} — ${error.message}`)
    else       log('🎁', `Gift oluşturuldu: ${u.gift.title}`)
  }

  // ── 6. Sub-communities
  const communityIdMap = {} // slug → uuid

  for (const comm of COMMUNITIES) {
    const founderUid = userIdMap[comm.founder]
    if (!founderUid) continue

    // Zaten var mı?
    const { data: existing } = await supabase
      .from('sub_communities')
      .select('id')
      .eq('owner_id', founderUid)
      .eq('name', comm.name)
      .limit(1)

    if (existing && existing.length > 0) {
      communityIdMap[comm.slug] = existing[0].id
      log('⏭️ ', `Alt topluluk mevcut: ${comm.name}`)
      continue
    }

    const { data, error } = await supabase
      .from('sub_communities')
      .insert({ owner_id: founderUid, name: comm.name, members_aware: true })
      .select('id')
      .single()

    if (error) {
      log('❌', `Alt topluluk hatası: ${comm.name} — ${error.message}`)
    } else {
      communityIdMap[comm.slug] = data.id
      log('🏘️ ', `Alt topluluk oluşturuldu: ${comm.name}`)
    }
  }

  // ── 7. Sub-community members
  for (const u of USERS) {
    const uid  = userIdMap[u.email]
    const cid  = communityIdMap[u.community]
    if (!uid || !cid) continue

    const { error } = await supabase
      .from('sub_community_members')
      .upsert({ sub_community_id: cid, user_id: uid }, { onConflict: 'sub_community_id,user_id' })

    if (error) log('❌', `Üye eklenemedi: ${u.email} → ${u.community} — ${error.message}`)
    else       log('👥', `Üye eklendi: ${u.email} → ${u.community}`)
  }

  // ── 8. Invitations (founder → community members)
  for (const comm of COMMUNITIES) {
    const founderUid = userIdMap[comm.founder]
    const cid        = communityIdMap[comm.slug]
    if (!founderUid || !cid) continue

    const members = USERS.filter(u => u.community === comm.slug && u.email !== comm.founder)

    for (const member of members) {
      const { data: existing } = await supabase
        .from('invitations')
        .select('id')
        .eq('inviter_id', founderUid)
        .eq('email', member.email)
        .limit(1)

      if (existing && existing.length > 0) {
        log('⏭️ ', `Davet mevcut: ${comm.founder} → ${member.email}`)
        continue
      }

      const endsAt = new Date()
      endsAt.setMonth(endsAt.getMonth() + 6)

      const { error } = await supabase.from('invitations').insert({
        inviter_id:           founderUid,
        email:                member.email,
        type:                 'prepaid',
        status:               'used',
        funded_by_inviter:    true,
        duration_months:      6,
        sub_community_id:     cid,
        subscription_ends_at: endsAt.toISOString(),
        used_at:              new Date().toISOString(),
      })

      if (error) log('❌', `Davet hatası: ${comm.founder} → ${member.email} — ${error.message}`)
      else       log('✉️ ', `Davet: ${comm.founder} → ${member.email}`)
    }
  }

  // ── 9. Trust circle (bidirectional pairs)
  for (const [emailA, emailB] of TRUST_PAIRS) {
    const uidA = userIdMap[emailA]
    const uidB = userIdMap[emailB]
    if (!uidA || !uidB) continue

    // A ekler B'yi
    const { error: e1 } = await supabase.from('trust_circle').upsert({
      owner_id:  uidA,
      member_id: uidB,
      gift_title: USERS.find(u => u.email === emailB)?.gift.title || null,
    }, { onConflict: 'owner_id,member_id' })

    // B ekler A'yı
    const { error: e2 } = await supabase.from('trust_circle').upsert({
      owner_id:  uidB,
      member_id: uidA,
      gift_title: USERS.find(u => u.email === emailA)?.gift.title || null,
    }, { onConflict: 'owner_id,member_id' })

    if (e1 || e2) log('❌', `Trust circle hatası: ${emailA} ↔ ${emailB}`)
    else          log('🔵', `Trust circle: ${emailA} ↔ ${emailB}`)
  }

  log('\n🎉', 'Seed tamamlandı!')
}

seed().catch(err => {
  console.error('Seed hatası:', err)
  process.exit(1)
})
