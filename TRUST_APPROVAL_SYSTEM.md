# 🤝 Güven Onay Mekanizması

## Genel Bakış
Sohbet sistemine eklenen güven onay mekanizması, destek işlemlerinin tamamlanmasını ve güven çemberinin oluşturulmasını sağlar.

## Özellikler

### 1. Destek Tamamlama (Veren Tarafı)
- **Buton**: "✅ Desteği Tamamladım"
- **Konum**: Sohbet ekranının üst kısmında (sadece veren görebilir)
- **İşlev**: 
  - Support transaction status'ü `waiting_approval` olarak günceller
  - Sohbeti her iki taraf için kilitler (yazma yetkisi kapanır)
  - Alan tarafa sistem mesajı gönderir: "Desteği aldın mı?"

### 2. Onay Süreci (Alan Tarafı)
Alan tarafın ekranında sistem mesajı ve iki buton görünür:

#### ✅ Evet, Onayla ve Güven Çemberine Ekle
- Support transaction status'ü `archived` yapar
- `approval_status` = `approved`
- `trust_connections` tablosuna kayıt ekler:
  - `follower_id`: Alan kişi (receiver)
  - `followed_id`: Veren kişi (provider)
- Sohbeti arşivler
- Onay mesajı gönderir

#### ❌ Hayır, Desteği Alamadım
- Support transaction status'ü `archived` yapar
- `approval_status` = `rejected`
- Güven bağlantısı oluşturmaz
- Sohbeti arşivler
- Red mesajı gönderir

## Veritabanı Değişiklikleri

### Yeni Tablo: `trust_connections`
```sql
CREATE TABLE trust_connections (
  id UUID PRIMARY KEY,
  follower_id UUID REFERENCES profiles(id),
  followed_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP,
  UNIQUE(follower_id, followed_id)
);
```

### `support_transactions` Tablosu Güncellemeleri
```sql
ALTER TABLE support_transactions ADD COLUMN:
- status TEXT ('active', 'waiting_approval', 'completed', 'archived')
- approval_status TEXT ('approved', 'rejected', NULL)
- completed_at TIMESTAMP
```

### `messages` Tablosu Güncellemeleri
```sql
ALTER TABLE messages ADD COLUMN:
- is_system_message BOOLEAN (sistem mesajlarını işaretler)
- message_type TEXT ('user', 'system', 'approval_request')
```

## Kullanım Akışı

### Senaryo 1: Başarılı Destek
1. Veren kişi desteği tamamlar → "Desteği Tamamladım" butonuna basar
2. Sohbet kilitlener, alan kişiye onay sorusu gelir
3. Alan kişi "Evet, Onayla" der
4. Güven bağlantısı oluşur
5. Sohbet arşivlenir

### Senaryo 2: Başarısız Destek
1. Veren kişi desteği tamamlar → "Desteği Tamamladım" butonuna basar
2. Sohbet kilitlener, alan kişiye onay sorusu gelir
3. Alan kişi "Hayır, Alamadım" der
4. Güven bağlantısı oluşmaz
5. Sohbet arşivlenir

## Kurulum

### 1. SQL Script'i Çalıştır
Supabase SQL Editor'de şu dosyayı çalıştır:
```bash
setup-trust-approval-system.sql
```

### 2. Kod Güncellemeleri
- ✅ `src/pages/ProjectChat.js` - Güven onay UI ve logic
- ✅ `src/App.js` - Route güncellendi: `/chat/:giftId/:requestId`

### 3. Deploy
```bash
git add .
git commit -m "feat: add trust approval mechanism to chat system"
git push origin main
```

## UI Durumları

### Aktif Sohbet
- Mesaj input'u açık
- "Desteği Tamamladım" butonu görünür (sadece veren için)
- Yeşil badge: "Aktif"

### Onay Bekliyor
- Mesaj input'u kapalı
- Sarı badge: "Onay Bekleniyor"
- Alan taraf için onay butonları görünür
- Veren taraf için bekleme mesajı

### Arşivlenmiş
- Mesaj input'u kapalı
- Gri badge: "Arşivlendi"
- Onay durumu gösterilir (approved/rejected)

## Güvenlik Notları
- Sadece veren kişi "Desteği Tamamladım" butonunu görebilir
- Sadece alan kişi onay butonlarını görebilir
- Arşivlenmiş sohbetlerde mesaj gönderilemez
- Duplicate trust connection'lar engellenir (UNIQUE constraint)

## Test Senaryoları

### Test 1: Başarılı Onay
1. Veren olarak giriş yap
2. Aktif bir sohbete git
3. "Desteği Tamamladım" butonuna bas
4. Alan olarak giriş yap
5. "Evet, Onayla" butonuna bas
6. Güven takımında yeni bağlantıyı kontrol et

### Test 2: Red
1. Veren olarak giriş yap
2. Aktif bir sohbete git
3. "Desteği Tamamladım" butonuna bas
4. Alan olarak giriş yap
5. "Hayır, Alamadım" butonuna bas
6. Sohbetin arşivlendiğini kontrol et

## Gelecek Geliştirmeler
- [ ] Güven skorlama sistemi
- [ ] Otomatik güven önerileri
- [ ] Güven çemberi görselleştirmesi
- [ ] Destek geçmişi istatistikleri
