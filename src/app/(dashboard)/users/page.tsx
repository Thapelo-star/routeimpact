import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { InviteUserForm } from '@/components/users/InviteUserForm'

export default async function UsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('org_id, role').eq('id', user.id).single()

  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .eq('org_id', profile?.org_id)
    .order('created_at', { ascending: true })

  const isAdmin = profile?.role === 'ADMIN'

  const ROLE_STYLES: Record<string, { bg: string; color: string }> = {
    ADMIN:         { bg: '#2a1a3a', color: '#a78bfa' },
    PROJECT_OWNER: { bg: '#1a1a3a', color: '#60a5fa' },
    SUSTAINABILITY:{ bg: '#1a2e1a', color: '#4ade80' },
    VIEWER:        { bg: '#1a1a0a', color: '#fbbf24' },
  }

  return (
    <div>
      <header style={{
        height: '56px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', padding: '0 28px',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: '18px' }}>Team & Users</span>
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', color: 'var(--text3)', marginLeft: '8px' }}>
          / {users?.length || 0} members
        </span>
      </header>

      <div style={{ padding: '28px', maxWidth: '900px' }}>

        {/* Invite form — admin only */}
        {isAdmin && <InviteUserForm orgId={profile?.org_id} />}

        {/* Users table */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '10px', overflow: 'hidden',
        }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text2)' }}>
              Members
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg3)' }}>
                {['User', 'Role', 'Email', 'Joined'].map(h => (
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
              {users?.map((u: any) => {
                const initials = u.full_name
                  ? u.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                  : u.email?.[0]?.toUpperCase() || '?'
                const roleStyle = ROLE_STYLES[u.role] || ROLE_STYLES.VIEWER
                const isCurrentUser = u.id === user.id

                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                          background: 'linear-gradient(135deg, var(--accent2), #166534)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '11px', fontWeight: 700, color: 'white',
                        }}>{initials}</div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
                            {u.full_name || 'Unnamed user'}
                            {isCurrentUser && (
                              <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px', color: 'var(--text3)', marginLeft: '8px' }}>you</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        fontFamily: 'DM Mono, monospace', fontSize: '9px',
                        padding: '2px 8px', borderRadius: '4px',
                        background: roleStyle.bg, color: roleStyle.color,
                        textTransform: 'uppercase', letterSpacing: '0.5px',
                      }}>
                        {u.role?.replace('_', ' ') || 'VIEWER'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', fontFamily: 'DM Mono, monospace', fontSize: '11px', color: 'var(--text2)' }}>
                      {u.email}
                    </td>
                    <td style={{ padding: '14px 20px', fontFamily: 'DM Mono, monospace', fontSize: '11px', color: 'var(--text3)' }}>
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}