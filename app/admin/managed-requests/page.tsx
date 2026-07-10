import { createServiceClient } from '@/lib/supabase/server'
import { requireSuperadmin } from '@/lib/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Briefcase } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import { DataTable } from '@/components/admin/DataTable'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { EmptyState } from '@/components/admin/EmptyState'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Status = 'new' | 'reviewing' | 'qualified' | 'rejected' | 'scheduled' | 'won' | 'lost'

interface ManagedRequest {
  id: string
  tenant_id: string
  status: Status
  preferred_package: 'light' | 'core' | 'premium' | 'unsure'
  bedrijfsnaam: string
  vakgebied: string | null
  regio: string | null
  omzet_maand_eur: number | null
  grootste_probleem: string | null
  created_at: string
  tenant_name?: string
}

const STATUS_VARIANTS: Record<Status, { label: string; variant: 'green' | 'amber' | 'red' | 'blue' | 'violet' | 'zinc' | 'yellow' }> = {
  new: { label: 'Nieuw', variant: 'violet' },
  reviewing: { label: 'In review', variant: 'amber' },
  qualified: { label: 'Gekwalificeerd', variant: 'green' },
  rejected: { label: 'Afgewezen', variant: 'red' },
  scheduled: { label: 'Gepland', variant: 'green' },
  won: { label: 'Gewonnen', variant: 'yellow' },
  lost: { label: 'Verloren', variant: 'zinc' },
}

async function getRequests(filterStatus?: string): Promise<ManagedRequest[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createServiceClient() as any

  let q = sb.from('managed_requests').select('*')
  if (filterStatus) q = q.eq('status', filterStatus)
  const { data: requests } = await q.order('created_at', { ascending: false })

  if (!requests || requests.length === 0) return []

  const tenantIds = Array.from(new Set(requests.map((r: ManagedRequest) => r.tenant_id)))
  const { data: tenants } = await sb.from('tenants').select('id, name').in('id', tenantIds)
  const tenantMap = new Map<string, string>((tenants ?? []).map((t: { id: string; name: string }) => [t.id, t.name]))

  return requests.map((r: ManagedRequest) => ({ ...r, tenant_name: tenantMap.get(r.tenant_id) }))
}

export default async function ManagedRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  try { await requireSuperadmin() } catch { redirect('/dashboard') }

  const params = await searchParams
  const requests = await getRequests(params.status)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Managed Aanvragen"
        description={`${requests.length} aanvragen${params.status ? ` • status: ${params.status}` : ''}`}
      />

      <div className="flex flex-wrap gap-1 rounded-lg bg-foundri-card p-1 w-fit">
        <FilterPill label="Alle" href="/admin/managed-requests" active={!params.status} />
        <FilterPill label="Nieuw" href="/admin/managed-requests?status=new" active={params.status === 'new'} />
        <FilterPill label="Review" href="/admin/managed-requests?status=reviewing" active={params.status === 'reviewing'} />
        <FilterPill label="Gekwalificeerd" href="/admin/managed-requests?status=qualified" active={params.status === 'qualified'} />
        <FilterPill label="Gepland" href="/admin/managed-requests?status=scheduled" active={params.status === 'scheduled'} />
        <FilterPill label="Gewonnen" href="/admin/managed-requests?status=won" active={params.status === 'won'} />
      </div>

      <DataTable
        rows={requests}
        rowKey={r => r.id}
        rowHref={r => `/admin/managed-requests/${r.id}`}
        emptyState={
          <EmptyState
            icon={Briefcase}
            title="Geen aanvragen"
            description="Geen managed-aanvragen voor dit filter."
          />
        }
        columns={[
          {
            key: 'bedrijf',
            header: 'Aanvrager',
            render: r => (
              <div>
                <p className="font-medium text-zinc-100">{r.bedrijfsnaam}</p>
                {r.tenant_name && <p className="mt-0.5 text-xs text-zinc-500">via {r.tenant_name}</p>}
              </div>
            ),
          },
          {
            key: 'package',
            header: 'Pakket',
            render: r => <span className="text-xs uppercase tracking-wider text-zinc-400">{r.preferred_package}</span>,
            hideOnMobile: false,
          },
          {
            key: 'omzet',
            header: 'Omzet/mnd',
            render: r => (r.omzet_maand_eur ? `€${r.omzet_maand_eur.toLocaleString('nl-NL')}` : '—'),
            hideOnMobile: true,
          },
          {
            key: 'regio',
            header: 'Regio',
            render: r => r.regio || '—',
            hideOnMobile: true,
          },
          {
            key: 'status',
            header: 'Status',
            render: r => {
              const v = STATUS_VARIANTS[r.status]
              return <StatusBadge label={v.label} variant={v.variant} />
            },
          },
          {
            key: 'date',
            header: 'Datum',
            render: r => (
              <span className="text-xs text-zinc-500">
                {new Date(r.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
              </span>
            ),
            hideOnMobile: true,
          },
        ]}
      />
    </div>
  )
}

function FilterPill({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
        active ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white'
      }`}
    >
      {label}
    </Link>
  )
}
