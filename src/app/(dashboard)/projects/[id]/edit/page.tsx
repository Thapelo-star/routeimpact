import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EditProjectForm from './EditProjectForm'

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !project) redirect('/projects')

  return (
    <div className="page">
      <div style={{ marginBottom: '24px' }}>
        <div style={{
          fontFamily: 'var(--serif)', fontSize: '28px',
          color: 'var(--text)', marginBottom: '4px',
        }}>
          Edit Project
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text3)' }}>
          {project.name}
        </div>
      </div>

      <EditProjectForm project={project} />
    </div>
  )
}