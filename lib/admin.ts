import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function requireSuperadmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // Use service client to bypass RLS for admin check
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = createServiceClient() as any

  const { data: tenantUser } = await service
    .from('tenant_users')
    .select('is_superadmin')
    .eq('user_id', user.id)
    .eq('is_superadmin', true)
    .single()

  if (!tenantUser) throw new Error('Not a superadmin')

  return { userId: user.id }
}
