export function StatusBadge({ status }: { status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | string }) {
  const styles = {
    DRAFT:     { background: '#60a5fa22', color: '#60a5fa', border: '1px solid #60a5fa44' },
    ACTIVE:    { background: '#4ade8033', color: '#4ade80', border: '1px solid #4ade8055' },
    COMPLETED: { background: '#ffffff11', color: '#9db8a3', border: '1px solid #ffffff22' },
  }
  const s = styles[status as keyof typeof styles] || styles.DRAFT
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
    }}>
      {status}
    </span>
  )
}