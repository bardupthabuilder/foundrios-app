'use client'

import { useEffect, useState } from 'react'
import { Bot, Zap, Clock, Hash, TrendingUp, Lock, Settings, ToggleLeft } from 'lucide-react'

interface AgentStats {
  total_runs: number
  success_rate: number
  error_rate: number
  avg_tokens: number
  avg_duration_ms: number
  last_run: string | null
}

interface Agent {
  id: string
  slug: string
  name: string
  description: string
  tier: 'basis' | 'next_level' | 'enterprise' | 'upsell'
  category: string
  pricing_monthly: number
  features: string[]
  status: 'concept' | 'in_build' | 'active' | 'archived'
  active: boolean
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

const tierLabels: Record<string, string> = {
  basis: 'Basis (Inbegrepen)',
  next_level: 'Next Level',
  enterprise: 'Enterprise',
  upsell: 'Upsells',
}

const tierColors: Record<string, string> = {
  basis: 'emerald',
  next_level: 'blue',
  enterprise: 'purple',
  upsell: 'amber',
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [activatingId, setActivatingId] = useState<string | null>(null)
  const [selectedTier, setSelectedTier] = useState<'basis' | 'next_level' | 'enterprise' | 'upsell'>('basis')

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

  async function toggleAgent(agent: Agent) {
    setActivatingId(agent.id)
    try {
      const res = await fetch('/workforce/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: agent.id, active: !agent.active }),
      })
      if (res.ok) {
        setAgents((prev) =>
          prev.map((a) =>
            a.id === agent.id ? { ...a, active: !a.active } : a
          )
        )
      }
    } catch (err) {
      console.error('Failed to toggle agent:', err)
    } finally {
      setActivatingId(null)
    }
  }

  const tiers: Array<'basis' | 'next_level' | 'enterprise' | 'upsell'> = ['basis', 'next_level', 'enterprise', 'upsell']
  const agentsByTier = tiers.reduce(
    (acc, tier) => {
      acc[tier] = agents.filter((a) => a.tier === tier)
      return acc
    },
    {} as Record<'basis' | 'next_level' | 'enterprise' | 'upsell', Agent[]>
  )

  const currentAgents = agentsByTier[selectedTier]
  const totalActive = agents.filter((a) => a.active).length

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Agents</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Je digitale workforce — {totalActive} geactiveerd
        </p>
      </div>

      {/* Tier Tabs */}
      <div className="flex gap-2 mb-8 border-b border-white/10">
        {tiers.map((tier) => (
          <button
            key={tier}
            onClick={() => setSelectedTier(tier)}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              selectedTier === tier
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-300'
            }`}
          >
            {tierLabels[tier]}
            <span className="ml-2 text-xs text-neutral-500">
              ({agentsByTier[tier].filter((a) => a.status === 'active').length})
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-neutral-400 text-sm">Laden...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {currentAgents.length === 0 ? (
            <div className="text-neutral-500 text-sm col-span-full">
              Geen agents in dit tier.
            </div>
          ) : (
            currentAgents.map((agent) => {
              const color = tierColors[agent.tier]
              const isActive = agent.status === 'active' || agent.status === 'in_build'
              const statusColor = agent.status === 'active' ? 'emerald' : agent.status === 'in_build' ? 'amber' : 'neutral'

              return (
                <div
                  key={agent.id}
                  className={`rounded-xl border p-5 transition-colors ${
                    isActive
                      ? 'border-white/10 bg-white/[0.02] hover:border-indigo-500/30'
                      : 'border-white/5 bg-white/[0.01] opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-${color}-600/15 text-${color}-400`}>
                        <Bot className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{agent.name}</h3>
                        <p className="text-xs text-neutral-500 mt-0.5">{agent.category}</p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${
                        agent.status === 'active'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : agent.status === 'in_build'
                            ? 'bg-amber-500/15 text-amber-400'
                            : 'bg-neutral-800 text-neutral-500'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${agent.status === 'active' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                      {agent.status === 'active' ? 'Actief' : agent.status === 'in_build' ? 'In bouw' : 'Concept'}
                    </span>
                  </div>

                  <p className="text-sm text-neutral-400 mb-4 leading-relaxed">{agent.description}</p>

                  {/* Features */}
                  {agent.features && agent.features.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-1">
                      {agent.features.slice(0, 3).map((feature, i) => (
                        <span key={i} className="inline-block text-xs px-2 py-1 rounded bg-white/5 text-neutral-400">
                          {feature}
                        </span>
                      ))}
                      {agent.features.length > 3 && (
                        <span className="inline-block text-xs px-2 py-1 text-neutral-500">
                          +{agent.features.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  {agent.stats && agent.active ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
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
                  ) : null}

                  {/* Actions */}
                  <div className="flex gap-2 items-center pt-4 border-t border-white/5">
                    <button
                      onClick={() => toggleAgent(agent)}
                      disabled={activatingId === agent.id || !isActive}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex-1 ${
                        agent.active
                          ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
                          : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <ToggleLeft className="h-4 w-4" />
                      {agent.active ? 'Actief' : 'Inactief'}
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-neutral-400 hover:text-neutral-300 hover:bg-white/5 transition-colors disabled:opacity-50"
                      disabled={!isActive}
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                  </div>

                  {agent.pricing_monthly > 0 && (
                    <p className="text-xs text-neutral-500 mt-3">
                      €{agent.pricing_monthly}/maand
                    </p>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
