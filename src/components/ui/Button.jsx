const VARIANTS = {
  primary:   { background: 'var(--present)', color: '#fff', border: 'none', fontWeight: 500 },
  secondary: { background: 'var(--bg)', color: 'var(--muted)', border: '0.5px solid var(--border)' },
  danger:    { background: 'var(--absent)', color: '#fff', border: 'none', fontWeight: 500 },
  ghost:     { background: 'none', color: 'var(--muted)', border: 'none' },
}

export default function Button({ variant = 'primary', disabled, children, style, ...props }) {
  return (
    <button
      disabled={disabled}
      style={{
        borderRadius: 10,
        padding: 12,
        fontSize: 14,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        ...VARIANTS[variant],
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  )
}
