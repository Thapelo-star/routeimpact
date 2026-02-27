import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { RagBadge } from '@/components/ui/RagBadge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ProjectTabs } from '@/components/project/ProjectTabs'
import { HealthScoreCard } from '@/components/ui/HealthScore'
import { DriftBanner } from '@/components/ui/DriftBanner'
import { calculateHealth } from '@/lib/health/calculateHealth'

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: project } = await supabase
    .from('projects')
    .select(`
      *,
      profiles(full_name, email),
      outcomes(
        *,
        indicators(*)
      ),
      assumptions(*),
      checkins(
        *,
        kpi_updates(*, indicators(*))
      ),
      learnings(*)
    `)
    .eq('id', id)
    .single()

  if (!project) notFound()

  const sortedCheckins = project.checkins?.sort((a: any, b: any) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  ) || []

  const latestCheckin = sortedCheckins[0]

  // ── Health Score ──
  const health = calculateHealth(project)

  return (
    <div>
      {/* Topbar */}
      <header style={{
        height: '56px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', padding: '0 28px', gap: '8px',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <Link href="/projects" style={{ textDecoration: 'none', color: 'var(--text3)', fontSize: '13px' }}>
          Projects
        </Link>
        <span style={{ color: 'var(--text3)' }}>/</span>
        <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: '18px', color: 'var(--text)' }}>
          {project.title}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Link href={`/projects/${id}/checkin`}>
            <button style={{
              background: 'transparent', color: 'var(--text2)',
              border: '1px solid var(--border2)', padding: '7px 14px',
              borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
            }}>+ Check-in</button>
          </Link>
          <Link href={`/projects/${id}/edit`}>
            <button style={{
              background: 'transparent', color: 'var(--text2)',
              border: '1px solid var(--border2)', padding: '7px 14px',
              borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
            }}>Edit Project</button>
          </Link>
          <StatusBadge status={project.status} />
        </div>
      </header>

      <div style={{ padding: '28px' }}>

        {/* Drift Banner — shows only when off route */}
        <DriftBanner health={health} projectId={id} />

        {/* Project header card */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '10px', padding: '24px', marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                {project.category || 'Project'}{project.location ? ` · ${project.location}` : ''}
              </div>
              <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: '28px', color: 'var(--text)', marginBottom: '8px', lineHeight: 1.2 }}>
                {project.title}
              </div>
              {project.description && (
                <div style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: 1.6, maxWidth: '620px' }}>
                  {project.description}
                </div>
              )}
            </div>

            {/* Health Score Card */}
            <HealthScoreCard health={health} />
          </div>

          {/* Meta row */}
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
            {project.start_date && (
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', color: 'var(--text3)' }}>
                📅 {new Date(project.start_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                {project.end_date && ` → ${new Date(project.end_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}`}
              </div>
            )}
            {project.profiles?.full_name && (
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', color: 'var(--text3)' }}>
                👤 {project.profiles.full_name}
              </div>
            )}
            {project.outcomes?.length > 0 && (
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', color: 'var(--text3)' }}>
                📊 {project.outcomes.length} outcome{project.outcomes.length !== 1 ? 's' : ''}
                {' · '}
                {project.outcomes.reduce((sum: number, o: any) => sum + (o.indicators?.length || 0), 0)} KPIs
              </div>
            )}
            {sortedCheckins.length > 0 && (
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', color: 'var(--text3)' }}>
                ⚡ {sortedCheckins.length} check-in{sortedCheckins.length !== 1 ? 's' : ''}
              </div>
            )}
            {project.budget && (
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', color: 'var(--text3)' }}>
                💰 R{Number(project.budget).toLocaleString()}
              </div>
            )}
            {/* Trend inline */}
            {health.trend !== 'no_data' && (
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', color: 'var(--text3)' }}>
                {health.trend === 'improving' ? '📈' : health.trend === 'declining' ? '📉' : '➡'} {health.trend}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <ProjectTabs
          project={project}
          checkins={sortedCheckins}
          latestCheckin={latestCheckin}
        />
      </div>
    </div>
  )
}