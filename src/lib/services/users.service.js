import { supabase } from '../supabase'

export async function loginWithCredentials(username, password) {
  const u = username.toLowerCase().trim()

  const { data, error } = await supabase.auth.signInWithPassword({
    email:    u + '@cpcc.internal',
    password,
  })
  if (error || !data.user) throw new Error('Incorrect username or password.')

  const { data: profile, error: profileErr } = await supabase.rpc('get_my_profile')
  if (profileErr || !profile) throw new Error('Could not load user profile.')

  return {
    id:                   data.user.id,
    username:             u,
    role:                 profile.role,
    branch_id:            profile.branch_id,
    branches:             profile.branches,
    must_change_password: profile.must_change_password,
  }
}

export async function getUserRole(username) {
  const { data } = await supabase
    .from('app_users')
    .select('role')
    .eq('username', username.toLowerCase().trim())
    .single()
  return data?.role || null
}

export async function adminResetPassword(callerId, userId, newPassword) {
  const { error } = await supabase
    .rpc('reset_user_password', { p_caller_id: callerId, p_user_id: userId, p_new_password: newPassword, p_must_change: true })
  if (error) throw new Error(`Failed to reset: ${error.message}`)
}

export async function getUsers() {
  const { data, error } = await supabase.rpc('get_users_for_admin')
  if (error) throw error
  return data || []
}
