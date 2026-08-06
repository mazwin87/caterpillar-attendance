import { supabase } from '../supabase'

const STUDENT_SELECT = '*, branches(name), parents(telegram_chat_id), date_of_birth, age_group'

export async function getStudents(branchId = null) {
  let query = supabase.from('students').select(STUDENT_SELECT).eq('is_active', true)
  if (branchId) query = query.eq('branch_id', branchId)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getBranches() {
  const { data, error } = await supabase.from('branches').select('*')
  if (error) throw error
  return data
}

export async function getTodayAttendanceMap() {
  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase.from('attendance').select('student_id, status').eq('date', today)
  return data || []
}

export async function generateStudentNo(branchId, branchSlug) {
  const { data } = await supabase
    .from('students').select('student_no')
    .eq('branch_id', branchId)
    .order('student_no', { ascending: false }).limit(1)
  let next = 1
  if (data && data.length > 0) {
    const num = parseInt(data[0].student_no.split('-').pop())
    if (!isNaN(num)) next = num + 1
  }
  return `${branchSlug.toUpperCase()}-${String(next).padStart(3, '0')}`
}

export async function addStudent({ name, student_no, branch_id, date_of_birth, monthly_fee, age_group }) {
  const { data, error } = await supabase
    .from('students')
    .insert({ name, student_no, branch_id, date_of_birth, monthly_fee: monthly_fee || 0, age_group: age_group || null })
    .select(STUDENT_SELECT)
    .single()
  if (error) throw error
  return data
}

export async function addParent({ student_id, name, phone, email }) {
  const { error } = await supabase.from('parents').insert({ student_id, name, phone, email })
  if (error) throw error
}

export async function updateStudent(studentId, { name, date_of_birth, monthly_fee, age_group }) {
  const { error } = await supabase
    .from('students')
    .update({ name, date_of_birth: date_of_birth || null, monthly_fee: parseFloat(monthly_fee) || 0, age_group: age_group || null })
    .eq('id', studentId)
  if (error) throw error
  const { data } = await supabase.from('students').select(STUDENT_SELECT).eq('id', studentId).single()
  return data
}

export async function deactivateStudent(studentId) {
  const { error } = await supabase.from('students').update({ is_active: false }).eq('id', studentId)
  if (error) throw error
}

export async function getBranchStudentsForPrint(branchId) {
  const { data, error } = await supabase
    .from('students').select('*, branches(name)')
    .eq('branch_id', branchId).eq('is_active', true).order('student_no')
  if (error) throw error
  return data || []
}
