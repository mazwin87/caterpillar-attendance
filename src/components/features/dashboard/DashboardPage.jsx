import { MdOutlineAdminPanelSettings, MdOutlineSchool } from 'react-icons/md'
import { STATUS } from '../../../lib/constants/attendance'
import { shortBranchName } from '../../../lib/constants/branches'
import { useDashboard } from '../../../hooks/useDashboard'
import { Spinner } from '../../ui'
import BranchSummaryGrid from './BranchSummaryGrid'
import StatusDrilldown from './StatusDrilldown'

export default function DashboardPage({ t, session, isAdmin }) {
  const {
    summary, loading, totals,
    activeStatus, activeBranch, students, loadingStudents,
    overrideStudent, setOverrideStudent,
    handleStatusClick, closeDrilldown, handleOverride,
  } = useDashboard(session)

  const today = new Date().toLocaleDateString('en-MY', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', paddingBottom: 200, overflowY: 'auto' }}>

      {/* Header */}
      <div style={{ background: 'var(--surface)', borderBottom: '0.5px solid var(--border)', padding: '52px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.08em', marginBottom: 4, textTransform: 'uppercase' }}>{today}</div>
            <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--text)' }}>Today's overview</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
              {session?.role === 'admin'
                ? <>
                    <MdOutlineAdminPanelSettings size={14} color='var(--present)' />
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--present)' }}>Admin</span>
                  </>
                : <>
                    <MdOutlineSchool size={14} color='var(--holiday)' />
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--holiday)' }}>
                      {session?.teacherName} · {shortBranchName(session?.branches?.name)}
                    </span>
                  </>
              }
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <Spinner />
        </div>
      ) : (
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Status totals grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
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
                    borderRadius: 12, padding: '14px 16px', textAlign: 'left', cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}>
                  <div style={{ fontSize: 26, fontWeight: 500, color: cfg.color, lineHeight: 1 }}>{val}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, letterSpacing: '0.05em' }}>{cfg.label}</div>
                </button>
              )
            })}
          </div>

          {activeStatus && (
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
          )}

          <BranchSummaryGrid
            summary={summary}
            activeStatus={activeStatus}
            activeBranch={activeBranch}
            onStatusClick={handleStatusClick}
          />
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
