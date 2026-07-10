import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { TIER_FEATURES, TIER_ORDER, getRequiredTier, type Tier } from '@/lib/tier-client'

export async function checkFeature(feature: string): Promise<{ allowed: boolean; requiredTier: Tier; currentTier: Tier }> {
  const { tenantId } = await requireTenant()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any

  const { data: tenant } = await supabase
    .from('tenants')
    .select('plan')
    .eq('id', tenantId)
    .single()

  const currentTier = (tenant?.plan || 'free') as Tier
  const requiredTier = getRequiredTier(feature)

  const allowed = (TIER_ORDER[currentTier] || 0) >= (TIER_ORDER[requiredTier] || 0)

  return { allowed, requiredTier, currentTier }
}

export { TIER_FEATURES, TIER_ORDER }
