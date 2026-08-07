import { supabase } from '../supabase'

export async function getReceiptById(id) {
  const { data, error } = await supabase.rpc('get_receipt_by_id', { p_id: id })
  if (error || !data) throw new Error('Receipt not found')
  return data
}
