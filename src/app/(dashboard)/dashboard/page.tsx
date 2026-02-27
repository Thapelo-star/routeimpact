import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { RagBadge } from '@/components/ui/RagBadge'
import { StatusBadge } from '@/components/ui/StatusBadge'

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

  const { data: projects } = await supabase
    .from('projects')
    .select(`*, checkins(overall_status, date, period_label, notes)`)
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: false })

  const total     = projects?.length || 0
  const active    = projects?.filter(p => p.status === 'ACTIVE').length || 0
  const completed = projects?.filter(p => p.status === 'COMPLETED').length || 0
  const draft     = projects?.filter(p => p.status === 'DRAFT').length || 0

  // Get latest checkin status per project
  const projectsWithStatus = projects?.map(p => {
    const latest = p.checkins?.sort((a: any, b: any) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0]
    return { ...p, latestStatus: latest?.overall_status, latestCheckin: latest }
  }) || []

  const onTrack  = projectsWithStatus.filter(p => p.latestStatus === 'GREEN').length
  const atRisk   = projectsWithStatus.filter(p => p.latestStatus === 'AMBER').length
  const offTrack = projectsWithStatus.filter(p => p.latestStatus === 'RED').length

  const recentCheckins = projectsWithStatus
    .filter(p => p.latestCheckin)
    .sort((a, b) => new Date(b.latestCheckin.date).getTime() - new Date(a.latestCheckin.date).getTime())
    .slice(0, 5)

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
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '28px' }}>
          {[
            { label: 'Total Projects', value: total, sub: `${active} active · ${completed} completed · ${draft} draft`, color: 'var(--blue)' },
            { label: 'On Track',  value: onTrack,  sub: 'GREEN status', color: 'var(--accent2)' },
            { label: 'At Risk',   value: atRisk,   sub: 'AMBER status', color: 'var(--amber)' },
            { label: 'Off Track', value: offTrack, sub: 'RED status',   color: 'var(--red)' },
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
          {/* Projects */}
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '16px' }}>
              <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: '20px' }}>Projects</div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', color: 'var(--text3)' }}>{total} total</div>
              <Link href="/projects" style={{ marginLeft: 'auto', textDecoration: 'none' }}>
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', color: 'var(--text3)' }}>View all →</span>
              </Link>
            </div>

            {projects?.length === 0 ? (
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
                {projectsWithStatus.slice(0, 6).map((project: any) => (
                  <Link key={project.id} href={`/projects/${project.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{
                      background: 'var(--surface)', border: '1px solid var(--border)',
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
                      {project.latestStatus && (
                        <RagBadge status={project.latestStatus} />
                      )}
                    </div>
                  </Link>
                ))}
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