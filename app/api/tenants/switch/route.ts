import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const body = await request.json()
  const { tenantId } = body

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId verplicht' }, { status: 400 })
  }

  // Try RPC first
  const { error: rpcError } = await (supabase as any).rpc('switch_tenant', {
    target_tenant_id: tenantId,
  })

  if (!rpcError) {
    return NextResponse.json({ success: true })
  }

  // Fallback: direct update if user has access
  const { data: access } = await supabase
    .from('tenant_users')
    .select('id')
    .eq('user_id', user.id)
    .eq('tenant_id', tenantId)
    .single()

  if (!access) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  // Deactivate all, activate target
  await supabase
    .from('tenant_users')
    .update({ is_active: false } as any)
    .eq('user_id', user.id)

  await supabase
    .from('tenant_users')
    .update({ is_active: true } as any)
    .eq('user_id', user.id)
    .eq('tenant_id', tenantId)

  return NextResponse.json({ success: true })
}
