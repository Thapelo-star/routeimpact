import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { RagBadge } from '@/components/ui/RagBadge'

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('org_id').eq('id', user.id).single()

  const { data: projects } = await supabase
    .from('projects')
    .select(`*, checkins(overall_status, date)`)
    .eq('org_id', profile?.org_id)
    .order('created_at', { ascending: false })

  const projectsWithStatus = projects?.map(p => {
    const latest = p.checkins?.sort((a: any, b: any) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0]
    return { ...p, latestStatus: latest?.overall_status }
  }) || []

  return (
    <div>
      <header style={{
        height: '56px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', padding: '0 28px',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: '18px' }}>Projects</span>
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', color: 'var(--text3)', marginLeft: '8px' }}>
          / {projects?.length || 0} total
        </span>
        <div style={{ marginLeft: 'auto' }}>
          <Link href="/projects/new">
            <button style={{
              background: 'var(--accent2)', color: '#052e16', border: 'none',
              padding: '7px 14px', borderRadius: '6px', fontSize: '12px',
              fontWeight: 700, cursor: 'pointer',
            }}>+ New Project</button>
          </Link>
        </div>
      </header>

      <div style={{ padding: '28px' }}>
        {projectsWithStatus.length === 0 ? (
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '10px', padding: '80px', textAlign: 'center',
          }}>
            <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: '24px', color: 'var(--text2)', marginBottom: '12px' }}>
              No projects yet
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text3)', marginBottom: '24px' }}>
              Start by creating your first sustainability project.
            </div>
            <Link href="/projects/new">
              <button style={{
                background: 'var(--accent2)', color: '#052e16', border: 'none',
                padding: '12px 24px', borderRadius: '8px', fontSize: '14px',
                fontWeight: 700, cursor: 'pointer',
              }}>Create first project →</button>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
            {projectsWithStatus.map((project: any) => (
              <Link key={project.id} href={`/projects/${project.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: '10px', padding: '18px', cursor: 'pointer',
                  transition: 'all 0.2s', height: '100%',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px', textTransform: 'uppercase', color: 'var(--text3)' }}>
                      {project.category || 'General'}
                    </div>
                    <StatusBadge status={project.status} />
                  </div>
                  <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: '16px', color: 'var(--text)', marginBottom: '6px', lineHeight: 1.3 }}>
                    {project.title}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: 1.5, marginBottom: '14px' }}>
                    {project.description?.slice(0, 100)}{project.description?.length > 100 ? '…' : ''}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: 'var(--text3)' }}>
                      {project.start_date
                        ? new Date(project.start_date).toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })
                        : 'No date set'}
                    </div>
                    {project.latestStatus && <RagBadge status={project.latestStatus} />}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}