import { NextResponse } from 'next/server'
import { requireSuperadmin } from '@/lib/admin'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    await requireSuperadmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = createServiceClient() as any

  const { data: tenants } = await service
    .from('tenants')
    .select('id, name, slug, plan, subscription_status, trial_ends_at, created_at')
    .order('created_at', { ascending: false })

  // Get user counts per tenant
  const { data: userCounts } = await service
    .from('tenant_users')
    .select('tenant_id')

  const countMap: Record<string, number> = {}
  for (const u of (userCounts ?? []) as { tenant_id: string }[]) {
    countMap[u.tenant_id] = (countMap[u.tenant_id] || 0) + 1
  }

  return NextResponse.json({
    tenants: ((tenants ?? []) as Record<string, unknown>[]).map(t => ({
      ...t,
      user_count: countMap[t.id as string] || 0,
    }))
  })
}
