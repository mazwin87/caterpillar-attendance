import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = 'https://rykxrnhwvvlwlxdzjyub.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5a3hybmh3dnZsd2x4ZHpqeXViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNjQxMTQsImV4cCI6MjA5MDk0MDExNH0.9urNPdet6Ja5yr4C74CX0PI15g8i0TPqh1TSrCfpuFw'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)

// Record a QR scan — calls the DB function directly
export async function recordScan(studentId) {
  const { data, error } = await supabase.rpc('record_scan', {
    p_student_id: studentId,
  })
  if (error) return { success: false, error: error.message }
  return data
}

// Get attendance summary for today per branch
export async function getDailySummary() {
  const today = new Date().toISOString().split('T')[0]

  const [{ data: branches }, { data: summary }] = await Promise.all([
    supabase.from('branches').select('name'),
    supabase.from('daily_branch_summary').select('*').eq('date', today),
  ])

  return (branches || []).map(b => {
    const found = (summary || []).find(d => d.branch === b.name)
    return found || {
      branch: b.name,
      date: today,
      total: 0,
      present: 0,
      late: 0,
      absent: 0,
      holiday: 0,
      attendance_rate_pct: 0,
    }
  })
}

// Get all branches
export async function getBranches() {
  const { data, error } = await supabase.from('branches').select('*')
  if (error) throw error
  return data
}

export async function getStudents(branchId) {
  let query = supabase
    .from('students')
    .select('*, branches(name), parents(telegram_chat_id), date_of_birth, age_group')
    .eq('is_active', true)
  if (branchId) query = query.eq('branch_id', branchId)
  const { data, error } = await query
  if (error) throw error
  return data
}

// Get today's attendance for a branch
export async function getTodayAttendance(branchId) {
  const today = new Date().toISOString().split('T')[0]
  let query = supabase
    .from('attendance')
    .select('*, students(name, student_no)')
    .eq('date', today)
  if (branchId) query = query.eq('branch_id', branchId)
  const { data, error } = await query
  if (error) throw error
  return data
}

// Add a student
export async function addStudent({ name, student_no, branch_id, class_id, date_of_birth, monthly_fee, age_group }) {
  const { data, error } = await supabase
    .from('students')
    .insert({ name, student_no, branch_id, class_id, date_of_birth, monthly_fee: monthly_fee || 0, age_group: age_group || null })
    .select()
    .single()
  if (error) throw error
  return data
}

// Add holiday
export async function addHoliday({ student_id, branch_id, start_date, end_date, reason }) {
  const { data, error } = await supabase
    .from('holidays')
    .insert({ student_id, branch_id, start_date, end_date, reason })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getPayments() {
  const { data, error } = await supabase.rpc('get_payments')
  if (error) throw error
  return data
}

export async function createPayment({ student_id, branch_id, amount, month, year, paid_date, payment_method, notes, issued_by }) {
  const { data, error } = await supabase.rpc('create_payment', {
    p_student_id:     student_id,
    p_branch_id:      branch_id,
    p_amount:         amount,
    p_month:          month,
    p_year:           year,
    p_paid_date:      paid_date,
    p_payment_method: payment_method,
    p_notes:          notes || null,
    p_issued_by:      issued_by,
  })
  if (error) throw error
  return data
}