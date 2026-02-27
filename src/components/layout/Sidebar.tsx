'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/auth/actions'

const NAV = [
  { section: 'Overview', items: [
    { href: '/dashboard',    icon: '◈', label: 'Portfolio' },
    { href: '/projects',     icon: '⊟', label: 'Projects'  },
  ]},
  { section: 'Workspace', items: [
    { href: '/projects/new', icon: '✦', label: 'New Project' },
    { href: '/users',        icon: '⊕', label: 'Users'       },
  ]},
  { section: 'Account', items: [
    { href: '/profile',      icon: '◉', label: 'Profile'     },
  ]},
]

interface SidebarProps {
  userName: string
  userRole: string
  orgName: string
}

export function Sidebar({ userName, userRole, orgName }: SidebarProps) {
  const pathname = usePathname()

  const initials = userName
    .split(' ').map(n => n[0] ?? '').join('').slice(0, 2).toUpperCase()

  return (
    <nav style={{
      width: '220px', minHeight: '100vh',
      background: 'var(--bg2)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      position: 'fixed', top: 0, left: 0, bottom: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: '20px', color: 'var(--accent)' }}>
          RouteImpact
        </div>
        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px', color: 'var(--text3)', marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {orgName}
        </div>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {NAV.map(section => (
          <div key={section.section} style={{ marginBottom: '8px', paddingTop: '12px' }}>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', padding: '0 8px', marginBottom: '4px' }}>
              {section.section}
            </div>
            {section.items.map(item => {
              const active = pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href))
              return (
                <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '8px 10px', borderRadius: '6px', cursor: 'pointer',
                    fontSize: '13px', fontWeight: 600, marginBottom: '2px',
                    transition: 'all 0.15s',
                    background: active ? '#4ade8033' : 'transparent',
                    color: active ? 'var(--accent)' : 'var(--text2)',
                    border: active ? '1px solid var(--border2)' : '1px solid transparent',
                  }}>
                    <span style={{ fontSize: '14px', width: '16px', textAlign: 'center' }}>{item.icon}</span>
                    {item.label}
                  </div>
                </Link>
              )
            })}
          </div>
        ))}
      </div>

      {/* User footer */}
      <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
        <Link href="/profile" style={{ textDecoration: 'none' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '6px 8px', borderRadius: '6px', cursor: 'pointer',
            transition: 'background 0.15s',
            background: pathname === '/profile' ? '#4ade8022' : 'transparent',
          }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = pathname === '/profile' ? '#4ade8022' : 'transparent'}
          >
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, var(--accent2), #166534)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: 700, color: 'white',
            }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {userName}
              </div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px', color: 'var(--text3)', textTransform: 'uppercase' }}>
                {userRole}
              </div>
            </div>
          </div>
        </Link>

        {/* Sign out */}
        <form action={logout} style={{ marginTop: '6px' }}>
          <button
            type="submit"
            style={{
              width: '100%', background: 'none',
              border: '1px solid transparent', borderRadius: '6px',
              color: 'var(--text3)', cursor: 'pointer',
              fontSize: '11px', fontFamily: 'DM Mono, monospace',
              padding: '5px 8px', textAlign: 'left',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'var(--surface)'
              ;(e.currentTarget as HTMLElement).style.color = 'var(--red)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'none'
              ;(e.currentTarget as HTMLElement).style.color = 'var(--text3)'
            }}
          >
            ↪ Sign out
          </button>
        </form>
      </div>
    </nav>
  )
}