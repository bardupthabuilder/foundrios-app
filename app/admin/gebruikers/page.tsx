import { createServiceClient } from '@/lib/supabase/server'
import { requireSuperadmin } from '@/lib/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import { DataTable } from '@/components/admin/DataTable'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { EmptyState } from '@/components/admin/EmptyState'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface UserRow {
  user_id: string
  email: string | null
  last_sign_in_at: string | null
  created_at: string
  is_superadmin: boolean
  tenant_count: number
  tenants: { id: string; name: string; role: string }[]
}

async function getUsers(filter?: string): Promise<UserRow[]> {
  const sb = createServiceClient() as any

  // Get all auth users
  const { data: { users: authUsers } } = await sb.auth.admin.listUsers({ perPage: 1000 })

  // Get all tenant_user rows
  const { data: tenantUsers } = await sb.from('tenant_users')
    .select('user_id, tenant_id, role, is_superadmin')

  const { data: tenants } = await sb.from('tenants').select('id, name')
  const tenantNameById = new Map((tenants ?? []).map((t: any) => [t.id, t.name]))

  // Build per-user tenants
  const tenantsByUser = new Map<string, { id: string; name: string; role: string; is_superadmin: boolean }[]>()
  for (const tu of tenantUsers ?? []) {
    const existing = tenantsByUser.get(tu.user_id) ?? []
    existing.push({
      id: tu.tenant_id,
      name: (tenantNameById.get(tu.tenant_id) as string) ?? '?',
      role: tu.role,
      is_superadmin: tu.is_superadmin === true,
    })
    tenantsByUser.set(tu.user_id, existing)
  }

  let rows: UserRow[] = (authUsers ?? []).map((u: any) => {
    const userTenants = tenantsByUser.get(u.id) ?? []
    const isSuperadmin = userTenants.some(t => t.is_superadmin)
    return {
      user_id: u.id,
      email: u.email ?? null,
      last_sign_in_at: u.last_sign_in_at,
      created_at: u.created_at,
      is_superadmin: isSuperadmin,
      tenant_count: userTenants.length,
      tenants: userTenants,
    }
  })

  // Sort by last sign in (recent first), no-login at bottom
  rows.sort((a, b) => {
    if (!a.last_sign_in_at && !b.last_sign_in_at) return 0
    if (!a.last_sign_in_at) return 1
    if (!b.last_sign_in_at) return -1
    return new Date(b.last_sign_in_at).getTime() - new Date(a.last_sign_in_at).getTime()
  })

  // Apply filters
  if (filter === 'admin') rows = rows.filter(r => r.is_superadmin)
  else if (filter === 'inactive') {
    const cutoff = Date.now() - 30 * 86400000
    rows = rows.filter(r => !r.last_sign_in_at || new Date(r.last_sign_in_at).getTime() < cutoff)
  } else if (filter === 'no_login') {
    rows = rows.filter(r => !r.last_sign_in_at)
  } else if (filter === 'no_tenant') {
    rows = rows.filter(r => r.tenant_count === 0)
  }

  return rows
}

function formatRelative(iso: string | null): string {
  if (!iso) return 'nooit'
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days === 0) return 'vandaag'
  if (days === 1) return 'gisteren'
  if (days < 7) return `${days}d`
  if (days < 30) return `${Math.floor(days / 7)}w`
  if (days < 365) return `${Math.floor(days / 30)}mnd`
  return `${Math.floor(days / 365)}j`
}

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  try { await requireSuperadmin() } catch { redirect('/dashboard') }

  const params = await searchParams
  const users = await getUsers(params.filter)

  // Counts for tabs
  const all = await getUsers()
  const counts = {
    all: all.length,
    admin: all.filter(u => u.is_superadmin).length,
    inactive: all.filter(u => !u.last_sign_in_at || new Date(u.last_sign_in_at).getTime() < Date.now() - 30 * 86400000).length,
    no_login: all.filter(u => !u.last_sign_in_at).length,
    no_tenant: all.filter(u => u.tenant_count === 0).length,
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gebruikers"
        description={`${users.length} gebruikers${params.filter ? ` • filter: ${params.filter}` : ''}`}
      />

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1 rounded-lg bg-foundri-card p-1 w-fit">
        <FilterPill label={`Alle (${counts.all})`} href="/admin/gebruikers" active={!params.filter} />
        <FilterPill label={`Admins (${counts.admin})`} href="/admin/gebruikers?filter=admin" active={params.filter === 'admin'} />
        <FilterPill label={`Inactief 30d+ (${counts.inactive})`} href="/admin/gebruikers?filter=inactive" active={params.filter === 'inactive'} />
        <FilterPill label={`Nooit ingelogd (${counts.no_login})`} href="/admin/gebruikers?filter=no_login" active={params.filter === 'no_login'} />
        <FilterPill label={`Geen tenant (${counts.no_tenant})`} href="/admin/gebruikers?filter=no_tenant" active={params.filter === 'no_tenant'} />
      </div>

      <DataTable
        rows={users}
        rowKey={u => u.user_id}
        emptyState={
          <EmptyState icon={Users} title="Geen gebruikers" description="Geen gebruikers die aan dit filter voldoen." />
        }
        columns={[
          {
            key: 'email',
            header: 'E-mail',
            render: (u) => (
              <div>
                <p className="font-medium text-zinc-100">{u.email ?? '(geen e-mail)'}</p>
                {u.is_superadmin && <StatusBadge label="Superadmin" variant="yellow" size="sm" />}
              </div>
            ),
          },
          {
            key: 'tenants',
            header: 'Bedrijven',
            render: (u) => {
              if (u.tenants.length === 0) return <span className="text-zinc-500 text-xs">geen</span>
              return (
                <div className="flex flex-wrap gap-1">
                  {u.tenants.map(t => (
                    <Link
                      key={t.id}
                      href={`/admin/tenants/${t.id}`}
                      className="text-xs text-blue-400 hover:text-blue-300"
                      title={t.role}
                    >
                      {t.name}
                    </Link>
                  ))}
                </div>
              )
            },
            hideOnMobile: false,
          },
          {
            key: 'last_login',
            header: 'Laatst ingelogd',
            render: (u) => (
              <span className={u.last_sign_in_at ? 'text-zinc-300' : 'text-zinc-600'}>
                {formatRelative(u.last_sign_in_at)}
              </span>
            ),
          },
          {
            key: 'created',
            header: 'Aangemaakt',
            render: (u) => <span className="text-zinc-500">{formatRelative(u.created_at)}</span>,
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
      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
        active ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white'
      }`}
    >
      {label}
    </a>
  )
}
