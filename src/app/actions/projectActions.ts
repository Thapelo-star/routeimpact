'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ProjectStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ON_HOLD'

export async function updateProjectStatus(projectId: string, status: ProjectStatus) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('projects')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', projectId)

  if (error) throw new Error(error.message)
  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/projects')
  revalidatePath('/dashboard')
}




