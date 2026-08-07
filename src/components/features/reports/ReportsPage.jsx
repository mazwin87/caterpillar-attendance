import { useReports } from '../../../hooks/useReports'
import ReportFilters from './ReportFilters'
import ExportControls from './ExportControls'
import AttendanceTable from './AttendanceTable'

export default function ReportsPage() {
  const reports = useReports()

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', paddingBottom: 80 }}>

      {/* Header */}
      <div style={{ background: 'var(--surface)', borderBottom: '0.5px solid var(--border)', padding: '52px 20px 16px' }}>
        <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--text)', marginBottom: 14 }}>Reports</div>
        <ReportFilters
          startDate={reports.startDate}
          endDate={reports.endDate}
          filterBranch={reports.filterBranch}
          branches={reports.branches}
          loading={reports.loading}
          onStartDate={reports.setStartDate}
          onEndDate={reports.setEndDate}
          onBranch={reports.setFilterBranch}
          onSearch={reports.fetchRecords}
        />
      </div>

      <div style={{ padding: '12px 16px' }}>
        <ExportControls
          records={reports.records}
          branches={reports.branches}
          filterBranch={reports.filterBranch}
          startDate={reports.startDate}
          endDate={reports.endDate}
        />
        <AttendanceTable
          grouped={reports.grouped}
          searched={reports.searched}
          loading={reports.loading}
        />
      </div>
    </div>
  )
}
