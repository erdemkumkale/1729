# 🔍 TROUBLESHOOTING GUIDE

## Problem 1: System Opens Directly to Questions (Skipping Payment)
## Problem 2: Questions Don't Advance (Infinite Loop)

---

## STEP 1: Check Your Database State

Run `check-database-state.sql` in Supabase SQL Editor.

This will show you:
1. Your profile data (especially `payment_status`)
2. The `onboarding_answers` table structure
3. Any saved answers
4. All profile columns

### What to Look For:

**If `payment_status` is 'paid' but you never paid:**
- Your profile was created incorrectly
- Solution: Run this SQL to reset:
```sql
UPDATE profiles 
SET payment_status = 'pending', onboarding_completed = false 
WHERE email = 'your-email@example.com';
```

**If `onboarding_answers` has `question_id` instead of `question_index`:**
- The table structure is wrong
- Solution: Run `fix-onboarding-table.sql`

---

## STEP 2: Fix the Database Table

Run `fix-onboarding-table.sql` in Supabase SQL Editor.

This will:
- Add `question_index` column
- Migrate data from `question_id` to `question_index`
- Drop old `question_id` column
- Add correct constraints

---

## STEP 3: Clear Your Browser Data

The app might be caching old state.

### Option A: Use Incognito/Private Mode
- Open a new incognito window
- Go to your site
- Test the flow

### Option B: Clear Cache
1. Open DevTools (F12)
2. Go to Application tab
3. Click "Clear storage"
4. Check all boxes
5. Click "Clear site data"
6. Refresh page

---

## STEP 4: Deploy New Build

```bash
./deploy.sh
```

Or manually:
```bash
netlify deploy --prod --dir=build
```

---

## STEP 5: Test with Console Open

1. Open your site in incognito mode
2. Press F12 to open console
3. Login with a NEW email (or reset your existing profile)
4. Watch the console logs

### Expected Flow:

```
🚪 GateKeeper Check: { hasUser: true, paymentStatus: 'pending', ... }
💳 Gate 3: Payment not paid → /payment
```

After payment:
```
🚪 GateKeeper Check: { hasUser: true, paymentStatus: 'paid', onboardingCompleted: false }
📝 Gate 4: Onboarding incomplete → /onboarding
```

On questions page:
```
📋 OnboardingFlow mounted: { userId: '...', currentStep: 1 }
💾 Saving answer for question 1...
✅ Answer 1 saved successfully
➡️ Moving from question 1 to 2
```

---

## STEP 6: If Still Failing

### Check Console for Errors

Look for these specific errors:

**Error: "Could not find the 'question_index' column"**
- You didn't run `fix-onboarding-table.sql`
- Or it failed to execute
- Solution: Run it again, check for SQL errors

**Error: "duplicate key value violates unique constraint"**
- You have old data in the table
- Solution: Delete your test answers:
```sql
DELETE FROM onboarding_answers WHERE user_id = 'your-user-id';
```

**No errors, but step doesn't change:**
- Check if `setStep` is being called
- Look for: `➡️ Moving from question X to Y`
- If you don't see this, the save is failing silently

---

## STEP 7: Nuclear Option - Reset Everything

If nothing works, reset your test user:

```sql
-- Delete your test user's data
DELETE FROM onboarding_answers WHERE user_id = 'your-user-id';
DELETE FROM profiles WHERE id = 'your-user-id';

-- Then in Supabase Auth dashboard:
-- Delete the user from Authentication > Users
```

Then signup again with a fresh email.

---

## What Changed in This Update

1. **Better Routing Logic**: Now explicitly checks for `payment_status !== 'paid'`
2. **Better Error Messages**: Shows exact database errors in UI
3. **Better Logging**: Console shows every step of the process
4. **Functional State Update**: Uses `setStep(prevStep => prevStep + 1)` to ensure state changes
5. **Error Display**: Red error box appears if something fails

---

## Still Stuck?

Send me a screenshot of:
1. Browser console (F12) showing the logs
2. The error message (if any)
3. The output from `check-database-state.sql`

I'll tell you exactly what's wrong.
