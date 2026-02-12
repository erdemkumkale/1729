# Test Kontrol Listesi

## ✅ Yapılan Değişiklikler

### 1. Magic Link Sistemi (Şifresiz Giriş)
- ✅ `App.js`: MagicLinkAuth import edildi
- ✅ `/login` route'u MagicLinkAuth kullanıyor
- ✅ Referans kodu desteği var

### 2. Onboarding Form Hafızası
- ✅ localStorage ile otomatik kaydetme
- ✅ Sayfa yüklendiğinde otomatik yükleme
- ✅ Tamamlandığında otomatik temizleme

---

## 🧪 Test Adımları

### Test 1: Magic Link Giriş

1. **Uygulamayı başlatın**
   ```bash
   npm start
   ```

2. **Login sayfasına gidin**
   - Tarayıcıda `http://localhost:3000/login` açın
   - Şifre alanı OLMAMALI
   - Sadece e-posta ve referans kodu alanları olmalı

3. **E-posta girin**
   - Geçerli bir e-posta adresi girin
   - "Giriş Bağlantısı Gönder" butonuna basın

4. **E-postanızı kontrol edin**
   - Gelen kutunuzu kontrol edin
   - Spam klasörünü de kontrol edin
   - Magic link'i bulun

5. **Link'e tıklayın**
   - Otomatik olarak giriş yapmalısınız
   - Payment sayfasına yönlendirilmelisiniz

**Beklenen Sonuç**: ✅ Şifre olmadan giriş yapabildiniz

---

### Test 2: Form Hafızası (localStorage)

1. **Onboarding'e gidin**
   - Payment'ı atlayın (veya tamamlayın)
   - Onboarding sayfasına gidin

2. **İlk soruyu cevaplayın**
   - Bir cevap yazın (örn: "Test cevabı 1")
   - "Devam Et" butonuna basın

3. **İkinci soruyu cevaplayın**
   - Bir cevap yazın (örn: "Test cevabı 2")
   - **SAYFAYI YENİLEYİN (F5)**

4. **Kontrol edin**
   - Hala 2. soruda olmalısınız
   - Yazdığınız cevap hala orada olmalı

**Beklenen Sonuç**: ✅ Cevaplar kaybolmadı

---

### Test 3: Geri Tuşu

1. **Onboarding'de 3. soruya ilerleyin**
   - Üç soruyu cevaplayın

2. **Tarayıcının geri tuşuna basın**
   - Başka bir sayfaya gidin

3. **Tekrar onboarding'e gelin**
   - `/onboarding` adresine gidin

4. **Kontrol edin**
   - Kaldığınız yerden devam edebilmelisiniz
   - Cevaplarınız hala orada olmalı

**Beklenen Sonuç**: ✅ İlerleme kaydedildi

---

### Test 4: Tarayıcı Kapatma

1. **Onboarding'de birkaç soru cevaplayın**
   - En az 2 soru cevaplayın

2. **Tarayıcıyı tamamen kapatın**
   - Tüm sekmeleri kapatın

3. **Tekrar açın ve giriş yapın**
   - Uygulamayı açın
   - Giriş yapın

4. **Onboarding'e gidin**
   - Cevaplarınız hala orada olmalı

**Beklenen Sonuç**: ✅ Veriler kalıcı

---

### Test 5: Tamamlama ve Temizlik

1. **Tüm soruları cevaplayın**
   - 4 soruyu da cevaplayın

2. **"Tamamla" butonuna basın**
   - Dashboard'a yönlendirilmelisiniz

3. **localStorage'ı kontrol edin**
   - F12 → Application → Local Storage
   - `onboarding_${user.id}` anahtarı OLMAMALI

**Beklenen Sonuç**: ✅ Veriler temizlendi

---

## 🔍 Sorun Giderme

### Magic Link Gelmiyor

**Kontrol Listesi**:
- [ ] E-posta adresi doğru mu?
- [ ] Spam klasörünü kontrol ettiniz mi?
- [ ] Supabase'de SMTP ayarları yapılandırılmış mı?

**Çözüm**:
1. Supabase Dashboard → Authentication → Email Templates
2. Magic Link template'ini kontrol edin
3. Development'ta Supabase kendi SMTP'sini kullanır

### localStorage Çalışmıyor

**Kontrol Listesi**:
- [ ] Tarayıcı console'unda hata var mı?
- [ ] localStorage destekleniyor mu?
- [ ] Gizli mod kullanıyor musunuz?

**Çözüm**:
1. F12 → Console açın
2. `localStorage.setItem('test', 'value')` yazın
3. Hata alırsanız tarayıcı ayarlarını kontrol edin

### Veriler Kayboldu

**Olası Nedenler**:
- Farklı cihazdan giriş yapıldı (localStorage cihaza özel)
- Tarayıcı verileri temizlendi
- Onboarding tamamlandı (veriler otomatik silinir)

---

## 📊 Başarı Kriterleri

Tüm testler başarılı olmalı:

- ✅ Magic link ile giriş yapabiliyorum
- ✅ Onboarding cevapları sayfa yenilendiğinde kalıyor
- ✅ Geri tuşuna basınca veriler korunuyor
- ✅ Tarayıcı kapansa bile veriler kalıyor
- ✅ Onboarding tamamlandığında veriler temizleniyor

---

## 🎯 Sonraki Adımlar

Eğer tüm testler başarılı ise:

1. ✅ Mutual Trust sistemini test edin (SQL dosyasını çalıştırın)
2. ✅ Handshake sistemini test edin (sohbet onayları)
3. ✅ Dashboard'da güven çemberini kontrol edin

---

## 💡 İpuçları

### localStorage'ı Manuel Kontrol
```javascript
// Console'da çalıştırın:
localStorage.getItem('onboarding_YOUR_USER_ID')
```

### localStorage'ı Manuel Temizle
```javascript
// Console'da çalıştırın:
localStorage.clear()
```

### Tüm Kayıtlı Verileri Gör
```javascript
// Console'da çalıştırın:
Object.keys(localStorage).forEach(key => {
  console.log(key, localStorage.getItem(key))
})
```
