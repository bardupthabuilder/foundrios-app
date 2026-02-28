import { createClient, createServiceClient } from '@/lib/supabase/server'

/**
 * Haalt de tenant_id op voor de ingelogde gebruiker.
 * Gooit een error als de gebruiker niet ingelogd is of geen tenant heeft.
 */
export async function requireTenant(): Promise<{ tenantId: string; userId: string }> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Niet ingelogd')
  }

  const { data: tenantUser, error: tenantError } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single()

  if (tenantError || !tenantUser) {
    throw new Error('Geen tenant gevonden voor deze gebruiker')
  }

  return { tenantId: tenantUser.tenant_id, userId: user.id }
}

/**
 * Maakt een nieuwe tenant aan en koppelt de gebruiker eraan.
 */
export async function createTenant(params: {
  userId: string
  companyName: string
}): Promise<string> {
  // Service role client — RLS bypassen voor tenant aanmaken
  const supabase = createServiceClient()

  const slug = params.companyName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .insert({ name: params.companyName, slug })
    .select('id')
    .single()

  if (tenantError || !tenant) {
    throw new Error(`Kon tenant niet aanmaken: ${tenantError?.message}`)
  }

  const { error: linkError } = await supabase.from('tenant_users').insert({
    tenant_id: tenant.id,
    user_id: params.userId,
    role: 'owner',
  })

  if (linkError) {
    throw new Error(`Kon gebruiker niet koppelen aan tenant: ${linkError.message}`)
  }

  return tenant.id
}
