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

  // Een gebruiker kan bij meerdere bedrijven horen (zie TenantSwitcher).
  // `.single()` gooide dan een fout — "meerdere rijen" — en de gebruiker werd
  // eindeloos naar onboarding gestuurd. De actieve tenant staat in `is_active`.
  //
  // `is_active` staat nog niet in de gegenereerde types; vandaar de losse client.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tenantUser, error: tenantError } = await (supabase as any)
    .from('tenant_users')
    .select('tenant_id, is_active')
    .eq('user_id', user.id)
    .order('is_active', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()

  if (tenantError || !tenantUser) {
    throw new Error('Geen tenant gevonden voor deze gebruiker')
  }

  return { tenantId: (tenantUser as { tenant_id: string }).tenant_id, userId: user.id }
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
