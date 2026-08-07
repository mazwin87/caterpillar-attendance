import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const CORS = {
  'Access-Control-Allow-Origin':  'https://nimonimo.tech',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!jwt) return json({ error: 'Unauthorized' }, 401)

  const admin = createClient(SUPABASE_URL, SERVICE_KEY)

  const { data: { user: caller }, error: jwtErr } = await admin.auth.getUser(jwt)
  if (jwtErr || !caller) return json({ error: 'Unauthorized' }, 401)

  const { data: callerProfile } = await admin
    .from('app_users').select('role, branch_id').eq('id', caller.id).single()
  if (!callerProfile || !['admin', 'superadmin'].includes(callerProfile.role))
    return json({ error: 'Unauthorized' }, 401)

  const { target_user_id, new_password } = await req.json()
  if (!target_user_id || !new_password) return json({ error: 'Missing fields' }, 400)

  const { data: target } = await admin
    .from('app_users').select('role, branch_id').eq('id', target_user_id).single()
  if (!target) return json({ error: 'User not found' }, 404)

  if (target.role === 'superadmin') return json({ error: 'Unauthorized' }, 401)
  if (callerProfile.role === 'admin') {
    if (target.role !== 'teacher' || target.branch_id !== callerProfile.branch_id)
      return json({ error: 'Unauthorized' }, 401)
  }

  const { error: pwErr } = await admin.auth.admin.updateUserById(target_user_id, { password: new_password })
  if (pwErr) return json({ error: pwErr.message }, 500)

  await admin.from('app_users').update({ must_change_password: true }).eq('id', target_user_id)

  return json({ success: true })
})
