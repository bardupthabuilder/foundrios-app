import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Inbox, TrendingUp, Clock, Star, FolderOpen, CalendarDays, Users } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { DemoSeedBanner } from '@/components/DemoSeedBanner'
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
  ])

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
    { title: 'Leads deze maand', value: totalLeads, icon: Inbox, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Hot leads', value: hotLeads, icon: Star, color: 'text-orange-600', bg: 'bg-orange-50' },
    { title: 'Conversie', value: `${conversionRate}%`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Actieve projecten', value: activeProjects, icon: FolderOpen, color: 'text-green-600', bg: 'bg-green-50' },
  ]

  // Hot leads die actie nodig hebben
  const hotLeadsList = recentLeads.filter((l) => l.ai_label === 'hot' && l.status !== 'won' && l.status !== 'lost')

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
          <p className="text-sm text-zinc-500">Overzicht van je bedrijf</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/leads"><Button variant="outline" size="sm">Lead Inbox</Button></Link>
          <Link href="/dashboard/projecten"><Button size="sm">Projecten</Button></Link>
        </div>
      </div>

      {isEmpty && <DemoSeedBanner />}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-500">{kpi.title}</CardTitle>
                <div className={`rounded-lg p-2 ${kpi.bg}`}>
                  <Icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-zinc-900">{kpi.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Actie-banner voor hot leads */}
      {hotLeadsList.length > 0 && (
        <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100">
                <Star className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-orange-900">
                  {hotLeadsList.length} hot lead{hotLeadsList.length > 1 ? 's' : ''} wacht{hotLeadsList.length === 1 ? '' : 'en'} op actie
                </p>
                <p className="text-xs text-orange-700">
                  {hotLeadsList.map(l => l.name).join(', ')}
                </p>
              </div>
            </div>
            <Link href="/dashboard/leads?label=hot">
              <Button size="sm" variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-100">
                Bekijk
              </Button>
            </Link>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4 mt-6">
        {/* Vandaag geplande projecten */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-zinc-400" />
              Vandaag ingepland ({todayEmployees} medewerkers)
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
                      <span className="text-zinc-600">{entry.projects?.name ?? '—'}</span>
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
                    className="flex items-center justify-between text-sm hover:bg-zinc-50 rounded px-2 py-1 -mx-2 transition-colors"
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
