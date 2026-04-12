import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// POST /api/tenant/invites/accept — accepteer een uitnodiging
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const body = await request.json()
  const token = body?.token?.trim()

  if (!token) {
    return NextResponse.json({ error: 'Token is verplicht' }, { status: 400 })
  }

  // Service client om RLS te bypassen
  const serviceClient = createServiceClient()

  // Zoek de invite
  const { data: invite, error: inviteError } = await serviceClient
    .from('tenant_invites' as any)
    .select('*')
    .eq('token', token)
    .eq('status', 'pending')
    .single()

  if (inviteError || !invite) {
    return NextResponse.json({ error: 'Uitnodiging niet gevonden of verlopen' }, { status: 404 })
  }

  const inv = invite as any

  // Check of niet verlopen
  if (new Date(inv.expires_at) < new Date()) {
    await serviceClient
      .from('tenant_invites' as any)
      .update({ status: 'expired' })
      .eq('id', inv.id)
    return NextResponse.json({ error: 'Uitnodiging is verlopen' }, { status: 410 })
  }

  // Check of user niet al gekoppeld is aan deze tenant
  const { data: existing } = await serviceClient
    .from('tenant_users')
    .select('id')
    .eq('tenant_id', inv.tenant_id)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    // Al gekoppeld — markeer invite als accepted
    await serviceClient
      .from('tenant_invites' as any)
      .update({ status: 'accepted' })
      .eq('id', inv.id)
    return NextResponse.json({ tenantId: inv.tenant_id, message: 'Al gekoppeld' })
  }

  // Koppel user aan tenant
  const { error: linkError } = await serviceClient.from('tenant_users').insert({
    tenant_id: inv.tenant_id,
    user_id: user.id,
    role: inv.role,
  })

  if (linkError) {
    return NextResponse.json({ error: `Kon niet koppelen: ${linkError.message}` }, { status: 500 })
  }

  // Markeer invite als accepted
  await serviceClient
    .from('tenant_invites' as any)
    .update({ status: 'accepted' })
    .eq('id', inv.id)

  return NextResponse.json({ tenantId: inv.tenant_id })
}
