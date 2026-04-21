'use client'

import { useEffect, useState } from 'react'
import type { FwAgentRun } from '@/lib/workforce/types'

const STATUS_COLORS: Record<string, string> = {
  running: 'bg-yellow-500/20 text-yellow-400',
  success: 'bg-green-500/20 text-green-400',
  error: 'bg-red-500/20 text-red-400',
  fallback: 'bg-orange-500/20 text-orange-400',
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'net'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}u`
  return `${Math.floor(hours / 24)}d`
}

export default function WorkforceRunsPage() {
  const [runs, setRuns] = useState<FwAgentRun[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRuns() {
      const res = await fetch('/workforce/api/agent-runs')
      if (res.ok) {
        const data = await res.json()
        setRuns(data.runs || [])
      }
      setLoading(false)
    }
    fetchRuns()
    const interval = setInterval(fetchRuns, 10000)
    return () => clearInterval(interval)
  }, [])

  const totalTokens = runs.reduce(
    (sum, r) => sum + (r.tokens_input || 0) + (r.tokens_output || 0),
    0
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Agent Runs</h1>
          <p className="text-sm text-neutral-400 mt-1">
            {runs.length} runs — {totalTokens.toLocaleString()} tokens totaal
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-neutral-400 text-sm">Laden...</div>
      ) : runs.length === 0 ? (
        <div className="border border-white/10 rounded-xl p-12 text-center">
          <p className="text-neutral-400">Nog geen agent runs.</p>
          <p className="text-sm text-neutral-500 mt-2">
            Stuur een lead via het dashboard om agents te triggeren.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {runs.map((run) => (
            <div key={run.id} className="border border-white/10 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === run.id ? null : run.id)}
                className="w-full px-4 py-3 flex items-center justify-between text-sm hover:bg-white/5 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[run.status] || ''}`}>
                    {run.status}
                  </span>
                  <span className="font-medium">{run.agent_name}</span>
                  <span className="text-neutral-500">{run.agent_version}</span>
                </div>
                <div className="flex items-center gap-4 text-neutral-400">
                  {run.duration_ms && <span className="text-xs">{run.duration_ms}ms</span>}
                  {run.tokens_input && run.tokens_output && (
                    <span className="text-xs">{run.tokens_input + run.tokens_output} tok</span>
                  )}
                  <span className="text-xs">{timeAgo(run.created_at)}</span>
                  <span className="text-neutral-600">{expanded === run.id ? '\u25B2' : '\u25BC'}</span>
                </div>
              </button>

              {expanded === run.id && (
                <div className="px-4 pb-4 space-y-3 border-t border-white/10">
                  {run.tools_called && run.tools_called.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-neutral-400 mb-1 font-medium">
                        Skills aangeroepen ({run.tools_called.length})
                      </p>
                      <div className="space-y-1">
                        {run.tools_called.map((tool, i) => (
                          <div key={i} className="bg-neutral-800 rounded px-3 py-2 text-xs">
                            <span className="text-indigo-400 font-medium">{tool.name}</span>
                            <pre className="text-neutral-400 mt-1 overflow-x-auto">
                              {JSON.stringify(tool.input, null, 2)}
                            </pre>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {run.output && (
                    <div>
                      <p className="text-xs text-neutral-400 mb-1 font-medium">Output</p>
                      <pre className="bg-neutral-800 rounded px-3 py-2 text-xs text-neutral-300 overflow-x-auto">
                        {JSON.stringify(run.output, null, 2)}
                      </pre>
                    </div>
                  )}

                  {run.error && (
                    <div>
                      <p className="text-xs text-red-400 mb-1 font-medium">Error</p>
                      <pre className="bg-red-500/10 rounded px-3 py-2 text-xs text-red-300">{run.error}</pre>
                    </div>
                  )}

                  <div className="flex gap-4 text-xs text-neutral-500 pt-2">
                    <span>Model: {run.model}</span>
                    <span>Input: {run.tokens_input} tokens</span>
                    <span>Output: {run.tokens_output} tokens</span>
                    <span>Duur: {run.duration_ms}ms</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
