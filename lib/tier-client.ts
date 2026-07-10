export type Tier = 'free' | 'pro' | 'scale'

export const TIER_FEATURES: Record<string, Tier> = {
  // Pro features
  automations: 'pro',
  auto_followup: 'pro',
  templates: 'pro',
  templates_custom: 'pro',
  sops_edit: 'pro',
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
  multi_location: 'scale',

  // Free baseline features
  quote_signing: 'free',
  sops_view: 'free',
  templates_view: 'free',

  // Playbook Library
  playbooks_browse: 'free',          // alle tiers zien de bibliotheek + categorieën
  playbooks_full_access: 'pro',      // Pro+ ziet volledige steps, prompts, checklists
  growth_unlock: 'scale',            // Scale-only: meta-ads/growzy/creatives/copy playbooks

  // Managed-by-GM upsell
  managed_request: 'free',           // alle tiers mogen een aanvraag indienen
}

export const TIER_ORDER: Record<Tier, number> = { free: 0, pro: 1, scale: 2 }

export const TIER_LABELS: Record<Tier, string> = {
  free: 'Free',
  pro: 'Pro',
  scale: 'Scale',
}

export function tierAtLeast(current: string | null | undefined, required: Tier): boolean {
  const c = (current || 'free') as Tier
  return (TIER_ORDER[c] ?? 0) >= TIER_ORDER[required]
}

export function getRequiredTier(feature: string): Tier {
  return TIER_FEATURES[feature] || 'free'
}
