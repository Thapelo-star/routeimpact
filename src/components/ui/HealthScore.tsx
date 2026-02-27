import type { HealthResult } from '@/lib/health/calculateHealth'

const TREND_ICON: Record<string, string> = {
  improving: '↑',
  declining:  '↓',
  stable:     '→',
  no_data:    '—',
}

const TREND_COLOR: Record<string, string> = {
  improving: 'var(--accent)',
  declining:  'var(--red)',
  stable:     'var(--text3)',
  no_data:    'var(--text3)',
}

const RAG_COLOR: Record<string, string> = {
  GREEN: 'var(--accent)',
  AMBER: 'var(--amber)',
  RED:   'var(--red)',
  NONE:  'var(--text3)',
}

const RAG_BG: Record<string, string> = {
  GREEN: '#4ade8022',
  AMBER: '#f59e0b22',
  RED:   '#ef444422',
  NONE:  'var(--bg3)',
}

// ── Compact pill (for project cards) ─────────

export function HealthScorePill({ health }: { health: HealthResult }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      background: RAG_BG[health.rag],
      border: `1px solid ${RAG_COLOR[health.rag]}44`,
      borderRadius: '20px', padding: '3px 10px',
    }}>
      <span style={{
        fontFamily: 'DM Mono, monospace', fontSize: '11px',
        fontWeight: 700, color: RAG_COLOR[health.rag],
      }}>
        {health.score}
      </span>
      <span style={{
        fontFamily: 'DM Mono, monospace', fontSize: '9px',
        color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px',
      }}>
        health
      </span>
      <span style={{
        fontSize: '11px', color: TREND_COLOR[health.trend], fontWeight: 700,
      }}>
        {TREND_ICON[health.trend]}
      </span>
    </div>
  )
}

// ── Full card (for project header) ───────────

export function HealthScoreCard({ health }: { health: HealthResult }) {
  const circumference = 2 * Math.PI * 28 // radius 28
  const filled = circumference * (health.score / 100)
  const gap    = circumference - filled

  return (
    <div style={{
      background: 'var(--surface)', border: `1px solid ${RAG_COLOR[health.rag]}44`,
      borderRadius: '10px', padding: '16px 20px',
      display: 'flex', alignItems: 'center', gap: '16px',
      minWidth: '200px',
    }}>
      {/* Circular progress */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <svg width="64" height="64" viewBox="0 0 64 64">
          {/* Track */}
          <circle cx="32" cy="32" r="28" fill="none" stroke="var(--border)" strokeWidth="5" />
          {/* Progress */}
          <circle
            cx="32" cy="32" r="28" fill="none"
            stroke={RAG_COLOR[health.rag]}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${gap}`}
            transform="rotate(-90 32 32)"
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'DM Serif Display, serif', fontSize: '16px',
          color: RAG_COLOR[health.rag],
        }}>
          {health.score}
        </div>
      </div>

      {/* Labels */}
      <div>
        <div style={{
          fontFamily: 'DM Mono, monospace', fontSize: '9px',
          textTransform: 'uppercase', letterSpacing: '1px',
          color: 'var(--text3)', marginBottom: '4px',
        }}>
          Health Score
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <span style={{
            fontFamily: 'DM Mono, monospace', fontSize: '10px',
            color: RAG_COLOR[health.rag], fontWeight: 700,
            textTransform: 'uppercase',
          }}>
            {health.rag}
          </span>
          <span style={{ fontSize: '12px', color: TREND_COLOR[health.trend], fontWeight: 700 }}>
            {TREND_ICON[health.trend]} {health.trend.replace('_', ' ')}
          </span>
        </div>
        {health.isDrifting && (
          <div style={{
            fontFamily: 'DM Mono, monospace', fontSize: '9px',
            color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '0.5px',
          }}>
            ⚠ Off Route
          </div>
        )}
      </div>
    </div>
  )
}