import { STATUS } from '../../../lib/constants/attendance'
import { shortBranchName } from '../../../lib/constants/branches'
import { PageHeader, DataFilter, Table, Input, Button, Spinner } from '../../ui'
import { buildExportHandlers } from './ExportControls'

const REPORT_TYPES = [
  { value: 'attendance-log', label: 'Attendance log' },
  { value: 'by-student',     label: 'By student' },
  { value: 'monthly',        label: 'Monthly' },
]

function FilterPill({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', textAlign: 'left', padding: '6px 10px', borderRadius: 8,
      fontSize: 12, cursor: 'pointer', marginBottom: 3,
      background: active ? 'var(--present)' : 'var(--bg)',
      color:      active ? '#fff'           : 'var(--muted)',
      border:     `0.5px solid ${active ? 'var(--present)' : 'var(--border)'}`,
      fontWeight: active ? 500 : 400,
    }}>
      {children}
    </button>
  )
}

function MetricCard({ label, count, pct, color, bg }) {
  return (
    <div style={{ background: bg, border: `0.5px solid ${color}`, borderRadius: 12, padding: '16px 20px' }}>
      <div style={{ fontSize: 30, fontWeight: 600, color, lineHeight: 1 }}>{count}</div>
      {pct !== undefined && (
        <div style={{ fontSize: 11, color, opacity: 0.75, marginTop: 3 }}>{pct}%</div>
      )}
      <div style={{ fontSize: 11, color, marginTop: 6, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    </div>
  )
}

export default function ReportsDesktopView({
  branches, records, grouped,
  loading, searched,
  filterBranch, setFilterBranch,
  startDate, setStartDate,
  endDate, setEndDate,
  reportType, setReportType,
  metrics,
  fetchRecords,
}) {
  const hasRecords = records.length > 0
  const { handleCSV, handlePDF } = buildExportHandlers({ records, branches, filterBranch, startDate, endDate })

  // Slot B — flat table rows from records
  const tableRows = records.map(r => ({
    id:         r.id,
    date:       r.date,
    student:    r.students?.name || '—',
    student_no: r.students?.student_no || '—',
    branch:     shortBranchName(r.students?.branches?.name) || '—',
    status:     r.status,
    reason:     r.absence_reason?.replace('_', ' ') || '—',
    time:       r.scanned_at
      ? new Date(r.scanned_at).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })
      : '—',
  }))

  const columns = [
    {
      key: 'date', label: 'Date', sortable: true,
      render: (row) => new Date(row.date).toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short' }),
    },
    { key: 'student',    label: 'Student', sortable: true },
    { key: 'student_no', label: 'ID',      sortable: true },
    { key: 'branch',     label: 'Branch',  sortable: true },
    {
      key: 'status', label: 'Status', sortable: true,
      render: (row) => {
        const cfg = STATUS[row.status] || {}
        return <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 20, background: cfg.bg, color: cfg.color, fontWeight: 500 }}>{row.status}</span>
      },
    },
    { key: 'reason', label: 'Reason', sortable: false },
    { key: 'time',   label: 'Time',   sortable: true },
  ]

  const branchLabel = filterBranch
    ? branches.find(b => b.id === filterBranch)?.name || 'All Branches'
    : 'All Branches'

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* PageHeader — export buttons always visible, disabled when no data */}
      <PageHeader
        title="Reports"
        subtitle={`${startDate} — ${endDate} · ${branchLabel}`}
        actions={
          <>
            <Button variant="secondary" onClick={handleCSV} disabled={!hasRecords} style={{ fontSize: 13 }}>
              📥 Export CSV
            </Button>
            <Button variant="secondary" onClick={handlePDF} disabled={!hasRecords} style={{ fontSize: 13 }}>
              🖨️ Export PDF
            </Button>
          </>
        }
      />

      <div style={{ flex: 1, display: 'flex' }}>

        {/* Left filter panel */}
        <DataFilter>
          <DataFilter.Section label="Branch">
            <FilterPill active={filterBranch === ''} onClick={() => setFilterBranch('')}>All branches</FilterPill>
            {branches.map(b => (
              <FilterPill key={b.id} active={filterBranch === b.id} onClick={() => setFilterBranch(b.id)}>
                {b.name}
              </FilterPill>
            ))}
          </DataFilter.Section>

          <DataFilter.Section label="Date range">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Input label="From" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              <Input label="To"   type="date" value={endDate}   onChange={e => setEndDate(e.target.value)} />
            </div>
          </DataFilter.Section>

          <DataFilter.Section label="Report type">
            {REPORT_TYPES.map(rt => (
              <FilterPill key={rt.value} active={reportType === rt.value} onClick={() => setReportType(rt.value)}>
                {rt.label}
              </FilterPill>
            ))}
          </DataFilter.Section>

          <Button
            onClick={fetchRecords}
            disabled={loading}
            style={{ width: '100%', marginTop: 8, fontSize: 13, padding: '10px' }}
          >
            {loading ? 'Loading...' : 'Search'}
          </Button>
        </DataFilter>

        {/* Main content — 3 slots always present */}
        <div style={{ flex: 1, padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Slot A — Summary metrics (reads from hook-computed metrics) */}
          <section>
            {searched && !loading && hasRecords ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                <MetricCard label="Total"   count={metrics.total}   color="var(--text)"    bg="var(--surface)" />
                <MetricCard label="Present" count={metrics.present} pct={metrics.presentPct} color="var(--present)" bg="var(--present-bg)" />
                <MetricCard label="Late"    count={metrics.late}    pct={metrics.latePct}    color="var(--late)"    bg="var(--late-bg)" />
                <MetricCard label="Absent"  count={metrics.absent}  pct={metrics.absentPct}  color="var(--absent)"  bg="var(--absent-bg)" />
                <MetricCard label="Holiday" count={metrics.holiday} pct={metrics.holidayPct} color="var(--holiday)" bg="var(--holiday-bg)" />
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                {['Total', 'Present', 'Late', 'Absent', 'Holiday'].map(label => (
                  <div key={label} style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '16px 20px', opacity: 0.5 }}>
                    <div style={{ fontSize: 30, fontWeight: 600, color: 'var(--muted)', lineHeight: 1 }}>—</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Slot B — Data table (swaps by reportType) */}
          <section>
            <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, overflow: 'hidden', minHeight: 160 }}>
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                  <Spinner />
                </div>
              ) : !searched ? (
                <div style={{ textAlign: 'center', padding: 60, fontSize: 13, color: 'var(--muted)' }}>
                  Set filters and press Search to load data
                </div>
              ) : reportType === 'attendance-log' ? (
                hasRecords
                  ? <Table columns={columns} rows={tableRows} emptyMessage="No records found." />
                  : <div style={{ textAlign: 'center', padding: 60, fontSize: 13, color: 'var(--muted)' }}>No records found for this period</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60, gap: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)' }}>{REPORT_TYPES.find(r => r.value === reportType)?.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', opacity: 0.6 }}>Coming soon</div>
                </div>
              )}
            </div>
          </section>

          {/* Slot C — Chart area (reserved; drop <AttendanceChart records={records} metrics={metrics} /> here) */}
          <section>
            <div style={{
              background: 'var(--surface)', border: '0.5px dashed var(--border)',
              borderRadius: 14, minHeight: 200,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)' }}>Charts</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', opacity: 0.6 }}>Coming soon — attendance trends, status breakdown</div>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}
