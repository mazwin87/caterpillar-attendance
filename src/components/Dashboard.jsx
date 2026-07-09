import { useEffect, useState } from 'react'
import { getDailySummary, supabase } from '../lib/supabase'
import { MdOutlineAdminPanelSettings, MdOutlineSchool } from 'react-icons/md'
import { STATUS, STATUS_CLASSES } from '../lib/constants'
import { cleanBranchName } from '../lib/branch'
import Spinner, { CenteredSpinner } from './ui/Spinner'

const BRANCH_COLORS = {
  'Caterpillar Playtime KL Traders':  '#2d7a4f',
  'Caterpillar Playtime Sentul':      '#9a6b1a',
  'Caterpillar Playtime Wangsa Maju': '#4a6fa5',
  'Caterpillar Playtime One Maxim':   '#7a4a8a',
}

export default function Dashboard({ t, session, isAdmin }) {
  const [summary, setSummary]           = useState([])
  const [loading, setLoading]           = useState(true)
  const [activeStatus, setActiveStatus] = useState(null)
  const [activeBranch, setActiveBranch] = useState(null)
  const [students, setStudents]         = useState([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [overrideStudent, setOverrideStudent] = useState(null)

  useEffect(() => {
  getDailySummary()
    .then(data => {
      if (session?.role === 'teacher' && session?.branch_id) {
        const branchName = session?.branches?.name
        setSummary(data.filter(b => b.branch === branchName))
      } else {
        setSummary(data)
      }
    })
    .catch(console.error)
    .finally(() => setLoading(false))
  }, [])

  async function handleStatusClick(status, branchName = null) {
    if (activeStatus === status && activeBranch === branchName) {
      setActiveStatus(null); setActiveBranch(null); setStudents([]); return
    }
    setActiveStatus(status); setActiveBranch(branchName); setLoadingStudents(true)
    const today = new Date().toISOString().split('T')[0]

    let query = supabase
      .from('attendance')
      .select('*, absence_reason, students(name, student_no, branches(name))')
      .eq('date', today)
      .eq('status', status)

    if (session?.role === 'teacher' && session?.branch_id) {
      query = query.eq('branch_id', session.branch_id)
    } else if (branchName) {
      const { data: branch } = await supabase.from('branches').select('id').eq('name', branchName).single()
      if (branch) query = query.eq('branch_id', branch.id)
    }

    const { data } = await query
    setStudents(data || [])
    setLoadingStudents(false)
  }

  async function handleOverride(attendanceId, newStatus) {
    const { error } = await supabase
      .from('attendance')
      .update({ status: newStatus })
      .eq('id', attendanceId)
    if (error) { alert(error.message); return }

    setStudents(prev => prev.map(a =>
      a.id === attendanceId ? { ...a, status: newStatus } : a
    ))
    setOverrideStudent(null)

    getDailySummary().then(setSummary)
  }

  const today = new Date().toLocaleDateString('en-MY', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  const totals = summary.reduce((acc, b) => ({
    present: acc.present + (b.present || 0),
    late:    acc.late    + (b.late    || 0),
    absent:  acc.absent  + (b.absent  || 0),
    holiday: acc.holiday + (b.holiday || 0),
    total:   acc.total   + (b.total   || 0),
  }), { present: 0, late: 0, absent: 0, holiday: 0, total: 0 })

  return (
    <div className="min-h-full bg-page overflow-y-auto pb-[200px]">

      {/* Header */}
      <div className="pt-[52px] lg:pt-8 bg-surface border-b border-border pb-4 px-5">
        <div className="lg:max-w-5xl lg:mx-auto flex items-center justify-between">
          <div>
            <div className="text-[11px] text-muted tracking-[0.08em] mb-1 uppercase">{today}</div>
            <div className="text-[22px] font-medium text-ink">Today's overview</div>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {session?.role === 'admin'
                ? <>
                    <MdOutlineAdminPanelSettings size={14} color='var(--present)' />
                    <span className="text-xs font-medium text-present">Admin</span>
                  </>
                : <>
                    <MdOutlineSchool size={14} color='var(--holiday)' />
                    <span className="text-xs font-medium text-holiday">
                      {session?.teacherName} · {cleanBranchName(session?.branches?.name)}
                    </span>
                  </>
              }
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Spinner />
        </div>
      ) : (
        <div className="lg:max-w-5xl lg:mx-auto p-4 flex flex-col gap-3">

          {/* Status grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {[
              { status: 'PRESENT', val: totals.present },
              { status: 'LATE',    val: totals.late },
              { status: 'ABSENT',  val: totals.absent },
              { status: 'HOLIDAY', val: totals.holiday },
            ].map(({ status, val }) => {
              const cfg = STATUS[status]
              const cls = STATUS_CLASSES[status]
              const isActive = activeStatus === status && activeBranch === null
              return (
                <button key={status} onClick={() => handleStatusClick(status, null)}
                  className={`rounded-xl px-4 py-3.5 text-left cursor-pointer transition-all duration-150 ${
                    isActive ? `${cls.bg} border-[1.5px] ${cls.border}` : 'bg-surface border border-border'
                  }`}>
                  <div className={`text-[26px] font-medium leading-none ${cls.text}`}>{val}</div>
                  <div className="text-[11px] text-muted mt-1 tracking-wide">{cfg.label}</div>
                </button>
              )
            })}
          </div>

          {/* Student list */}
          {activeStatus && (
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${STATUS_CLASSES[activeStatus].dot}`} />
                  <span className="text-xs text-ink font-medium">
                    {STATUS[activeStatus].label} {activeBranch ? `· ${cleanBranchName(activeBranch)}` : '· All branches'}
                  </span>
                </div>
                <button onClick={() => { setActiveStatus(null); setActiveBranch(null); setStudents([]) }}
                  className="bg-transparent border-0 text-muted text-lg cursor-pointer leading-none">×</button>
              </div>
              {loadingStudents ? (
                <CenteredSpinner padding={24} size={20} color={STATUS[activeStatus].color} />
              ) : students.length === 0 ? (
                <div className="p-6 text-center text-[13px] text-muted">No students</div>
              ) : students.map((a, i) => {
                    const rowCls = STATUS_CLASSES[a.status] || STATUS_CLASSES[activeStatus]
                    return (
                  <div key={a.id}>
                    <div className={`flex items-center gap-3 px-4 py-3 cursor-pointer ${
                        overrideStudent === a.id ? 'bg-page' : 'bg-transparent'
                      } ${overrideStudent === a.id || i === students.length - 1 ? '' : 'border-b border-border'}`}
                      onClick={() => isAdmin && setOverrideStudent(overrideStudent === a.id ? null : a.id)}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${rowCls.bg} ${rowCls.text}`}>
                        {a.students?.name?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-ink font-medium overflow-hidden text-ellipsis whitespace-nowrap">{a.students?.name}</div>
                        <div className="text-xs text-muted mt-0.5">{a.students?.student_no} · {cleanBranchName(a.students?.branches?.name)}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${rowCls.bg} ${rowCls.text}`}>
                          {a.status}
                        </span>
                        {a.scanned_at && (
                          <div className="text-xs text-muted">
                            {new Date(a.scanned_at).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                        {a.absence_reason && (
                          <span className="text-[10px] text-absent capitalize">
                            {a.absence_reason.replace('_', ' ')}
                          </span>
                        )}
                        {activeStatus === 'ABSENT' && !a.absence_reason && (
                          <span className="text-[10px] text-muted italic">no reason yet</span>
                        )}
                      </div>
                    </div>

                    {overrideStudent === a.id && isAdmin && (
                      <div className={`px-4 pt-2 pb-3 bg-page ${i === students.length - 1 ? '' : 'border-b border-border'}`}>
                        <div className="text-[10px] text-muted mb-2 uppercase tracking-wider">Change status to:</div>
                        <div className="flex gap-1.5 flex-wrap">
                          {Object.entries(STATUS).filter(([key]) => key !== 'HOLIDAY').map(([key, cfg]) => {
                            const optCls = STATUS_CLASSES[key]
                            const isSel = a.status === key
                            return (
                              <button key={key}
                                onClick={() => handleOverride(a.id, key)}
                                className={`px-3.5 py-1.5 rounded-full text-xs cursor-pointer border ${
                                  isSel ? `${optCls.bg} ${optCls.text} ${optCls.border} font-medium` : 'bg-surface text-muted border-border font-normal opacity-80'
                                }`}>
                                {cfg.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Branch cards */}
          {summary.length === 0 ? (
            <div className="text-center text-muted text-[13px] p-8">No data yet for today</div>
          ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {summary.map(branch => {
            const color = BRANCH_COLORS[branch.branch] || 'var(--present)'
            const rate = branch.attendance_rate_pct || 0
            return (
              <div key={branch.branch} className="bg-surface border border-border rounded-xl p-4">
                <div className="flex justify-between items-start mb-2.5">
                  <div>
                    <div className="text-sm font-medium text-ink">{branch.branch}</div>
                    <div className="text-xs text-muted mt-0.5">{branch.total} students</div>
                  </div>
                  <div className="text-xl font-medium" style={{ color }}>{rate}%</div>
                </div>
                <div className="bg-border rounded h-1 mb-3 overflow-hidden">
                  <div className="h-full rounded transition-[width] duration-500 ease-in-out" style={{ width: `${rate}%`, background: color }} />
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { status: 'PRESENT', val: branch.present },
                    { status: 'LATE',    val: branch.late },
                    { status: 'ABSENT',  val: branch.absent },
                    { status: 'HOLIDAY', val: branch.holiday },
                  ].map(({ status, val }) => {
                    const cfg = STATUS[status]
                    const cls = STATUS_CLASSES[status]
                    const isActive = activeStatus === status && activeBranch === branch.branch
                    return (
                      <button key={status} onClick={() => handleStatusClick(status, branch.branch)}
                        className={`rounded-lg py-1.5 px-1 cursor-pointer transition-all duration-150 text-center border ${
                          isActive ? `${cls.bg} ${cls.border}` : 'bg-transparent border-transparent'
                        }`}>
                        <div className={`text-[15px] font-medium ${cls.text}`}>{val ?? 0}</div>
                        <div className="text-[9px] text-muted mt-0.5">{cfg.label}</div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
          </div>
          )}
        </div>
      )}
    </div>
  )
}
