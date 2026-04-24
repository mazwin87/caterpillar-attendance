import { useEffect, useState } from 'react'
import { getDailySummary, supabase } from '../lib/supabase'
import { MdOutlineAdminPanelSettings, MdOutlineSchool } from 'react-icons/md'

const BRANCH_COLORS = {
  'Caterpillar Playtime KL Traders':  '#2d7a4f',
  'Caterpillar Playtime Sentul':      '#9a6b1a',
  'Caterpillar Playtime Wangsa Maju': '#4a6fa5',
  'Caterpillar Playtime One Maxim':   '#7a4a8a',
}

const STATUS = {
  PRESENT: { color: 'var(--present)', bg: 'var(--present-bg)', label: 'Present' },
  LATE:    { color: 'var(--late)',    bg: 'var(--late-bg)',    label: 'Late' },
  ABSENT:  { color: 'var(--absent)',  bg: 'var(--absent-bg)',  label: 'Absent' },
  HOLIDAY: { color: 'var(--holiday)', bg: 'var(--holiday-bg)', label: 'Holiday' },
}

export default function Dashboard({ t, session, isAdmin }) {
  const [summary, setSummary]           = useState([])
  const [loading, setLoading]           = useState(true)
  const [activeStatus, setActiveStatus] = useState(null)
  const [activeBranch, setActiveBranch] = useState(null)
  const [students, setStudents]         = useState([])
  const [loadingStudents, setLoadingStudents] = useState(false)

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

    // Teachers can only see their branch
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

  // Add this state at the top of Dashboard component
  const [overrideStudent, setOverrideStudent] = useState(null)

  // Add this function
  async function handleOverride(attendanceId, newStatus) {
    const { error } = await supabase
      .from('attendance')
      .update({ status: newStatus })
      .eq('id', attendanceId)
    if (error) { alert(error.message); return }

    // Update local state
    setStudents(prev => prev.map(a =>
      a.id === attendanceId ? { ...a, status: newStatus } : a
    ))
    setOverrideStudent(null)

    // Refresh summary
    getDailySummary().then(setSummary)
  }

async function runManualAttendance() {
  if (!window.confirm('Mark all unscanned students as absent and send notifications?')) return

  const today = new Date().toISOString().split('T')[0]

  // Check if there's an event today
  const { data: todayEvent } = await supabase
    .from('events')
    .select('*')
    .eq('date', today)
    .single()

  if (todayEvent) {
    // Event mode — only mark absent for event branches + age groups
    const confirmed = window.confirm(
      `Event detected: "${todayEvent.name}"\n\nOnly students from selected branches and age groups will be marked absent. Continue?`
    )
    if (!confirmed) return

    // Get students matching event criteria
    const { data: allStudents } = await supabase
      .from('students')
      .select('id, branch_id, date_of_birth')
      .eq('is_active', true)
      .in('branch_id', todayEvent.branches)

    // Filter by age group
    const eligibleIds = allStudents
      ?.filter(s => {
        const group = getAgeGroup(s.date_of_birth)
        return group && todayEvent.age_groups.includes(group.label)
      })
      .map(s => s.id) || []

    if (eligibleIds.length === 0) {
      alert('No eligible students found for this event.')
      return
    }

    // Mark absent only eligible students with no scan today
    const { data: alreadyScanned } = await supabase
      .from('attendance')
      .select('student_id')
      .eq('date', today)
      .in('student_id', eligibleIds)

    const scannedIds = alreadyScanned?.map(a => a.student_id) || []
    const toMarkAbsent = eligibleIds.filter(id => !scannedIds.includes(id))

    if (toMarkAbsent.length > 0) {
      const absentRows = toMarkAbsent.map(studentId => {
        const student = allStudents.find(s => s.id === studentId)
        return { branch_id: student.branch_id, student_id: studentId, date: today, status: 'ABSENT' }
      })
      await supabase.from('attendance').insert(absentRows)
    }

    // Trigger notifications
    await fetch(`https://rykxrnhwvvlwlxdzjyub.supabase.co/functions/v1/notify_absent_parents`)
    alert(`Done! ${toMarkAbsent.length} students marked absent for "${todayEvent.name}".`)

  } else {
    // Normal mode — run full cron
    const { error } = await supabase.rpc('run_daily_absent_marking')
    if (error) { alert(error.message); return }
    alert('Done! Absent students marked and notifications sent.')
  }

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

  const s = (style) => ({ style })

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', paddingBottom: 200, overflowY: 'auto' }}>

      {/* Header */}
      <div style={{ background: 'var(--surface)', borderBottom: '0.5px solid var(--border)', padding: '52px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.08em', marginBottom: 4, textTransform: 'uppercase' }}>{today}</div>
            <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--text)' }}>Today's overview</div>
            {/* Session info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
              {session?.role === 'admin'
                ? <>
                    <MdOutlineAdminPanelSettings size={14} color='var(--present)' />
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--present)' }}>Admin</span>
                  </>
                : <>
                    <MdOutlineSchool size={14} color='var(--holiday)' />
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--holiday)' }}>
                      {session?.teacherName} · {session?.branches?.name?.replace('Caterpillar Playtime ', '')}
                    </span>
                  </>
              }
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <div style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: 'var(--present)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : (
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Status grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { status: 'PRESENT', val: totals.present },
              { status: 'LATE',    val: totals.late },
              { status: 'ABSENT',  val: totals.absent },
              { status: 'HOLIDAY', val: totals.holiday },
            ].map(({ status, val }) => {
              const cfg = STATUS[status]
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

          {/* Student list */}
          {activeStatus && (
            <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '0.5px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS[activeStatus].color }} />
                  <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>
                    {STATUS[activeStatus].label} {activeBranch ? `· ${activeBranch.replace('Caterpillar_', '')}` : '· All branches'}
                  </span>
                </div>
                <button onClick={() => { setActiveStatus(null); setActiveBranch(null); setStudents([]) }}
                  style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>×</button>
              </div>
              {loadingStudents ? (
                <div style={{ padding: 24, textAlign: 'center' }}>
                  <div style={{ width: 20, height: 20, border: '2px solid var(--border)', borderTopColor: STATUS[activeStatus].color, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
                </div>
              ) : students.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: 'var(--muted)' }}>No students</div>
              ) : students.map((a, i) => (
                  <div key={a.id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                      borderBottom: overrideStudent === a.id ? 'none' : i < students.length - 1 ? '0.5px solid var(--border)' : 'none',
                      cursor: 'pointer', background: overrideStudent === a.id ? 'var(--bg)' : 'transparent',
                    }}
                      onClick={() => isAdmin && setOverrideStudent(overrideStudent === a.id ? null : a.id)}>                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: STATUS[a.status]?.bg || STATUS[activeStatus].bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 500, color: STATUS[a.status]?.color || STATUS[activeStatus].color, flexShrink: 0 }}>
                        {a.students?.name?.charAt(0)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.students?.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{a.students?.student_no} · {a.students?.branches?.name?.replace('Caterpillar_', '')}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                        {/* Current status badge */}
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: STATUS[a.status]?.bg || STATUS[activeStatus].bg, color: STATUS[a.status]?.color || STATUS[activeStatus].color, fontWeight: 500 }}>
                          {a.status}
                        </span>
                        {a.scanned_at && (
                          <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                            {new Date(a.scanned_at).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                        {a.absence_reason && (
                          <span style={{ fontSize: 10, color: 'var(--absent)', textTransform: 'capitalize' }}>
                            {a.absence_reason.replace('_', ' ')}
                          </span>
                        )}
                        {activeStatus === 'ABSENT' && !a.absence_reason && (
                          <span style={{ fontSize: 10, color: 'var(--muted)', fontStyle: 'italic' }}>no reason yet</span>
                        )}
                      </div>
                    </div>

                    {/* Status override picker */}
                    {overrideStudent === a.id && isAdmin && (
                      <div style={{ padding: '8px 16px 12px', borderBottom: i < students.length - 1 ? '0.5px solid var(--border)' : 'none', background: 'var(--bg)' }}>
                        <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Change status to:</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {Object.entries(STATUS).filter(([key]) => key !== 'HOLIDAY').map(([key, cfg]) => (
                            <button key={key}
                              onClick={() => handleOverride(a.id, key)}
                              style={{
                                padding: '6px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                                background: a.status === key ? cfg.bg : 'var(--surface)',
                                color: a.status === key ? cfg.color : 'var(--muted)',
                                border: `0.5px solid ${a.status === key ? cfg.color : 'var(--border)'}`,
                                fontWeight: a.status === key ? 500 : 400,
                                opacity: a.status === key ? 1 : 0.8,
                              }}>
                              {cfg.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}

          {/* Branch cards */}
          {summary.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, padding: 32 }}>No data yet for today</div>
          ) : summary.map(branch => {
            const color = BRANCH_COLORS[branch.branch] || 'var(--present)'
            const rate = branch.attendance_rate_pct || 0
            return (
              <div key={branch.branch} style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{branch.branch}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{branch.total} students</div>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 500, color }}>{rate}%</div>
                </div>
                <div style={{ background: 'var(--border)', borderRadius: 4, height: 4, marginBottom: 12, overflow: 'hidden' }}>
                  <div style={{ width: `${rate}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.5s ease' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                  {[
                    { status: 'PRESENT', val: branch.present },
                    { status: 'LATE',    val: branch.late },
                    { status: 'ABSENT',  val: branch.absent },
                    { status: 'HOLIDAY', val: branch.holiday },
                  ].map(({ status, val }) => {
                    const cfg = STATUS[status]
                    const isActive = activeStatus === status && activeBranch === branch.branch
                    return (
                      <button key={status} onClick={() => handleStatusClick(status, branch.branch)}
                        style={{
                          background: isActive ? cfg.bg : 'transparent',
                          border: isActive ? `1px solid ${cfg.color}` : '1px solid transparent',
                          borderRadius: 8, padding: '6px 4px', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center',
                        }}>
                        <div style={{ fontSize: 15, fontWeight: 500, color: cfg.color }}>{val ?? 0}</div>
                        <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 1 }}>{cfg.label}</div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}