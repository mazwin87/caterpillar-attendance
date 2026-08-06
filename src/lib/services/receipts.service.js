import { supabase } from '../supabase'

export async function getReceiptById(id) {
  const { data, error } = await supabase
    .from('payments')
    .select('*, students(name, student_no, branches(name, address, phone, email, website, reg_no))')
    .eq('id', id)
    .single()
  if (error || !data) throw new Error('Receipt not found')
  return data
}
