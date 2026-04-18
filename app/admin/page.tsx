import { requireSuperadmin } from '@/lib/admin'
import { createServiceClient } from '@/lib/supabase/server'

export default async function AdminDashboard() {
  await requireSuperadmin()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = createServiceClient() as any

  const [tenantsResult, usersResult, leadsResult] = await Promise.all([
    service.from('tenants').select('id, name, plan, subscription_status, created_at').order('created_at', { ascending: false }),
    service.from('tenant_users').select('id', { count: 'exact', head: true }),
    service.from('leads').select('id', { count: 'exact', head: true }),
  ])

  const tenants = (tenantsResult.data ?? []) as { id: string; name: string; plan: string | null; subscription_status: string; created_at: string }[]
  const plans: Record<string, number> = { free: 0, pro: 0, scale: 0 }
  for (const t of tenants) {
    const plan = t.plan || 'free'
    plans[plan] = (plans[plan] || 0) + 1
  }

  return (
    <div className="max-w-5xl space-y-8">
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-white">Admin Dashboard</h1>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-white/5 bg-foundri-deep p-4">
          <p className="text-sm text-zinc-400">Bedrijven</p>
          <p className="text-3xl font-bold text-foundri-yellow">{tenants.length}</p>
        </div>
        <div className="rounded-lg border border-white/5 bg-foundri-deep p-4">
          <p className="text-sm text-zinc-400">Gebruikers</p>
          <p className="text-3xl font-bold text-white">{usersResult.count || 0}</p>
        </div>
        <div className="rounded-lg border border-white/5 bg-foundri-deep p-4">
          <p className="text-sm text-zinc-400">Leads (totaal)</p>
          <p className="text-3xl font-bold text-white">{leadsResult.count || 0}</p>
        </div>
        <div className="rounded-lg border border-white/5 bg-foundri-deep p-4">
          <p className="text-sm text-zinc-400">Pro / Scale</p>
          <p className="text-3xl font-bold text-white">{plans.pro} / {plans.scale}</p>
        </div>
      </div>

      {/* Recent tenants */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-white">Recente bedrijven</h2>
        <div className="rounded-lg border border-white/5 bg-foundri-deep">
          {tenants.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-zinc-500">Nog geen bedrijven</p>
          )}
          {tenants.slice(0, 10).map((t) => (
            <div key={t.id} className="flex items-center justify-between border-b border-white/5 px-4 py-3 last:border-0">
              <div>
                <p className="text-sm font-medium text-white">{t.name}</p>
                <p className="text-xs text-zinc-500">{new Date(t.created_at).toLocaleDateString('nl-NL')}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs ${
                  t.plan === 'scale' ? 'bg-foundri-yellow/20 text-foundri-yellow' :
                  t.plan === 'pro' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-white/10 text-zinc-400'
                }`}>{t.plan || 'free'}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${
                  t.subscription_status === 'active' ? 'bg-green-500/20 text-green-400' :
                  t.subscription_status === 'trial' ? 'bg-orange-500/20 text-orange-400' :
                  'bg-red-500/20 text-red-400'
                }`}>{t.subscription_status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
