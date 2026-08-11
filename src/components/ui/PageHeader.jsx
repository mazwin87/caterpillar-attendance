export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div style={{
      padding: '32px 32px 24px',
      borderBottom: '0.5px solid var(--border)',
      background: 'var(--surface)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      gap: 16,
    }}>
      <div>
        <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--text)' }}>{title}</div>
        {subtitle && (
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{subtitle}</div>
        )}
      </div>
      {actions && (
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>{actions}</div>
      )}
    </div>
  )
}
