export default function EmptyState({ children }) {
  return (
    <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, padding: 48 }}>
      {children}
    </div>
  )
}
