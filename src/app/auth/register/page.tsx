'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const fd = new FormData(e.currentTarget)

    if (fd.get('password') !== fd.get('confirm_password')) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: fd.get('email') as string,
      password: fd.get('password') as string,
      options: {
        data: { full_name: fd.get('full_name') as string }
      }
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/org-setup')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{background:'var(--bg)'}}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="font-serif text-3xl text-accent mb-1">RouteImpact</div>
          <div className="font-mono text-xs text-text3 uppercase tracking-widest">Create your account</div>
        </div>

        <div className="rounded-xl border p-8" style={{background:'var(--surface)',borderColor:'var(--border)'}}>
          <div className="font-serif text-xl text-text1 mb-6">Get started</div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg text-sm border" style={{background:'#1a0a0a',borderColor:'#7f1d1d',color:'#fca5a5'}}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { name:'full_name', label:'Full name', type:'text', placeholder:'Sarah Abdi' },
              { name:'email', label:'Work email', type:'email', placeholder:'you@company.com' },
              { name:'password', label:'Password', type:'password', placeholder:'8+ characters' },
              { name:'confirm_password', label:'Confirm password', type:'password', placeholder:'••••••••' },
            ].map(f => (
              <div key={f.name}>
                <label className="font-mono text-xs uppercase tracking-widest text-text3 block mb-2">{f.label}</label>
                <input
                  name={f.name} type={f.type} required placeholder={f.placeholder}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{background:'var(--bg3)',border:'1px solid var(--border)',color:'var(--text)'}}
                />
              </div>
            ))}
            <button
              type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-bold transition-all mt-2 disabled:opacity-40"
              style={{background:'var(--accent2)',color:'#052e16',border:'none',cursor:'pointer'}}
            >
              {loading ? 'Creating account…' : 'Create account →'}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-sm text-text3">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-accent hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}