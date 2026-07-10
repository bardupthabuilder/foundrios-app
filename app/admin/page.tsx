import { createServiceClient } from '@/lib/supabase/server'
import { requireSuperadmin } from '@/lib/admin'
import {
  Building2, Users, Inbox, TrendingUp, BookOpen, FileText,
  AlertCircle, MessageSquare, Activity, FolderOpen, Wallet, Clock,
  CheckCircle2, Sparkles, Layers,
} from 'lucide-react'
import Link from 'next/link'
import { KPICard } from '@/components/admin/KPICard'
import { PageHeader } from '@/components/admin/PageHeader'
import { ActivityFeed } from '@/components/admin/ActivityFeed'
import { StatusBadge, subscriptionVariant } from '@/components/admin/StatusBadge'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface TenantRow {
  id: string
  name: string
  subscription_status: string
  trial_ends_at: string | null
  created_at: string
}

interface UserActivityRow {
  id: string
  user_id: string | null
  event_name: string
  tenant_id: string
  created_at: string
}

async function getDashboardData() {
  const sb = createServiceClient() as any

  const [
    tenantsRes,
    usersCountRes,
    leadsCountRes,
    hotLeadsRes,
    articlesRes,
    templatesRes,
    feedbackRes,
    activityRes,
    last30dTenantsRes,
    last30dLeadsRes,
    projectsRes,
    activityLast7dRes,
    articlesByCatRes,
    templatesByCatRes,
    notesCountRes,
    aiToolsCountRes,
  ] = await Promise.all([
    sb.from('tenants').select('id, name, subscription_status, trial_ends_at, onboarding_completed, niche, created_at').order('created_at', { ascending: false }),
    sb.from('tenant_users').select('id', { count: 'exact', head: true }),
    sb.from('leads').select('id', { count: 'exact', head: true }).eq('is_demo', false),
    sb.from('leads').select('id', { count: 'exact', head: true }).eq('is_demo', false).eq('status', 'hot').gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
    sb.from('knowledge_articles').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    sb.from('templates').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    sb.from('feedback').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    sb.from('telemetry_events').select('id, user_id, event_name, tenant_id, created_at').order('created_at', { ascending: false }).limit(15),
    sb.from('tenants').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
    sb.from('leads').select('id', { count: 'exact', head: true }).eq('is_demo', false).gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
    sb.from('projects').select('budget_cents, status, tenant_id').eq('is_demo', false),
    sb.from('telemetry_events').select('tenant_id').gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
    sb.from('knowledge_articles').select('category').eq('status', 'published'),
    sb.from('templates').select('category').eq('status', 'published'),
    sb.from('content_notes').select('id', { count: 'exact', head: true }),
    sb.from('content_ai_tools').select('id', { count: 'exact', head: true }).eq('status', 'active'),
  ])

  const tenants = (tenantsRes.data ?? []) as TenantRow[]
  const recentActivity = (activityRes.data ?? []) as UserActivityRow[]
  const projects = projectsRes.data ?? []
  const activityLast7d = activityLast7dRes.data ?? []

  const activeTenants = tenants.filter(t => t.subscription_status === 'active').length
  const trialTenants = tenants.filter(t => t.subscription_status === 'trial').length
  const pastDueTenants = tenants.filter(t => t.subscription_status === 'past_due').length
  const cancelledTenants = tenants.filter(t => t.subscription_status === 'cancelled').length
  const onboardingCompleted = tenants.filter((t: any) => t.onboarding_completed === true).length
  const churnRiskTenants = tenants.filter(t => {
    if (t.subscription_status !== 'trial') return false
    if (!t.trial_ends_at) return false
    const daysLeft = (new Date(t.trial_ends_at).getTime() - Date.now()) / 86400000
    return daysLeft < 3 && daysLeft > -7
  })

  // Pipeline value
  const totalPipelineValueCents = projects.reduce((sum: number, p: any) => sum + (p.budget_cents ?? 0), 0)
  const activeProjectValueCents = projects
    .filter((p: any) => p.status === 'actief' || p.status === 'gepland')
    .reduce((sum: number, p: any) => sum + (p.budget_cents ?? 0), 0)

  // Top tenants by activity last 7d
  const tenantNameById = new Map(tenants.map(t => [t.id, t.name]))
  const activityCount = new Map<string, number>()
  for (const e of activityLast7d) {
    activityCount.set(e.tenant_id, (activityCount.get(e.tenant_id) ?? 0) + 1)
  }
  const topTenants = Array.from(activityCount.entries())
    .filter(([id]) => tenantNameById.has(id))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => ({ id, name: tenantNameById.get(id)!, eventCount: count }))

  // Content per category
  const articlesByCat = countCategory((articlesByCatRes.data ?? []) as any[])
  const templatesByCat = countCategory((templatesByCatRes.data ?? []) as any[])

  return {
    tenants,
    counts: {
      totalTenants: tenants.length,
      activeTenants,
      trialTenants,
      pastDueTenants,
      cancelledTenants,
      onboardingCompleted,
      totalUsers: usersCountRes.count ?? 0,
      totalLeads: leadsCountRes.count ?? 0,
      hotLeadsLast7d: hotLeadsRes.count ?? 0,
      articles: articlesRes.count ?? 0,
      templates: templatesRes.count ?? 0,
      feedbackOpen: feedbackRes.count ?? 0,
      newTenants30d: last30dTenantsRes.count ?? 0,
      newLeads30d: last30dLeadsRes.count ?? 0,
      totalPipelineValueCents,
      activeProjectValueCents,
      activeProjectCount: projects.filter((p: any) => p.status === 'actief').length,
      contentNotes: notesCountRes.count ?? 0,
      contentTools: aiToolsCountRes.count ?? 0,
    },
    churnRiskTenants,
    recentActivity,
    topTenants,
    articlesByCat,
    templatesByCat,
  }
}

function countCategory(rows: { category: string }[]): { category: string; count: number }[] {
  const m = new Map<string, number>()
  for (const r of rows) {
    if (!r.category) continue
    m.set(r.category, (m.get(r.category) ?? 0) + 1)
  }
  return Array.from(m.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
}

function SubBar({ label, count, total, variant }: { label: string; count: number; total: number; variant: 'green' | 'yellow' | 'amber' | 'red' }) {
  const pct = total > 0 ? (count / total) * 100 : 0
  const colors = {
    green: 'bg-emerald-500',
    yellow: 'bg-foundri-yellow',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
  }
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-zinc-400">{label}</span>
        <span className="text-zinc-500">{count} ({Math.round(pct)}%)</span>
      </div>
      <div className="h-1.5 rounded-full bg-foundri-card overflow-hidden">
        <div className={`h-full ${colors[variant]} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

const EVENT_ICONS: Record<string, { icon: any; color: string }> = {
  signup_completed: { icon: Users, color: 'text-emerald-400' },
  lead_created: { icon: Inbox, color: 'text-blue-400' },
  project_created: { icon: FolderOpen, color: 'text-violet-400' },
  invoice_sent: { icon: Wallet, color: 'text-amber-400' },
  feedback_submitted: { icon: MessageSquare, color: 'text-rose-400' },
}

function activityTitle(event: string, tenantName?: string): string {
  const map: Record<string, string> = {
    signup_completed: 'Nieuwe signup',
    lead_created: 'Nieuwe lead',
    project_created: 'Nieuw project',
    invoice_sent: 'Factuur verzonden',
    feedback_submitted: 'Feedback ontvangen',
    onboarding_completed: 'Onboarding afgerond',
    login: 'Login',
  }
  const base = map[event] ?? event.replace(/_/g, ' ')
  return tenantName ? `${base} — ${tenantName}` : base
}

export default async function AdminDashboard() {
  try {
    await requireSuperadmin()
  } catch {
    redirect('/dashboard')
  }

  const data = await getDashboardData()
  const tenantNameById = new Map(data.tenants.map(t => [t.id, t.name]))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cockpit"
        description="Operationeel overzicht van FoundriOS — alles in één scherm"
      />

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <KPICard
          label="Totaal bedrijven"
          value={data.counts.totalTenants}
          sublabel={`+${data.counts.newTenants30d} laatste 30 dagen`}
          icon={Building2}
          accent="blue"
          href="/admin/tenants"
        />
        <KPICard
          label="Actieve klanten"
          value={data.counts.activeTenants}
          sublabel={`${data.counts.trialTenants} in trial`}
          icon={TrendingUp}
          accent="green"
          href="/admin/tenants?status=active"
        />
        <KPICard
          label="Gebruikers"
          value={data.counts.totalUsers}
          icon={Users}
          accent="violet"
          href="/admin/gebruikers"
        />
        <KPICard
          label="Leads totaal"
          value={data.counts.totalLeads}
          sublabel={`+${data.counts.newLeads30d} laatste 30 dagen`}
          icon={Inbox}
          accent="amber"
        />
        <KPICard
          label="Hot leads (7d)"
          value={data.counts.hotLeadsLast7d}
          icon={Activity}
          accent="red"
        />
        <KPICard
          label="Handboek-artikelen"
          value={data.counts.articles}
          icon={BookOpen}
          accent="violet"
          href="/admin/kennisbank"
        />
        <KPICard
          label="Templates"
          value={data.counts.templates}
          icon={FileText}
          accent="amber"
          href="/admin/templates"
        />
        <KPICard
          label="Open feedback"
          value={data.counts.feedbackOpen}
          icon={MessageSquare}
          accent={data.counts.feedbackOpen > 0 ? 'rose' : 'zinc'}
          href="/admin/feedback"
        />
      </div>

      {/* Two-column: activity + churn risk */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Activity feed */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Recente activiteit</h2>
            <Link href="/admin/activity" className="text-xs text-zinc-500 hover:text-zinc-300">
              Alles bekijken →
            </Link>
          </div>
          <ActivityFeed
            items={data.recentActivity.map(e => {
              const cfg = EVENT_ICONS[e.event_name] ?? { icon: Activity, color: 'text-zinc-400' }
              return {
                id: e.id,
                icon: cfg.icon,
                iconColor: cfg.color,
                title: activityTitle(e.event_name, tenantNameById.get(e.tenant_id)),
                subtitle: tenantNameById.get(e.tenant_id),
                timestamp: e.created_at,
              }
            })}
          />
        </div>

        {/* Churn risk */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-400" />
            Trial-aandacht
          </h2>
          <div className="rounded-xl border border-white/5 bg-foundri-deep overflow-hidden">
            {data.churnRiskTenants.length === 0 ? (
              <div className="p-4 text-sm text-zinc-500 text-center">Geen trials op de rand</div>
            ) : (
              <ul className="divide-y divide-white/5">
                {data.churnRiskTenants.map(t => {
                  const daysLeft = Math.round((new Date(t.trial_ends_at!).getTime() - Date.now()) / 86400000)
                  return (
                    <li key={t.id}>
                      <Link
                        href={`/admin/tenants/${t.id}`}
                        className="block px-4 py-3 hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm text-zinc-200 truncate">{t.name}</span>
                          <span className={`text-xs font-medium shrink-0 ${daysLeft < 0 ? 'text-red-400' : 'text-amber-400'}`}>
                            {daysLeft < 0 ? `${Math.abs(daysLeft)}d over` : `${daysLeft}d trial`}
                          </span>
                        </div>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Subscription breakdown + Pipeline value + Onboarding */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Subscription distribution */}
        <div className="rounded-xl border border-white/5 bg-foundri-deep p-5">
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Layers className="h-4 w-4 text-zinc-500" />
            Subscription verdeling
          </h3>
          <div className="space-y-2">
            <SubBar label="Actief" count={data.counts.activeTenants} total={data.counts.totalTenants} variant="green" />
            <SubBar label="Trial" count={data.counts.trialTenants} total={data.counts.totalTenants} variant="yellow" />
            <SubBar label="Past due" count={data.counts.pastDueTenants} total={data.counts.totalTenants} variant="amber" />
            <SubBar label="Opgezegd" count={data.counts.cancelledTenants} total={data.counts.totalTenants} variant="red" />
          </div>
        </div>

        {/* Pipeline value */}
        <div className="rounded-xl border border-white/5 bg-foundri-deep p-5">
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Wallet className="h-4 w-4 text-emerald-400" />
            Pipeline-waarde
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-zinc-500">Lopend + gepland</p>
              <p className="text-2xl font-bold text-white tracking-tight mt-1">
                € {(data.counts.activeProjectValueCents / 100).toLocaleString('nl-NL')}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">{data.counts.activeProjectCount} actieve projecten</p>
            </div>
            <div className="pt-3 border-t border-white/5">
              <p className="text-xs text-zinc-500">Totaal alle projecten</p>
              <p className="text-base font-semibold text-zinc-300 mt-0.5">
                € {(data.counts.totalPipelineValueCents / 100).toLocaleString('nl-NL')}
              </p>
            </div>
          </div>
        </div>

        {/* Onboarding completion */}
        <div className="rounded-xl border border-white/5 bg-foundri-deep p-5">
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-blue-400" />
            Onboarding-status
          </h3>
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-white tracking-tight">
                {data.counts.totalTenants > 0 ? Math.round((data.counts.onboardingCompleted / data.counts.totalTenants) * 100) : 0}%
              </p>
              <p className="text-xs text-zinc-500">afgerond</p>
            </div>
            <p className="text-xs text-zinc-500">
              {data.counts.onboardingCompleted} van {data.counts.totalTenants} bedrijven
            </p>
            <div className="h-2 rounded-full bg-foundri-card overflow-hidden mt-2">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${data.counts.totalTenants > 0 ? (data.counts.onboardingCompleted / data.counts.totalTenants) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Top tenants + Content health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top tenants by activity */}
        <div className="rounded-xl border border-white/5 bg-foundri-deep p-5">
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-violet-400" />
            Meest actief (laatste 7 dagen)
          </h3>
          {data.topTenants.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-4">Geen activiteit deze week</p>
          ) : (
            <ul className="space-y-2">
              {data.topTenants.map((t, i) => (
                <li key={t.id}>
                  <Link href={`/admin/tenants/${t.id}`} className="flex items-center justify-between gap-3 px-3 py-2 rounded hover:bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-zinc-600 w-5">{i + 1}.</span>
                      <span className="text-sm text-zinc-200 truncate">{t.name}</span>
                    </div>
                    <span className="text-xs text-zinc-500 shrink-0">{t.eventCount} events</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Content overview */}
        <div className="rounded-xl border border-white/5 bg-foundri-deep p-5">
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            Content-overzicht
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-zinc-500 mb-2">Artikelen per categorie</p>
              <ul className="space-y-1">
                {data.articlesByCat.map(c => (
                  <li key={c.category} className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300 capitalize">{c.category}</span>
                    <span className="text-zinc-500">{c.count}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-2">Templates per categorie</p>
              <ul className="space-y-1">
                {data.templatesByCat.map(c => (
                  <li key={c.category} className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300 capitalize">{c.category}</span>
                    <span className="text-zinc-500">{c.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-zinc-500">
            <Link href="/admin/content-studio" className="hover:text-zinc-300">
              Content Studio →
            </Link>
            <span>{data.counts.contentTools} AI tools · {data.counts.contentNotes} notes</span>
          </div>
        </div>
      </div>

      {/* Recent tenants */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Laatst aangemeld</h2>
          <Link href="/admin/tenants" className="text-xs text-zinc-500 hover:text-zinc-300">
            Alle bedrijven →
          </Link>
        </div>
        <div className="rounded-xl border border-white/5 bg-foundri-deep overflow-hidden">
          <ul className="divide-y divide-white/5">
            {data.tenants.slice(0, 5).map(t => {
              const sub = subscriptionVariant(t.subscription_status)
              const daysAgo = Math.floor((Date.now() - new Date(t.created_at).getTime()) / 86400000)
              return (
                <li key={t.id}>
                  <Link href={`/admin/tenants/${t.id}`} className="block px-4 py-3 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-200 truncate">{t.name}</p>
                        <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          {daysAgo === 0 ? 'vandaag' : daysAgo === 1 ? 'gisteren' : `${daysAgo} dagen geleden`}
                        </p>
                      </div>
                      <StatusBadge label={sub.label} variant={sub.variant} />
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  )
}
