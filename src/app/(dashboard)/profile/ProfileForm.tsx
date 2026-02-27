'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ProfileForm({ user, profile }: { user: any; profile: any }) {
  const router   = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    job_title: profile?.job_title || '',
    phone:     profile?.phone     || '',
  })
  const [passwords, setPasswords] = useState({ next: '', confirm: '' })

  const [saving,        setSaving]        = useState(false)
  const [savingPw,      setSavingPw]      = useState(false)
  const [successMsg,    setSuccessMsg]    = useState('')
  const [errorMsg,      setErrorMsg]      = useState('')
  const [pwError,       setPwError]       = useState('')
  const [pwSuccess,     setPwSuccess]     = useState('')

  const initials = (form.full_name || user.email || 'U')
    .split(' ').map((w: string) => w[0] ?? '').join('').toUpperCase().slice(0, 2)

  async function handleSaveProfile() {
    setSaving(true); setSuccessMsg(''); setErrorMsg('')
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name:  form.full_name.trim() || null,
        job_title:  form.job_title.trim() || null,
        phone:      form.phone.trim()     || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
    setSaving(false)
    if (error) { setErrorMsg(error.message); return }
    setSuccessMsg('Profile updated successfully.')
    router.refresh()
  }

  async function handleChangePassword() {
    setPwError(''); setPwSuccess('')
    if (passwords.next.length < 8) { setPwError('Password must be at least 8 characters.'); return }
    if (passwords.next !== passwords.confirm) { setPwError('Passwords do not match.'); return }
    setSavingPw(true)
    const { error } = await supabase.auth.updateUser({ password: passwords.next })
    setSavingPw(false)
    if (error) { setPwError(error.message); return }
    setPwSuccess('Password updated successfully.')
    setPasswords({ next: '', confirm: '' })
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <>
      {/* ── Avatar Card ── */}
      <div className="form-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, var(--accent2), #166534)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--serif)', fontSize: '24px', color: 'white',
        }}>
          {initials}
        </div>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
            {form.full_name || 'Your Name'}
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text3)' }}>
            {user.email}
          </div>
          {profile?.organisations?.name && (
            <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text3)', marginTop: '2px' }}>
              {profile.organisations.name} · {profile?.role || 'Member'}
            </div>
          )}
        </div>
      </div>

      {/* ── Personal Details ── */}
      <div className="form-card">
        <div className="form-title">Personal Details</div>

        <div className="form-row">
          <div className="form-group">
            <label>Full Name</label>
            <input
              value={form.full_name}
              onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
              placeholder="e.g. Thapelo Tshamano"
            />
          </div>
          <div className="form-group">
            <label>Job Title</label>
            <input
              value={form.job_title}
              onChange={e => setForm(p => ({ ...p, job_title: e.target.value }))}
              placeholder="e.g. Sustainability Manager"
            />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '14px' }}>
          <label>Phone</label>
          <input
            value={form.phone}
            onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
            placeholder="+27 82 000 0000"
          />
        </div>

        <div className="form-group">
          <label>Email Address</label>
          <input value={user.email} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
          <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--text3)', marginTop: '4px' }}>
            Email cannot be changed here.
          </div>
        </div>

        {successMsg && (
          <div style={{
            background: '#4ade8022', border: '1px solid #4ade8044',
            borderRadius: '6px', padding: '10px 14px',
            color: 'var(--accent)', fontSize: '12px', marginTop: '14px',
          }}>✓ {successMsg}</div>
        )}
        {errorMsg && (
          <div style={{
            background: '#ef444422', border: '1px solid #ef444455',
            borderRadius: '6px', padding: '10px 14px',
            color: 'var(--red)', fontSize: '12px', marginTop: '14px',
          }}>{errorMsg}</div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button className="btn btn-primary" onClick={handleSaveProfile} disabled={saving}>
            {saving ? 'Saving…' : 'Save Profile ✓'}
          </button>
        </div>
      </div>

      {/* ── Organisation (read-only) ── */}
      {profile?.organisations && (
        <div className="form-card">
          <div className="form-title">Organisation</div>
          <div className="form-row">
            <div className="form-group">
              <label>Organisation Name</label>
              <input value={profile.organisations.name || ''} disabled style={{ opacity: 0.6 }} />
            </div>
            <div className="form-group">
              <label>Industry</label>
              <input value={profile.organisations.industry || ''} disabled style={{ opacity: 0.6 }} />
            </div>
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--text3)' }}>
            Organisation details can only be changed by an Admin.
          </div>
        </div>
      )}

      {/* ── Change Password ── */}
      <div className="form-card">
        <div className="form-title">Change Password</div>

        <div className="form-group" style={{ marginBottom: '14px' }}>
          <label>New Password</label>
          <input
            type="password"
            value={passwords.next}
            onChange={e => setPasswords(p => ({ ...p, next: e.target.value }))}
            placeholder="Minimum 8 characters"
          />
        </div>
        <div className="form-group" style={{ marginBottom: '14px' }}>
          <label>Confirm New Password</label>
          <input
            type="password"
            value={passwords.confirm}
            onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
            placeholder="Repeat new password"
          />
        </div>

        {pwError && (
          <div style={{
            background: '#ef444422', border: '1px solid #ef444455',
            borderRadius: '6px', padding: '10px 14px',
            color: 'var(--red)', fontSize: '12px', marginBottom: '14px',
          }}>{pwError}</div>
        )}
        {pwSuccess && (
          <div style={{
            background: '#4ade8022', border: '1px solid #4ade8044',
            borderRadius: '6px', padding: '10px 14px',
            color: 'var(--accent)', fontSize: '12px', marginBottom: '14px',
          }}>✓ {pwSuccess}</div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={handleChangePassword} disabled={savingPw}>
            {savingPw ? 'Updating…' : 'Update Password'}
          </button>
        </div>
      </div>

      {/* ── Sign Out ── */}
      <div className="form-card" style={{ borderColor: '#ef444433' }}>
        <div className="form-title" style={{ color: 'var(--red)' }}>Session</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '4px' }}>
              Sign out of RouteImpact
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text3)' }}>
              You will be redirected to the login page.
            </div>
          </div>
          <button
            onClick={handleSignOut}
            style={{
              background: 'transparent', border: '1px solid #ef444455',
              color: 'var(--red)', padding: '8px 16px', borderRadius: '6px',
              fontSize: '12px', fontWeight: 700, cursor: 'pointer',
            }}
          >
            Sign Out →
          </button>
        </div>
      </div>
    </>
  )
}