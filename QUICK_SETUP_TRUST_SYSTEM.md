# 🚀 Güven Onay Sistemi - Hızlı Kurulum

## ⚡ Tek Adımda Kurulum

### 1. SQL Script'i Çalıştır
Supabase Dashboard → SQL Editor → Yeni Query:

```sql
-- Kopyala-yapıştır: setup-trust-approval-system.sql dosyasının içeriğini
```

### 2. Vercel'de Otomatik Deploy
✅ Kod zaten push edildi, Vercel otomatik deploy edecek.

## 🎯 Nasıl Çalışır?

### Veren Tarafı (Provider)
1. Sohbet ekranında "✅ Desteği Tamamladım" butonuna bas
2. Sohbet kilitlenir
3. Karşı tarafın onayını bekle

### Alan Tarafı (Receiver)
1. Sistem mesajı gelir: "Desteği aldın mı?"
2. İki seçenek:
   - ✅ **Evet, Onayla** → Güven çemberine eklenir
   - ❌ **Hayır, Alamadım** → Sadece arşivlenir

## 📊 Veritabanı Değişiklikleri

### Yeni Tablo
- `trust_connections` - Güven bağlantılarını saklar

### Güncellemeler
- `support_transactions` → `status`, `approval_status`, `completed_at`
- `messages` → `is_system_message`, `message_type`

## 🔗 Route Değişikliği
Eski: `/gift/:giftId/chat/:requestId`
Yeni: `/chat/:giftId/:requestId`

## ✅ Tamamlandı
- [x] SQL schema oluşturuldu
- [x] Chat UI güncellendi
- [x] Onay mekanizması eklendi
- [x] Güven bağlantısı logic'i
- [x] Sistem mesajları
- [x] Route güncellendi
- [x] Kod push edildi

## 🧪 Test Et
1. İki farklı hesapla giriş yap
2. Birinden destek kartı oluştur
3. Diğerinden destek iste
4. Sohbet başlat
5. Veren: "Desteği Tamamladım" butonuna bas
6. Alan: Onay butonlarından birini seç
7. Güven takımını kontrol et

## 📝 Notlar
- Sadece SQL script'i çalıştırman gerekiyor
- Vercel otomatik deploy edecek
- Tüm kod değişiklikleri push edildi
