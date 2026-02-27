import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { RagBadge } from '@/components/ui/RagBadge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { HealthScorePill } from '@/components/ui/HealthScore'
import { calculateHealth, calculatePortfolioHealth } from '@/lib/health/calculateHealth'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, organisations(*)')
    .eq('id', user.id)
    .single()

  if (!profile?.org_id) redirect('/org-setup')

  // Full project data needed for health calculation
  const { data: projects } = await supabase
    .from('projects')
    .select(`
      *,
      outcomes(*, indicators(*)),
      assumptions(*),
      checkins(
        *,
        kpi_updates(*, indicators(*))
      )
    `)
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: false })

  const allProjects = projects || []

  // ── Basic stats ──
  const total     = allProjects.length
  const active    = allProjects.filter(p => p.status === 'ACTIVE').length
  const completed = allProjects.filter(p => p.status === 'COMPLETED').length
  const draft     = allProjects.filter(p => p.status === 'DRAFT').length

  // ── Health scores ──
  const healthMap = new Map(
    allProjects.map(p => [p.id, calculateHealth(p)])
  )
  const portfolio = calculatePortfolioHealth(allProjects)

  // ── Latest checkin per project ──
  const projectsWithStatus = allProjects.map(p => {
    const sorted = p.checkins?.sort((a: any, b: any) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    const latest = sorted?.[0]
    return { ...p, latestStatus: latest?.overall_status, latestCheckin: latest }
  })

  const onTrack  = projectsWithStatus.filter(p => p.latestStatus === 'GREEN').length
  const atRisk   = projectsWithStatus.filter(p => p.latestStatus === 'AMBER').length
  const offTrack = projectsWithStatus.filter(p => p.latestStatus === 'RED').length

  const recentCheckins = projectsWithStatus
    .filter(p => p.latestCheckin)
    .sort((a, b) => new Date(b.latestCheckin.date).getTime() - new Date(a.latestCheckin.date).getTime())
    .slice(0, 5)

  const driftingProjects = projectsWithStatus.filter(p => healthMap.get(p.id)?.isDrifting)

  const portfolioRagColor: Record<string, string> = {
    GREEN: 'var(--accent)', AMBER: 'var(--amber)', RED: 'var(--red)', NONE: 'var(--text3)',
  }

  return (
    <div>
      {/* Topbar */}
      <header style={{
        height: '56px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', padding: '0 28px', gap: '8px',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: '18px' }}>Portfolio</span>
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', color: 'var(--text3)' }}>
          / {profile?.organisations?.name}
        </span>
        <div style={{ marginLeft: 'auto' }}>
          <Link href="/projects/new">
            <button style={{
              background: 'var(--accent2)', color: '#052e16', border: 'none',
              padding: '7px 14px', borderRadius: '6px', fontSize: '12px',
              fontWeight: 700, cursor: 'pointer', fontFamily: 'Syne, sans-serif',
            }}>+ New Project</button>
          </Link>
        </div>
      </header>

      <div style={{ padding: '28px' }}>

        {/* ── Portfolio Health Banner ── */}
        {total > 0 && (
          <div style={{
            background: 'var(--surface)', border: `1px solid ${portfolioRagColor[portfolio.rag]}44`,
            borderRadius: '10px', padding: '20px 24px', marginBottom: '20px',
            display: 'flex', alignItems: 'center', gap: '24px',
          }}>
            {/* Big score */}
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <div style={{
                fontFamily: 'DM Serif Display, serif', fontSize: '48px', lineHeight: 1,
                color: portfolioRagColor[portfolio.rag],
              }}>
                {portfolio.avgScore}
              </div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Portfolio Health
              </div>
            </div>

            <div style={{ width: '1px', height: '48px', background: 'var(--border)', flexShrink: 0 }} />

            {/* Breakdown */}
            <div style={{ flex: 1, display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: '24px', color: 'var(--accent)' }}>{onTrack}</div>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px', color: 'var(--text3)', textTransform: 'uppercase' }}>On Track</div>
              </div>
              <div>
                <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: '24px', color: 'var(--amber)' }}>{atRisk}</div>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px', color: 'var(--text3)', textTransform: 'uppercase' }}>At Risk</div>
              </div>
              <div>
                <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: '24px', color: 'var(--red)' }}>{offTrack}</div>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px', color: 'var(--text3)', textTransform: 'uppercase' }}>Off Track</div>
              </div>
              {portfolio.driftingCount > 0 && (
                <div>
                  <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: '24px', color: 'var(--red)' }}>
                    {portfolio.driftingCount}
                  </div>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px', color: 'var(--red)', textTransform: 'uppercase' }}>
                    Drifting ⚠
                  </div>
                </div>
              )}
            </div>

            {/* RAG pill */}
            <div style={{
              padding: '6px 14px', borderRadius: '20px', flexShrink: 0,
              background: `${portfolioRagColor[portfolio.rag]}22`,
              border: `1px solid ${portfolioRagColor[portfolio.rag]}44`,
              fontFamily: 'DM Mono, monospace', fontSize: '10px', fontWeight: 700,
              color: portfolioRagColor[portfolio.rag], textTransform: 'uppercase',
            }}>
              ● {portfolio.rag}
            </div>
          </div>
        )}

        {/* ── Drift Alert Panel ── */}
        {driftingProjects.length > 0 && (
          <div style={{
            background: '#ef444411', border: '1px solid #ef444433',
            borderRadius: '10px', padding: '16px 20px', marginBottom: '20px',
          }}>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--red)', marginBottom: '10px' }}>
              ⚠ {driftingProjects.length} Project{driftingProjects.length > 1 ? 's' : ''} Off Route
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {driftingProjects.map((p: any) => {
                const h = healthMap.get(p.id)!
                return (
                  <Link key={p.id} href={`/projects/${p.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{
                      background: 'var(--surface)', border: '1px solid #ef444433',
                      borderRadius: '8px', padding: '8px 14px',
                      display: 'flex', alignItems: 'center', gap: '10px',
                      cursor: 'pointer', transition: 'border-color 0.15s',
                    }}>
                      <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: '20px', color: 'var(--red)', lineHeight: 1 }}>
                        {h.score}
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)' }}>{p.title}</div>
                        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px', color: 'var(--red)' }}>
                          {h.driftReasons[0]}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Stats Row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '28px' }}>
          {[
            { label: 'Total Projects', value: total, sub: `${active} active · ${completed} completed · ${draft} draft`, color: 'var(--blue)' },
            { label: 'On Track',  value: onTrack,  sub: 'GREEN status', color: 'var(--accent2)' },
            { label: 'At Risk',   value: atRisk,   sub: 'AMBER status', color: 'var(--amber)'   },
            { label: 'Off Track', value: offTrack, sub: 'RED status',   color: 'var(--red)'     },
          ].map(stat => (
            <div key={stat.label} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '10px', padding: '18px 20px', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: stat.color }} />
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text3)', marginBottom: '10px' }}>
                {stat.label}
              </div>
              <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: '36px', lineHeight: 1, color: 'var(--text)' }}>
                {stat.value}
              </div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: 'var(--text3)', marginTop: '6px' }}>
                {stat.sub}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px' }}>
          {/* Projects grid */}
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '16px' }}>
              <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: '20px' }}>Projects</div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', color: 'var(--text3)' }}>{total} total</div>
              <Link href="/projects" style={{ marginLeft: 'auto', textDecoration: 'none' }}>
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', color: 'var(--text3)' }}>View all →</span>
              </Link>
            </div>

            {total === 0 ? (
              <div style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: '10px', padding: '60px', textAlign: 'center',
              }}>
                <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: '20px', color: 'var(--text2)', marginBottom: '8px' }}>
                  No projects yet
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text3)', marginBottom: '20px' }}>
                  Create your first sustainability project to get started.
                </div>
                <Link href="/projects/new">
                  <button style={{
                    background: 'var(--accent2)', color: '#052e16',
                    border: 'none', padding: '10px 20px', borderRadius: '6px',
                    fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                  }}>Create first project →</button>
                </Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {projectsWithStatus.slice(0, 6).map((project: any) => {
                  const health = healthMap.get(project.id)!
                  return (
                    <Link key={project.id} href={`/projects/${project.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{
                        background: 'var(--surface)',
                        border: `1px solid ${health.isDrifting ? '#ef444433' : 'var(--border)'}`,
                        borderRadius: '10px', padding: '18px', cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px', textTransform: 'uppercase', color: 'var(--text3)' }}>
                            {project.category || 'Project'}
                          </div>
                          <StatusBadge status={project.status} />
                        </div>
                        <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: '15px', color: 'var(--text)', marginBottom: '6px', lineHeight: 1.3 }}>
                          {project.title}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: 1.5, marginBottom: '12px' }}>
                          {project.description?.slice(0, 80)}{project.description?.length > 80 ? '…' : ''}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          {project.latestStatus
                            ? <RagBadge status={project.latestStatus} />
                            : <span />
                          }
                          <HealthScorePill health={health} />
                        </div>
                        {health.isDrifting && (
                          <div style={{
                            marginTop: '8px', fontFamily: 'DM Mono, monospace', fontSize: '9px',
                            color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '0.5px',
                          }}>
                            ⚠ Off Route
                          </div>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Recent check-ins feed */}
          <div>
            <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: '20px', marginBottom: '16px' }}>
              Recent Check-ins
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
              {recentCheckins.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', fontFamily: 'DM Mono, monospace', fontSize: '11px', color: 'var(--text3)' }}>
                  No check-ins yet
                </div>
              ) : recentCheckins.map((p: any) => {
                const dotColor = p.latestStatus === 'GREEN' ? 'var(--accent)' : p.latestStatus === 'RED' ? 'var(--red)' : 'var(--amber)'
                return (
                  <Link key={p.id} href={`/projects/${p.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{
                      padding: '14px 18px', borderBottom: '1px solid var(--border)',
                      display: 'flex', gap: '12px', cursor: 'pointer',
                    }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: dotColor, marginTop: '4px', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)', marginBottom: '2px' }}>{p.title}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text2)', lineHeight: 1.4 }}>
                          {p.latestCheckin.period_label} · {p.latestCheckin.notes?.slice(0, 60) || 'Check-in submitted'}
                        </div>
                        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px', color: 'var(--text3)', marginTop: '4px' }}>
                          {new Date(p.latestCheckin.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}