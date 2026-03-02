'use client'

import Link from 'next/link'
import type { SimilarProject } from '@/lib/insights/similarProjects'

const RAG_COLOR: Record<string, string> = {
  GREEN: 'var(--accent)',
  AMBER: 'var(--amber)',
  RED:   'var(--red)',
  NONE:  'var(--text3)',
}

const RAG_BG: Record<string, string> = {
  GREEN: '#4ade8022',
  AMBER: '#f59e0b22',
  RED:   '#ef444422',
  NONE:  'var(--bg3)',
}

const TREND_ICON: Record<string, string> = {
  improving: '↑',
  declining: '↓',
  stable:    '→',
  no_data:   '—',
}

// ── Pattern analysis from all org projects ────────────────

function analysePatterns(allOrgProjects: any[], currentTheme: string | null) {
  const completed = allOrgProjects.filter(p =>
    p.status === 'COMPLETED' && p.learnings?.length > 0
  )

  if (!completed.length) return null

  // Top lesson tags across all completed projects
  const tagCount: Record<string, number> = {}
  for (const p of completed) {
    const tags: string[] = p.learnings?.[0]?.lessons_tags ?? []
    for (const tag of tags) {
      tagCount[tag] = (tagCount[tag] ?? 0) + 1
    }
  }
  const topTags = Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)

  // Top recurring success drivers
  const successDriverWords: Record<string, number> = {}
  for (const p of completed) {
    const text: string = p.learnings?.[0]?.what_worked ?? ''
    text.split(/[\s,.\n]+/).filter(w => w.length > 4).forEach(w => {
      const lower = w.toLowerCase()
      successDriverWords[lower] = (successDriverWords[lower] ?? 0) + 1
    })
  }

  // KPI performance by theme
  const themeKpiStats: Record<string, { total: number; green: number; amber: number; red: number }> = {}
  for (const p of allOrgProjects) {
    const theme = p.theme ?? 'UNKNOWN'
    if (!themeKpiStats[theme]) themeKpiStats[theme] = { total: 0, green: 0, amber: 0, red: 0 }
    const allUpdates = (p.checkins ?? []).flatMap((c: any) => c.kpi_updates ?? [])
    for (const u of allUpdates) {
      themeKpiStats[theme].total++
      if (u.status === 'GREEN') themeKpiStats[theme].green++
      else if (u.status === 'AMBER') themeKpiStats[theme].amber++
      else if (u.status === 'RED') themeKpiStats[theme].red++
    }
  }

  // Most common high risks
  const riskCount: Record<string, number> = {}
  for (const p of allOrgProjects) {
    const highRisks = (p.assumptions ?? []).filter((a: any) => a.risk_level === 'HIGH')
    for (const r of highRisks) {
      const key = r.text?.slice(0, 60) ?? ''
      if (key) riskCount[key] = (riskCount[key] ?? 0) + 1
    }
  }
  const topRisks = Object.entries(riskCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  // Projects by health band
  const healthBands = { strong: 0, moderate: 0, struggling: 0 }
  for (const p of allOrgProjects) {
    const checkins = p.checkins ?? []
    const latest = checkins.sort((a: any, b: any) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0]
    if (!latest) continue
    if (latest.overall_status === 'GREEN') healthBands.strong++
    else if (latest.overall_status === 'AMBER') healthBands.moderate++
    else if (latest.overall_status === 'RED') healthBands.struggling++
  }

  // Same-theme completion rate
  const sameTheme = allOrgProjects.filter(p => p.theme === currentTheme)
  const sameThemeCompleted = sameTheme.filter(p => p.status === 'COMPLETED').length
  const completionRate = sameTheme.length > 0
    ? Math.round((sameThemeCompleted / sameTheme.length) * 100)
    : null

  return {
    topTags,
    topRisks,
    themeKpiStats,
    healthBands,
    completedCount: completed.length,
    totalCount: allOrgProjects.length,
    sameThemeCount: sameTheme.length,
    completionRate,
  }
}

// ── Mini bar ──────────────────────────────────

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{
        flex: 1, height: '6px', background: 'var(--border)',
        borderRadius: '3px', overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: color, borderRadius: '3px',
          transition: 'width 0.4s ease',
        }} />
      </div>
      <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: 'var(--text3)', minWidth: '24px' }}>
        {value}
      </span>
    </div>
  )
}

// ── Main component ────────────────────────────

export function InsightsTab({
  similarProjects,
  currentTheme,
  allOrgProjects = [],
}: {
  similarProjects: SimilarProject[]
  currentTheme: string | null
  allOrgProjects?: any[]
}) {
  const patterns = analysePatterns(allOrgProjects, currentTheme)
  const hasContent = similarProjects.length > 0 || patterns !== null

  if (!hasContent) {
    return (
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '10px', padding: '60px', textAlign: 'center',
      }}>
        <div style={{
          fontFamily: 'DM Serif Display, serif', fontSize: '20px',
          color: 'var(--text2)', marginBottom: '8px',
        }}>
          No insights yet
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text3)', lineHeight: 1.6 }}>
          Insights appear once projects are completed with retrospectives.
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* ══════════════════════════════════════
          SIMILAR PROJECTS
      ══════════════════════════════════════ */}
      {similarProjects.length > 0 && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              fontFamily: 'DM Serif Display, serif', fontSize: '22px',
              color: 'var(--text)', marginBottom: '4px',
            }}>
              Similar Projects
            </div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', color: 'var(--text3)' }}>
              Matched by theme and lesson tags from completed projects
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {similarProjects.map(proj => (
              <div key={proj.id} style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: '10px', overflow: 'hidden',
              }}>
                {/* Project header */}
                <div style={{
                  padding: '16px 20px', borderBottom: '1px solid var(--border)',
                  display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <Link href={`/projects/${proj.id}`} style={{ textDecoration: 'none' }}>
                        <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: '17px', color: 'var(--text)' }}>
                          {proj.title}
                        </span>
                      </Link>
                      {proj.theme && (
                        <span style={{
                          fontFamily: 'DM Mono, monospace', fontSize: '9px',
                          textTransform: 'uppercase', letterSpacing: '1px',
                          padding: '2px 8px', borderRadius: '4px',
                          background: 'var(--bg3)', color: 'var(--text3)',
                        }}>
                          {proj.theme}
                        </span>
                      )}
                    </div>
                    {proj.description && (
                      <div style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: 1.5 }}>
                        {proj.description.slice(0, 120)}{proj.description.length > 120 ? '…' : ''}
                      </div>
                    )}
                  </div>

                  {/* Health score */}
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                    flexShrink: 0, background: RAG_BG[proj.health.rag],
                    border: `1px solid ${RAG_COLOR[proj.health.rag]}44`,
                    borderRadius: '8px', padding: '10px 14px',
                  }}>
                    <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: '28px', color: RAG_COLOR[proj.health.rag], lineHeight: 1 }}>
                      {proj.health.score}
                    </div>
                    <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px', color: 'var(--text3)', textTransform: 'uppercase' }}>
                      health
                    </div>
                    <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: RAG_COLOR[proj.health.rag], fontWeight: 700 }}>
                      {TREND_ICON[proj.health.trend]} {proj.health.rag}
                    </div>
                  </div>
                </div>

                {/* Shared tags */}
                {proj.sharedTags.length > 0 && (
                  <div style={{
                    padding: '10px 20px', borderBottom: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
                  }}>
                    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      Shared lessons:
                    </span>
                    {proj.sharedTags.map(tag => (
                      <span key={tag} style={{
                        fontFamily: 'DM Mono, monospace', fontSize: '10px',
                        padding: '2px 8px', borderRadius: '20px',
                        background: '#4ade8022', color: 'var(--accent)',
                        border: '1px solid #4ade8033',
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Learnings */}
                {proj.lessons && (
                  <div style={{ padding: '16px 20px' }}>
                    {proj.lessons.ai_summary && (
                      <div style={{
                        background: '#4ade8011', border: '1px solid #4ade8033',
                        borderRadius: '8px', padding: '12px 16px', marginBottom: '14px',
                      }}>
                        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--accent)', marginBottom: '6px' }}>
                          ✦ AI Summary
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.6 }}>
                          {proj.lessons.ai_summary}
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {[
                        { label: '✓ What Worked',      value: proj.lessons.what_worked,     color: 'var(--accent)' },
                        { label: "✗ What Didn't Work", value: proj.lessons.what_didnt,      color: 'var(--red)'    },
                        { label: '→ Recommendations',  value: proj.lessons.recommendations, color: 'var(--blue)'   },
                        { label: '⚡ Key Drivers',      value: proj.lessons.key_drivers,     color: 'var(--amber)'  },
                      ].filter(s => s.value).map(section => (
                        <div key={section.label} style={{ background: 'var(--bg3)', borderRadius: '8px', padding: '12px 14px' }}>
                          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', color: section.color, marginBottom: '6px' }}>
                            {section.label}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: 1.5 }}>
                            {section.value!.slice(0, 160)}{section.value!.length > 160 ? '…' : ''}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: '20px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                      <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: 'var(--text3)' }}>
                        📊 {proj.outcomeCount} outcome{proj.outcomeCount !== 1 ? 's' : ''} · {proj.kpiCount} KPIs
                      </div>
                      {proj.tagOverlap > 0 && (
                        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: 'var(--text3)' }}>
                          🔗 {Math.round(proj.tagOverlap * 100)}% tag overlap
                        </div>
                      )}
                      <Link href={`/projects/${proj.id}`} style={{ marginLeft: 'auto', textDecoration: 'none' }}>
                        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: 'var(--text3)' }}>
                          View project →
                        </span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          PORTFOLIO PATTERNS
      ══════════════════════════════════════ */}
      {patterns && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: '22px', color: 'var(--text)', marginBottom: '4px' }}>
              Portfolio Patterns
            </div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', color: 'var(--text3)' }}>
              Aggregated intelligence from {patterns.totalCount} project{patterns.totalCount !== 1 ? 's' : ''} across your organisation
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>

            {/* ── Top Lesson Tags ── */}
            {patterns.topTags.length > 0 && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px' }}>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--accent)', marginBottom: '14px' }}>
                  🏷 Most Common Lesson Tags
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {patterns.topTags.map(([tag, count]) => (
                    <div key={tag}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text2)' }}>{tag}</span>
                        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: 'var(--text3)' }}>
                          {count}×
                        </span>
                      </div>
                      <MiniBar value={count} max={patterns.topTags[0][1]} color="var(--accent2)" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── KPI Performance by Theme ── */}
            {Object.keys(patterns.themeKpiStats).length > 0 && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px' }}>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--amber)', marginBottom: '14px' }}>
                  📊 KPI Performance by Theme
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {Object.entries(patterns.themeKpiStats)
                    .filter(([, s]) => s.total > 0)
                    .map(([theme, stats]) => {
                      const greenPct = Math.round((stats.green / stats.total) * 100)
                      const amberPct = Math.round((stats.amber / stats.total) * 100)
                      const redPct   = Math.round((stats.red   / stats.total) * 100)
                      return (
                        <div key={theme}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text2)', textTransform: 'capitalize' }}>
                              {theme.toLowerCase()}
                            </span>
                            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: 'var(--text3)' }}>
                              {stats.total} KPI updates
                            </span>
                          </div>
                          {/* Stacked bar */}
                          <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', gap: '1px' }}>
                            {greenPct > 0 && <div style={{ width: `${greenPct}%`, background: 'var(--accent)' }} title={`${greenPct}% GREEN`} />}
                            {amberPct > 0 && <div style={{ width: `${amberPct}%`, background: 'var(--amber)' }} title={`${amberPct}% AMBER`} />}
                            {redPct   > 0 && <div style={{ width: `${redPct}%`,   background: 'var(--red)'   }} title={`${redPct}% RED`}   />}
                          </div>
                          <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px', color: 'var(--accent)' }}>{greenPct}% ●</span>
                            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px', color: 'var(--amber)'  }}>{amberPct}% ●</span>
                            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px', color: 'var(--red)'    }}>{redPct}% ●</span>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}

            {/* ── Top High Risks ── */}
            {patterns.topRisks.length > 0 && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px' }}>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--red)', marginBottom: '14px' }}>
                  ⚠ Most Common HIGH Risks
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {patterns.topRisks.map(([risk, count]) => (
                    <div key={risk} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <span style={{
                        fontFamily: 'DM Mono, monospace', fontSize: '9px',
                        padding: '2px 6px', borderRadius: '4px', flexShrink: 0,
                        background: '#ef444422', color: 'var(--red)',
                        border: '1px solid #ef444433',
                      }}>
                        {count}×
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: 1.5 }}>
                        {risk}{risk.length >= 60 ? '…' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Portfolio Health Breakdown ── */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px' }}>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text3)', marginBottom: '14px' }}>
                🗂 Portfolio Health Breakdown
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: 'Strong (GREEN)',    value: patterns.healthBands.strong,    color: 'var(--accent)' },
                  { label: 'Moderate (AMBER)',  value: patterns.healthBands.moderate,  color: 'var(--amber)'  },
                  { label: 'Struggling (RED)',  value: patterns.healthBands.struggling, color: 'var(--red)'   },
                ].map(band => {
                  const total = patterns.healthBands.strong + patterns.healthBands.moderate + patterns.healthBands.struggling
                  return (
                    <div key={band.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text2)' }}>{band.label}</span>
                        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: band.color }}>
                          {band.value} project{band.value !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <MiniBar value={band.value} max={total || 1} color={band.color} />
                    </div>
                  )
                })}

                {/* Completion rate for same theme */}
                {patterns.completionRate !== null && currentTheme && (
                  <div style={{
                    marginTop: '8px', paddingTop: '10px', borderTop: '1px solid var(--border)',
                  }}>
                    <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text3)', marginBottom: '6px' }}>
                      {currentTheme} completion rate
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ flex: 1, height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${patterns.completionRate}%`, height: '100%',
                          background: patterns.completionRate >= 70 ? 'var(--accent)' : patterns.completionRate >= 40 ? 'var(--amber)' : 'var(--red)',
                          borderRadius: '4px', transition: 'width 0.4s ease',
                        }} />
                      </div>
                      <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', fontWeight: 700, color: 'var(--text)' }}>
                        {patterns.completionRate}%
                      </span>
                    </div>
                    <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: 'var(--text3)', marginTop: '4px' }}>
                      {patterns.sameThemeCount} {currentTheme.toLowerCase()} project{patterns.sameThemeCount !== 1 ? 's' : ''} · {patterns.completedCount} completed org-wide
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}