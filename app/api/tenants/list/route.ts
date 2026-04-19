import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  // Try RPC first
  const { data, error } = await (supabase as any).rpc('list_my_tenants')

  if (!error && data && data.length > 0) {
    return NextResponse.json({ tenants: data })
  }

  // Fallback: direct query for user's own tenants
  const { data: tenantUsers } = await supabase
    .from('tenant_users')
    .select('tenant_id, role, is_active')
    .eq('user_id', user.id)

  if (!tenantUsers || tenantUsers.length === 0) {
    return NextResponse.json({ tenants: [] })
  }

  // Get tenant names
  const tenantIds = tenantUsers.map(tu => tu.tenant_id)
  const { data: tenants } = await supabase
    .from('tenants')
    .select('id, name')
    .in('id', tenantIds)

  const result = tenantUsers.map(tu => {
    const tenant = (tenants ?? []).find((t: any) => t.id === tu.tenant_id)
    return {
      tenant_id: tu.tenant_id,
      tenant_name: tenant?.name || 'Onbekend',
      role: tu.role,
      is_active: (tu as any).is_active ?? true,
    }
  })

  return NextResponse.json({ tenants: result })
}
