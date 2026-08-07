import { supabase } from '../supabase'
import { getMYT } from '../utils/date'

export async function recordScan(studentId) {
  const { data, error } = await supabase.rpc('record_scan', { p_student_id: studentId })
  if (error) return { success: false, error: error.message }
  return data
}

// Returns false if student not found OR branch doesn't match.
export async function verifyStudentBranch(studentId, branchId) {
  const { data } = await supabase.from('students').select('branch_id').eq('id', studentId).single()
  return data?.branch_id === branchId
}

export async function getTodayCounts(branchId) {
  const today = getMYT()
  const { data } = await supabase
    .from('attendance')
    .select('status, student_id, students!inner(branch_id)')
    .eq('date', today)
  if (!data) return { present: 0, late: 0, todayMap: {} }
  const filtered = branchId ? data.filter(a => a.students?.branch_id === branchId) : data
  return {
    present:  filtered.filter(a => a.status === 'PRESENT').length,
    late:     filtered.filter(a => a.status === 'LATE').length,
    todayMap: Object.fromEntries(data.map(a => [a.student_id, a.status])),
  }
}

export async function getStudentsForBranch(branchId) {
  let query = supabase.from('students').select('*, branches(name)').eq('is_active', true).order('name')
  if (branchId) query = query.eq('branch_id', branchId)
  const { data } = await query
  return data || []
}

export async function upsertAttendance(student, status) {
  const today = getMYT()
  const { data: existing, error: selectError } = await supabase
    .from('attendance')
    .select('id')
    .eq('student_id', student.id)
    .eq('date', today)
    .maybeSingle()
  if (selectError) throw new Error(`Lookup failed: ${selectError.message}`)
  if (existing) {
    const { error } = await supabase.from('attendance').update({ status }).eq('id', existing.id)
    if (error) throw new Error(`Update failed: ${error.message}`)
  } else {
    const { error } = await supabase.from('attendance').insert({
      student_id: student.id, branch_id: student.branch_id,
      date: today, status, scanned_at: new Date().toISOString(),
    })
    if (error) throw new Error(`Insert failed: ${error.message}`)
  }
}

export async function runAbsentMarking(callerId) {
  await supabase.rpc('run_daily_absent_marking', { p_caller_id: callerId })
  await supabase.functions.invoke('notify_absent_parents', { body: { caller_id: callerId } })
}

export async function getScannerBranches() {
  const { data } = await supabase.from('branches').select('id, name, slug').order('name')
  return data || []
}
