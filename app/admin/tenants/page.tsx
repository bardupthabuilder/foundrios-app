import { createServiceClient } from '@/lib/supabase/server'
import { requireSuperadmin } from '@/lib/admin'
import { redirect } from 'next/navigation'
import { Building2 } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import { DataTable } from '@/components/admin/DataTable'
import { StatusBadge, subscriptionVariant } from '@/components/admin/StatusBadge'
import { EmptyState } from '@/components/admin/EmptyState'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface Tenant {
  id: string
  name: string
  slug: string | null
  subscription_status: string
  trial_ends_at: string | null
  created_at: string
  user_count: number
  lead_count: number
  project_count: number
}

async function getTenants(filterStatus?: string): Promise<Tenant[]> {
  const sb = createServiceClient() as any

  let query = sb.from('tenants').select('id, name, slug, subscription_status, trial_ends_at, created_at')
  if (filterStatus) query = query.eq('subscription_status', filterStatus)
  const { data: tenants } = await query.order('created_at', { ascending: false })

  if (!tenants || tenants.length === 0) return []

  const tenantIds = tenants.map((t: any) => t.id)

  // Counts per tenant in parallel
  const [usersRes, leadsRes, projectsRes] = await Promise.all([
    sb.from('tenant_users').select('tenant_id').in('tenant_id', tenantIds),
    sb.from('leads').select('tenant_id').in('tenant_id', tenantIds).eq('is_demo', false),
    sb.from('projects').select('tenant_id').in('tenant_id', tenantIds).eq('is_demo', false),
  ])

  const userCount = countByTenant(usersRes.data ?? [])
  const leadCount = countByTenant(leadsRes.data ?? [])
  const projectCount = countByTenant(projectsRes.data ?? [])

  return tenants.map((t: any) => ({
    ...t,
    user_count: userCount.get(t.id) ?? 0,
    lead_count: leadCount.get(t.id) ?? 0,
    project_count: projectCount.get(t.id) ?? 0,
  }))
}

function countByTenant(rows: { tenant_id: string }[]): Map<string, number> {
  const m = new Map<string, number>()
  for (const r of rows) m.set(r.tenant_id, (m.get(r.tenant_id) ?? 0) + 1)
  return m
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function TenantsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  try { await requireSuperadmin() } catch { redirect('/dashboard') }

  const params = await searchParams
  const filterStatus = params.status
  const tenants = await getTenants(filterStatus)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bedrijven"
        description={`${tenants.length} bedrijven${filterStatus ? ` • status: ${filterStatus}` : ''}`}
      />

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-lg bg-foundri-card p-1 w-fit">
        <FilterPill label="Alle" href="/admin/tenants" active={!filterStatus} />
        <FilterPill label="Actief" href="/admin/tenants?status=active" active={filterStatus === 'active'} />
        <FilterPill label="Trial" href="/admin/tenants?status=trial" active={filterStatus === 'trial'} />
        <FilterPill label="Past due" href="/admin/tenants?status=past_due" active={filterStatus === 'past_due'} />
        <FilterPill label="Opgezegd" href="/admin/tenants?status=cancelled" active={filterStatus === 'cancelled'} />
      </div>

      <DataTable
        rows={tenants}
        rowKey={t => t.id}
        rowHref={t => `/admin/tenants/${t.id}`}
        emptyState={
          <EmptyState
            icon={Building2}
            title="Geen bedrijven"
            description="Geen bedrijven die aan dit filter voldoen."
          />
        }
        columns={[
          {
            key: 'name',
            header: 'Bedrijf',
            render: (t) => (
              <div>
                <p className="font-medium text-zinc-100">{t.name}</p>
                {t.slug && <p className="text-xs text-zinc-500 mt-0.5">/{t.slug}</p>}
              </div>
            ),
          },
          {
            key: 'status',
            header: 'Status',
            render: (t) => {
              const sub = subscriptionVariant(t.subscription_status)
              return <StatusBadge label={sub.label} variant={sub.variant} />
            },
          },
          {
            key: 'users',
            header: 'Users',
            render: (t) => t.user_count,
            hideOnMobile: false,
          },
          {
            key: 'leads',
            header: 'Leads',
            render: (t) => t.lead_count,
            hideOnMobile: true,
          },
          {
            key: 'projects',
            header: 'Projecten',
            render: (t) => t.project_count,
            hideOnMobile: true,
          },
          {
            key: 'created',
            header: 'Aangemaakt',
            render: (t) => <span className="text-zinc-500">{formatDate(t.created_at)}</span>,
            hideOnMobile: true,
          },
        ]}
      />
    </div>
  )
}

function FilterPill({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <a
      href={href}
      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
        active ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white'
      }`}
    >
      {label}
    </a>
  )
}
