import { supabase } from '../supabase'

export async function loginWithCredentials(username, password) {
  const { data, error } = await supabase
    .from('app_users')
    .select('*, branches(name, slug)')
    .eq('username', username.toLowerCase().trim())
    .eq('password', password)
    .single()
  if (error || !data) throw new Error('Incorrect username or password.')
  return data
}

export async function getUserRole(username) {
  const { data } = await supabase
    .from('app_users')
    .select('role')
    .eq('username', username.toLowerCase().trim())
    .single()
  return data?.role || null
}

export async function changeOwnPassword(userId, newPassword) {
  const { error } = await supabase
    .from('app_users')
    .update({ password: newPassword, must_change_password: false })
    .eq('id', userId)
  if (error) throw new Error('Failed to update password. Please try again.')
}

export async function adminResetPassword(userId, newPassword) {
  const { error } = await supabase
    .rpc('reset_user_password', { p_user_id: userId, p_new_password: newPassword, p_must_change: false })
  if (error) throw new Error(`Failed to reset: ${error.message}`)
}

export async function getUsers({ isSuperAdmin, branchId }) {
  let query = supabase
    .from('app_users')
    .select('id, username, role, branch_id, branches(name)')
    .neq('role', 'superadmin')
    .order('role', { ascending: true })
    .order('username', { ascending: true })

  if (!isSuperAdmin) {
    query = query.eq('role', 'teacher')
    if (branchId) query = query.eq('branch_id', branchId)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}
