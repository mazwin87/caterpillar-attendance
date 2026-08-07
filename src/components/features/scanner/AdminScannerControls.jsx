import { Select, Button } from '../../ui'

export default function AdminScannerControls({ branches, filterBranch, onBranchChange, runningNow, runResult, onRunNow }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <Select
          value={filterBranch}
          onChange={e => onBranchChange(e.target.value)}
          style={{ flex: 1, padding: '9px 12px', fontSize: 13 }}
        >
          <option value="">All branches</option>
          {branches.map(b => <option key={b.id} value={b.id}>{b.slug}</option>)}
        </Select>
        <Button
          onClick={onRunNow}
          disabled={runningNow}
          variant={runningNow ? 'secondary' : 'danger'}
          style={{ padding: '9px 14px', fontSize: 12, whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          {runningNow ? 'Running...' : '🔔 Notify Absent'}
        </Button>
      </div>
      {runResult && (
        <div style={{ fontSize: 12, color: 'var(--present)', background: 'var(--present-bg)', borderRadius: 8, padding: '6px 12px' }}>
          {runResult}
        </div>
      )}
    </div>
  )
}
