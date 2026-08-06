export default function QRCodeModal({ student, qrDataUrl, onClose }) {
  if (!student) return null
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={onClose}>
      <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 300, textAlign: 'center' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>{student.name}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 20 }}>{student.student_no}</div>
        {qrDataUrl && (
          <img src={qrDataUrl} alt="QR" style={{ width: 200, height: 200, borderRadius: 8, border: '0.5px solid var(--border)', marginBottom: 20 }} />
        )}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose}
            style={{ flex: 1, background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 10, padding: 11, fontSize: 14, color: 'var(--muted)', cursor: 'pointer' }}>
            Close
          </button>
          <a href={qrDataUrl} download={`${student.student_no}-qr.png`}
            style={{ flex: 1, background: 'var(--present)', borderRadius: 10, padding: 11, fontSize: 14, color: '#fff', fontWeight: 500, textAlign: 'center', textDecoration: 'none', display: 'block' }}>
            Download
          </a>
        </div>
      </div>
    </div>
  )
}
