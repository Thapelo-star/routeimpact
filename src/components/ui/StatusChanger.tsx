'use client'

import { useState } from 'react'
import { updateProjectStatus, type ProjectStatus } from '@/app/actions/projectActions'

const STATUSES: { value: ProjectStatus; label: string; color: string }[] = [
  { value: 'DRAFT',     label: 'Draft',     color: '#60a5fa' },
  { value: 'ACTIVE',    label: 'Active',    color: '#4ade80' },
  { value: 'ON_HOLD',   label: 'On Hold',   color: '#f59e0b' },
  { value: 'COMPLETED', label: 'Completed', color: '#9db8a3' },
]

export default function StatusChanger({
  projectId,
  currentStatus,
}: {
  projectId: string
  currentStatus: ProjectStatus
}) {
  const [status,  setStatus]  = useState<ProjectStatus>(currentStatus)
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)

  const current = STATUSES.find(s => s.value === status) ?? STATUSES[1]

  async function handleChange(newStatus: ProjectStatus) {
    if (newStatus === status) { setOpen(false); return }
    setLoading(true)
    setOpen(false)
    await updateProjectStatus(projectId, newStatus)
    setStatus(newStatus)
    setLoading(false)
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        disabled={loading}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '5px 12px', borderRadius: '20px',
          border: `1px solid ${current.color}55`,
          background: `${current.color}22`,
          color: current.color,
          fontFamily: 'var(--mono)', fontSize: '10px', fontWeight: 600,
          cursor: 'pointer', transition: 'all 0.15s',
          textTransform: 'uppercase', letterSpacing: '0.5px',
        }}
      >
        ● {loading ? '…' : current.label}
        <span style={{ fontSize: '8px', opacity: 0.7 }}>▾</span>
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '8px', overflow: 'hidden', zIndex: 100,
            minWidth: '140px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}>
            {STATUSES.map(s => (
              <div
                key={s.value}
                onClick={() => handleChange(s.value)}
                style={{
                  padding: '10px 14px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: s.value === status ? `${s.color}22` : 'transparent',
                  transition: 'background 0.1s',
                  fontSize: '12px', fontWeight: 700,
                  color: s.value === status ? s.color : 'var(--text2)',
                }}
              >
                <span style={{ color: s.color }}>●</span>
                {s.label}
                {s.value === status && <span style={{ marginLeft: 'auto', fontSize: '10px' }}>✓</span>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}