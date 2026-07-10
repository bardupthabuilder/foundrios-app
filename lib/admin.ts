import { createClient } from '@/lib/supabase/server'

export async function requireSuperadmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // Query via authenticated client (RLS allows reading own tenant_users)
  // User kan meerdere tenant-memberships hebben — pak de eerste superadmin-rij
  const { data: tenantUsers } = await supabase
    .from('tenant_users')
    .select('*')
    .eq('user_id', user.id)

  const rows = (tenantUsers ?? []) as Record<string, unknown>[]
  const adminRow = rows.find(r => r.is_superadmin === true)

  if (!adminRow) throw new Error('Not a superadmin')

  return { userId: user.id, tenantId: adminRow.tenant_id as string }
}
