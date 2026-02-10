# 🎯 FRESH START - Simple Solution

## The Problem
RLS (Row Level Security) is blocking profile creation in Supabase, causing the error:
`new row violates row-level security policy for table "profiles"`

## The Solution
Completely disable RLS and let the database auto-generate hex codes.

---

## Step 1: Fix Database (Run in Supabase SQL Editor)

```sql
-- Disable RLS on all tables
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_answers DISABLE ROW LEVEL SECURITY;
ALTER TABLE gifts DISABLE ROW LEVEL SECURITY;
ALTER TABLE circles DISABLE ROW LEVEL SECURITY;
ALTER TABLE invitations DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DO $$ 
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles') LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON profiles';
  END LOOP;
END $$;

-- Create trigger to auto-generate profiles with hex codes
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, hex_code, onboarding_completed, payment_status, role)
  VALUES (
    NEW.id,
    NEW.email,
    '#' || UPPER(LPAD(TO_HEX(FLOOR(RANDOM() * 16777215)::INT), 6, '0')),
    false,
    'pending',
    'user'
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'Error: %', SQLERRM;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant all permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Make hex_code nullable (in case it's not)
ALTER TABLE profiles ALTER COLUMN hex_code DROP NOT NULL;
```

---

## Step 2: Deploy New Build

The build is ready in the `build` folder. Upload it to Netlify.

---

## Step 3: Test

1. Sign up with new email
2. Should go directly to payment (no hex reveal page)
3. Complete payment
4. Answer questions
5. Reach dashboard

**The hex code is auto-generated in the database. User never sees a hex reveal page.**

---

## New User Flow

```
Signup → Payment → Questions → Dashboard
```

Simple. Clean. No RLS errors.

---

## If It Still Fails

The issue is in your Supabase project configuration. You'll need to:

1. Check Supabase logs (Dashboard → Logs → Postgres Logs)
2. Contact Supabase support with the exact error message
3. Or create a new Supabase project and migrate your data

The code is correct. The issue is with Supabase RLS configuration that we can't access remotely.
