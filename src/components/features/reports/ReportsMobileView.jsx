import ReportFilters from './ReportFilters'
import ExportControls from './ExportControls'
import AttendanceTable from './AttendanceTable'

export default function ReportsMobileView({
  branches, records, grouped,
  loading, searched,
  filterBranch, setFilterBranch,
  startDate, setStartDate,
  endDate, setEndDate,
  fetchRecords,
}) {
  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', paddingBottom: 80 }}>
      <div style={{ background: 'var(--surface)', borderBottom: '0.5px solid var(--border)', padding: '52px 20px 16px' }}>
        <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--text)', marginBottom: 14 }}>Reports</div>
        <ReportFilters
          startDate={startDate}
          endDate={endDate}
          filterBranch={filterBranch}
          branches={branches}
          loading={loading}
          onStartDate={setStartDate}
          onEndDate={setEndDate}
          onBranch={setFilterBranch}
          onSearch={fetchRecords}
        />
      </div>
      <div style={{ padding: '12px 16px' }}>
        <ExportControls
          records={records}
          branches={branches}
          filterBranch={filterBranch}
          startDate={startDate}
          endDate={endDate}
        />
        <AttendanceTable
          grouped={grouped}
          searched={searched}
          loading={loading}
        />
      </div>
    </div>
  )
}
