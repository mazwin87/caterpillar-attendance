export default function Spinner() {
  return (
    <>
      <div style={{
        width: 24,
        height: 24,
        border: '2px solid var(--border)',
        borderTopColor: 'var(--present)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        margin: '0 auto',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}
