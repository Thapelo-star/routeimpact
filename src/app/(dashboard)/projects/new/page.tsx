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

// ── AI suggestion button ──────────────────────
function AiButton({ loading, onClick, label = '✦ Suggest' }: { loading: boolean; onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '5px 12px', borderRadius: '20px', cursor: loading ? 'not-allowed' : 'pointer',
        background: '#4ade8011', border: '1px solid #4ade8033',
        color: 'var(--accent)', fontSize: '11px', fontFamily: 'DM Mono, monospace',
        fontWeight: 700, transition: 'all 0.15s', opacity: loading ? 0.6 : 1,
      }}
    >
      {loading ? '✦ Thinking…' : label}
    </button>
  )
}

// ── Suggestion pill (accept/ignore) ──────────
function SuggestionPill({ label, onAccept }: { label: string; onAccept: () => void }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: '4px 10px', borderRadius: '20px',
      background: '#4ade8011', border: '1px solid #4ade8033',
      fontSize: '11px', color: 'var(--text2)',
    }}>
      <span>{label}</span>
      <span
        onClick={onAccept}
        style={{
          color: 'var(--accent)', fontWeight: 700, cursor: 'pointer',
          fontSize: '12px', lineHeight: 1,
        }}
        title="Accept suggestion"
      >＋</span>
    </div>
  )
}

export default function NewProjectPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Step 1
  const [basics, setBasics] = useState({
    title: '', description: '', category: '', location: '',
    start_date: '', end_date: '', budget: '',
  })

  // Step 2
  const [selectedThemes, setSelectedThemes] = useState<string[]>([])
  const [selectedSdgs, setSelectedSdgs] = useState<string[]>([])

  // Step 3
  const [outcomes, setOutcomes] = useState<Outcome[]>([
    { theme: '', sdg_tags: [], outcome_title: '', outcome_description: '' }
  ])

  // Step 4
  const [indicators, setIndicators] = useState<Indicator[]>([
    { outcome_index: 0, name: '', unit: '', baseline_value: '', target_value: '', frequency: 'monthly', measurement_method: '' }
  ])

  // Step 5
  const [assumptions, setAssumptions] = useState<Assumption[]>([
    { text: '', risk_level: 'MEDIUM' }
  ])

  // ── AI state ──
  const [aiLoadingSdgs,        setAiLoadingSdgs]        = useState(false)
  const [aiSdgSuggestions,     setAiSdgSuggestions]     = useState<string[]>([])
  const [aiLoadingOutcomes,    setAiLoadingOutcomes]    = useState<Record<number, boolean>>({})
  const [aiOutcomeSuggestions, setAiOutcomeSuggestions] = useState<Record<number, any[]>>({})
  const [aiLoadingKpis,        setAiLoadingKpis]        = useState<Record<number, boolean>>({})
  const [aiKpiSuggestions,     setAiKpiSuggestions]     = useState<Record<number, any[]>>({})
  const [aiLoadingRisks,       setAiLoadingRisks]       = useState(false)
  const [aiRiskSuggestions,    setAiRiskSuggestions]    = useState<any[]>([])

  // ── AI calls ──
  async function suggestSdgs() {
    setAiLoadingSdgs(true)
    setAiSdgSuggestions([])
    try {
      const res = await fetch('/api/ai/blueprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'sdgs', themes: selectedThemes }),
      })
      const data = await res.json()
      if (data.suggestions) setAiSdgSuggestions(data.suggestions.filter((s: string) => !selectedSdgs.includes(s)))
    } catch {}
    setAiLoadingSdgs(false)
  }

  async function suggestOutcomes(themeIndex: number, theme: string) {
    setAiLoadingOutcomes(p => ({ ...p, [themeIndex]: true }))
    setAiOutcomeSuggestions(p => ({ ...p, [themeIndex]: [] }))
    try {
      const res = await fetch('/api/ai/blueprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'outcomes', theme, description: basics.description }),
      })
      const data = await res.json()
      if (data.suggestions) setAiOutcomeSuggestions(p => ({ ...p, [themeIndex]: data.suggestions }))
    } catch {}
    setAiLoadingOutcomes(p => ({ ...p, [themeIndex]: false }))
  }

  async function suggestKpis(outcomeIndex: number, outcome: Outcome) {
    setAiLoadingKpis(p => ({ ...p, [outcomeIndex]: true }))
    setAiKpiSuggestions(p => ({ ...p, [outcomeIndex]: [] }))
    try {
      const res = await fetch('/api/ai/blueprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'indicators', theme: outcome.theme, outcomeTitle: outcome.outcome_title }),
      })
      const data = await res.json()
      if (data.suggestions) setAiKpiSuggestions(p => ({ ...p, [outcomeIndex]: data.suggestions }))
    } catch {}
    setAiLoadingKpis(p => ({ ...p, [outcomeIndex]: false }))
  }

  async function suggestRisks() {
    setAiLoadingRisks(true)
    setAiRiskSuggestions([])
    try {
      const res = await fetch('/api/ai/blueprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'assumptions', themes: selectedThemes, description: basics.description }),
      })
      const data = await res.json()
      if (data.suggestions) setAiRiskSuggestions(data.suggestions)
    } catch {}
    setAiLoadingRisks(false)
  }

  // ── Accept AI suggestions ──
  function acceptSdg(sdg: string) {
    setSelectedSdgs(p => p.includes(sdg) ? p : [...p, sdg])
    setAiSdgSuggestions(p => p.filter(s => s !== sdg))
  }

  function acceptOutcome(themeIndex: number, suggestion: any) {
    const theme = selectedThemes[themeIndex] || outcomes[themeIndex]?.theme || ''
    setOutcomes(prev => {
      // Find first empty slot or add new
      const emptyIdx = prev.findIndex(o => !o.outcome_title.trim())
      if (emptyIdx >= 0) {
        return prev.map((o, i) => i === emptyIdx
          ? { ...o, theme, outcome_title: suggestion.outcome_title, outcome_description: suggestion.outcome_description }
          : o
        )
      }
      return [...prev, { theme, sdg_tags: [], outcome_title: suggestion.outcome_title, outcome_description: suggestion.outcome_description }]
    })
    setAiOutcomeSuggestions(p => ({ ...p, [themeIndex]: p[themeIndex]?.filter(s => s !== suggestion) ?? [] }))
  }

  function acceptKpi(outcomeIndex: number, suggestion: any) {
    setIndicators(prev => {
      const emptyIdx = prev.findIndex(i => i.outcome_index === outcomeIndex && !i.name.trim())
      const newInd = {
        outcome_index:      outcomeIndex,
        name:               suggestion.name,
        unit:               suggestion.unit || '',
        baseline_value:     suggestion.baseline_value !== null && suggestion.baseline_value !== undefined ? String(suggestion.baseline_value) : '',
        target_value:       suggestion.target_value !== null && suggestion.target_value !== undefined ? String(suggestion.target_value) : '',
        frequency:          suggestion.frequency || 'monthly',
        measurement_method: suggestion.measurement_method || '',
      }
      if (emptyIdx >= 0) {
        return prev.map((ind, i) => i === emptyIdx ? newInd : ind)
      }
      return [...prev, newInd]
    })
    setAiKpiSuggestions(p => ({ ...p, [outcomeIndex]: p[outcomeIndex]?.filter(s => s !== suggestion) ?? [] }))
  }

  function acceptRisk(suggestion: any) {
    setAssumptions(prev => {
      const emptyIdx = prev.findIndex(a => !a.text.trim())
      if (emptyIdx >= 0) {
        return prev.map((a, i) => i === emptyIdx ? suggestion : a)
      }
      return [...prev, suggestion]
    })
    setAiRiskSuggestions(p => p.filter(s => s !== suggestion))
  }

  // ── Styles ──
  const inputStyle = {
    background: 'var(--bg3)', border: '1px solid var(--border)',
    borderRadius: '6px', color: 'var(--text)', fontFamily: 'Syne, sans-serif',
    fontSize: '13px', padding: '9px 12px', outline: 'none', width: '100%',
  }
  const labelStyle = {
    fontFamily: 'DM Mono, monospace', fontSize: '9px', textTransform: 'uppercase' as const,
    letterSpacing: '1px', color: 'var(--text3)', display: 'block', marginBottom: '6px',
  }
  const cardStyle = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '10px', padding: '24px', marginBottom: '14px',
  }

  // ── Suggestion box ──
  function SuggestionBox({ items, renderItem }: { items: any[]; renderItem: (item: any) => React.ReactNode }) {
    if (!items.length) return null
    return (
      <div style={{
        background: '#4ade8008', border: '1px solid #4ade8022',
        borderRadius: '8px', padding: '12px 14px', marginTop: '10px',
      }}>
        <div style={{
          fontFamily: 'DM Mono, monospace', fontSize: '9px',
          textTransform: 'uppercase', letterSpacing: '1px',
          color: 'var(--accent)', marginBottom: '8px',
        }}>
          ✦ AI Suggestions — click + to accept
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {items.map((item, i) => <span key={i}>{renderItem(item)}</span>)}
        </div>
      </div>
    )
  }

  // ── Form helpers (same as before) ──
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
        <div style={{
          marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px',
          fontFamily: 'DM Mono, monospace', fontSize: '10px', color: 'var(--accent)',
        }}>
          <span>✦</span> AI-assisted
        </div>
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
              Give your project a name and key details.
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
              Which sustainability themes and UN SDGs does this project address?
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

            {/* AI SDG suggestions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Relevant SDGs</label>
              {selectedThemes.length > 0 && (
                <AiButton
                  loading={aiLoadingSdgs}
                  onClick={suggestSdgs}
                  label="✦ Suggest SDGs"
                />
              )}
            </div>

            <SuggestionBox
              items={aiSdgSuggestions}
              renderItem={(sdg: string) => (
                <SuggestionPill label={sdg} onAccept={() => acceptSdg(sdg)} />
              )}
            />

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
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

              {/* AI outcome suggestions per theme */}
              {selectedThemes.length > 0 && (
                <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {selectedThemes.map((theme, ti) => (
                    <div key={theme} style={{ width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase' }}>
                          {THEME_ICONS[theme]} {theme}
                        </span>
                        <AiButton
                          loading={aiLoadingOutcomes[ti] || false}
                          onClick={() => suggestOutcomes(ti, theme)}
                          label={`✦ Suggest ${theme.toLowerCase()} outcomes`}
                        />
                      </div>
                      {(aiOutcomeSuggestions[ti] || []).length > 0 && (
                        <div style={{
                          background: '#4ade8008', border: '1px solid #4ade8022',
                          borderRadius: '8px', padding: '12px 14px', marginBottom: '8px',
                        }}>
                          <div style={{
                            fontFamily: 'DM Mono, monospace', fontSize: '9px',
                            textTransform: 'uppercase', letterSpacing: '1px',
                            color: 'var(--accent)', marginBottom: '8px',
                          }}>
                            ✦ AI Suggestions — click + to accept
                          </div>
                          {(aiOutcomeSuggestions[ti] || []).map((s: any, si: number) => (
                            <div key={si} style={{
                              display: 'flex', alignItems: 'flex-start', gap: '10px',
                              padding: '8px 0',
                              borderBottom: si < (aiOutcomeSuggestions[ti] || []).length - 1 ? '1px solid #4ade8011' : 'none',
                            }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 600 }}>{s.outcome_title}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '2px' }}>{s.outcome_description}</div>
                              </div>
                              <button
                                onClick={() => acceptOutcome(ti, s)}
                                style={{
                                  background: '#4ade8022', border: '1px solid #4ade8044',
                                  borderRadius: '6px', color: 'var(--accent)',
                                  fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                                  padding: '4px 10px', flexShrink: 0,
                                }}
                              >＋ Add</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {outcomes.map((outcome, i) => (
              <div key={i} style={{ ...cardStyle, position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text3)' }}>
                    Outcome {i + 1}
                  </div>
                  {outcomes.length > 1 && (
                    <button onClick={() => removeOutcome(i)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '14px' }}>✕</button>
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
              color: 'var(--text3)', fontSize: '13px', fontWeight: 600, fontFamily: 'Syne, sans-serif',
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
                Define measurable indicators. Use AI suggestions to get started quickly.
              </p>
            </div>

            {outcomes.map((outcome, oi) => (
              <div key={oi} style={{ marginBottom: '20px' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: '10px', padding: '10px 14px',
                  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px' }}>{THEME_ICONS[outcome.theme]}</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>{outcome.outcome_title}</span>
                  </div>
                  {outcome.outcome_title && (
                    <AiButton
                      loading={aiLoadingKpis[oi] || false}
                      onClick={() => suggestKpis(oi, outcome)}
                      label="✦ Suggest KPIs"
                    />
                  )}
                </div>

                {/* KPI suggestions */}
                {(aiKpiSuggestions[oi] || []).length > 0 && (
                  <div style={{
                    background: '#4ade8008', border: '1px solid #4ade8022',
                    borderRadius: '8px', padding: '12px 14px', marginBottom: '10px',
                  }}>
                    <div style={{
                      fontFamily: 'DM Mono, monospace', fontSize: '9px',
                      textTransform: 'uppercase', letterSpacing: '1px',
                      color: 'var(--accent)', marginBottom: '8px',
                    }}>
                      ✦ AI KPI Suggestions — click + to accept
                    </div>
                    {(aiKpiSuggestions[oi] || []).map((s: any, si: number) => (
                      <div key={si} style={{
                        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px',
                        padding: '8px 0',
                        borderBottom: si < (aiKpiSuggestions[oi] || []).length - 1 ? '1px solid #4ade8011' : 'none',
                      }}>
                        <div>
                          <div style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 600 }}>
                            {s.name} <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: 'var(--text3)' }}>({s.unit})</span>
                          </div>
                          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: 'var(--text3)', marginTop: '2px' }}>
                            Baseline: {s.baseline_value ?? '—'} → Target: {s.target_value ?? '—'} · {s.measurement_method}
                          </div>
                        </div>
                        <button
                          onClick={() => acceptKpi(oi, s)}
                          style={{
                            background: '#4ade8022', border: '1px solid #4ade8044',
                            borderRadius: '6px', color: 'var(--accent)',
                            fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                            padding: '4px 10px', flexShrink: 0,
                          }}
                        >＋ Add</button>
                      </div>
                    ))}
                  </div>
                )}

                {indicators.filter(ind => ind.outcome_index === oi).map((ind, ii) => {
                  const globalIdx = indicators.findIndex((x) => x === ind)
                  return (
                    <div key={ii} style={{ ...cardStyle, marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase' }}>
                          Indicator {ii + 1}
                        </span>
                        {indicators.filter(x => x.outcome_index === oi).length > 1 && (
                          <button onClick={() => removeIndicator(globalIdx)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer' }}>✕</button>
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.6, margin: 0 }}>
                  What could go wrong? Capturing risks upfront helps track what actually happened.
                </p>
                <AiButton
                  loading={aiLoadingRisks}
                  onClick={suggestRisks}
                  label="✦ Suggest risks"
                />
              </div>

              {/* Risk suggestions */}
              {aiRiskSuggestions.length > 0 && (
                <div style={{
                  background: '#4ade8008', border: '1px solid #4ade8022',
                  borderRadius: '8px', padding: '12px 14px', marginTop: '14px',
                }}>
                  <div style={{
                    fontFamily: 'DM Mono, monospace', fontSize: '9px',
                    textTransform: 'uppercase', letterSpacing: '1px',
                    color: 'var(--accent)', marginBottom: '8px',
                  }}>
                    ✦ AI Risk Suggestions — click + to accept
                  </div>
                  {aiRiskSuggestions.map((s: any, si: number) => (
                    <div key={si} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
                      padding: '8px 0',
                      borderBottom: si < aiRiskSuggestions.length - 1 ? '1px solid #4ade8011' : 'none',
                    }}>
                      <div style={{ flex: 1 }}>
                        <span style={{
                          fontFamily: 'DM Mono, monospace', fontSize: '9px',
                          padding: '1px 6px', borderRadius: '4px', marginRight: '8px',
                          background: s.risk_level === 'HIGH' ? '#ef444433' : s.risk_level === 'MEDIUM' ? '#f59e0b33' : '#4ade8033',
                          color: s.risk_level === 'HIGH' ? 'var(--red)' : s.risk_level === 'MEDIUM' ? 'var(--amber)' : 'var(--accent)',
                        }}>
                          {s.risk_level}
                        </span>
                        <span style={{ fontSize: '13px', color: 'var(--text2)' }}>{s.text}</span>
                      </div>
                      <button
                        onClick={() => acceptRisk(s)}
                        style={{
                          background: '#4ade8022', border: '1px solid #4ade8044',
                          borderRadius: '6px', color: 'var(--accent)',
                          fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                          padding: '4px 10px', flexShrink: 0,
                        }}
                      >＋ Add</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {assumptions.map((a, i) => (
              <div key={i} style={{ ...cardStyle, marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase' }}>
                    Assumption {i + 1}
                  </span>
                  {assumptions.length > 1 && (
                    <button onClick={() => removeAssumption(i)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer' }}>✕</button>
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
              color: 'var(--text3)', fontSize: '13px', fontWeight: 600, fontFamily: 'Syne, sans-serif',
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
              { label: 'Project',     value: basics.title },
              { label: 'Category',   value: basics.category || '—' },
              { label: 'Location',   value: basics.location || '—' },
              { label: 'Timeline',   value: basics.start_date ? `${basics.start_date} → ${basics.end_date || 'TBD'}` : '—' },
              { label: 'Themes',     value: selectedThemes.join(', ') || '—' },
              { label: 'SDGs',       value: selectedSdgs.length > 0 ? `${selectedSdgs.length} selected` : '—' },
              { label: 'Outcomes',   value: `${outcomes.filter(o => o.outcome_title).length} defined` },
              { label: 'Indicators', value: `${indicators.filter(i => i.name).length} defined` },
              { label: 'Assumptions',value: `${assumptions.filter(a => a.text).length} captured` },
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

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
          <button
            onClick={() => step > 0 ? setStep(s => s - 1) : router.push('/projects')}
            style={{
              padding: '10px 20px', borderRadius: '6px', cursor: 'pointer',
              background: 'transparent', border: '1px solid var(--border2)',
              color: 'var(--text2)', fontSize: '13px', fontWeight: 700, fontFamily: 'Syne, sans-serif',
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