import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileForm from './ProfileForm'

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, organisations(*)')
    .eq('id', user.id)
    .single()

  return (
    <div className="page">
      <div style={{ marginBottom: '28px' }}>
        <div style={{
          fontFamily: 'var(--serif)', fontSize: '28px',
          color: 'var(--text)', marginBottom: '4px',
        }}>
          Profile &amp; Settings
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text3)' }}>
          {user.email}
        </div>
      </div>

      <ProfileForm user={user} profile={profile} />
    </div>
  )
}