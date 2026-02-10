# 🎟️ PROMO CODE SYSTEM - IMPLEMENTATION GUIDE

## ✅ What's Been Done

### 1. PaymentPage Refactored
**File**: `src/pages/PaymentPage.js`

**New Features**:
- Clean white design (consistent with app)
- Single price display: **$10 / Ay**
- Promo code input field: "Davet veya Dahil Etme Kodu"
- "Uygula" button to apply code
- Dynamic price updates based on promo type

**Promo Code Logic**:
- `discount_50` → Shows $5 / Ay (crosses out $10)
- `prepaid` → Shows $0 + message "#[HEX] sizi dahil etti"
- Invalid → Shows "Geçersiz kod" error

---

## 📋 Database Setup Required

### Step 1: Update Invitations Table

Run `update-invitations-table.sql` in Supabase SQL Editor.

This adds:
- `promo_code` column (VARCHAR(6), UNIQUE)
- `used_by` column (UUID, references profiles)
- `used_at` column (TIMESTAMPTZ)
- Index for fast lookups
- Helper function to generate random codes

---

## 🎯 How to Generate Promo Codes

### Method 1: Manual SQL (For Testing)

```sql
-- Generate a 50% discount code
INSERT INTO invitations (email, inviter_id, type, status, promo_code)
VALUES (
  'friend@example.com',
  'your-user-id-here',
  'discount_50',
  'pending',
  'SAVE50'
);

-- Generate a prepaid (free) code
INSERT INTO invitations (email, inviter_id, type, status, promo_code)
VALUES (
  'vip@example.com',
  'your-user-id-here',
  'prepaid',
  'pending',
  'FREE00'
);
```

### Method 2: Using the Helper Function

```sql
-- Auto-generate random 6-character code
INSERT INTO invitations (email, inviter_id, type, status, promo_code)
VALUES (
  'user@example.com',
  (SELECT id FROM profiles WHERE email = 'your-email@example.com'),
  'discount_50',
  'pending',
  generate_promo_code()
);
```

---

## 🔮 Future: Dashboard Integration

### Where to Add (Not Implemented Yet)

In `src/pages/RealDashboard.js`, add a "Güven Takımı" section with:

1. **Button**: "Birini Davet Et" or "Birini Dahil Et"
2. **Modal Opens** with:
   - Email input
   - Type selector (discount_50 or prepaid)
   - "Kod Oluştur" button
3. **On Submit**:
   ```javascript
   const generateInvitation = async (email, type) => {
     // Generate random 6-char code
     const promoCode = Math.random().toString(36).substring(2, 8).toUpperCase()
     
     // Insert into invitations table
     const { data, error } = await supabase
       .from('invitations')
       .insert({
         email: email,
         inviter_id: user.id,
         type: type, // 'discount_50' or 'prepaid'
         status: 'pending',
         promo_code: promoCode
       })
       .select()
       .single()
     
     // Display code to user
     alert(`Kod oluşturuldu: ${promoCode}\n\nBu kodu ${email} ile paylaşın.`)
     
     // (Optional) Trigger email notification
     // await sendEmail(email, promoCode)
   }
   ```

---

## 🧪 Testing the System

### Test 1: Create a Promo Code

```sql
INSERT INTO invitations (email, inviter_id, type, status, promo_code)
VALUES (
  'test@example.com',
  (SELECT id FROM profiles LIMIT 1),
  'discount_50',
  'pending',
  'TEST50'
);
```

### Test 2: Use the Code

1. Logout
2. Sign up with new email
3. On payment page, enter: `TEST50`
4. Click "Uygula"
5. Should see: $5 / Ay (crossed out $10)
6. Complete payment
7. Check database: invitation status should be 'used'

### Test 3: Prepaid Code

```sql
INSERT INTO invitations (email, inviter_id, type, status, promo_code)
SELECT 
  'vip@example.com',
  id,
  'prepaid',
  'pending',
  'VIP000'
FROM profiles 
WHERE hex_code IS NOT NULL 
LIMIT 1;
```

Then use code `VIP000` → Should show $0 and inviter's hex code.

---

## 📊 Database Schema

### invitations Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| email | TEXT | Invited user's email |
| inviter_id | UUID | Who created the invitation |
| type | TEXT | 'discount_50' or 'prepaid' |
| status | TEXT | 'pending' or 'used' |
| promo_code | VARCHAR(6) | Unique 6-character code |
| used_by | UUID | User who used the code |
| used_at | TIMESTAMPTZ | When code was used |
| created_at | TIMESTAMPTZ | When code was created |

---

## 🎨 UI Text (Already Implemented)

### PaymentPage
- **Title**: "Abonelik"
- **Subtitle**: "Takımlaşma ekosistemine giriş için ilk filtremiz, ekosistemin sürdürülebilirliğini sağlamak adına abonelik ücreti."
- **Input Label**: "Davet veya Dahil Etme Kodu"
- **Button**: "Uygula"
- **Prepaid Message**: "#[HEX] sizi dahil etti."
- **Discount Message**: "%50 indirim uygulandı!"
- **Error**: "Geçersiz kod"

---

## 🚀 Deployment Steps

1. ✅ Run `update-invitations-table.sql` in Supabase
2. ✅ Deploy new PaymentPage (already done)
3. ✅ Test with manual promo codes
4. ⏳ Later: Add dashboard UI for generating codes

---

## 📝 Summary

✅ **PaymentPage** - Refactored with promo code system
✅ **SQL Schema** - Updated invitations table
✅ **Promo Logic** - discount_50 and prepaid types
✅ **Clean Design** - White theme, simple UI
⏳ **Dashboard UI** - Not yet implemented (manual SQL for now)

**Current Status**: Promo codes work! Create them manually in SQL, users can apply them on payment page.

**Next Step**: Add UI in dashboard to generate codes with one click.
