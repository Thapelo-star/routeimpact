'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const THEMES   = ['Environmental', 'Social', 'Operational', 'Financial']
const STATUSES = [
  { value: 'DRAFT',     label: 'Draft',     color: '#60a5fa' },
  { value: 'ACTIVE',    label: 'Active',    color: '#4ade80' },
  { value: 'COMPLETED', label: 'Completed', color: '#9db8a3' },
  { value: 'ON_HOLD',   label: 'On Hold',   color: '#f59e0b' },
]

export default function EditProjectForm({ project }: { project: any }) {
  const router   = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    name:        project.name        || '',
    description: project.description || '',
    department:  project.department  || '',
    theme:       project.theme       || '',
    status:      project.status      || 'ACTIVE',
    start_date:  project.start_date  ? project.start_date.slice(0, 10) : '',
    end_date:    project.end_date    ? project.end_date.slice(0, 10)   : '',
    budget:      project.budget      || '',
  })

  const [saving,           setSaving]           = useState(false)
  const [deleting,         setDeleting]         = useState(false)
  const [showDeleteConfirm,setShowDeleteConfirm] = useState(false)
  const [error,            setError]            = useState('')

  const set = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  async function handleSave() {
    if (!form.name.trim()) { setError('Project name is required.'); return }
    setSaving(true)
    setError('')
    const { error } = await supabase
      .from('projects')
      .update({
        name:        form.name.trim(),
        description: form.description.trim() || null,
        department:  form.department.trim()  || null,
        theme:       form.theme              || null,
        status:      form.status,
        start_date:  form.start_date         || null,
        end_date:    form.end_date           || null,
        budget:      form.budget ? Number(form.budget) : null,
        updated_at:  new Date().toISOString(),
      })
      .eq('id', project.id)

    if (error) { setError(error.message); setSaving(false); return }
    router.push(`/projects/${project.id}`)
    router.refresh()
  }

  async function handleDelete() {
    setDeleting(true)
    // Delete child records first to avoid FK violations
    const { data: outcomes } = await supabase
      .from('outcomes').select('id').eq('project_id', project.id)
    if (outcomes?.length) {
      const outcomeIds = outcomes.map((o: any) => o.id)
      await supabase.from('indicators').delete().in('outcome_id', outcomeIds)
    }
    const { data: checkins } = await supabase
      .from('checkins').select('id').eq('project_id', project.id)
    if (checkins?.length) {
      const checkinIds = checkins.map((c: any) => c.id)
      await supabase.from('kpi_updates').delete().in('checkin_id', checkinIds)
    }
    await supabase.from('checkins').delete().eq('project_id', project.id)
    await supabase.from('outcomes').delete().eq('project_id', project.id)
    await supabase.from('assumptions').delete().eq('project_id', project.id)
    await supabase.from('learnings').delete().eq('project_id', project.id)
    await supabase.from('projects').delete().eq('id', project.id)
    router.push('/projects')
    router.refresh()
  }

  return (
    <>
      {/* ── Basic Info ── */}
      <div className="form-card">
        <div className="form-title">Project Details</div>

        <div className="form-group" style={{ marginBottom: '14px' }}>
          <label>Project Name *</label>
          <input
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="e.g. Cape Town Zero-Waste Initiative"
          />
        </div>

        <div className="form-group" style={{ marginBottom: '14px' }}>
          <label>Description</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="What is this project trying to achieve?"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Department / Owner</label>
            <input
              value={form.department}
              onChange={e => set('department', e.target.value)}
              placeholder="e.g. Operations"
            />
          </div>
          <div className="form-group">
            <label>Sustainability Theme</label>
            <select value={form.theme} onChange={e => set('theme', e.target.value)}>
              <option value="">Select theme…</option>
              {THEMES.map(t => (
                <option key={t} value={t.toUpperCase()}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Start Date</label>
            <input
              type="date"
              value={form.start_date}
              onChange={e => set('start_date', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>End Date</label>
            <input
              type="date"
              value={form.end_date}
              onChange={e => set('end_date', e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Budget (ZAR)</label>
          <input
            type="number"
            value={form.budget}
            onChange={e => set('budget', e.target.value)}
            placeholder="e.g. 500000"
          />
        </div>
      </div>

      {/* ── Status ── */}
      <div className="form-card">
        <div className="form-title">Project Status</div>
        <label style={{ marginBottom: '10px', display: 'block' }}>Current Status</label>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {STATUSES.map(s => (
            <div
              key={s.value}
              onClick={() => set('status', s.value)}
              style={{
                padding: '10px 20px', borderRadius: '8px', cursor: 'pointer',
                border: `1px solid ${form.status === s.value ? s.color : 'var(--border)'}`,
                background: form.status === s.value ? `${s.color}22` : 'var(--bg3)',
                color: form.status === s.value ? s.color : 'var(--text3)',
                fontWeight: 700, fontSize: '13px', transition: 'all 0.15s',
              }}
            >
              {s.label}
            </div>
          ))}
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text3)', marginTop: '10px' }}>
          {form.status === 'DRAFT'     && 'Blueprint is being set up. Not yet active.'}
          {form.status === 'ACTIVE'    && 'Project is running. Check-ins can be logged.'}
          {form.status === 'COMPLETED' && 'Project finished. Retrospective can be submitted.'}
          {form.status === 'ON_HOLD'   && 'Project paused temporarily.'}
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{
          background: '#ef444422', border: '1px solid #ef444455',
          borderRadius: '8px', padding: '12px 16px',
          color: 'var(--red)', fontSize: '13px', marginBottom: '14px',
        }}>
          {error}
        </div>
      )}

      {/* ── Actions ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          style={{
            background: 'transparent', border: '1px solid #ef444455',
            color: 'var(--red)', padding: '8px 16px', borderRadius: '6px',
            fontSize: '12px', fontWeight: 700, cursor: 'pointer',
          }}
        >
          🗑 Delete Project
        </button>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-ghost" onClick={() => router.back()}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes ✓'}
          </button>
        </div>
      </div>

      {/* ── Delete Confirm Modal ── */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '12px', padding: '32px', maxWidth: '420px', width: '90%',
          }}>
            <div style={{
              fontFamily: 'var(--serif)', fontSize: '22px',
              color: 'var(--text)', marginBottom: '12px',
            }}>
              Delete this project?
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.6, marginBottom: '24px' }}>
              This will permanently delete{' '}
              <strong style={{ color: 'var(--text)' }}>{project.name}</strong>{' '}
              and all its outcomes, indicators, check-ins, and learnings.
              This cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-ghost"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  background: 'var(--red)', color: 'white', border: 'none',
                  padding: '8px 18px', borderRadius: '6px',
                  fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                }}
              >
                {deleting ? 'Deleting…' : 'Yes, delete permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}