'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const fd = new FormData(e.currentTarget)
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email: fd.get('email') as string,
      password: fd.get('password') as string,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{background:'var(--bg)'}}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="font-serif text-3xl text-accent mb-1">RouteImpact</div>
          <div className="font-mono text-xs text-text3 uppercase tracking-widest">Sustainability Navigation</div>
        </div>

        <div className="rounded-xl border p-8" style={{background:'var(--surface)',borderColor:'var(--border)'}}>
          <div className="font-serif text-xl text-text1 mb-6">Sign in</div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg text-sm border" style={{background:'#1a0a0a',borderColor:'#7f1d1d',color:'#fca5a5'}}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="font-mono text-xs uppercase tracking-widest text-text3 block mb-2">Email</label>
              <input
                name="email" type="email" required
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{background:'var(--bg3)',border:'1px solid var(--border)',color:'var(--text)'}}
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="font-mono text-xs uppercase tracking-widest text-text3 block mb-2">Password</label>
              <input
                name="password" type="password" required
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{background:'var(--bg3)',border:'1px solid var(--border)',color:'var(--text)'}}
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-bold transition-all mt-2 disabled:opacity-40"
              style={{background:'var(--accent2)',color:'#052e16',border:'none',cursor:'pointer'}}
            >
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-sm text-text3">
          No account?{' '}
          <Link href="/auth/register" className="text-accent hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  )
}