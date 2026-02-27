'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const STEPS = ['Basics', 'Themes & SDGs', 'Outcomes', 'Indicators', 'Assumptions', 'Review']

const SDGS = [
  'SDG 1 · No Poverty', 'SDG 2 · Zero Hunger', 'SDG 3 · Good Health',
  'SDG 4 · Quality Education', 'SDG 5 · Gender Equality', 'SDG 6 · Clean Water',
  'SDG 7 · Clean Energy', 'SDG 8 · Decent Work', 'SDG 9 · Industry & Innovation',
  'SDG 10 · Reduced Inequalities', 'SDG 11 · Sustainable Cities', 'SDG 12 · Responsible Consumption',
  'SDG 13 · Climate Action', 'SDG 14 · Life Below Water', 'SDG 15 · Life on Land',
  'SDG 16 · Peace & Justice', 'SDG 17 · Partnerships',
]

const THEMES = ['ENVIRONMENTAL', 'SOCIAL', 'OPERATIONAL', 'FINANCIAL']
const THEME_ICONS: Record<string, string> = {
  ENVIRONMENTAL: '🌿', SOCIAL: '👥', OPERATIONAL: '⚙️', FINANCIAL: '💰'
}

const CATEGORIES = ['Environmental', 'Social', 'Operational', 'Financial', 'Infrastructure', 'Community', 'Governance', 'Supply Chain']

type Outcome = { theme: string; sdg_tags: string[]; outcome_title: string; outcome_description: string }
type Indicator = { outcome_index: number; name: string; unit: string; baseline_value: string; target_value: string; frequency: string; measurement_method: string }
type Assumption = { text: string; risk_level: string }

export default function NewProjectPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Step 1 - Basics
  const [basics, setBasics] = useState({
    title: '', description: '', category: '', location: '',
    start_date: '', end_date: '', budget: '',
  })

  // Step 2 - Themes & SDGs (per outcome)
  const [selectedThemes, setSelectedThemes] = useState<string[]>([])
  const [selectedSdgs, setSelectedSdgs] = useState<string[]>([])

  // Step 3 - Outcomes
  const [outcomes, setOutcomes] = useState<Outcome[]>([
    { theme: '', sdg_tags: [], outcome_title: '', outcome_description: '' }
  ])

  // Step 4 - Indicators
  const [indicators, setIndicators] = useState<Indicator[]>([
    { outcome_index: 0, name: '', unit: '', baseline_value: '', target_value: '', frequency: 'monthly', measurement_method: '' }
  ])

  // Step 5 - Assumptions
  const [assumptions, setAssumptions] = useState<Assumption[]>([
    { text: '', risk_level: 'MEDIUM' }
  ])

  const inputStyle = {
    background: 'var(--bg3)', border: '1px solid var(--border)',
    borderRadius: '6px', color: 'var(--text)', fontFamily: 'Syne, sans-serif',
    fontSize: '13px', padding: '9px 12px', outline: 'none', width: '100%',
  }

  const labelStyle = {
    fontFamily: 'DM Mono, monospace', fontSize: '9px', textTransform: 'uppercase' as const,
    letterSpacing: '1px', color: 'var(--text3)', display: 'block', marginBottom: '6px',
  }

  function toggleTheme(t: string) {
    setSelectedThemes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }

  function toggleSdg(s: string) {
    setSelectedSdgs(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  function addOutcome() {
    setOutcomes(prev => [...prev, { theme: '', sdg_tags: [], outcome_title: '', outcome_description: '' }])
  }

  function updateOutcome(i: number, field: keyof Outcome, value: any) {
    setOutcomes(prev => prev.map((o, idx) => idx === i ? { ...o, [field]: value } : o))
  }

  function removeOutcome(i: number) {
    setOutcomes(prev => prev.filter((_, idx) => idx !== i))
    setIndicators(prev => prev.filter(ind => ind.outcome_index !== i).map(ind => ({
      ...ind, outcome_index: ind.outcome_index > i ? ind.outcome_index - 1 : ind.outcome_index
    })))
  }

  function addIndicator(outcomeIndex?: number) {
    setIndicators(prev => [...prev, {
      outcome_index: outcomeIndex ?? 0, name: '', unit: '', baseline_value: '',
      target_value: '', frequency: 'monthly', measurement_method: ''
    }])
  }

  function updateIndicator(i: number, field: keyof Indicator, value: any) {
    setIndicators(prev => prev.map((ind, idx) => idx === i ? { ...ind, [field]: value } : ind))
  }

  function removeIndicator(i: number) {
    setIndicators(prev => prev.filter((_, idx) => idx !== i))
  }

  function addAssumption() {
    setAssumptions(prev => [...prev, { text: '', risk_level: 'MEDIUM' }])
  }

  function updateAssumption(i: number, field: keyof Assumption, value: string) {
    setAssumptions(prev => prev.map((a, idx) => idx === i ? { ...a, [field]: value } : a))
  }

  function removeAssumption(i: number) {
    setAssumptions(prev => prev.filter((_, idx) => idx !== i))
  }

  function canProceed() {
    if (step === 0) return basics.title.trim().length > 0
    if (step === 1) return selectedThemes.length > 0
    if (step === 2) return outcomes.every(o => o.outcome_title.trim().length > 0 && o.theme)
    if (step === 3) return indicators.every(i => i.name.trim().length > 0)
    return true
  }

  async function handleSubmit() {
    setSaving(true)
    setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { data: profile } = await supabase
      .from('profiles').select('org_id').eq('id', user.id).single()

    // Create project
    const { data: project, error: projErr } = await supabase
      .from('projects')
      .insert({
        org_id: profile?.org_id,
        owner_user_id: user.id,
        title: basics.title,
        description: basics.description,
        category: basics.category,
        location: basics.location,
        start_date: basics.start_date || null,
        end_date: basics.end_date || null,
        budget: basics.budget ? parseFloat(basics.budget) : null,
        status: 'ACTIVE',
      })
      .select().single()

    if (projErr) { setError(projErr.message); setSaving(false); return }

    // Create outcomes
    for (const outcome of outcomes) {
      if (!outcome.outcome_title.trim()) continue
      const { data: outcomeData, error: outErr } = await supabase
        .from('outcomes')
        .insert({
          project_id: project.id,
          theme: outcome.theme,
          sdg_tags: selectedSdgs,
          outcome_title: outcome.outcome_title,
          outcome_description: outcome.outcome_description,
        })
        .select().single()

      if (outErr) continue

      // Create indicators for this outcome
      const outcomeIdx = outcomes.indexOf(outcome)
      const outcomeIndicators = indicators.filter(i => i.outcome_index === outcomeIdx)
      for (const ind of outcomeIndicators) {
        if (!ind.name.trim()) continue
        await supabase.from('indicators').insert({
          outcome_id: outcomeData.id,
          name: ind.name,
          unit: ind.unit,
          baseline_value: ind.baseline_value ? parseFloat(ind.baseline_value) : null,
          target_value: ind.target_value ? parseFloat(ind.target_value) : null,
          frequency: ind.frequency,
          measurement_method: ind.measurement_method,
        })
      }
    }

    // Create assumptions
    for (const assumption of assumptions) {
      if (!assumption.text.trim()) continue
      await supabase.from('assumptions').insert({
        project_id: project.id,
        text: assumption.text,
        risk_level: assumption.risk_level,
      })
    }

    router.push(`/projects/${project.id}`)
  }

  const cardStyle = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '10px', padding: '24px', marginBottom: '14px',
  }

  return (
    <div>
      {/* Topbar */}
      <header style={{
        height: '56px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', padding: '0 28px', gap: '8px',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: '18px' }}>New Project</span>
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', color: 'var(--text3)' }}>
          / Blueprint Wizard
        </span>
      </header>

      <div style={{ padding: '28px', maxWidth: '780px', margin: '0 auto' }}>

        {/* Step progress */}
        <div style={{
          display: 'flex', background: 'var(--surface)',
          border: '1px solid var(--border)', borderRadius: '10px',
          overflow: 'hidden', marginBottom: '24px',
        }}>
          {STEPS.map((s, i) => (
            <div key={s} onClick={() => i < step && setStep(i)} style={{
              flex: 1, padding: '12px 8px',
              borderRight: i < STEPS.length - 1 ? '1px solid var(--border)' : 'none',
              display: 'flex', alignItems: 'center', gap: '6px',
              cursor: i < step ? 'pointer' : 'default',
              background: i === step ? 'var(--surface2)' : 'transparent',
              transition: 'background 0.15s',
            }}>
              <div style={{
                width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'DM Mono, monospace', fontSize: '9px',
                background: i < step ? 'var(--accent2)' : i === step ? 'var(--text)' : 'var(--border)',
                color: i < step ? '#052e16' : i === step ? 'var(--bg)' : 'var(--text3)',
              }}>
                {i < step ? '✓' : i + 1}
              </div>
              <span style={{
                fontSize: '11px', fontWeight: 700,
                color: i === step ? 'var(--text)' : i < step ? 'var(--accent)' : 'var(--text3)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{s}</span>
            </div>
          ))}
        </div>

        {/* ── STEP 0: BASICS ── */}
        {step === 0 && (
          <div style={cardStyle}>
            <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: '20px', marginBottom: '6px' }}>
              Project basics
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '20px', lineHeight: 1.6 }}>
              Give your project a name and key details. You can update these later.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Project title *</label>
                <input style={inputStyle} value={basics.title} placeholder="e.g. Cape Town Zero-Waste Initiative"
                  onChange={e => setBasics(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={3}
                  value={basics.description} placeholder="What is this project trying to achieve?"
                  onChange={e => setBasics(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={labelStyle}>Category</label>
                  <select style={inputStyle} value={basics.category}
                    onChange={e => setBasics(p => ({ ...p, category: e.target.value }))}>
                    <option value="">Select…</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Location</label>
                  <input style={inputStyle} value={basics.location} placeholder="e.g. Cape Town"
                    onChange={e => setBasics(p => ({ ...p, location: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>Start date</label>
                  <input type="date" style={inputStyle} value={basics.start_date}
                    onChange={e => setBasics(p => ({ ...p, start_date: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>End date</label>
                  <input type="date" style={inputStyle} value={basics.end_date}
                    onChange={e => setBasics(p => ({ ...p, end_date: e.target.value }))} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Budget (optional)</label>
                <input type="number" style={inputStyle} value={basics.budget} placeholder="0.00"
                  onChange={e => setBasics(p => ({ ...p, budget: e.target.value }))} />
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 1: THEMES & SDGs ── */}
        {step === 1 && (
          <div style={cardStyle}>
            <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: '20px', marginBottom: '6px' }}>
              Themes & SDGs
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '20px', lineHeight: 1.6 }}>
              Which sustainability themes and UN Sustainable Development Goals does this project address?
            </p>

            <label style={labelStyle}>Sustainability themes *</label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px' }}>
              {THEMES.map(t => (
                <div key={t} onClick={() => toggleTheme(t)} style={{
                  padding: '10px 18px', borderRadius: '8px', cursor: 'pointer',
                  fontSize: '13px', fontWeight: 600, transition: 'all 0.15s',
                  background: selectedThemes.includes(t) ? '#4ade8033' : 'var(--bg3)',
                  border: `1px solid ${selectedThemes.includes(t) ? 'var(--accent2)' : 'var(--border)'}`,
                  color: selectedThemes.includes(t) ? 'var(--accent)' : 'var(--text2)',
                }}>
                  {THEME_ICONS[t]} {t.charAt(0) + t.slice(1).toLowerCase()}
                </div>
              ))}
            </div>

            <label style={labelStyle}>Relevant SDGs (select all that apply)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {SDGS.map(s => (
                <div key={s} onClick={() => toggleSdg(s)} style={{
                  padding: '4px 10px', borderRadius: '20px', cursor: 'pointer',
                  fontSize: '11px', fontFamily: 'DM Mono, monospace', transition: 'all 0.15s',
                  background: selectedSdgs.includes(s) ? '#4ade8033' : 'transparent',
                  border: `1px solid ${selectedSdgs.includes(s) ? 'var(--accent2)' : 'var(--border)'}`,
                  color: selectedSdgs.includes(s) ? 'var(--accent)' : 'var(--text3)',
                }}>
                  {s}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 2: OUTCOMES ── */}
        {step === 2 && (
          <div>
            <div style={cardStyle}>
              <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: '20px', marginBottom: '6px' }}>
                Sustainability outcomes
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.6 }}>
                Define what this project will achieve. Each outcome should be specific and measurable.
              </p>
            </div>

            {outcomes.map((outcome, i) => (
              <div key={i} style={{ ...cardStyle, position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text3)' }}>
                    Outcome {i + 1}
                  </div>
                  {outcomes.length > 1 && (
                    <button onClick={() => removeOutcome(i)} style={{
                      background: 'none', border: 'none', color: 'var(--text3)',
                      cursor: 'pointer', fontSize: '14px',
                    }}>✕</button>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Theme *</label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {THEMES.map(t => (
                        <div key={t} onClick={() => updateOutcome(i, 'theme', t)} style={{
                          padding: '6px 12px', borderRadius: '6px', cursor: 'pointer',
                          fontSize: '11px', fontWeight: 600, transition: 'all 0.15s',
                          background: outcome.theme === t ? '#4ade8033' : 'var(--bg3)',
                          border: `1px solid ${outcome.theme === t ? 'var(--accent2)' : 'var(--border)'}`,
                          color: outcome.theme === t ? 'var(--accent)' : 'var(--text2)',
                        }}>
                          {THEME_ICONS[t]} {t.charAt(0) + t.slice(1).toLowerCase()}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Outcome title *</label>
                    <input style={inputStyle} value={outcome.outcome_title}
                      placeholder="e.g. Reduce landfill waste by 80%"
                      onChange={e => updateOutcome(i, 'outcome_title', e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Description</label>
                    <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={2}
                      value={outcome.outcome_description}
                      placeholder="Describe how this outcome will be achieved…"
                      onChange={e => updateOutcome(i, 'outcome_description', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}

            <button onClick={addOutcome} style={{
              width: '100%', padding: '12px', borderRadius: '8px', cursor: 'pointer',
              background: 'transparent', border: '1px dashed var(--border2)',
              color: 'var(--text3)', fontSize: '13px', fontWeight: 600,
              fontFamily: 'Syne, sans-serif', transition: 'all 0.15s',
            }}>
              + Add another outcome
            </button>
          </div>
        )}

        {/* ── STEP 3: INDICATORS ── */}
        {step === 3 && (
          <div>
            <div style={cardStyle}>
              <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: '20px', marginBottom: '6px' }}>
                Indicators & KPIs
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.6 }}>
                Define measurable indicators for each outcome. Set a baseline and target value.
              </p>
            </div>

            {outcomes.map((outcome, oi) => (
              <div key={oi} style={{ marginBottom: '20px' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  marginBottom: '10px', padding: '10px 14px',
                  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px',
                }}>
                  <span style={{ fontSize: '12px' }}>{THEME_ICONS[outcome.theme]}</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>{outcome.outcome_title}</span>
                </div>

                {indicators.filter(ind => ind.outcome_index === oi).map((ind, ii) => {
                  const globalIdx = indicators.findIndex((x, i) => x === ind)
                  return (
                    <div key={ii} style={{ ...cardStyle, marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase' }}>
                          Indicator {ii + 1}
                        </span>
                        {indicators.filter(x => x.outcome_index === oi).length > 1 && (
                          <button onClick={() => removeIndicator(globalIdx)} style={{
                            background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer',
                          }}>✕</button>
                        )}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', marginBottom: '10px' }}>
                        <div>
                          <label style={labelStyle}>Indicator name *</label>
                          <input style={inputStyle} value={ind.name} placeholder="e.g. CO₂ emissions"
                            onChange={e => updateIndicator(globalIdx, 'name', e.target.value)} />
                        </div>
                        <div>
                          <label style={labelStyle}>Unit</label>
                          <input style={inputStyle} value={ind.unit} placeholder="kg, %, t, R…"
                            onChange={e => updateIndicator(globalIdx, 'unit', e.target.value)} />
                        </div>
                        <div>
                          <label style={labelStyle}>Baseline value</label>
                          <input type="number" style={inputStyle} value={ind.baseline_value} placeholder="0"
                            onChange={e => updateIndicator(globalIdx, 'baseline_value', e.target.value)} />
                        </div>
                        <div>
                          <label style={labelStyle}>Target value</label>
                          <input type="number" style={inputStyle} value={ind.target_value} placeholder="100"
                            onChange={e => updateIndicator(globalIdx, 'target_value', e.target.value)} />
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                        <div>
                          <label style={labelStyle}>Frequency</label>
                          <select style={inputStyle} value={ind.frequency}
                            onChange={e => updateIndicator(globalIdx, 'frequency', e.target.value)}>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="quarterly">Quarterly</option>
                          </select>
                        </div>
                        <div>
                          <label style={labelStyle}>Measurement method</label>
                          <input style={inputStyle} value={ind.measurement_method}
                            placeholder="e.g. Monthly waste report from operations"
                            onChange={e => updateIndicator(globalIdx, 'measurement_method', e.target.value)} />
                        </div>
                      </div>
                    </div>
                  )
                })}

                <button onClick={() => addIndicator(oi)} style={{
                  width: '100%', padding: '10px', borderRadius: '6px', cursor: 'pointer',
                  background: 'transparent', border: '1px dashed var(--border)',
                  color: 'var(--text3)', fontSize: '12px', fontFamily: 'Syne, sans-serif',
                }}>
                  + Add indicator for this outcome
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── STEP 4: ASSUMPTIONS ── */}
        {step === 4 && (
          <div>
            <div style={cardStyle}>
              <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: '20px', marginBottom: '6px' }}>
                Assumptions & risks
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.6 }}>
                What assumptions are you making? What could go wrong? Capturing these upfront helps track what actually happened.
              </p>
            </div>

            {assumptions.map((a, i) => (
              <div key={i} style={{ ...cardStyle, marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase' }}>
                    Assumption {i + 1}
                  </span>
                  {assumptions.length > 1 && (
                    <button onClick={() => removeAssumption(i)} style={{
                      background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer',
                    }}>✕</button>
                  )}
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={labelStyle}>Assumption / risk</label>
                  <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={2}
                    value={a.text} placeholder="e.g. Supplier will maintain capacity throughout the project"
                    onChange={e => updateAssumption(i, 'text', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Risk level</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {['LOW', 'MEDIUM', 'HIGH'].map(level => (
                      <div key={level} onClick={() => updateAssumption(i, 'risk_level', level)} style={{
                        flex: 1, padding: '8px', borderRadius: '6px', cursor: 'pointer',
                        textAlign: 'center', fontSize: '11px', fontWeight: 700,
                        fontFamily: 'DM Mono, monospace', transition: 'all 0.15s',
                        background: a.risk_level === level
                          ? level === 'HIGH' ? '#ef444433' : level === 'MEDIUM' ? '#f59e0b33' : '#4ade8033'
                          : 'var(--bg3)',
                        border: `1px solid ${a.risk_level === level
                          ? level === 'HIGH' ? 'var(--red)' : level === 'MEDIUM' ? 'var(--amber)' : 'var(--accent2)'
                          : 'var(--border)'}`,
                        color: a.risk_level === level
                          ? level === 'HIGH' ? 'var(--red)' : level === 'MEDIUM' ? 'var(--amber)' : 'var(--accent)'
                          : 'var(--text3)',
                      }}>
                        {level}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            <button onClick={addAssumption} style={{
              width: '100%', padding: '12px', borderRadius: '8px', cursor: 'pointer',
              background: 'transparent', border: '1px dashed var(--border2)',
              color: 'var(--text3)', fontSize: '13px', fontWeight: 600,
              fontFamily: 'Syne, sans-serif',
            }}>
              + Add another assumption
            </button>
          </div>
        )}

        {/* ── STEP 5: REVIEW ── */}
        {step === 5 && (
          <div style={cardStyle}>
            <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: '20px', marginBottom: '20px' }}>
              Review & submit
            </div>

            {[
              { label: 'Project', value: basics.title },
              { label: 'Category', value: basics.category || '—' },
              { label: 'Location', value: basics.location || '—' },
              { label: 'Timeline', value: basics.start_date ? `${basics.start_date} → ${basics.end_date || 'TBD'}` : '—' },
              { label: 'Themes', value: selectedThemes.join(', ') || '—' },
              { label: 'SDGs', value: selectedSdgs.length > 0 ? `${selectedSdgs.length} selected` : '—' },
              { label: 'Outcomes', value: `${outcomes.filter(o => o.outcome_title).length} defined` },
              { label: 'Indicators', value: `${indicators.filter(i => i.name).length} defined` },
              { label: 'Assumptions', value: `${assumptions.filter(a => a.text).length} captured` },
            ].map(row => (
              <div key={row.label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 0', borderBottom: '1px solid var(--border)',
              }}>
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text3)' }}>
                  {row.label}
                </span>
                <span style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 600 }}>{row.value}</span>
              </div>
            ))}

            {error && (
              <div style={{ marginTop: '16px', padding: '12px', borderRadius: '8px', background: '#1a0a0a', border: '1px solid #7f1d1d', color: '#fca5a5', fontSize: '13px' }}>
                {error}
              </div>
            )}
          </div>
        )}

        {/* Navigation buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
          <button
            onClick={() => step > 0 ? setStep(s => s - 1) : router.push('/projects')}
            style={{
              padding: '10px 20px', borderRadius: '6px', cursor: 'pointer',
              background: 'transparent', border: '1px solid var(--border2)',
              color: 'var(--text2)', fontSize: '13px', fontWeight: 700,
              fontFamily: 'Syne, sans-serif',
            }}
          >
            {step === 0 ? 'Cancel' : '← Back'}
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              style={{
                padding: '10px 24px', borderRadius: '6px', cursor: canProceed() ? 'pointer' : 'not-allowed',
                background: 'var(--accent2)', border: 'none',
                color: '#052e16', fontSize: '13px', fontWeight: 700,
                fontFamily: 'Syne, sans-serif', opacity: canProceed() ? 1 : 0.4,
              }}
            >
              Next: {STEPS[step + 1]} →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={saving}
              style={{
                padding: '10px 24px', borderRadius: '6px', cursor: saving ? 'not-allowed' : 'pointer',
                background: 'var(--accent2)', border: 'none',
                color: '#052e16', fontSize: '13px', fontWeight: 700,
                fontFamily: 'Syne, sans-serif', opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? 'Creating project…' : '✓ Create project'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}