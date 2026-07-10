import { NextResponse } from 'next/server'
import { checkFeature } from '@/lib/tier'
import type { Tier } from '@/lib/tier-client'

export type FeatureCheckResult =
  | { ok: true; tenantId: string; currentTier: Tier; requiredTier: Tier }
  | { ok: false; response: NextResponse }

export async function requireFeature(feature: string): Promise<FeatureCheckResult> {
  try {
    const { allowed, currentTier, requiredTier } = await checkFeature(feature)
    if (!allowed) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            error: 'Upgrade vereist',
            feature,
            requiredTier,
            currentTier,
            upgradeUrl: '/dashboard/billing/upgrade',
          },
          { status: 403 }
        ),
      }
    }
    const { requireTenant } = await import('@/lib/tenant')
    const { tenantId } = await requireTenant()
    return { ok: true, tenantId, currentTier, requiredTier }
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 }),
    }
  }
}
