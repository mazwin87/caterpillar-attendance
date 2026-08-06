const BASE = {
  width: '100%',
  background: 'var(--bg)',
  border: '0.5px solid var(--border)',
  borderRadius: 10,
  padding: '11px 14px',
  fontSize: 14,
  color: 'var(--text)',
  outline: 'none',
}

export default function Select({ label, error, children, style, ...props }) {
  return (
    <div>
      {label && <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>{label}</div>}
      <select style={{ ...BASE, ...style }} {...props}>
        {children}
      </select>
      {error && <div style={{ fontSize: 11, color: 'var(--absent)', marginTop: 4 }}>{error}</div>}
    </div>
  )
}
