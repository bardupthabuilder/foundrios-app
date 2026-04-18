import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'

const TIER_FEATURES: Record<string, string> = {
  // Pro features
  automations: 'pro',
  auto_followup: 'pro',
  templates: 'pro',
  lead_scoring: 'pro',
  maintenance_contracts: 'pro',
  content_ai: 'pro',
  export: 'pro',
  payment_reminders: 'pro',

  // Scale features
  intelligence: 'scale',
  ai_assistants: 'scale',
  benchmarks: 'scale',
  predictions: 'scale',
  multi_user: 'scale',
  advanced_workflows: 'scale',
}

const TIER_ORDER = { free: 0, pro: 1, scale: 2 }

export async function checkFeature(feature: string): Promise<{ allowed: boolean; requiredTier: string; currentTier: string }> {
  const { tenantId } = await requireTenant()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any

  const { data: tenant } = await supabase
    .from('tenants')
    .select('plan')
    .eq('id', tenantId)
    .single()

  const currentTier = tenant?.plan || 'free'
  const requiredTier = TIER_FEATURES[feature] || 'free'

  const allowed = (TIER_ORDER[currentTier as keyof typeof TIER_ORDER] || 0) >= (TIER_ORDER[requiredTier as keyof typeof TIER_ORDER] || 0)

  return { allowed, requiredTier, currentTier }
}

export { TIER_FEATURES, TIER_ORDER }
