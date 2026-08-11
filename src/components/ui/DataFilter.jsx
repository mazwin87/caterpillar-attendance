function Section({ label, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
        {label}
      </div>
      {children}
    </div>
  )
}

export default function DataFilter({ children }) {
  return (
    <div style={{
      width: 220, flexShrink: 0,
      background: 'var(--surface)',
      borderRight: '0.5px solid var(--border)',
      padding: '24px 16px',
      overflowY: 'auto',
      alignSelf: 'stretch',
    }}>
      {children}
    </div>
  )
}

DataFilter.Section = Section
