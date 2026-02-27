'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const INDUSTRIES = ['Agriculture','Construction','Education','Energy','Finance','Healthcare','Manufacturing','Mining','Retail','Technology','Transport','Other']
const SIZES = ['1–10','11–50','51–200','201–500','500+']

export default function OrgSetupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name:'', industry:'', size:'' })

async function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  setLoading(true)
  setError('')
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { router.push('/auth/login'); return }

  // Create org
  const { data: org, error: orgErr } = await supabase
    .from('organisations')
    .insert({ name: form.name, industry: form.industry, size: form.size })
    .select()
    .single()

  if (orgErr) { setError(orgErr.message); setLoading(false); return }

  // Update profile with org and role using RPC to avoid policy recursion
  const { error: profileErr } = await supabase
    .from('profiles')
    .update({ org_id: org.id, role: 'ADMIN' })
    .eq('id', user.id)

  if (profileErr) { setError(profileErr.message); setLoading(false); return }

  router.push('/dashboard')
}
  return (
    <div className="min-h-screen flex items-center justify-center" style={{background:'var(--bg)'}}>
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="font-serif text-3xl text-accent mb-1">RouteImpact</div>
          <div className="font-mono text-xs text-text3 uppercase tracking-widest">Set up your organisation</div>
        </div>

        <div className="rounded-xl border p-8" style={{background:'var(--surface)',borderColor:'var(--border)'}}>
          <div className="font-serif text-xl text-text1 mb-2">Your organisation</div>
          <p className="text-sm text-text2 mb-6">This creates your company workspace. You can invite teammates after.</p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg text-sm text-red-400 border border-red-900" style={{background:'#1a0a0a'}}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="font-mono text-xs uppercase tracking-widest text-text3 block mb-2">Organisation name</label>
              <input
                type="text" required value={form.name}
                onChange={e => setForm(f => ({...f, name: e.target.value}))}
                placeholder="Acme Corp"
                className="w-full px-3 py-2.5 rounded-lg text-sm text-text1 outline-none"
                style={{background:'var(--bg3)',border:'1px solid var(--border)'}}
              />
            </div>
            <div>
              <label className="font-mono text-xs uppercase tracking-widest text-text3 block mb-2">Industry</label>
              <select
                required value={form.industry}
                onChange={e => setForm(f => ({...f, industry: e.target.value}))}
                className="w-full px-3 py-2.5 rounded-lg text-sm text-text1 outline-none"
                style={{background:'var(--bg3)',border:'1px solid var(--border)'}}
              >
                <option value="">Select industry…</option>
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="font-mono text-xs uppercase tracking-widest text-text3 block mb-2">Organisation size</label>
              <div className="grid grid-cols-5 gap-2">
                {SIZES.map(s => (
                  <button
                    key={s} type="button"
                    onClick={() => setForm(f => ({...f, size: s}))}
                    className="py-2 rounded-lg text-xs font-bold transition-all"
                    style={{
                      background: form.size === s ? 'var(--accent-dim, #4ade8033)' : 'var(--bg3)',
                      border: `1px solid ${form.size === s ? 'var(--accent2)' : 'var(--border)'}`,
                      color: form.size === s ? 'var(--accent)' : 'var(--text3)',
                    }}
                  >{s}</button>
                ))}
              </div>
            </div>
            <button
              type="submit" disabled={loading || !form.name || !form.industry || !form.size}
              className="w-full py-2.5 rounded-lg text-sm font-bold transition-all mt-2 disabled:opacity-40"
              style={{background:'var(--accent2)',color:'#052e16'}}
            >
              {loading ? 'Creating…' : 'Create workspace →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}