import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANON_KEY       = Deno.env.get('SUPABASE_ANON_KEY')!

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ ok: false, error: 'missing_auth' }, 401)

  const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user: caller }, error: callerErr } = await callerClient.auth.getUser()
  if (callerErr || !caller) return json({ ok: false, error: 'invalid_session' }, 401)

  const { target_user_id, new_password } = await req.json()
  if (!target_user_id || !new_password) return json({ ok: false, error: 'missing_fields' }, 400)
  if (String(new_password).length < 6) return json({ ok: false, error: 'weak_password' }, 400)

  const admin = createClient(SUPABASE_URL, SERVICE_KEY)

  const { data: target } = await admin
    .from('user_branch_roles')
    .select('role, branch_id, kindergarten_id')
    .eq('user_id', target_user_id)
    .maybeSingle()
  if (!target) return json({ ok: false, error: 'target_not_found' }, 404)

  const { data: isPlatformAdmin } = await callerClient.rpc('is_platform_admin')
  const { data: callerRoles } = await callerClient
    .from('user_branch_roles')
    .select('role, branch_id, kindergarten_id')
    .eq('user_id', caller.id)

  const superAdminKindergartens = (callerRoles || []).filter(r => r.role === 'super_admin').map(r => r.kindergarten_id)
  const branchAdminBranches     = (callerRoles || []).filter(r => r.role === 'branch_admin').map(r => r.branch_id)

  const authorized =
    caller.id === target_user_id ||
    !!isPlatformAdmin ||
    superAdminKindergartens.includes(target.kindergarten_id) ||
    (target.role === 'teacher' && branchAdminBranches.includes(target.branch_id))

  if (!authorized) return json({ ok: false, error: 'forbidden' }, 403)

  const { error: updateErr } = await admin.auth.admin.updateUserById(target_user_id, { password: new_password })
  if (updateErr) return json({ ok: false, error: updateErr.message }, 400)

  await admin.from('app_users').update({ must_change_password: true }).eq('auth_user_id', target_user_id)

  return json({ ok: true })
})
