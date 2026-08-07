import { supabase, getDailySummary } from '../supabase'
import { getAgeGroup } from '../constants/ageGroups'

export { getDailySummary }

export async function getDrilldown(status, branchName, session) {
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
  return data || []
}

export async function overrideStatus(attendanceId, newStatus) {
  const { error } = await supabase
    .from('attendance')
    .update({ status: newStatus })
    .eq('id', attendanceId)
  if (error) throw new Error(error.message)
}

export async function getTodayEvent() {
  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('events')
    .select('*')
    .eq('date', today)
    .single()
  return data || null
}

export async function markAbsentForEvent(todayEvent, callerId) {
  const today = new Date().toISOString().split('T')[0]

  const { data: allStudents } = await supabase
    .from('students')
    .select('id, branch_id, date_of_birth')
    .eq('is_active', true)
    .in('branch_id', todayEvent.branches)

  const eligibleIds = allStudents
    ?.filter(s => {
      const group = getAgeGroup(s.date_of_birth)
      return group && todayEvent.age_groups.includes(group.label)
    })
    .map(s => s.id) || []

  if (eligibleIds.length === 0) return { count: 0 }

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

  await fetch('https://rykxrnhwvvlwlxdzjyub.supabase.co/functions/v1/notify_absent_parents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ caller_id: callerId }),
  })
  return { count: toMarkAbsent.length }
}

export async function markAllAbsent(callerId) {
  const { error } = await supabase.rpc('run_daily_absent_marking', { p_caller_id: callerId })
  if (error) throw new Error(error.message)
}
