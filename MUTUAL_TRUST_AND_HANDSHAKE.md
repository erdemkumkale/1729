# Karşılıklı Güven ve Sohbet Onay Sistemi

Bu dokümantasyon, sistemdeki iki yeni özelliği açıklar:

## 1. Karşılıklı Güven Mekanizması (Mütekabiliyet)

### Nasıl Çalışır?

Bir kullanıcı davet koduyla kayıt olduğunda, sistem otomatik olarak **çift yönlü güven bağı** oluşturur:

- **Davet Eden → Davet Edilen** (güven bağı)
- **Davet Edilen → Davet Eden** (karşılıklı güven bağı)

### Teknik Detaylar

#### Database Trigger
`setup-mutual-trust-system.sql` dosyası şu işlemleri yapar:

1. **Trigger Fonksiyonu**: `handle_mutual_trust_on_signup()`
   - Yeni kullanıcı kaydolduğunda tetiklenir
   - Kullanıcının kullandığı promo kodu kontrol edilir
   - Davet eden kişi bulunursa, iki yönlü güven bağı oluşturulur

2. **Invitation İşleme**: `mark_invitation_used()`
   - Promo kodu kullanıldığında invitation kaydını günceller
   - `status: 'used'`, `used_by`, `used_at` alanlarını doldurur

#### Frontend Entegrasyonu

**AuthContext.js**:
- `signUp()` fonksiyonu promo code parametresi alır
- `signInWithMagicLink()` fonksiyonu promo code'u metadata'ya ekler
- Auth state değişikliğinde promo code işlenir

**MagicLinkAuth.js**:
- Kullanıcı kayıt olurken referans kodu girebilir
- Kod otomatik olarak büyük harfe çevrilir
- Magic link ile giriş yapıldığında kod işlenir

### Kullanıcı Deneyimi

1. Yeni kullanıcı kayıt olurken referans kodu girer (örn: `SAVE50`)
2. Sistem otomatik olarak:
   - Invitation kaydını "used" olarak işaretler
   - İki yönlü güven bağı oluşturur
3. Kullanıcı Dashboard'u açtığında:
   - "Güven Çemberin" bölümünde davet edeni görür
   - Davet eden de yeni kullanıcıyı güven çemberinde görür

---

## 2. Sohbet Onay Sistemi (Handshake)

### Nasıl Çalışır?

Destek sohbetlerinde iki aşamalı onay sistemi:

#### Aşama 1: Veren Tarafı (Provider)
- Sohbet ekranının altında **"✅ Desteği Tamamladım"** butonu
- Butona basıldığında:
  - Mesaj yazma alanı kapanır
  - Support transaction `status: 'waiting_approval'` olur
  - Alan tarafa onay sorusu gönderilir

#### Aşama 2: Alan Tarafı (Receiver)
İki seçenek sunulur:
1. **"✅ Evet, Onayla ve Güven Çemberine Ekle"**
   - Destek onaylanır
   - Güven bağı oluşturulur (`trust_connections` tablosuna eklenir)
   - Sohbet arşive kaldırılır (`status: 'archived'`)

2. **"❌ Hayır, Desteği Alamadım"**
   - Destek onaylanmaz
   - Güven bağı oluşturulmaz
   - Sohbet arşive kaldırılır

### Teknik Detaylar

#### Database Yapısı

**support_transactions tablosu**:
```sql
status: 'active' | 'waiting_approval' | 'archived'
approval_status: 'approved' | 'rejected' | NULL
completed_at: TIMESTAMPTZ
```

**trust_connections tablosu**:
```sql
follower_id: UUID (Alan kişi)
followed_id: UUID (Veren kişi)
```

#### Frontend Akışı (ProjectChat.js)

1. **Veren Butonu**:
```javascript
handleCompleteSupport()
- status → 'waiting_approval'
- completed_at → NOW()
- Sistem mesajı gönderilir
```

2. **Alan Butonları**:
```javascript
handleApproval(approved)
- status → 'archived'
- approval_status → 'approved' | 'rejected'
- Eğer approved: trust_connections'a kayıt
```

### UI Durumları

#### Aktif Sohbet
- Mesaj yazma alanı açık
- Veren için: "Desteği Tamamladım" butonu görünür

#### Onay Bekleniyor
- Mesaj yazma alanı kapalı
- Veren için: "Onay bekleniyor" mesajı
- Alan için: İki onay butonu görünür

#### Arşivlendi
- Mesaj yazma alanı kapalı
- Durum mesajı: "Destek tamamlandı" veya "Destek onaylanmadı"

---

## Kurulum

### 1. Database Setup

Supabase SQL Editor'de şu dosyaları sırayla çalıştırın:

```bash
# Önce invitation sistemi (eğer yoksa)
setup-invitations-complete.sql

# Sonra mutual trust sistemi
setup-mutual-trust-system.sql
```

### 2. Test Etme

#### Mutual Trust Test:
1. Bir kullanıcı ile giriş yapın
2. Profil sayfasından referans kodu oluşturun
3. Yeni bir tarayıcıda kayıt olurken bu kodu kullanın
4. Her iki kullanıcının Dashboard'unda "Güven Çemberin" bölümünü kontrol edin

#### Handshake Test:
1. Bir hediye oluşturun
2. Başka bir kullanıcı ile hediyeyi talep edin
3. Sohbet başlatın
4. Veren taraf: "Desteği Tamamladım" butonuna basın
5. Alan taraf: Onay butonlarından birini seçin
6. Her iki tarafın Dashboard'unda güven çemberini kontrol edin

---

## Önemli Notlar

### Güvenlik
- Trust connections unique constraint ile korunur (aynı bağ iki kez oluşturulamaz)
- Invitation kodları bir kez kullanılabilir
- Approval işlemi sadece receiver tarafından yapılabilir

### Performans
- Trust connections için index'ler mevcut
- Invitation promo_code için index mevcut
- Queries optimize edilmiş

### Hata Yönetimi
- Promo code bulunamazsa sessizce devam eder
- Trust connection zaten varsa duplicate error ignore edilir
- Frontend'de tüm hatalar console'a loglanır

---

## Gelecek İyileştirmeler

1. **Bildirimler**: Onay bekleyen sohbetler için bildirim sistemi
2. **İstatistikler**: Güven çemberi büyüklüğü, başarılı işbirliği sayısı
3. **Filtreleme**: Dashboard'da güven çemberine göre hediye filtreleme
4. **Referans Ödülleri**: Başarılı davetler için ödül sistemi
