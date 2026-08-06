import { supabase } from '../supabase'

export async function getAttendanceRange(startDate, endDate, branchId = null) {
  let query = supabase
    .from('attendance')
    .select('*, absence_reason, students(name, student_no, branches(name), classes(name))')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false })
    .order('status', { ascending: true })

  if (branchId) query = query.eq('branch_id', branchId)

  const { data, error } = await query
  if (error) throw error
  return data || []
}
