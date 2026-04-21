'use client'

import { useEffect, useState } from 'react'
import { Bot, Zap, Clock, Hash, TrendingUp, Lock } from 'lucide-react'

interface AgentStats {
  total_runs: number
  success_rate: number
  error_rate: number
  avg_tokens: number
  avg_duration_ms: number
  last_run: string | null
  version: string
}

interface Agent {
  name: string
  label: string
  description: string
  status: 'active' | 'coming_soon'
  model: string
  stats: AgentStats | null
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'net'
  if (mins < 60) return `${mins}m geleden`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}u geleden`
  const days = Math.floor(hours / 24)
  return `${days}d geleden`
}

const STEP_NUMBERS: Record<string, string> = {
  lead_intake: '01',
  qualification: '02',
  conversation: '03',
  booking: '04',
  reactivation: '05',
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAgents() {
      const res = await fetch('/workforce/api/agents')
      if (res.ok) {
        const data = await res.json()
        setAgents(data.agents || [])
      }
      setLoading(false)
    }
    fetchAgents()
  }, [])

  const activeAgents = agents.filter((a) => a.status === 'active')
  const comingSoon = agents.filter((a) => a.status === 'coming_soon')

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Agents</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Je digitale workforce — {activeAgents.length} actief, {comingSoon.length} in ontwikkeling
        </p>
      </div>

      {loading ? (
        <div className="text-neutral-400 text-sm">Laden...</div>
      ) : (
        <div className="space-y-10">
          {/* Active Agents */}
          <div>
            <h2 className="text-xs font-medium uppercase tracking-wide text-indigo-400 mb-4">Actief</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {activeAgents.map((agent) => (
                <div
                  key={agent.name}
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-5 hover:border-indigo-500/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600/15 text-indigo-400">
                        <Bot className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-indigo-400/60">{STEP_NUMBERS[agent.name]}</span>
                          <h3 className="font-semibold">{agent.label}</h3>
                        </div>
                        <p className="text-xs text-neutral-500 mt-0.5">{agent.model.split('-').slice(0, 2).join(' ')}</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Actief
                    </span>
                  </div>

                  <p className="text-sm text-neutral-400 mb-5 leading-relaxed">{agent.description}</p>

                  {agent.stats ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="rounded-lg bg-white/[0.03] px-3 py-2">
                        <div className="flex items-center gap-1.5 text-neutral-500 mb-1">
                          <Hash className="h-3 w-3" />
                          <span className="text-[10px] uppercase tracking-wider">Runs</span>
                        </div>
                        <p className="text-lg font-semibold">{agent.stats.total_runs}</p>
                      </div>
                      <div className="rounded-lg bg-white/[0.03] px-3 py-2">
                        <div className="flex items-center gap-1.5 text-neutral-500 mb-1">
                          <TrendingUp className="h-3 w-3" />
                          <span className="text-[10px] uppercase tracking-wider">Success</span>
                        </div>
                        <p className="text-lg font-semibold">{agent.stats.success_rate}%</p>
                      </div>
                      <div className="rounded-lg bg-white/[0.03] px-3 py-2">
                        <div className="flex items-center gap-1.5 text-neutral-500 mb-1">
                          <Zap className="h-3 w-3" />
                          <span className="text-[10px] uppercase tracking-wider">Tokens</span>
                        </div>
                        <p className="text-lg font-semibold">{agent.stats.avg_tokens}</p>
                      </div>
                      <div className="rounded-lg bg-white/[0.03] px-3 py-2">
                        <div className="flex items-center gap-1.5 text-neutral-500 mb-1">
                          <Clock className="h-3 w-3" />
                          <span className="text-[10px] uppercase tracking-wider">Snelheid</span>
                        </div>
                        <p className="text-lg font-semibold">{(agent.stats.avg_duration_ms / 1000).toFixed(1)}s</p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg bg-white/[0.03] px-4 py-3 text-sm text-neutral-500">
                      Nog geen runs — stuur een test lead om deze agent te activeren.
                    </div>
                  )}

                  {agent.stats?.last_run && (
                    <p className="text-xs text-neutral-600 mt-3">
                      Laatste run: {timeAgo(agent.stats.last_run)} · {agent.stats.version}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Coming Soon */}
          <div>
            <h2 className="text-xs font-medium uppercase tracking-wide text-neutral-500 mb-4">In ontwikkeling</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {comingSoon.map((agent) => (
                <div
                  key={agent.name}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-5 opacity-60"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-800 text-neutral-500">
                      <Lock className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-neutral-600">{STEP_NUMBERS[agent.name]}</span>
                        <h3 className="font-medium text-neutral-300">{agent.label}</h3>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-neutral-500 leading-relaxed">{agent.description}</p>
                  <span className="mt-3 inline-flex rounded-full bg-neutral-800 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-neutral-500">
                    Coming soon
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
