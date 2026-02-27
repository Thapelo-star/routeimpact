import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = 'https://vxcbsupgaonjjrkxdzws.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4Y2JzdXBnYW9uampya3hkendzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3ODg5MzUsImV4cCI6MjA4NzM2NDkzNX0.j7doewcC6GRJ4zNTuZmg5Wl-8lE5_MttbE6bImktbMM'

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}