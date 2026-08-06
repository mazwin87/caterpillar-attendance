import { supabase } from '../supabase'

export async function getHolidays() {
  const { data, error } = await supabase
    .from('holidays')
    .select('*, students(name, student_no), branches(name)')
    .order('start_date', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getClosures() {
  const { data, error } = await supabase
    .from('school_calendar')
    .select('*')
    .eq('is_off_day', true)
    .order('date', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createHoliday({ student_id, branch_id, start_date, end_date, reason }) {
  const { data: inserted, error } = await supabase
    .from('holidays')
    .insert({ student_id, branch_id, start_date, end_date, reason })
    .select()
    .single()
  if (error) throw error

  const { data, error: fetchErr } = await supabase
    .from('holidays')
    .select('*, students(name, student_no), branches(name)')
    .eq('id', inserted.id)
    .single()
  if (fetchErr) throw fetchErr
  return data
}

export async function deleteHoliday(id) {
  const { error } = await supabase.from('holidays').delete().eq('id', id)
  if (error) throw error
}

export async function createClosure({ date, end_date, label }) {
  const { data, error } = await supabase
    .from('school_calendar')
    .insert({ date, end_date: end_date || date, label, is_off_day: true, branch_id: null })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteClosure(id) {
  const { error } = await supabase.from('school_calendar').delete().eq('id', id)
  if (error) throw error
}

export async function deletePastClosures(ids) {
  if (!ids.length) return
  const { error } = await supabase.from('school_calendar').delete().in('id', ids)
  if (error) throw error
}
