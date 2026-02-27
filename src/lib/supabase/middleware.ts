import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const SUPABASE_URL = 'https://vxcbsupgaonjjrkxdzws.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4Y2JzdXBnYW9uampya3hkendzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3ODg5MzUsImV4cCI6MjA4NzM2NDkzNX0.j7doewcC6GRJ4zNTuZmg5Wl-8lE5_MttbE6bImktbMM'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  try {
    const { data: { user } } = await supabase.auth.getUser()
    const isAuthPage = request.nextUrl.pathname.startsWith('/auth')
    const isOrgSetup = request.nextUrl.pathname.startsWith('/org-setup')

    if (!user && !isAuthPage) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      return NextResponse.redirect(url)
    }

    if (user && isAuthPage) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  } catch (e) {
    // Network error — allow request to continue, page will handle auth
    const isAuthPage = request.nextUrl.pathname.startsWith('/auth')
    if (!isAuthPage) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}