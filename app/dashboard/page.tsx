import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Inbox, TrendingUp, Star, FolderOpen, CalendarDays, Euro, Receipt, FileText, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { DemoSeedBanner } from '@/components/DemoSeedBanner'
import { WelcomeBanner } from '@/components/WelcomeBanner'
import { formatDistanceToNow } from 'date-fns'
import { nl } from 'date-fns/locale'

function getWeekRange() {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  const friday = new Date(monday)
  friday.setDate(monday.getDate() + 4)
  friday.setHours(23, 59, 59, 999)
  return { start: monday.toISOString().split('T')[0], end: friday.toISOString().split('T')[0] }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { tenantId } = await requireTenant()
  const todayStr = new Date().toISOString().split('T')[0]
  const { start: weekStart, end: weekEnd } = getWeekRange()

  const [
    leadsResult,
    hotLeadsResult,
    recentLeadsResult,
    activeProjectsResult,
    weekHoursResult,
    todayPlanningResult,
    invoicesResult,
    pipelineQuotesResult,
    tenantResult,
    employeesCountResult,
    quotesCountResult,
  ] = await Promise.all([
    supabase
      .from('leads')
      .select('id, status, created_at', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from('leads')
      .select('id', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .eq('ai_label', 'hot')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from('leads')
      .select('id, name, status, ai_label, source, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('projects')
      .select('id', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .eq('status', 'actief'),
    supabase
      .from('time_entries')
      .select('hours')
      .eq('tenant_id', tenantId)
      .gte('entry_date', weekStart)
      .lte('entry_date', weekEnd),
    supabase
      .from('planning_entries')
      .select('id, employee_id, planned_hours, employees(name), projects(name, city)')
      .eq('tenant_id', tenantId)
      .eq('planned_date', todayStr),
    // Financieel
    supabase
      .from('invoices')
      .select('amount_excl_vat, status, due_date, paid_at')
      .eq('tenant_id', tenantId),
    supabase
      .from('quotes')
      .select('amount_excl_vat, status')
      .eq('tenant_id', tenantId)
      .in('status', ['concept', 'verstuurd']),
    // Onboarding progress (description, services, niche, onboarding_dismissed not in generated types)
    supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single(),
    supabase
      .from('employees')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId),
    supabase
      .from('quotes')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId),
  ])

  // Onboarding progress — extra columns (description, services, onboarding_dismissed) exist in DB but not in generated types
  const tenant = tenantResult.data as Record<string, unknown> | null
  const profileComplete = !!(tenant?.description && tenant?.services && Array.isArray(tenant.services) && (tenant.services as string[]).length > 0)
  const hasEmployees = (employeesCountResult.count || 0) > 0
  const hasLeads = (leadsResult.count || 0) > 0
  const hasQuotes = (quotesCountResult.count || 0) > 0
  const showWelcome = tenant && !tenant.onboarding_dismissed

  const isEmpty = (leadsResult.count ?? 0) === 0 && (activeProjectsResult.count ?? 0) === 0
  const totalLeads = leadsResult.count ?? 0
  const hotLeads = hotLeadsResult.count ?? 0
  const wonLeads = leadsResult.data?.filter((l) => l.status === 'won').length ?? 0
  const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0
  const recentLeads = recentLeadsResult.data ?? []
  const activeProjects = activeProjectsResult.count ?? 0
  const weekHours = weekHoursResult.data?.reduce((sum, e) => sum + (e.hours ?? 0), 0) ?? 0
  const todayPlanning = todayPlanningResult.data ?? []
  const todayEmployees = new Set(todayPlanning.map((p) => p.employee_id)).size

  const kpis = [
    { title: 'Leads deze maand', value: totalLeads, icon: Inbox, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { title: 'Hot leads', value: hotLeads, icon: Star, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { title: 'Conversie', value: `${conversionRate}%`, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { title: 'Actieve projecten', value: activeProjects, icon: FolderOpen, color: 'text-green-400', bg: 'bg-green-500/10' },
  ]

  // Financieel
  const invoices = invoicesResult.data ?? []
  const paidInvoices = invoices.filter((i) => i.status === 'paid')
  const openInvoices = invoices.filter((i) => i.status === 'sent' || i.status === 'draft')
  const overdueInvoices = invoices.filter((i) => i.status === 'sent' && i.due_date && new Date(i.due_date) < new Date())
  const revenueThisMonth = paidInvoices
    .filter((i) => i.paid_at && new Date(i.paid_at).getMonth() === new Date().getMonth() && new Date(i.paid_at).getFullYear() === new Date().getFullYear())
    .reduce((sum, i) => sum + (i.amount_excl_vat ?? 0), 0)
  const totalOpen = openInvoices.reduce((sum, i) => sum + (i.amount_excl_vat ?? 0), 0)
  const totalOverdue = overdueInvoices.reduce((sum, i) => sum + (i.amount_excl_vat ?? 0), 0)
  const pipelineValue = (pipelineQuotesResult.data ?? []).reduce((sum, q) => sum + (q.amount_excl_vat ?? 0), 0)

  const fmtEur = (cents: number) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(cents / 100)

  // Action items
  const newLeadsCount = leadsResult.data?.filter((l) => l.status === 'new').length ?? 0
  const staleQuotesCount = (pipelineQuotesResult.data ?? []).filter((q) => q.status === 'verstuurd').length
  const overdueInvoicesCount = overdueInvoices.length

  const hasActions = newLeadsCount > 0 || staleQuotesCount > 0 || overdueInvoicesCount > 0

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-display)]">Command Center</h1>
          <p className="text-sm text-zinc-400">Overzicht van je bedrijf</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/leads"><Button variant="outline" size="sm">Lead Inbox</Button></Link>
          <Link href="/dashboard/projecten"><Button size="sm">Projecten</Button></Link>
        </div>
      </div>

      {showWelcome && (
        <WelcomeBanner
          tenantName={(tenant?.name as string) || 'FoundriOS'}
          onboardingStep={0}
          hasLeads={hasLeads}
          hasEmployees={hasEmployees}
          hasQuotes={hasQuotes}
          profileComplete={profileComplete}
        />
      )}

      {isEmpty && <DemoSeedBanner />}

      {/* Section 1: Action Items */}
      <section className="mb-8">
        {hasActions ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {newLeadsCount > 0 && (
              <Link href="/dashboard/leads?label=hot" className="flex items-center gap-3 rounded-lg border border-foundri-yellow/20 bg-foundri-yellow/5 p-4 transition-colors hover:bg-foundri-yellow/10">
                <Inbox className="h-5 w-5 text-foundri-yellow" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{newLeadsCount} nieuwe leads</p>
                  <p className="text-xs text-zinc-400">Wachten op reactie</p>
                </div>
                <ArrowRight className="h-4 w-4 text-zinc-400" />
              </Link>
            )}
            {staleQuotesCount > 0 && (
              <Link href="/dashboard/offertes?status=verstuurd" className="flex items-center gap-3 rounded-lg border border-purple-500/20 bg-purple-500/5 p-4 transition-colors hover:bg-purple-500/10">
                <FileText className="h-5 w-5 text-purple-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{staleQuotesCount} offertes verstuurd</p>
                  <p className="text-xs text-zinc-400">Wacht op reactie</p>
                </div>
                <ArrowRight className="h-4 w-4 text-zinc-400" />
              </Link>
            )}
            {overdueInvoicesCount > 0 && (
              <Link href="/dashboard/facturen?status=overdue" className="flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/5 p-4 transition-colors hover:bg-red-500/10">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{overdueInvoicesCount} facturen verlopen</p>
                  <p className="text-xs text-zinc-400">Directe actie vereist</p>
                </div>
                <ArrowRight className="h-4 w-4 text-zinc-400" />
              </Link>
            )}
          </div>
        ) : (
          !isEmpty && (
            <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/5 p-4">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              <p className="text-sm text-green-400">Alles bijgewerkt — geen openstaande acties</p>
            </div>
          )
        )}
      </section>

      {/* Section 2: KPI Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400">{kpi.title}</CardTitle>
                <div className={`rounded-lg p-2 ${kpi.bg}`}>
                  <Icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{kpi.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Section 3: Financial KPIs */}
      {!isEmpty && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Omzet deze maand</CardTitle>
              <div className="rounded-lg p-2 bg-green-500/10"><Euro className="h-4 w-4 text-green-400" /></div>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-white">{fmtEur(revenueThisMonth)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Openstaand</CardTitle>
              <div className="rounded-lg p-2 bg-blue-500/10"><Receipt className="h-4 w-4 text-blue-400" /></div>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-white">{fmtEur(totalOpen)}</div></CardContent>
          </Card>
          <Card className={totalOverdue > 0 ? 'border-red-500/30' : ''}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Verlopen</CardTitle>
              <div className={`rounded-lg p-2 ${totalOverdue > 0 ? 'bg-red-500/10' : 'bg-foundri-surface'}`}>
                <AlertTriangle className={`h-4 w-4 ${totalOverdue > 0 ? 'text-red-400' : 'text-zinc-400'}`} />
              </div>
            </CardHeader>
            <CardContent><div className={`text-2xl font-bold ${totalOverdue > 0 ? 'text-red-400' : 'text-white'}`}>{fmtEur(totalOverdue)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Pipeline (offertes)</CardTitle>
              <div className="rounded-lg p-2 bg-purple-500/10"><FileText className="h-4 w-4 text-purple-400" /></div>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-white">{fmtEur(pipelineValue)}</div></CardContent>
          </Card>
        </div>
      )}

      {/* Section 4: Today — Planning + Recent Leads */}
      <div className="grid sm:grid-cols-2 gap-4 mt-6">
        {/* Planning vandaag */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-zinc-400" />
              Planning vandaag ({todayEmployees} medewerkers)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayPlanning.length === 0 ? (
              <p className="text-sm text-zinc-400">Niemand ingepland vandaag.</p>
            ) : (
              <div className="space-y-2">
                {todayPlanning.map((entry: any) => (
                  <div key={entry.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium">{entry.employees?.name ?? '—'}</span>
                      <span className="text-zinc-400 mx-1">→</span>
                      <span className="text-zinc-300">{entry.projects?.name ?? '—'}</span>
                    </div>
                    <span className="text-zinc-400">{entry.planned_hours ?? 8}u</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recente leads */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Inbox className="h-4 w-4 text-zinc-400" />
              Recente leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentLeads.length === 0 ? (
              <p className="text-sm text-zinc-400">Nog geen leads.</p>
            ) : (
              <div className="space-y-2">
                {recentLeads.map((lead) => (
                  <Link
                    key={lead.id}
                    href={`/dashboard/leads/${lead.id}`}
                    className="flex items-center justify-between text-sm hover:bg-white/5 rounded px-2 py-1 -mx-2 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          lead.ai_label === 'hot' ? 'bg-red-500' : lead.ai_label === 'warm' ? 'bg-orange-400' : 'bg-zinc-300'
                        }`}
                      />
                      <span className="font-medium">{lead.name}</span>
                    </div>
                    <span className="text-xs text-zinc-400">
                      {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true, locale: nl })}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
