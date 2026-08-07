export default function Checkbox({ checked, onChange, label, sublabel }) {
  return (
    <div
      onClick={onChange}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        background: 'var(--bg)',
        borderRadius: 10,
        border: `0.5px solid ${checked ? 'var(--present)' : 'var(--border)'}`,
        cursor: 'pointer',
      }}
    >
      <div style={{
        width: 20,
        height: 20,
        borderRadius: 6,
        flexShrink: 0,
        border: `1.5px solid ${checked ? 'var(--present)' : 'var(--border)'}`,
        background: checked ? 'var(--present)' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {checked && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}
      </div>
      <div>
        <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{label}</div>
        {sublabel && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{sublabel}</div>}
      </div>
    </div>
  )
}
