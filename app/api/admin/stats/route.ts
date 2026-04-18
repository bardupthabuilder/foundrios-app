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

  const [tenantsResult, usersResult, leadsResult, trialResult] = await Promise.all([
    service.from('tenants').select('id', { count: 'exact', head: true }),
    service.from('tenant_users').select('id', { count: 'exact', head: true }),
    service.from('leads').select('id', { count: 'exact', head: true }),
    service.from('tenants').select('id', { count: 'exact', head: true }).eq('subscription_status', 'trial'),
  ])

  // Plan distribution
  const { data: planData } = await service.from('tenants').select('plan')
  const plans: Record<string, number> = { free: 0, pro: 0, scale: 0 }
  for (const t of (planData ?? []) as { plan: string | null }[]) {
    const plan = t.plan || 'free'
    plans[plan] = (plans[plan] || 0) + 1
  }

  return NextResponse.json({
    totalTenants: tenantsResult.count || 0,
    totalUsers: usersResult.count || 0,
    totalLeads: leadsResult.count || 0,
    trialTenants: trialResult.count || 0,
    planDistribution: plans,
  })
}
