'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const LESSON_TAGS = [
  'Regulatory Risk', 'Supplier Readiness', 'Community Engagement',
  'Budget Buffer', 'Timeline Pressure', 'Change Management',
  'Executive Sponsorship', 'Data Quality', 'Stakeholder Alignment',
  'Technical Complexity', 'Resource Constraints', 'Policy Changes',
]

export default function RetrospectivePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [project,   setProject]   = useState<any>(null)
  const [outcomes,  setOutcomes]  = useState<any[]>([])
  const [saving,    setSaving]    = useState(false)
  const [aiRunning, setAiRunning] = useState(false)
  const [error,     setError]     = useState('')
  const [aiStatus,  setAiStatus]  = useState<'idle' | 'running' | 'done' | 'failed'>('idle')

  const [form, setForm] = useState({
    what_worked:     '',
    what_didnt:      '',
    recommendations: '',
    key_drivers:     '',
    lessons_tags:    [] as string[],
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: proj } = await supabase
        .from('projects')
        .select('*, outcomes(*, indicators(*))')
        .eq('id', id)
        .single()
      setProject(proj)
      setOutcomes(proj?.outcomes || [])
    }
    load()
  }, [id])

  function toggleTag(tag: string) {
    setForm(prev => ({
      ...prev,
      lessons_tags: prev.lessons_tags.includes(tag)
        ? prev.lessons_tags.filter(t => t !== tag)
        : [...prev.lessons_tags, tag],
    }))
  }

  async function handleSubmit() {
    setSaving(true)
    setError('')
    const supabase = createClient()

    // 1. Save retrospective
    const { data: inserted, error: retroErr } = await supabase
      .from('learnings')
      .insert({
        project_id:      id,
        what_worked:     form.what_worked,
        what_didnt:      form.what_didnt,
        recommendations: form.recommendations,
        key_drivers:     form.key_drivers,
        lessons_tags:    form.lessons_tags,
      })
      .select()
      .single()

    if (retroErr) { setError(retroErr.message); setSaving(false); return }

    // 2. Mark project completed
    await supabase.from('projects').update({ status: 'COMPLETED' }).eq('id', id)

    setSaving(false)

    // 3. Trigger AI summary in background
    if (inserted?.id && process.env.NEXT_PUBLIC_AI_ENABLED !== 'false') {
      setAiRunning(true)
      setAiStatus('running')
      try {
        const res = await fetch('/api/ai/retrospective', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ learningId: inserted.id, projectId: id }),
        })
        if (res.ok) {
          setAiStatus('done')
        } else {
          setAiStatus('failed')
        }
      } catch {
        setAiStatus('failed')
      } finally {
        setAiRunning(false)
      }
    }

    router.push(`/projects/${id}`)
  }

  const inputStyle = {
    background: 'var(--bg3)', border: '1px solid var(--border)',
    borderRadius: '6px', color: 'var(--text)', fontFamily: 'Syne, sans-serif',
    fontSize: '13px', padding: '9px 12px', outline: 'none',
    width: '100%', resize: 'vertical' as const,
  }

  const labelStyle = {
    fontFamily: 'DM Mono, monospace', fontSize: '9px',
    textTransform: 'uppercase' as const, letterSpacing: '1px',
    color: 'var(--text3)', display: 'block', marginBottom: '6px',
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
        <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: '18px' }}>Retrospective</span>

        {/* AI status indicator */}
        {aiStatus === 'running' && (
          <span style={{ marginLeft: 'auto', fontFamily: 'DM Mono, monospace', fontSize: '10px', color: 'var(--accent)' }}>
            ✦ Generating AI summary…
          </span>
        )}
        {aiStatus === 'done' && (
          <span style={{ marginLeft: 'auto', fontFamily: 'DM Mono, monospace', fontSize: '10px', color: 'var(--accent)' }}>
            ✓ AI summary saved
          </span>
        )}
      </header>

      <div style={{ padding: '28px', maxWidth: '780px', margin: '0 auto' }}>

        {/* AI info banner */}
        <div style={{
          background: '#4ade8011', border: '1px solid #4ade8022',
          borderRadius: '10px', padding: '12px 16px', marginBottom: '20px',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <span style={{ fontSize: '16px' }}>✦</span>
          <div style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--accent)' }}>AI Summary</strong> — After you save, an executive summary will be automatically generated and stored on the project&apos;s retrospective tab.
          </div>
        </div>

        {/* Targets vs Actuals */}
        {outcomes.length > 0 && (
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '10px', marginBottom: '14px', overflow: 'hidden',
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: '18px' }}>
                Targets vs Actuals
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg3)' }}>
                  {['Indicator', 'Baseline', 'Target', 'Unit', 'Outcome'].map(h => (
                    <th key={h} style={{
                      fontFamily: 'DM Mono, monospace', fontSize: '9px',
                      textTransform: 'uppercase', letterSpacing: '1px',
                      color: 'var(--text3)', padding: '8px 20px',
                      textAlign: 'left', borderBottom: '1px solid var(--border)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {outcomes.flatMap((o: any) => o.indicators?.map((ind: any) => (
                  <tr key={ind.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 20px', fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{ind.name}</td>
                    <td style={{ padding: '10px 20px', fontFamily: 'DM Mono, monospace', fontSize: '12px', color: 'var(--text2)' }}>{ind.baseline_value ?? '—'}</td>
                    <td style={{ padding: '10px 20px', fontFamily: 'DM Mono, monospace', fontSize: '12px', color: 'var(--accent)' }}>{ind.target_value ?? '—'}</td>
                    <td style={{ padding: '10px 20px', fontFamily: 'DM Mono, monospace', fontSize: '12px', color: 'var(--text3)' }}>{ind.unit || '—'}</td>
                    <td style={{ padding: '10px 20px', fontSize: '12px', color: 'var(--text2)' }}>{o.outcome_title}</td>
                  </tr>
                )) || [])}
              </tbody>
            </table>
          </div>
        )}

        {/* Four quadrant form */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
          {[
            { key: 'what_worked',     label: '✓ What Worked',      color: 'var(--accent)', placeholder: 'What went well? What would you repeat next time?' },
            { key: 'what_didnt',      label: "✗ What Didn't Work", color: 'var(--red)',    placeholder: 'What underperformed? Where did you fall short?' },
            { key: 'recommendations', label: '→ Recommendations',  color: 'var(--blue)',   placeholder: 'What should future projects do differently?' },
            { key: 'key_drivers',     label: '⚡ Key Drivers',      color: 'var(--amber)',  placeholder: 'What factors most influenced the outcome?' },
          ].map(section => (
            <div key={section.key} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '10px', padding: '18px',
            }}>
              <div style={{
                fontFamily: 'DM Mono, monospace', fontSize: '10px',
                textTransform: 'uppercase', letterSpacing: '1px',
                color: section.color, marginBottom: '10px',
              }}>
                {section.label}
              </div>
              <textarea
                style={inputStyle} rows={5}
                value={form[section.key as keyof typeof form] as string}
                placeholder={section.placeholder}
                onChange={e => setForm(prev => ({ ...prev, [section.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>

        {/* Lesson tags */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '10px', padding: '18px', marginBottom: '14px',
        }}>
          <label style={labelStyle}>Lesson Tags</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
            {LESSON_TAGS.map(tag => (
              <div key={tag} onClick={() => toggleTag(tag)} style={{
                padding: '4px 12px', borderRadius: '20px', cursor: 'pointer',
                fontSize: '11px', fontFamily: 'DM Mono, monospace', transition: 'all 0.15s',
                background: form.lessons_tags.includes(tag) ? '#4ade8033' : 'transparent',
                border: `1px solid ${form.lessons_tags.includes(tag) ? 'var(--accent2)' : 'var(--border)'}`,
                color: form.lessons_tags.includes(tag) ? 'var(--accent)' : 'var(--text3)',
              }}>
                {tag}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div style={{
            padding: '12px', borderRadius: '8px',
            background: '#1a0a0a', border: '1px solid #7f1d1d',
            color: '#fca5a5', fontSize: '13px', marginBottom: '14px',
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Link href={`/projects/${id}`}>
            <button style={{
              padding: '10px 20px', borderRadius: '6px', cursor: 'pointer',
              background: 'transparent', border: '1px solid var(--border2)',
              color: 'var(--text2)', fontSize: '13px', fontWeight: 700,
              fontFamily: 'Syne, sans-serif',
            }}>Cancel</button>
          </Link>
          <button
            onClick={handleSubmit}
            disabled={saving || aiRunning}
            style={{
              padding: '10px 24px', borderRadius: '6px',
              cursor: (saving || aiRunning) ? 'not-allowed' : 'pointer',
              background: 'var(--accent2)', border: 'none', color: '#052e16',
              fontSize: '13px', fontWeight: 700, fontFamily: 'Syne, sans-serif',
              opacity: (saving || aiRunning) ? 0.6 : 1,
            }}
          >
            {saving ? 'Saving…' : aiRunning ? '✦ Generating summary…' : '✓ Complete project & save'}
          </button>
        </div>
      </div>
    </div>
  )
}