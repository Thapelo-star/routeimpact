export function RagBadge({ status }: { status: 'GREEN' | 'AMBER' | 'RED' | string }) {
  const styles = {
    GREEN: { background: '#4ade8033', color: '#4ade80', border: '1px solid #4ade8055' },
    AMBER: { background: '#f59e0b33', color: '#f59e0b', border: '1px solid #f59e0b55' },
    RED:   { background: '#ef444433', color: '#ef4444', border: '1px solid #ef444455' },
  }
  const labels = { GREEN: '● On Track', AMBER: '● At Risk', RED: '● Off Track' }
  const s = styles[status as keyof typeof styles] || styles.AMBER
  return (
    <span style={{
      ...s,
      fontFamily: 'DM Mono, monospace',
      fontSize: '9px',
      padding: '2px 8px',
      borderRadius: '20px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      fontWeight: 500,
      whiteSpace: 'nowrap',
    }}>
      {labels[status as keyof typeof labels] || status}
    </span>
  )
}