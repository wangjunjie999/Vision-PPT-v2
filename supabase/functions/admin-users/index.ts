import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    // Verify caller identity
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token)
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }
    const callerId = claimsData.claims.sub

    // Check admin role using service client
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: roleCheck } = await serviceClient
      .from('user_roles')
      .select('role')
      .eq('user_id', callerId)
      .eq('role', 'admin')
      .maybeSingle()

    if (!roleCheck) {
      return new Response(JSON.stringify({ error: 'Forbidden: admin role required' }), { status: 403, headers: corsHeaders })
    }

    if (req.method === 'GET') {
      // List all users with their roles
      const { data: { users }, error: usersError } = await serviceClient.auth.admin.listUsers({ perPage: 1000 })
      if (usersError) throw usersError

      const { data: roles } = await serviceClient.from('user_roles').select('*')

      const userList = users.map(u => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        roles: (roles || []).filter(r => r.user_id === u.id).map(r => r.role),
      }))

      return new Response(JSON.stringify({ users: userList }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (req.method === 'POST') {
      const { user_id, role, action } = await req.json()

      if (!user_id || !role || !action) {
        return new Response(JSON.stringify({ error: 'Missing user_id, role, or action' }), { status: 400, headers: corsHeaders })
      }

      // Prevent removing own admin role
      if (action === 'remove' && user_id === callerId && role === 'admin') {
        return new Response(JSON.stringify({ error: 'Cannot remove your own admin role' }), { status: 400, headers: corsHeaders })
      }

      if (action === 'add') {
        const { error } = await serviceClient.from('user_roles').upsert(
          { user_id, role },
          { onConflict: 'user_id,role' }
        )
        if (error) throw error
      } else if (action === 'remove') {
        const { error } = await serviceClient
          .from('user_roles')
          .delete()
          .eq('user_id', user_id)
          .eq('role', role)
        if (error) throw error
      } else {
        return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: corsHeaders })
      }

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: corsHeaders })
  }
})
