import { Input, Select, Button } from '../../ui'

export default function ReportFilters({
  startDate, endDate, filterBranch, branches, loading,
  onStartDate, onEndDate, onBranch, onSearch,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Input label="From" type="date" value={startDate} onChange={e => onStartDate(e.target.value)} />
        <Input label="To"   type="date" value={endDate}   onChange={e => onEndDate(e.target.value)} />
      </div>

      <Select value={filterBranch} onChange={e => onBranch(e.target.value)}>
        <option value="">All branches</option>
        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
      </Select>

      <Button onClick={onSearch} disabled={loading} style={{ padding: '11px', fontSize: 14 }}>
        {loading ? 'Loading...' : 'Search'}
      </Button>
    </div>
  )
}
