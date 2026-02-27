'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const ROLES = [
  { value: 'PROJECT_OWNER',  label: 'Project Owner',      desc: 'Can create and manage projects' },
  { value: 'SUSTAINABILITY', label: 'Sustainability Lead', desc: 'Can review and monitor all projects' },
  { value: 'VIEWER',         label: 'Viewer',              desc: 'Read-only access to dashboards' },
  { value: 'ADMIN',          label: 'Admin',               desc: 'Full access including user management' },
]

export function InviteUserForm({ orgId }: { orgId: string }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ email: '', full_name: '', password: '', role: 'PROJECT_OWNER' })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const inputStyle = {
    background: 'var(--bg3)', border: '1px solid var(--border)',
    borderRadius: '6px', color: 'var(--text)', fontFamily: 'Syne, sans-serif',
    fontSize: '13px', padding: '9px 12px', outline: 'none', width: '100%',
  }

  const labelStyle = {
    fontFamily: 'DM Mono, monospace', fontSize: '9px',
    textTransform: 'uppercase' as const, letterSpacing: '1px',
    color: 'var(--text3)', display: 'block', marginBottom: '6px',
  }

  async function handleInvite() {
    setSaving(true)
    setError('')
    setSuccess('')

    const supabase = createClient()

    // Sign up the new user
    const { data, error: signUpErr } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.full_name } }
    })

    if (signUpErr) { setError(signUpErr.message); setSaving(false); return }

    if (data.user) {
      // Update their profile with org and role
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ org_id: orgId, role: form.role })
        .eq('id', data.user.id)

      if (profileErr) { setError(profileErr.message); setSaving(false); return }
    }

    setSuccess(`${form.full_name || form.email} has been added to your organisation.`)
    setForm({ email: '', full_name: '', password: '', role: 'PROJECT_OWNER' })
    setSaving(false)
    setTimeout(() => { setSuccess(''); setOpen(false); window.location.reload() }, 2000)
  }

  return (
    <div style={{ marginBottom: '20px' }}>
      {!open ? (
        <button onClick={() => setOpen(true)} style={{
          background: 'var(--accent2)', color: '#052e16', border: 'none',
          padding: '9px 18px', borderRadius: '6px', fontSize: '12px',
          fontWeight: 700, cursor: 'pointer', fontFamily: 'Syne, sans-serif',
        }}>
          + Add team member
        </button>
      ) : (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '10px', padding: '24px',
        }}>
          <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: '18px', marginBottom: '16px' }}>
            Add team member
          </div>

          {success && (
            <div style={{ marginBottom: '14px', padding: '12px', borderRadius: '8px', background: '#052e16', border: '1px solid var(--accent2)', color: 'var(--accent)', fontSize: '13px' }}>
              ✓ {success}
            </div>
          )}

          {error && (
            <div style={{ marginBottom: '14px', padding: '12px', borderRadius: '8px', background: '#1a0a0a', border: '1px solid #7f1d1d', color: '#fca5a5', fontSize: '13px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={labelStyle}>Full name</label>
              <input style={inputStyle} value={form.full_name} placeholder="Jane Smith"
                onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" style={inputStyle} value={form.email} placeholder="jane@company.com"
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Temporary password</label>
              <input type="password" style={inputStyle} value={form.password} placeholder="They can change this later"
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Role</label>
              <select style={inputStyle} value={form.role}
                onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                {ROLES.map(r => (
                  <option key={r.value} value={r.value}>{r.label} — {r.desc}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button onClick={() => setOpen(false)} style={{
              padding: '8px 16px', borderRadius: '6px', cursor: 'pointer',
              background: 'transparent', border: '1px solid var(--border2)',
              color: 'var(--text2)', fontSize: '12px', fontWeight: 700, fontFamily: 'Syne, sans-serif',
            }}>Cancel</button>
            <button onClick={handleInvite} disabled={saving || !form.email || !form.password} style={{
              padding: '8px 16px', borderRadius: '6px', cursor: 'pointer',
              background: 'var(--accent2)', border: 'none', color: '#052e16',
              fontSize: '12px', fontWeight: 700, fontFamily: 'Syne, sans-serif',
              opacity: saving || !form.email || !form.password ? 0.4 : 1,
            }}>
              {saving ? 'Adding…' : 'Add member'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}