export default function FeeStatusGrid({ paidCount, unpaidCount, total, filterStatus, onFilterChange }) {
  if (paidCount + unpaidCount === 0) return null

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, padding: '12px 16px 0' }}>
      <div
        onClick={() => onFilterChange(filterStatus === 'paid' ? '' : 'paid')}
        style={{
          background: filterStatus === 'paid' ? 'var(--present)' : 'var(--present-bg)',
          borderRadius: 10, padding: '10px 12px', textAlign: 'center',
          cursor: 'pointer', transition: 'all 0.15s',
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 500, color: filterStatus === 'paid' ? '#fff' : 'var(--present)' }}>
          {paidCount}
        </div>
        <div style={{ fontSize: 10, color: filterStatus === 'paid' ? 'rgba(255,255,255,0.8)' : 'var(--present)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Paid
        </div>
      </div>

      <div
        onClick={() => onFilterChange(filterStatus === 'unpaid' ? '' : 'unpaid')}
        style={{
          background: filterStatus === 'unpaid' ? 'var(--absent)' : 'var(--absent-bg)',
          borderRadius: 10, padding: '10px 12px', textAlign: 'center',
          cursor: 'pointer', transition: 'all 0.15s',
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 500, color: filterStatus === 'unpaid' ? '#fff' : 'var(--absent)' }}>
          {unpaidCount}
        </div>
        <div style={{ fontSize: 10, color: filterStatus === 'unpaid' ? 'rgba(255,255,255,0.8)' : 'var(--absent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Unpaid
        </div>
      </div>

      <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)' }}>
          RM {total.toFixed(0)}
        </div>
        <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Collected
        </div>
      </div>
    </div>
  )
}
