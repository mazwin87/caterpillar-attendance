import { supabase, getBranches } from '../supabase'

export async function getEvents() {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createEvent({ name, date, branches, age_groups }) {
  const { data, error } = await supabase
    .from('events')
    .insert({ name, date, branches, age_groups })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteEvent(id) {
  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) throw error
}

export { getBranches }
