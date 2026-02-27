import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const SUPABASE_URL = 'https://vxcbsupgaonjjrkxdzws.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4Y2JzdXBnYW9uampya3hkendzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3ODg5MzUsImV4cCI6MjA4NzM2NDkzNX0.j7doewcC6GRJ4zNTuZmg5Wl-8lE5_MttbE6bImktbMM'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {}
      },
    },
  })
}