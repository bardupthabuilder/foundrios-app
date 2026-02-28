import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Inbox, TrendingUp, Clock, Star } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'
import { nl } from 'date-fns/locale'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { tenantId } = await requireTenant()

  // Haal KPI data op
  const [leadsResult, hotLeadsResult, recentLeadsResult] = await Promise.all([
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
  ])

  const totalLeads = leadsResult.count ?? 0
  const hotLeads = hotLeadsResult.count ?? 0
  const wonLeads = leadsResult.data?.filter((l) => l.status === 'won').length ?? 0
  const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0
  const recentLeads = recentLeadsResult.data ?? []

  const kpis = [
    {
      title: 'Leads deze maand',
      value: totalLeads,
      icon: Inbox,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Hot leads',
      value: hotLeads,
      icon: Star,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      title: 'Conversie',
      value: `${conversionRate}%`,
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: 'Gewonnen deals',
      value: wonLeads,
      icon: Clock,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ]

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
          <p className="text-sm text-zinc-500">Overzicht van de afgelopen 30 dagen</p>
        </div>
        <Link href="/dashboard/leads">
          <Button>Naar Lead Inbox</Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-500">
                  {kpi.title}
                </CardTitle>
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

      {/* Recente leads */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recente leads</CardTitle>
          </CardHeader>
          <CardContent>
            {recentLeads.length === 0 ? (
              <p className="text-sm text-zinc-400">
                Nog geen leads. Koppel WhatsApp of een formulier om te starten.
              </p>
            ) : (
              <div className="space-y-3">
                {recentLeads.map((lead) => (
                  <Link
                    key={lead.id}
                    href={`/dashboard/leads/${lead.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-zinc-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          lead.ai_label === 'hot'
                            ? 'bg-red-500'
                            : lead.ai_label === 'warm'
                            ? 'bg-orange-400'
                            : 'bg-zinc-300'
                        }`}
                      />
                      <span className="text-sm font-medium text-zinc-900">{lead.name}</span>
                    </div>
                    <span className="text-xs text-zinc-400">
                      {formatDistanceToNow(new Date(lead.created_at), {
                        addSuffix: true,
                        locale: nl,
                      })}
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
