'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function CheckinPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [project, setProject] = useState<any>(null)
  const [indicators, setIndicators] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    period_label: '',
    overall_status: 'GREEN',
    notes: '',
    blockers: '',
    risks: '',
  })

  const [kpiValues, setKpiValues] = useState<Record<string, { value: string; status: string; comment: string }>>({})

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: proj } = await supabase
        .from('projects')
        .select('*, outcomes(*, indicators(*))')
        .eq('id', id)
        .single()
      setProject(proj)
      const allIndicators = proj?.outcomes?.flatMap((o: any) => o.indicators || []) || []
      setIndicators(allIndicators)
      const initial: Record<string, { value: string; status: string; comment: string }> = {}
      allIndicators.forEach((ind: any) => {
        initial[ind.id] = { value: '', status: 'GREEN', comment: '' }
      })
      setKpiValues(initial)
    }
    load()
  }, [id])

  async function handleSubmit() {
    setSaving(true)
    setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: checkin, error: checkinErr } = await supabase
      .from('checkins')
      .insert({
        project_id: id,
        created_by: user?.id,
        date: form.date,
        period_label: form.period_label,
        overall_status: form.overall_status,
        notes: form.notes,
        blockers: form.blockers,
        risks: form.risks,
      })
      .select().single()

    if (checkinErr) { setError(checkinErr.message); setSaving(false); return }

    // Save KPI updates
    const kpiInserts = Object.entries(kpiValues)
      .filter(([_, v]) => v.value !== '')
      .map(([indicator_id, v]) => ({
        checkin_id: checkin.id,
        indicator_id,
        value: parseFloat(v.value),
        status: v.status,
        comment: v.comment,
      }))

    if (kpiInserts.length > 0) {
      await supabase.from('kpi_updates').insert(kpiInserts)
    }

    router.push(`/projects/${id}`)
  }

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

  const cardStyle = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '10px', padding: '24px', marginBottom: '14px',
  }

  return (
    <div>
      <header style={{
        height: '56px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', padding: '0 28px', gap: '8px',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <Link href={`/projects/${id}`} style={{ textDecoration: 'none', color: 'var(--text3)', fontSize: '13px' }}>
          {project?.title || 'Project'}
        </Link>
        <span style={{ color: 'var(--text3)' }}>/</span>
        <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: '18px' }}>Add Check-in</span>
      </header>

      <div style={{ padding: '28px', maxWidth: '780px', margin: '0 auto' }}>
        <div style={cardStyle}>
          <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: '20px', marginBottom: '20px' }}>
            Check-in details
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={labelStyle}>Period label</label>
              <input style={inputStyle} value={form.period_label}
                placeholder="e.g. March 2026"
                onChange={e => setForm(p => ({ ...p, period_label: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Date</label>
              <input type="date" style={inputStyle} value={form.date}
                onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Overall status</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['GREEN', 'AMBER', 'RED'].map(s => (
                <div key={s} onClick={() => setForm(p => ({ ...p, overall_status: s }))} style={{
                  flex: 1, padding: '10px', borderRadius: '6px', cursor: 'pointer',
                  textAlign: 'center', fontSize: '12px', fontWeight: 700,
                  fontFamily: 'DM Mono, monospace', transition: 'all 0.15s',
                  background: form.overall_status === s
                    ? s === 'GREEN' ? '#4ade8033' : s === 'RED' ? '#ef444433' : '#f59e0b33'
                    : 'var(--bg3)',
                  border: `1px solid ${form.overall_status === s
                    ? s === 'GREEN' ? 'var(--accent2)' : s === 'RED' ? 'var(--red)' : 'var(--amber)'
                    : 'var(--border)'}`,
                  color: form.overall_status === s
                    ? s === 'GREEN' ? 'var(--accent)' : s === 'RED' ? 'var(--red)' : 'var(--amber)'
                    : 'var(--text3)',
                }}>
                  ● {s}
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Progress notes</label>
            <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={3}
              value={form.notes} placeholder="Describe overall progress this period…"
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={labelStyle}>Blockers</label>
              <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={2}
                value={form.blockers} placeholder="Any blockers or delays?"
                onChange={e => setForm(p => ({ ...p, blockers: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Emerging risks</label>
              <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={2}
                value={form.risks} placeholder="Any new risks to flag?"
                onChange={e => setForm(p => ({ ...p, risks: e.target.value }))} />
            </div>
          </div>
        </div>

        {/* KPI Updates */}
        {indicators.length > 0 && (
          <div style={cardStyle}>
            <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: '20px', marginBottom: '6px' }}>
              KPI Updates
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '20px' }}>
              Record the latest value for each indicator.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {indicators.map((ind: any) => (
                <div key={ind.id} style={{
                  padding: '16px', borderRadius: '8px',
                  background: 'var(--bg3)', border: '1px solid var(--border)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>{ind.name}</div>
                      <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: 'var(--text3)' }}>
                        Baseline: {ind.baseline_value ?? '—'} · Target: {ind.target_value ?? '—'} {ind.unit}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={labelStyle}>New value ({ind.unit || 'unit'})</label>
                      <input type="number" style={inputStyle}
                        value={kpiValues[ind.id]?.value || ''}
                        placeholder="0.0"
                        onChange={e => setKpiValues(prev => ({
                          ...prev,
                          [ind.id]: { ...prev[ind.id], value: e.target.value }
                        }))} />
                    </div>
                    <div>
                      <label style={labelStyle}>Status</label>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {['GREEN', 'AMBER', 'RED'].map(s => (
                          <div key={s} onClick={() => setKpiValues(prev => ({
                            ...prev,
                            [ind.id]: { ...prev[ind.id], status: s }
                          }))} style={{
                            flex: 1, padding: '8px 4px', borderRadius: '4px',
                            cursor: 'pointer', textAlign: 'center',
                            fontSize: '9px', fontFamily: 'DM Mono, monospace', fontWeight: 700,
                            background: kpiValues[ind.id]?.status === s
                              ? s === 'GREEN' ? '#4ade8033' : s === 'RED' ? '#ef444433' : '#f59e0b33'
                              : 'var(--bg2)',
                            border: `1px solid ${kpiValues[ind.id]?.status === s
                              ? s === 'GREEN' ? 'var(--accent2)' : s === 'RED' ? 'var(--red)' : 'var(--amber)'
                              : 'var(--border)'}`,
                            color: kpiValues[ind.id]?.status === s
                              ? s === 'GREEN' ? 'var(--accent)' : s === 'RED' ? 'var(--red)' : 'var(--amber)'
                              : 'var(--text3)',
                          }}>
                            {s[0]}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Comment</label>
                      <input style={inputStyle}
                        value={kpiValues[ind.id]?.comment || ''}
                        placeholder="Optional note…"
                        onChange={e => setKpiValues(prev => ({
                          ...prev,
                          [ind.id]: { ...prev[ind.id], comment: e.target.value }
                        }))} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div style={{ padding: '12px', borderRadius: '8px', background: '#1a0a0a', border: '1px solid #7f1d1d', color: '#fca5a5', fontSize: '13px', marginBottom: '14px' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Link href={`/projects/${id}`}>
            <button style={{
              padding: '10px 20px', borderRadius: '6px', cursor: 'pointer',
              background: 'transparent', border: '1px solid var(--border2)',
              color: 'var(--text2)', fontSize: '13px', fontWeight: 700, fontFamily: 'Syne, sans-serif',
            }}>Cancel</button>
          </Link>
          <button onClick={handleSubmit} disabled={saving} style={{
            padding: '10px 24px', borderRadius: '6px', cursor: saving ? 'not-allowed' : 'pointer',
            background: 'var(--accent2)', border: 'none', color: '#052e16',
            fontSize: '13px', fontWeight: 700, fontFamily: 'Syne, sans-serif',
            opacity: saving ? 0.6 : 1,
          }}>
            {saving ? 'Saving…' : 'Save Check-in ✓'}
          </button>
        </div>
      </div>
    </div>
  )
}