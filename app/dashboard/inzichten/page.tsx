'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Minus, Brain, Loader2 } from 'lucide-react'

interface IntelligenceData {
  period: string
  leads: { total: number; won: number; trend: number }
  conversion: { current: number; previous: number; trend: number }
  leadSources: { source: string; total: number; won: number; conversion: number }[]
  pipelineStages: Record<string, number>
  revenue: { total: number; avgDeal: number }
  quotes: { total: number; accepted: number; conversion: number }
  capacity: { avgWeeklyHours: number }
  recommendations: { title: string; description: string; priority: 'high' | 'medium' | 'low' }[]
}

const stageLabels: Record<string, string> = {
  nieuw: 'Nieuw',
  contact: 'Contact',
  afspraak: 'Afspraak',
  offerte: 'Offerte',
  onderhandeling: 'Onderhandeling',
  gewonnen: 'Gewonnen',
  verloren: 'Verloren',
}

const stageColors: Record<string, string> = {
  nieuw: 'bg-blue-500',
  contact: 'bg-cyan-500',
  afspraak: 'bg-amber-500',
  offerte: 'bg-purple-500',
  onderhandeling: 'bg-orange-500',
  gewonnen: 'bg-green-500',
  verloren: 'bg-red-500',
}

const priorityColors: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-orange-500',
  low: 'bg-green-500',
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(cents / 100)
}

function TrendIndicator({ value, suffix = '' }: { value: number; suffix?: string }) {
  if (value > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-sm text-green-400">
        <TrendingUp className="h-3.5 w-3.5" />
        +{value}{suffix}
      </span>
    )
  }
  if (value < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-sm text-red-400">
        <TrendingDown className="h-3.5 w-3.5" />
        {value}{suffix}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-sm text-zinc-500">
      <Minus className="h-3.5 w-3.5" />
      0{suffix}
    </span>
  )
}

export default function InzichtenPage() {
  const [data, setData] = useState<IntelligenceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/intelligence')
      .then(r => {
        if (!r.ok) throw new Error('Kan inzichten niet laden')
        return r.json()
      })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
          <p className="text-sm text-zinc-500">Inzichten laden...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[60vh]">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    )
  }

  if (!data || (data.leads.total === 0 && data.revenue.total === 0 && data.quotes.total === 0)) {
    return (
      <div className="space-y-6 p-6 lg:p-8">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-white">Inzichten</h1>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/5 bg-foundri-deep p-16">
          <Brain className="h-12 w-12 text-zinc-600 mb-4" />
          <p className="text-zinc-400 text-center max-w-md">
            Begin met het vastleggen van leads, offertes en facturen om inzichten te krijgen.
          </p>
        </div>
      </div>
    )
  }

  const maxPipelineCount = Math.max(...Object.values(data.pipelineStages), 1)

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-white">Inzichten</h1>
        <span className="inline-flex items-center rounded-full bg-foundri-deep border border-white/5 px-3 py-1 text-xs font-medium text-zinc-400">
          Laatste 30 dagen
        </span>
      </div>

      {/* Row 1: KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Leads */}
        <div className="rounded-xl border border-white/5 bg-foundri-deep p-5">
          <p className="text-sm font-medium text-zinc-400">Leads</p>
          <p className="mt-2 text-3xl font-bold text-foundri-yellow">{data.leads.total}</p>
          <div className="mt-1">
            <TrendIndicator value={data.leads.trend} suffix=" vs vorige" />
          </div>
        </div>

        {/* Conversie */}
        <div className="rounded-xl border border-white/5 bg-foundri-deep p-5">
          <p className="text-sm font-medium text-zinc-400">Conversie</p>
          <p className="mt-2 text-3xl font-bold text-foundri-yellow">{data.conversion.current}%</p>
          <div className="mt-1">
            <TrendIndicator value={data.conversion.trend} suffix="%" />
          </div>
        </div>

        {/* Omzet */}
        <div className="rounded-xl border border-white/5 bg-foundri-deep p-5">
          <p className="text-sm font-medium text-zinc-400">Omzet</p>
          <p className="mt-2 text-3xl font-bold text-foundri-yellow">{formatCurrency(data.revenue.total)}</p>
          <p className="mt-1 text-sm text-zinc-500">betaald deze periode</p>
        </div>

        {/* Gem. dealwaarde */}
        <div className="rounded-xl border border-white/5 bg-foundri-deep p-5">
          <p className="text-sm font-medium text-zinc-400">Gem. dealwaarde</p>
          <p className="mt-2 text-3xl font-bold text-foundri-yellow">{formatCurrency(data.revenue.avgDeal)}</p>
          <p className="mt-1 text-sm text-zinc-500">per factuur</p>
        </div>
      </div>

      {/* Row 2: Lead Sources + Pipeline */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Lead Source Performance */}
        <div className="rounded-xl border border-white/5 bg-foundri-deep p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4">Leadbron prestaties</h2>
          {data.leadSources.length === 0 ? (
            <p className="text-sm text-zinc-500">Geen leadbronnen gevonden.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="pb-2 text-left text-xs font-medium text-zinc-500">Bron</th>
                  <th className="pb-2 text-right text-xs font-medium text-zinc-500">Leads</th>
                  <th className="pb-2 text-right text-xs font-medium text-zinc-500">Conversie</th>
                </tr>
              </thead>
              <tbody>
                {data.leadSources.map((src) => (
                  <tr key={src.source} className="border-b border-white/5 last:border-0">
                    <td className="py-3 text-sm text-white capitalize">{src.source.replace(/_/g, ' ')}</td>
                    <td className="py-3 text-right text-sm text-zinc-300">{src.total}</td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-1.5 w-16 rounded-full bg-foundri-card overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#F5A623]"
                            style={{ width: `${Math.min(src.conversion, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm text-zinc-300 w-10 text-right">{src.conversion}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pipeline Distribution */}
        <div className="rounded-xl border border-white/5 bg-foundri-deep p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4">Pipeline verdeling</h2>
          {Object.keys(data.pipelineStages).length === 0 ? (
            <p className="text-sm text-zinc-500">Geen pipeline data.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(data.pipelineStages).map(([stage, count]) => (
                <div key={stage} className="flex items-center gap-3">
                  <span className="w-28 text-sm text-zinc-300 truncate">{stageLabels[stage] || stage}</span>
                  <div className="flex-1 h-2 rounded-full bg-foundri-card overflow-hidden">
                    <div
                      className={`h-full rounded-full ${stageColors[stage] || 'bg-zinc-500'}`}
                      style={{ width: `${(count / maxPipelineCount) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-sm font-medium text-white">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 3: AI Recommendations */}
      {data.recommendations.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-3">AI Aanbevelingen</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.recommendations.map((rec, i) => (
              <div key={i} className="rounded-xl border border-white/5 bg-foundri-deep p-4">
                <div className="flex items-start gap-3">
                  <div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${priorityColors[rec.priority]}`} />
                  <div>
                    <p className="text-sm font-semibold text-white">{rec.title}</p>
                    <p className="mt-1 text-sm text-zinc-400">{rec.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Row 4: Quote Conversion + Capacity */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Offerte conversie */}
        <div className="rounded-xl border border-white/5 bg-foundri-deep p-5">
          <p className="text-sm font-medium text-zinc-400">Offerte conversie</p>
          <p className="mt-2 text-3xl font-bold text-foundri-yellow">{data.quotes.conversion}%</p>
          <p className="mt-1 text-sm text-zinc-500">
            {data.quotes.accepted} van {data.quotes.total} offertes geaccepteerd
          </p>
        </div>

        {/* Capaciteit */}
        <div className="rounded-xl border border-white/5 bg-foundri-deep p-5">
          <p className="text-sm font-medium text-zinc-400">Capaciteit</p>
          <p className="mt-2 text-3xl font-bold text-foundri-yellow">{data.capacity.avgWeeklyHours}</p>
          <p className="mt-1 text-sm text-zinc-500">gem. uren/week ingeboekt</p>
        </div>
      </div>
    </div>
  )
}
