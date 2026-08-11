import { MdOutlineAdminPanelSettings, MdOutlineSchool } from 'react-icons/md'
import { STATUS } from '../../../lib/constants/attendance'
import { shortBranchName, BRANCH_COLORS } from '../../../lib/constants/branches'
import { PageHeader, Table, Spinner } from '../../ui'
import StatusDrilldown from './StatusDrilldown'

function StatusCell({ value, status, branchName, activeStatus, activeBranch, onStatusClick }) {
  const cfg      = STATUS[status]
  const isActive = activeStatus === status && activeBranch === branchName
  return (
    <button
      onClick={() => onStatusClick(status, branchName)}
      style={{
        padding: '3px 10px', borderRadius: 20, fontSize: 13, fontWeight: 500,
        cursor: 'pointer', border: 'none',
        color: isActive ? cfg.color : 'var(--text)',
        background: isActive ? cfg.bg : 'transparent',
        transition: 'background 0.12s',
      }}
    >
      {value ?? 0}
    </button>
  )
}

export default function DashboardDesktopView({
  session, isAdmin,
  summary, loading, totals,
  activeStatus, activeBranch, students, loadingStudents,
  overrideStudent, setOverrideStudent,
  handleStatusClick, closeDrilldown, handleOverride,
}) {
  const today = new Date().toLocaleDateString('en-MY', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  const userLabel = session?.role === 'admin' || session?.role === 'superadmin'
    ? null
    : `${session?.teacherName} · ${shortBranchName(session?.branches?.name)}`

  const tableRows = summary.map(b => ({
    id:      b.branch,
    branch:  b.branch,
    total:   b.total   || 0,
    present: b.present || 0,
    late:    b.late    || 0,
    absent:  b.absent  || 0,
    holiday: b.holiday || 0,
    rate:    b.attendance_rate_pct || 0,
  }))

  const columns = [
    {
      key: 'branch', label: 'Branch', sortable: true,
      render: (row) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: BRANCH_COLORS[row.branch] || 'var(--present)', display: 'inline-block', flexShrink: 0 }} />
          {row.branch}
        </span>
      ),
    },
    { key: 'total',   label: 'Total',   sortable: true },
    {
      key: 'present', label: 'Present', sortable: true,
      render: (row) => <StatusCell value={row.present} status="PRESENT" branchName={row.branch} activeStatus={activeStatus} activeBranch={activeBranch} onStatusClick={handleStatusClick} />,
    },
    {
      key: 'late', label: 'Late', sortable: true,
      render: (row) => <StatusCell value={row.late} status="LATE" branchName={row.branch} activeStatus={activeStatus} activeBranch={activeBranch} onStatusClick={handleStatusClick} />,
    },
    {
      key: 'absent', label: 'Absent', sortable: true,
      render: (row) => <StatusCell value={row.absent} status="ABSENT" branchName={row.branch} activeStatus={activeStatus} activeBranch={activeBranch} onStatusClick={handleStatusClick} />,
    },
    {
      key: 'holiday', label: 'Holiday', sortable: true,
      render: (row) => <StatusCell value={row.holiday} status="HOLIDAY" branchName={row.branch} activeStatus={activeStatus} activeBranch={activeBranch} onStatusClick={handleStatusClick} />,
    },
    {
      key: 'rate', label: 'Rate', sortable: true,
      render: (row) => {
        const color = BRANCH_COLORS[row.branch] || 'var(--present)'
        return (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 500, color }}>{row.rate}%</span>
            <span style={{ flex: 1, maxWidth: 80, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden', display: 'inline-block' }}>
              <span style={{ display: 'block', width: `${row.rate}%`, height: '100%', background: color, borderRadius: 2 }} />
            </span>
          </span>
        )
      },
    },
  ]

  return (
    <div style={{ minHeight: '100%' }}>
      <PageHeader
        title="Today's Overview"
        subtitle={userLabel ?? today}
        actions={userLabel ? <span style={{ fontSize: 12, color: 'var(--muted)' }}>{today}</span> : null}
      />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <Spinner />
        </div>
      ) : (
        <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* 4 summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[
              { status: 'PRESENT', val: totals.present },
              { status: 'LATE',    val: totals.late },
              { status: 'ABSENT',  val: totals.absent },
              { status: 'HOLIDAY', val: totals.holiday },
            ].map(({ status, val }) => {
              const cfg      = STATUS[status]
              const isActive = activeStatus === status && activeBranch === null
              return (
                <button key={status} onClick={() => handleStatusClick(status, null)}
                  style={{
                    background: isActive ? cfg.bg : 'var(--surface)',
                    border: `${isActive ? '1.5px' : '0.5px'} solid ${isActive ? cfg.color : 'var(--border)'}`,
                    borderRadius: 14, padding: '20px 24px', textAlign: 'left',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                  <div style={{ fontSize: 36, fontWeight: 600, color: cfg.color, lineHeight: 1 }}>{val}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6, letterSpacing: '0.05em' }}>{cfg.label}</div>
                  {totals.total > 0 && (
                    <div style={{ fontSize: 11, color: cfg.color, marginTop: 4, opacity: 0.7 }}>
                      {Math.round((val / totals.total) * 100)}% of total
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Branch summary table */}
          {summary.length > 0 && (
            <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', borderBottom: '0.5px solid var(--border)', fontSize: 12, fontWeight: 500, color: 'var(--muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Branch breakdown — click any count to drill down
              </div>
              <Table columns={columns} rows={tableRows} emptyMessage="No branch data." />
            </div>
          )}

          {/* Status drilldown — inline below table */}
          {activeStatus && (
            <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              <StatusDrilldown
                activeStatus={activeStatus}
                activeBranch={activeBranch}
                students={students}
                loadingStudents={loadingStudents}
                isAdmin={isAdmin}
                overrideStudent={overrideStudent}
                setOverrideStudent={setOverrideStudent}
                onOverride={handleOverride}
                onClose={closeDrilldown}
              />
            </div>
          )}

          {/* Analytics placeholder — reserved slot */}
          <div style={{
            background: 'var(--surface)', border: '0.5px dashed var(--border)',
            borderRadius: 14, padding: '40px 32px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 8, minHeight: 180,
          }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)' }}>Analytics</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', opacity: 0.6 }}>Coming soon — attendance trends, monthly charts</div>
          </div>

        </div>
      )}
    </div>
  )
}
