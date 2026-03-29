import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Guard: log clearly instead of throwing, so SSR doesn't crash the module
if (!supabaseUrl || !supabaseAnon) {
  console.error(
    '[supabaseClient] Missing env vars.\n' +
    '  NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ?? '❌ undefined', '\n' +
    '  NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnon ? '✓ set' : '❌ undefined'
  )
}

export const supabase = createClient(
  supabaseUrl  ?? '',
  supabaseAnon ?? '',
  {
    auth: {
      persistSession:   true,
      autoRefreshToken: true,
    },
  }
)
