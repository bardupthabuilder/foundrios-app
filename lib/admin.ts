import { createClient } from '@/lib/supabase/server'

export async function requireSuperadmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // Query via authenticated client (RLS allows reading own tenant_users)
  const { data: tenantUser } = await supabase
    .from('tenant_users')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const isSuperadmin = (tenantUser as Record<string, unknown>)?.is_superadmin === true

  if (!isSuperadmin) throw new Error('Not a superadmin')

  return { userId: user.id, tenantId: (tenantUser as Record<string, unknown>)?.tenant_id as string }
}
