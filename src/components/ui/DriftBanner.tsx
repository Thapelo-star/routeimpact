import type { HealthResult } from '@/lib/health/calculateHealth'

export function DriftBanner({ health, projectId }: { health: HealthResult; projectId: string }) {
  if (!health.isDrifting) return null

  return (
    <div style={{
      background: '#ef444411',
      border: '1px solid #ef444444',
      borderRadius: '10px',
      padding: '14px 20px',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '14px',
    }}>
      {/* Icon */}
      <div style={{
        width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
        background: '#ef444422', border: '1px solid #ef444466',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '16px',
      }}>
        ⚠
      </div>

      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: 'DM Mono, monospace', fontSize: '10px',
          textTransform: 'uppercase', letterSpacing: '1px',
          color: 'var(--red)', fontWeight: 700, marginBottom: '4px',
        }}>
          Off Route — Drift Detected
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.6 }}>
          This project is showing signs of deviation from its planned trajectory.
        </div>
        {health.driftReasons.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
            {health.driftReasons.map(reason => (
              <span key={reason} style={{
                fontFamily: 'DM Mono, monospace', fontSize: '10px',
                padding: '2px 8px', borderRadius: '4px',
                background: '#ef444422', color: 'var(--red)',
                border: '1px solid #ef444444',
              }}>
                {reason}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Health score inline */}
      <div style={{ flexShrink: 0, textAlign: 'center' }}>
        <div style={{
          fontFamily: 'DM Serif Display, serif', fontSize: '28px',
          color: 'var(--red)', lineHeight: 1,
        }}>
          {health.score}
        </div>
        <div style={{
          fontFamily: 'DM Mono, monospace', fontSize: '9px',
          color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px',
        }}>
          / 100
        </div>
      </div>
    </div>
  )
}