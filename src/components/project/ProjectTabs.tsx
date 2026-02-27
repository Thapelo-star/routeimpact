'use client'

import { useState } from 'react'
import Link from 'next/link'
import { RagBadge } from '@/components/ui/RagBadge'

const THEME_ICONS: Record<string, string> = {
  ENVIRONMENTAL: '🌿',
  SOCIAL: '👥',
  OPERATIONAL: '⚙️',
  FINANCIAL: '💰',
}

const RISK_COLORS: Record<string, { bg: string; color: string }> = {
  HIGH:   { bg: '#ef444433', color: '#ef4444' },
  MEDIUM: { bg: '#f59e0b33', color: '#f59e0b' },
  LOW:    { bg: '#4ade8033', color: '#4ade80' },
}

export function ProjectTabs({
  project,
  checkins,
  latestCheckin,
}: {
  project: any
  checkins: any[]
  latestCheckin: any
}) {
  const [activeTab, setActiveTab] = useState('blueprint')

  const tabs = [
    { id: 'blueprint', label: '◷ Blueprint',    sub: 'Before'  },
    { id: 'tracking',  label: '◉ Progress',      sub: 'During'  },
    { id: 'retro',     label: '◌ Retrospective', sub: 'After'   },
  ]

  return (
    <div>
      {/* ── Tab Bar ── */}
      <div style={{
        display: 'flex', gap: '4px',
        borderBottom: '1px solid var(--border)',
        marginBottom: '20px',
      }}>
        {tabs.map(tab => (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 18px', fontSize: '12px', fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              color: activeTab === tab.id ? 'var(--accent)' : 'var(--text3)',
              borderBottom: `2px solid ${activeTab === tab.id ? 'var(--accent)' : 'transparent'}`,
              marginBottom: '-1px', transition: 'all 0.15s',
            }}
          >
            {tab.label}
            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px', opacity: 0.7 }}>
              {tab.sub}
            </span>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════
          BLUEPRINT TAB
      ══════════════════════════════════════ */}
      {activeTab === 'blueprint' && (
        <div>
          {!project.outcomes?.length ? (
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '10px', padding: '40px', textAlign: 'center',
            }}>
              <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: '18px', color: 'var(--text2)', marginBottom: '8px' }}>
                No outcomes defined
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text3)' }}>
                Edit the project to add sustainability outcomes and KPIs.
              </div>
            </div>
          ) : (
            <>
              {project.outcomes.map((outcome: any) => (
                <div key={outcome.id} style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: '10px', marginBottom: '14px', overflow: 'hidden',
                }}>
                  <div style={{
                    padding: '14px 20px', borderBottom: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', gap: '10px',
                  }}>
                    <span style={{ fontSize: '16px' }}>
                      {THEME_ICONS[outcome.theme] || '📌'}
                    </span>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>
                        {outcome.outcome_title}
                      </div>
                      {outcome.outcome_description && (
                        <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '2px' }}>
                          {outcome.outcome_description}
                        </div>
                      )}
                    </div>
                    {outcome.sdg_tags?.length > 0 && (
                      <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {outcome.sdg_tags.map((tag: string) => (
                          <span key={tag} style={{
                            fontFamily: 'DM Mono, monospace', fontSize: '9px',
                            padding: '2px 6px', borderRadius: '4px',
                            background: '#052e16', color: '#4ade80',
                          }}>{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {outcome.indicators?.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg3)' }}>
                          {['Indicator', 'Unit', 'Baseline', 'Target', 'Latest', 'Status'].map(h => (
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
                        {outcome.indicators.map((ind: any) => {
                          const latestUpdate = checkins
                            .flatMap((c: any) => c.kpi_updates || [])
                            .filter((u: any) => u.indicator_id === ind.id)
                            .sort((a: any, b: any) =>
                              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                            )[0]

                          return (
                            <tr key={ind.id} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '12px 20px' }}>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                                  {ind.name}
                                </div>
                                {ind.measurement_method && (
                                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: 'var(--text3)', marginTop: '2px' }}>
                                    {ind.measurement_method}
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: '12px 20px', fontFamily: 'DM Mono, monospace', fontSize: '11px', color: 'var(--text2)' }}>
                                {ind.unit || '—'}
                              </td>
                              <td style={{ padding: '12px 20px', fontFamily: 'DM Mono, monospace', fontSize: '13px', color: 'var(--text2)' }}>
                                {ind.baseline_value ?? '—'}
                              </td>
                              <td style={{ padding: '12px 20px', fontFamily: 'DM Mono, monospace', fontSize: '13px', color: 'var(--text2)' }}>
                                {ind.target_value ?? '—'}
                              </td>
                              <td style={{ padding: '12px 20px', fontFamily: 'DM Mono, monospace', fontSize: '13px' }}>
                                {latestUpdate ? (
                                  <span style={{
                                    color: latestUpdate.status === 'GREEN' ? 'var(--accent)'
                                      : latestUpdate.status === 'RED' ? 'var(--red)' : 'var(--amber)',
                                  }}>
                                    {latestUpdate.value}{ind.unit ? ` ${ind.unit}` : ''}
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--text3)' }}>No data</span>
                                )}
                              </td>
                              <td style={{ padding: '12px 20px' }}>
                                {latestUpdate
                                  ? <RagBadge status={latestUpdate.status} />
                                  : <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px', color: 'var(--text3)' }}>—</span>
                                }
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ padding: '16px 20px', fontFamily: 'DM Mono, monospace', fontSize: '11px', color: 'var(--text3)' }}>
                      No indicators defined for this outcome.
                    </div>
                  )}
                </div>
              ))}

              {project.assumptions?.length > 0 && (
                <>
                  <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: '20px', margin: '24px 0 12px', color: 'var(--text)' }}>
                    Assumptions &amp; Risks
                  </div>
                  <div style={{
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: '10px', overflow: 'hidden',
                  }}>
                    {project.assumptions.map((a: any, i: number) => (
                      <div key={a.id} style={{
                        display: 'flex', alignItems: 'flex-start', gap: '12px',
                        padding: '14px 20px',
                        borderBottom: i < project.assumptions.length - 1 ? '1px solid var(--border)' : 'none',
                      }}>
                        <span style={{
                          fontFamily: 'DM Mono, monospace', fontSize: '9px',
                          padding: '2px 6px', borderRadius: '4px', flexShrink: 0, marginTop: '1px',
                          background: RISK_COLORS[a.risk_level]?.bg || '#f59e0b33',
                          color: RISK_COLORS[a.risk_level]?.color || '#f59e0b',
                        }}>
                          {a.risk_level}
                        </span>
                        <span style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.5 }}>
                          {a.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════
          PROGRESS TAB
      ══════════════════════════════════════ */}
      {activeTab === 'tracking' && (
        <div>
          {checkins.length === 0 ? (
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '10px', padding: '60px', textAlign: 'center',
            }}>
              <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: '20px', color: 'var(--text2)', marginBottom: '8px' }}>
                No check-ins yet
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text3)', marginBottom: '20px' }}>
                Record your first progress update to start tracking.
              </div>
              <Link href={`/projects/${project.id}/checkin`}>
                <button style={{
                  background: 'var(--accent2)', color: '#052e16', border: 'none',
                  padding: '10px 20px', borderRadius: '6px', fontSize: '13px',
                  fontWeight: 700, cursor: 'pointer',
                }}>+ Add first check-in</button>
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {checkins.map((checkin: any) => (
                <div key={checkin.id} style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: '10px', overflow: 'hidden',
                }}>
                  <div style={{
                    padding: '16px 20px', borderBottom: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>
                        {checkin.period_label ||
                          new Date(checkin.date).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}
                      </div>
                      <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: 'var(--text3)', marginTop: '2px' }}>
                        {new Date(checkin.date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                    <RagBadge status={checkin.overall_status} />
                  </div>

                  {checkin.notes && (
                    <div style={{
                      padding: '14px 20px',
                      borderBottom: checkin.kpi_updates?.length > 0 ? '1px solid var(--border)' : 'none',
                    }}>
                      <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text3)', marginBottom: '6px' }}>
                        Notes
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.6 }}>
                        {checkin.notes}
                      </div>
                      {checkin.blockers && (
                        <div style={{ marginTop: '8px' }}>
                          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px', color: 'var(--red)', textTransform: 'uppercase' }}>
                            Blockers:{' '}
                          </span>
                          <span style={{ fontSize: '13px', color: 'var(--text2)' }}>{checkin.blockers}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {checkin.kpi_updates?.length > 0 && (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg3)' }}>
                          {['KPI', 'Value', 'Target', 'Status', 'Comment'].map(h => (
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
                        {checkin.kpi_updates.map((update: any) => (
                          <tr key={update.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '10px 20px', fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                              {update.indicators?.name || '—'}
                            </td>
                            <td style={{
                              padding: '10px 20px', fontFamily: 'DM Mono, monospace', fontSize: '13px',
                              color: update.status === 'GREEN' ? 'var(--accent)'
                                : update.status === 'RED' ? 'var(--red)' : 'var(--amber)',
                            }}>
                              {update.value}{update.indicators?.unit ? ` ${update.indicators.unit}` : ''}
                            </td>
                            <td style={{ padding: '10px 20px', fontFamily: 'DM Mono, monospace', fontSize: '12px', color: 'var(--text3)' }}>
                              {update.indicators?.target_value ?? '—'}{update.indicators?.unit ? ` ${update.indicators.unit}` : ''}
                            </td>
                            <td style={{ padding: '10px 20px' }}>
                              <RagBadge status={update.status} />
                            </td>
                            <td style={{ padding: '10px 20px', fontSize: '12px', color: 'var(--text2)' }}>
                              {update.comment || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════
          RETROSPECTIVE TAB
      ══════════════════════════════════════ */}
      {activeTab === 'retro' && (
        <div>
          {!project.learnings?.length ? (
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '10px', padding: '60px', textAlign: 'center',
            }}>
              <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: '20px', color: 'var(--text2)', marginBottom: '8px' }}>
                No retrospective yet
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text3)', marginBottom: '20px' }}>
                Complete the project and capture what you learned.
              </div>
              <Link href={`/projects/${project.id}/retrospective`}>
                <button style={{
                  background: 'var(--accent2)', color: '#052e16', border: 'none',
                  padding: '10px 20px', borderRadius: '6px', fontSize: '13px',
                  fontWeight: 700, cursor: 'pointer',
                }}>Start retrospective →</button>
              </Link>
            </div>
          ) : (
            <div>
              {project.learnings.map((l: any) => (
                <div key={l.id}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                    {[
                      { label: '✓ What Worked',      value: l.what_worked,     color: 'var(--accent)' },
                      { label: "✗ What Didn't Work", value: l.what_didnt,      color: 'var(--red)'    },
                      { label: '→ Recommendations',  value: l.recommendations, color: 'var(--blue)'   },
                      { label: '⚡ Key Drivers',      value: l.key_drivers,     color: 'var(--amber)'  },
                    ].map(section => (
                      <div key={section.label} style={{
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
                        <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.6 }}>
                          {section.value || '—'}
                        </div>
                      </div>
                    ))}
                  </div>

                  {l.lessons_tags?.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {l.lessons_tags.map((tag: string) => (
                        <span key={tag} style={{
                          fontFamily: 'DM Mono, monospace', fontSize: '10px',
                          padding: '3px 10px', borderRadius: '20px',
                          background: '#4ade8033', color: 'var(--accent)',
                          border: '1px solid #4ade8044',
                        }}>{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}