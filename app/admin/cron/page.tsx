'use client'

import { useState, useEffect, useCallback } from 'react'
import { Play, RefreshCw, CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface CronLog {
  id: string
  job_name: string
  status: string
  details: Record<string, unknown> | null
  started_at: string
  finished_at: string | null
}

export default function CronPage() {
  const [logs, setLogs] = useState<CronLog[]>([])
  const [loading, setLoading] = useState(true)
  const [triggering, setTriggering] = useState(false)
  const [triggerResult, setTriggerResult] = useState('')

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/cron')
    if (res.ok) {
      const data = await res.json()
      setLogs(data.logs)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  async function triggerJob() {
    setTriggering(true)
    setTriggerResult('')
    try {
      const res = await fetch('/api/cron/execute')
      const data = await res.json()
      if (res.ok) {
        setTriggerResult(`Klaar: ${data.notificationsCreated} notificaties, ${data.snapshotsCreated} snapshots`)
        fetchLogs()
      } else {
        setTriggerResult(`Fout: ${data.error}`)
      }
    } catch (err) {
      setTriggerResult(`Fout: ${String(err)}`)
    }
    setTriggering(false)
  }

  function statusIcon(status: string) {
    if (status === 'success') return <CheckCircle className="h-4 w-4 text-green-400" />
    if (status === 'failed') return <XCircle className="h-4 w-4 text-red-400" />
    return <Loader2 className="h-4 w-4 animate-spin text-orange-400" />
  }

  function statusBadge(status: string) {
    if (status === 'success') return 'bg-green-500/20 text-green-400'
    if (status === 'failed') return 'bg-red-500/20 text-red-400'
    return 'bg-orange-500/20 text-orange-400'
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-white">Cron Jobs</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogs}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-sm text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Vernieuwen
          </button>
          <button
            onClick={triggerJob}
            disabled={triggering}
            className="flex items-center gap-1.5 rounded-lg bg-foundri-yellow px-3 py-1.5 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5" />
            {triggering ? 'Bezig...' : 'Handmatig draaien'}
          </button>
        </div>
      </div>

      {triggerResult && (
        <div className={`rounded-lg border px-4 py-2 text-sm ${
          triggerResult.startsWith('Fout') ? 'border-red-500/20 bg-red-500/10 text-red-400' : 'border-green-500/20 bg-green-500/10 text-green-400'
        }`}>
          {triggerResult}
        </div>
      )}

      {/* Schedule info */}
      <div className="rounded-lg border border-white/5 bg-foundri-deep p-4">
        <h3 className="text-sm font-medium text-white">Schema</h3>
        <div className="mt-2 flex items-center gap-3">
          <span className="rounded bg-white/5 px-2 py-0.5 font-mono text-xs text-zinc-400">0 6 * * *</span>
          <span className="text-sm text-zinc-400">Dagelijks om 06:00 UTC</span>
        </div>
        <p className="mt-1 text-xs text-zinc-500">daily_automations: stale lead notificaties + revenue snapshots</p>
      </div>

      {/* Log entries */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-white">Laatste runs</h2>
        {loading ? (
          <p className="text-sm text-zinc-500">Laden...</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-zinc-500">Nog geen cron runs</p>
        ) : (
          <div className="rounded-lg border border-white/5 bg-foundri-deep divide-y divide-white/5">
            {logs.map(log => (
              <div key={log.id} className="flex items-start justify-between px-4 py-3">
                <div className="flex items-start gap-3">
                  {statusIcon(log.status)}
                  <div>
                    <p className="text-sm font-medium text-white">{log.job_name}</p>
                    <p className="text-xs text-zinc-500">
                      {new Date(log.started_at).toLocaleString('nl-NL')}
                      {log.finished_at && (
                        <> &middot; {Math.round((new Date(log.finished_at).getTime() - new Date(log.started_at).getTime()) / 1000)}s</>
                      )}
                    </p>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <p className="mt-1 text-xs text-zinc-500">
                        {Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join(' | ')}
                      </p>
                    )}
                  </div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs ${statusBadge(log.status)}`}>{log.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
