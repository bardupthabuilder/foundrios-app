import { createServiceClient } from '@/lib/supabase/server'
import { requireSuperadmin } from '@/lib/admin'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Users, Inbox, FolderOpen, Wallet, Calendar, ArrowLeft,
  Mail, Phone, MapPin, Activity, FileText,
} from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import { KPICard } from '@/components/admin/KPICard'
import { StatusBadge, subscriptionVariant } from '@/components/admin/StatusBadge'
import { ActivityFeed } from '@/components/admin/ActivityFeed'
import { TenantAdminControls } from '@/components/admin/TenantAdminControls'
import { TenantPlaybookGrants } from '@/components/admin/TenantPlaybookGrants'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getTenantData(id: string) {
  const sb = createServiceClient() as any

  const [tenantRes, usersRes, leadsRes, projectsRes, activityRes, feedbackRes, auditRes] = await Promise.all([
    sb.from('tenants').select('*').eq('id', id).single(),
    sb.from('tenant_users').select('user_id, role, is_superadmin, created_at, demo_mode_active').eq('tenant_id', id),
    sb.from('leads').select('id, status, ai_score, created_at').eq('tenant_id', id).eq('is_demo', false).order('created_at', { ascending: false }),
    sb.from('projects').select('id, name, status, budget_cents, start_date, end_date').eq('tenant_id', id).eq('is_demo', false).order('start_date', { ascending: false }),
    sb.from('telemetry_events').select('id, event_name, user_id, created_at').eq('tenant_id', id).order('created_at', { ascending: false }).limit(20),
    sb.from('feedback').select('id, status').eq('tenant_id', id),
    sb.from('tenant_audit_log').select('id, action, meta, created_at').eq('tenant_id', id).order('created_at', { ascending: false }).limit(20),
  ])

  if (!tenantRes.data) return null

  // Get user emails for tenant_users
  const userIds = (usersRes.data ?? []).map((u: any) => u.user_id).filter(Boolean)
  let usersWithEmails: any[] = []
  if (userIds.length > 0) {
    const { data: { users } } = await sb.auth.admin.listUsers()
    const emailById = new Map<string, { email: string | undefined; last_sign_in_at: string | null }>(
      (users as any[]).map((u) => [u.id as string, { email: u.email, last_sign_in_at: u.last_sign_in_at }])
    )
    usersWithEmails = (usersRes.data ?? []).map((tu: any) => {
      const info = emailById.get(tu.user_id)
      return {
        ...tu,
        email: info?.email,
        last_sign_in_at: info?.last_sign_in_at,
      }
    })
  }

  return {
    tenant: tenantRes.data,
    users: usersWithEmails,
    leads: leadsRes.data ?? [],
    projects: projectsRes.data ?? [],
    activity: activityRes.data ?? [],
    feedback: feedbackRes.data ?? [],
    audit: auditRes.data ?? [],
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatEuro(cents: number | null): string {
  if (cents == null) return '—'
  return `€ ${(cents / 100).toLocaleString('nl-NL')}`
}

export default async function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  try { await requireSuperadmin() } catch { redirect('/dashboard') }
  const { id } = await params
  const data = await getTenantData(id)
  if (!data) notFound()

  const { tenant, users, leads, projects, activity, feedback, audit } = data
  const profile = tenant // tenants tabel heeft alle profiel-velden direct
  const sub = subscriptionVariant(tenant.subscription_status)
  const hotLeads = leads.filter((l: any) => l.status === 'hot').length
  const activeProjects = projects.filter((p: any) => p.status === 'actief').length
  const totalProjectValue = projects.reduce((sum: number, p: any) => sum + (p.budget_cents ?? 0), 0)
  const openFeedback = feedback.filter((f: any) => f.status === 'open').length

  return (
    <div className="space-y-6">
      <Link
        href="/admin/tenants"
        className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Alle bedrijven
      </Link>

      <PageHeader
        title={tenant.name}
        description={tenant.slug ? `/${tenant.slug}` : undefined}
        actions={<StatusBadge label={sub.label} variant={sub.variant} size="md" />}
      />

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Gebruikers" value={users.length} icon={Users} accent="violet" />
        <KPICard label="Leads" value={leads.length} sublabel={`${hotLeads} hot`} icon={Inbox} accent="amber" />
        <KPICard label="Projecten" value={projects.length} sublabel={`${activeProjects} actief`} icon={FolderOpen} accent="blue" />
        <KPICard label="Project-waarde" value={formatEuro(totalProjectValue)} icon={Wallet} accent="green" />
      </div>

      {/* Two-column: bedrijfsinfo + recente activiteit */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* Bedrijfsinfo card */}
          <div className="rounded-xl border border-white/5 bg-foundri-deep p-5">
            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">Bedrijfsinfo</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-sm">
              <InfoRow label="Aangemaakt" value={formatDate(tenant.created_at)} />
              <InfoRow label="Trial einde" value={formatDate(tenant.trial_ends_at)} />
              {profile?.niche && <InfoRow label="Niche" value={profile.niche} />}
              {profile?.region && <InfoRow label="Regio" value={profile.region} icon={MapPin} />}
              {profile?.owner_name && <InfoRow label="Eigenaar" value={profile.owner_name} />}
              {profile?.owner_phone && <InfoRow label="Telefoon" value={profile.owner_phone} icon={Phone} />}
              {profile?.email && <InfoRow label="E-mail" value={profile.email} icon={Mail} />}
              {profile?.onboarding_completed != null && (
                <InfoRow
                  label="Onboarding"
                  value={profile.onboarding_completed ? 'Afgerond' : 'Niet afgerond'}
                />
              )}
            </dl>
          </div>

          {/* Users */}
          <div className="rounded-xl border border-white/5 bg-foundri-deep overflow-hidden">
            <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Gebruikers</h2>
              <span className="text-xs text-zinc-500">{users.length}</span>
            </div>
            <ul className="divide-y divide-white/5">
              {users.length === 0 ? (
                <li className="px-5 py-4 text-sm text-zinc-500">Geen gebruikers</li>
              ) : users.map((u: any) => (
                <li key={u.user_id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-200 truncate">{u.email ?? u.user_id}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Laatst ingelogd: {u.last_sign_in_at ? formatDate(u.last_sign_in_at) : 'nooit'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {u.is_superadmin && <StatusBadge label="Admin" variant="yellow" />}
                    <StatusBadge label={u.role} variant="zinc" />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Projects */}
          {projects.length > 0 && (
            <div className="rounded-xl border border-white/5 bg-foundri-deep overflow-hidden">
              <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Projecten</h2>
                <span className="text-xs text-zinc-500">{projects.length}</span>
              </div>
              <ul className="divide-y divide-white/5">
                {projects.slice(0, 5).map((p: any) => (
                  <li key={p.id} className="px-5 py-3 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-200 truncate">{p.name}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {p.start_date ? formatDate(p.start_date) : 'Geen startdatum'}
                        {p.budget_cents && ` • ${formatEuro(p.budget_cents)}`}
                      </p>
                    </div>
                    <StatusBadge label={p.status} variant="blue" />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right column: admin controls + activity */}
        <div className="space-y-4">
          <TenantAdminControls
            tenantId={tenant.id}
            initial={{
              plan: (tenant.plan ?? 'free') as 'free' | 'pro' | 'scale',
              is_managed: !!tenant.is_managed,
              managed_package: (tenant.managed_package ?? null) as 'light' | 'core' | 'premium' | null,
              is_platform_case: !!tenant.is_platform_case,
              internal_notes: tenant.internal_notes ?? null,
            }}
          />

          <TenantPlaybookGrants tenantId={tenant.id} />

          <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Activiteit</h2>
          <ActivityFeed
            items={activity.map((e: any) => ({
              id: e.id,
              icon: Activity,
              title: e.event_name.replace(/_/g, ' '),
              timestamp: e.created_at,
            }))}
            emptyText="Geen activiteit"
          />

          {audit.length > 0 && (
            <>
              <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Admin log</h2>
              <div className="rounded-xl border border-white/5 bg-foundri-deep p-3">
                <ul className="space-y-2">
                  {audit.map((a: any) => (
                    <li key={a.id} className="text-xs">
                      <p className="text-zinc-300">{a.action.replace(/_/g, ' ')}</p>
                      <p className="text-zinc-500">
                        {formatDate(a.created_at)}
                        {a.meta && Object.keys(a.meta).length > 0 && (
                          <> · {JSON.stringify(a.meta)}</>
                        )}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {openFeedback > 0 && (
            <Link
              href={`/admin/feedback?tenant=${tenant.id}`}
              className="block rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 hover:border-rose-500/40 transition-colors"
            >
              <div className="flex items-center gap-2 text-rose-300">
                <FileText className="h-4 w-4" />
                <span className="text-sm font-medium">{openFeedback} open feedback</span>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof Calendar }) {
  return (
    <>
      <dt className="text-zinc-500 flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </dt>
      <dd className="text-zinc-200">{value}</dd>
    </>
  )
}
