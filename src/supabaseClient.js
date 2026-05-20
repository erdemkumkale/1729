import { createClient } from '@supabase/supabase-js'

// Hardcoded — public anon key, safe to expose in client bundle
const supabaseUrl  = 'https://bwrdhplnxrcrxqpttugq.supabase.co'
const supabaseAnon = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cmRocGxueHJjcnhxcHR0dWdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NTc3MTcsImV4cCI6MjA4NTUzMzcxN30._apBGxoZ2bqF_Q48vFES6jp6xLUsEZiz6C4nFG2QyGA'

export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: {
    persistSession:   true,
    autoRefreshToken: true,
  },
})
