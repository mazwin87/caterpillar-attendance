import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const ALLOWED_ORIGINS = new Set(['https://nimonimo.tech', 'http://localhost:3002', 'http://localhost:3000'])

function corsHeaders(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://nimonimo.tech'
  return {
    'Access-Control-Allow-Origin':  allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

function json(body: object, status = 200, origin: string | null = null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  })
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('Origin')
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(origin) })

  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!jwt) return json({ error: 'Unauthorized' }, 401, origin)

  const admin = createClient(SUPABASE_URL, SERVICE_KEY)

  const { data: { user: caller }, error: jwtErr } = await admin.auth.getUser(jwt)
  if (jwtErr || !caller) return json({ error: 'Unauthorized' }, 401, origin)

  const { data: callerProfile } = await admin
    .from('app_users').select('role, branch_id').eq('id', caller.id).single()
  if (!callerProfile || !['admin', 'superadmin'].includes(callerProfile.role))
    return json({ error: 'Unauthorized' }, 401, origin)

  const { target_user_id, new_password } = await req.json()
  if (!target_user_id || !new_password) return json({ error: 'Missing fields' }, 400, origin)

  const { data: target } = await admin
    .from('app_users').select('role, branch_id').eq('id', target_user_id).single()
  if (!target) return json({ error: 'User not found' }, 404, origin)

  if (target.role === 'superadmin') return json({ error: 'Unauthorized' }, 401, origin)
  if (callerProfile.role === 'admin') {
    if (target.role !== 'teacher' || target.branch_id !== callerProfile.branch_id)
      return json({ error: 'Unauthorized' }, 401, origin)
  }

  const { error: pwErr } = await admin.auth.admin.updateUserById(target_user_id, { password: new_password })
  if (pwErr) return json({ error: pwErr.message }, 500, origin)

  await admin.from('app_users').update({ must_change_password: true }).eq('id', target_user_id)

  return json({ success: true }, 200, origin)
})
