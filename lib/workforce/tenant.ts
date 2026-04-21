import { createClient } from '@/lib/supabase/server'
import { createWorkforceServiceClient } from '@/lib/workforce/supabase'

/**
 * Haalt de fw_tenant_id op voor de ingelogde Workforce gebruiker.
 */
export async function requireWorkforceTenant(): Promise<{ tenantId: string; userId: string }> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Niet ingelogd')
  }

  const serviceClient = createWorkforceServiceClient()

  const { data: tenantUser, error: tenantError } = await serviceClient
    .from('fw_tenant_users')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single()

  if (tenantError || !tenantUser) {
    throw new Error('Geen Workforce tenant gevonden voor deze gebruiker')
  }

  return { tenantId: tenantUser.tenant_id, userId: user.id }
}

/**
 * Maakt een nieuwe Workforce tenant aan en koppelt de gebruiker eraan.
 */
export async function createWorkforceTenant(params: {
  userId: string
  companyName: string
  niche?: string
  region?: string
}): Promise<string> {
  const supabase = createWorkforceServiceClient()

  const baseSlug = params.companyName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  let slug = baseSlug
  let tenant: { id: string } | null = null

  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await supabase
      .from('fw_tenants')
      .insert({
        name: params.companyName,
        slug,
        niche: params.niche || null,
        region: params.region || null,
      })
      .select('id')
      .single()

    if (!error && data) {
      tenant = data
      break
    }

    if (error?.code === '23505' && error.message.includes('slug')) {
      slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`
      continue
    }

    throw new Error(`Kon Workforce tenant niet aanmaken: ${error?.message}`)
  }

  if (!tenant) {
    throw new Error('Kon unieke slug genereren — probeer opnieuw')
  }

  const { error: linkError } = await supabase.from('fw_tenant_users').insert({
    tenant_id: tenant.id,
    user_id: params.userId,
    role: 'owner',
  })

  if (linkError) {
    throw new Error(`Kon gebruiker niet koppelen aan Workforce tenant: ${linkError.message}`)
  }

  return tenant.id
}
