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

  const { username, password, role, branch_id, kindergarten_id } = await req.json()

  if (!username || !password || !role || !kindergarten_id) {
    return json({ ok: false, error: 'missing_fields' }, 400)
  }
  if (!['super_admin', 'branch_admin', 'teacher'].includes(role)) {
    return json({ ok: false, error: 'invalid_role' }, 400)
  }
  if ((role === 'branch_admin' || role === 'teacher') && !branch_id) {
    return json({ ok: false, error: 'branch_id_required' }, 400)
  }
  if (String(password).length < 6) {
    return json({ ok: false, error: 'weak_password' }, 400)
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY)

  const { data: isPlatformAdmin } = await callerClient.rpc('is_platform_admin')
  const { data: callerRoles } = await callerClient
    .from('user_branch_roles')
    .select('role, branch_id, kindergarten_id')
    .eq('user_id', caller.id)

  const superAdminKindergartens = (callerRoles || []).filter(r => r.role === 'super_admin').map(r => r.kindergarten_id)
  const branchAdminBranches     = (callerRoles || []).filter(r => r.role === 'branch_admin').map(r => r.branch_id)

  let authorized = false
  if (role === 'super_admin') {
    authorized = !!isPlatformAdmin
  } else if (role === 'branch_admin') {
    authorized = !!isPlatformAdmin || superAdminKindergartens.includes(kindergarten_id)
  } else if (role === 'teacher') {
    authorized = !!isPlatformAdmin || superAdminKindergartens.includes(kindergarten_id) || branchAdminBranches.includes(branch_id)
  }

  if (!authorized) return json({ ok: false, error: 'forbidden' }, 403)

  if (branch_id) {
    const { data: branch } = await admin
      .from('branches').select('id').eq('id', branch_id).eq('kindergarten_id', kindergarten_id).maybeSingle()
    if (!branch) return json({ ok: false, error: 'branch_kindergarten_mismatch' }, 400)
  }

  const { data: kg } = await admin.from('kindergartens').select('slug').eq('id', kindergarten_id).maybeSingle()
  if (!kg) return json({ ok: false, error: 'kindergarten_not_found' }, 404)

  const cleanUsername = String(username).toLowerCase().trim()
  const email = `${cleanUsername}@${kg.slug}.internal`

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
  })
  if (createErr || !created?.user) {
    return json({ ok: false, error: createErr?.message || 'create_failed' }, 400)
  }

  const legacyRole = role === 'super_admin' ? 'superadmin' : role === 'branch_admin' ? 'admin' : 'teacher'

  const { error: profileErr } = await admin.from('app_users').insert({
    username: cleanUsername,
    email,
    auth_user_id: created.user.id,
    role: legacyRole,
    branch_id: branch_id || null,
    kindergarten_id,
    must_change_password: true,
    password: 'managed_by_supabase_auth',
  })
  if (profileErr) {
    await admin.auth.admin.deleteUser(created.user.id)
    return json({ ok: false, error: profileErr.message }, 400)
  }

  const { error: roleErr } = await admin.from('user_branch_roles').insert({
    user_id: created.user.id, branch_id: branch_id || null, role, kindergarten_id,
  })
  if (roleErr) {
    await admin.auth.admin.deleteUser(created.user.id)
    return json({ ok: false, error: roleErr.message }, 400)
  }

  return json({ ok: true, username: cleanUsername, email, user_id: created.user.id })
})
