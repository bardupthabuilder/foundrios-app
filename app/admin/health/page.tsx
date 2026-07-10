import { createServiceClient } from '@/lib/supabase/server'
import { requireSuperadmin } from '@/lib/admin'
import { redirect } from 'next/navigation'
import { Heart, AlertTriangle, CheckCircle2, Database, Zap, Clock } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import { KPICard } from '@/components/admin/KPICard'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getHealthData() {
  const sb = createServiceClient() as any

  const [automationsRes, automationFailedRes, cronRes, recentErrorsRes, dbCheckRes] = await Promise.all([
    sb.from('automation_log').select('id', { count: 'exact', head: true }).gte('executed_at', new Date(Date.now() - 24 * 3600000).toISOString()),
    sb.from('automation_log').select('id', { count: 'exact', head: true }).gte('executed_at', new Date(Date.now() - 24 * 3600000).toISOString()).eq('result', 'failed'),
    sb.from('cron_log').select('id, job_name, status, started_at, finished_at, details').order('started_at', { ascending: false }).limit(10),
    sb.from('automation_log').select('id, trigger_type, action_type, target_type, details, executed_at').eq('result', 'failed').order('executed_at', { ascending: false }).limit(10),
    sb.from('tenants').select('id', { count: 'exact', head: true }).limit(1),
  ])

  return {
    automations24h: automationsRes.count ?? 0,
    automationsFailed24h: automationFailedRes.count ?? 0,
    cronLogs: cronRes.data ?? [],
    recentErrors: recentErrorsRes.data ?? [],
    dbReachable: !dbCheckRes.error,
  }
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default async function HealthPage() {
  try { await requireSuperadmin() } catch { redirect('/dashboard') }
  const data = await getHealthData()

  const automationSuccessRate = data.automations24h > 0
    ? Math.round(((data.automations24h - data.automationsFailed24h) / data.automations24h) * 100)
    : 100

  return (
    <div className="space-y-6">
      <PageHeader
        title="Health"
        description="System status, automations en errors van de laatste 24 uur"
      />

      {/* Status grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard
          label="Database"
          value={data.dbReachable ? 'OK' : 'Down'}
          icon={Database}
          accent={data.dbReachable ? 'green' : 'red'}
        />
        <KPICard
          label="Automations 24u"
          value={data.automations24h}
          icon={Zap}
          accent="blue"
        />
        <KPICard
          label="Success rate"
          value={`${automationSuccessRate}%`}
          sublabel={`${data.automationsFailed24h} failed`}
          icon={CheckCircle2}
          accent={automationSuccessRate >= 95 ? 'green' : automationSuccessRate >= 80 ? 'amber' : 'red'}
        />
        <KPICard
          label="Errors 24u"
          value={data.automationsFailed24h}
          icon={AlertTriangle}
          accent={data.automationsFailed24h === 0 ? 'green' : data.automationsFailed24h < 5 ? 'amber' : 'red'}
        />
      </div>

      {/* Cron logs */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Cron jobs (laatste 10)
        </h2>
        <div className="rounded-xl border border-white/5 bg-foundri-deep overflow-hidden">
          {data.cronLogs.length === 0 ? (
            <div className="p-6 text-sm text-zinc-500 text-center">Geen cron-logs beschikbaar</div>
          ) : (
            <ul className="divide-y divide-white/5">
              {data.cronLogs.map((log: any) => {
                const details = log.details ? (typeof log.details === 'string' ? log.details : JSON.stringify(log.details).slice(0, 80)) : null
                return (
                  <li key={log.id} className="px-5 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {log.status === 'success' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-200 truncate">{log.job_name}</p>
                        {details && <p className="text-xs text-zinc-500 truncate mt-0.5">{details}</p>}
                      </div>
                    </div>
                    <span className="text-xs text-zinc-500 shrink-0">{formatTime(log.started_at)}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Recent errors */}
      {data.recentErrors.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            Recente errors
          </h2>
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 overflow-hidden">
            <ul className="divide-y divide-red-500/10">
              {data.recentErrors.map((err: any) => (
                <li key={err.id} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <p className="text-sm font-medium text-red-300">
                      {err.trigger_type} → {err.action_type}
                    </p>
                    <span className="text-xs text-zinc-500 shrink-0">{formatTime(err.executed_at)}</span>
                  </div>
                  {err.details && (
                    <pre className="text-xs text-zinc-400 mt-1 overflow-x-auto">
                      {typeof err.details === 'string' ? err.details : JSON.stringify(err.details, null, 2).slice(0, 200)}
                    </pre>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Health legenda */}
      <div className="rounded-xl border border-white/5 bg-foundri-deep p-5">
        <div className="flex items-center gap-2 mb-3">
          <Heart className="h-4 w-4 text-rose-400" />
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Wat te doen bij problemen</h3>
        </div>
        <ul className="text-sm text-zinc-400 space-y-1.5">
          <li><strong className="text-zinc-300">Database down:</strong> check Supabase dashboard, mogelijk planmatig onderhoud</li>
          <li><strong className="text-zinc-300">Success rate &lt;95%:</strong> bekijk recente errors hieronder, identificeer patroon</li>
          <li><strong className="text-zinc-300">Errors &gt;5 per 24u:</strong> investigate trigger_type, mogelijk integratie offline</li>
          <li><strong className="text-zinc-300">Cron failed:</strong> check Vercel cron logs voor stack trace</li>
        </ul>
      </div>
    </div>
  )
}
