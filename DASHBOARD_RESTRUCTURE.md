# 🏗️ DASHBOARD RESTRUCTURE - IMPLEMENTATION PLAN

## Overview
Complete reorganization of the dashboard into 5 main pages with clean navigation.

---

## 1. NAVIGATION STRUCTURE

### Header Menu (5 Items):
1. **Kontrol Paneli** - `/dashboard` - Overview/Home
2. **Soru/Cevap** - `/questions` - View/edit onboarding answers
3. **Güven Takımı** - `/trust-team` - Trust network management
4. **Al** - `/receive` - Receive support (marketplace)
5. **Ver** - `/give` - Give support (your cards)

### Right Side:
- User hex circle (colored, shows first 3 chars)
- "Çıkış Yap" button

---

## 2. PAGE SPECIFICATIONS

### PAGE 1: Kontrol Paneli (`/dashboard`)
**Purpose**: Overview/landing page after login

**Content**:
- Welcome message
- Quick stats (cards active, support given/received)
- Recent activity feed
- Quick actions

---

### PAGE 2: Soru/Cevap (`/questions`)
**Purpose**: View and edit onboarding answers

**Layout**:
- Display all 4 questions with answers
- Each answer is editable
- **Question 4 Special Feature**:
  - Checkbox: "Bu becerim için verilecek bir kart oluştur"
  - If checked → Auto-create gift card using first 5 words as title
  - Logic: Extract first 5 words from answer, create gift record

**Database**:
- Read from: `onboarding_answers`
- Write to: `gifts` (if checkbox checked)
- Update: `onboarding_answers.create_gift_card` column

---

### PAGE 3: Ver (Give) (`/give`)
**Purpose**: Manage your support cards

**Sub-tabs**:
1. **VER** (Active Cards)
   - List all user's active gift cards
   - Each card has toggle: Açık/Kapalı (is_active)
   - Button at bottom: "Yeni Destek Kartı Aç"
   
2. **VERDİKLERİM** (History)
   - List all support transactions where user is provider
   - Show: Receiver name/hex, card used, date
   - Query: `support_transactions WHERE provider_id = user.id`

**Database**:
- Read: `gifts WHERE creator_id = user.id`
- Read: `support_transactions WHERE provider_id = user.id`
- Update: `gifts.is_active` (toggle)

---

### PAGE 4: Al (Receive) (`/receive`)
**Purpose**: Browse and request support

**Sub-tabs**:
1. **AL** (Marketplace)
   - Filters: [Güven Takımı | Türkiye | Global]
   - Default: Güven Takımı
   - Show available gift cards
   - Click to request support
   
2. **ALDIKLARIM** (History)
   - List all support received
   - Show: Provider name/hex, card, date
   - Query: `support_transactions WHERE receiver_id = user.id`

**Filter Logic**:
- **Güven Takımı**: Show gifts from trust team members only
- **Türkiye**: Show gifts from Turkish users (future: add country field)
- **Global**: Show all active gifts

**Database**:
- Read: `gifts WHERE is_active = true` (with filters)
- Read: `support_transactions WHERE receiver_id = user.id`

---

### PAGE 5: Güven Takımı (Trust Team) (`/trust-team`)
**Purpose**: Manage trust network

**Auto-populated List** (3 criteria):
1. **Inviter/Includer**: User who invited you
   - Query: `invitations WHERE email = user.email AND status = 'used'`
   - Get: `inviter_id`

2. **Invited/Included**: Users you invited
   - Query: `invitations WHERE inviter_id = user.id AND status = 'used'`
   - Get: `used_by`

3. **Support Transactions**: Anyone you've exchanged support with
   - Query: `support_transactions WHERE provider_id = user.id OR receiver_id = user.id`
   - Get: Both `provider_id` and `receiver_id`

**Actions**:
- **Davet Linki** button: Generate invitation link with promo code
- **Dahil Et** button: Create prepaid invitation for someone

**Database**:
- Read: `invitations`, `support_transactions`
- Write: `invitations` (when creating new invites)

---

## 3. DATABASE SCHEMA UPDATES

### New Table: `support_transactions`
```sql
CREATE TABLE support_transactions (
  id UUID PRIMARY KEY,
  provider_id UUID REFERENCES profiles(id),
  receiver_id UUID REFERENCES profiles(id),
  gift_id UUID REFERENCES gifts(id),
  status TEXT ('active', 'completed', 'cancelled'),
  created_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT
);
```

### Updated Tables:
- `gifts`: Add `is_active BOOLEAN` column
- `onboarding_answers`: Add `create_gift_card BOOLEAN` column

---

## 4. IMPLEMENTATION ORDER

### Phase 1: Database (Run SQL)
1. ✅ Run `create-support-transactions.sql`
2. ✅ Verify all columns exist

### Phase 2: Shared Components
1. Create new `Layout.js` with 5-item navigation
2. Create `Header.js` component
3. Update routing in `App.js`

### Phase 3: Pages (Create in order)
1. `/dashboard` - Kontrol Paneli (simple overview)
2. `/questions` - Soru/Cevap (with checkbox logic)
3. `/give` - Ver (with tabs)
4. `/receive` - Al (with filters)
5. `/trust-team` - Güven Takımı (with auto-population)

### Phase 4: Testing
1. Test navigation between pages
2. Test gift card creation from Question 4
3. Test support transaction flow
4. Test trust team auto-population

---

## 5. KEY FEATURES TO IMPLEMENT

### Question 4 Auto-Gift Creation
```javascript
const handleQuestion4Submit = async (answer, createCard) => {
  // Save answer
  await saveAnswer(4, answer, createCard)
  
  // If checkbox is checked, create gift
  if (createCard) {
    const title = answer.split(' ').slice(0, 5).join(' ')
    await createGift({
      title: title,
      description: answer,
      creator_id: user.id,
      visibility: 'global',
      is_active: true
    })
  }
}
```

### Trust Team Auto-Population
```javascript
const fetchTrustTeam = async () => {
  const team = new Set()
  
  // 1. Get inviter
  const { data: inviter } = await supabase
    .from('invitations')
    .select('inviter_id')
    .eq('email', user.email)
    .eq('status', 'used')
  
  // 2. Get invited users
  const { data: invited } = await supabase
    .from('invitations')
    .select('used_by')
    .eq('inviter_id', user.id)
    .eq('status', 'used')
  
  // 3. Get support transaction partners
  const { data: transactions } = await supabase
    .from('support_transactions')
    .select('provider_id, receiver_id')
    .or(`provider_id.eq.${user.id},receiver_id.eq.${user.id}`)
  
  // Combine and deduplicate
  // ... return unique user IDs
}
```

---

## 6. DESIGN GUIDELINES

### Theme: Clean White
- Background: White or light gray
- Primary color: Indigo/Purple
- Cards: White with subtle shadow
- Text: Dark gray for body, black for headers

### Navigation
- Fixed top header
- Active page highlighted
- Hover effects on menu items

### Cards/Lists
- Consistent card design across all pages
- Clear visual hierarchy
- Action buttons always visible

---

## 7. NEXT STEPS

1. **Run SQL**: Execute `create-support-transactions.sql`
2. **Create Layout**: New navigation component
3. **Create Pages**: One by one in order
4. **Test Flow**: End-to-end user journey
5. **Deploy**: Push to production

---

## FILES TO CREATE/MODIFY

### New Files:
- `src/components/DashboardLayout.js` - New layout with 5-item nav
- `src/pages/KontrolPaneli.js` - Dashboard home
- `src/pages/SoruCevap.js` - Questions page
- `src/pages/Ver.js` - Give page with tabs
- `src/pages/Al.js` - Receive page with filters
- `src/pages/GuvenTakimi.js` - Trust team page

### Modified Files:
- `src/App.js` - Update routing
- `src/pages/RealDashboard.js` - Replace or redirect

### SQL Files:
- `create-support-transactions.sql` - New table schema

---

This is a complete restructure. Shall I proceed with implementation?
