'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ChevronRight, ChevronLeft, Check, X, ExternalLink } from 'lucide-react'
import { parseBudgetCents, formatEuroCents } from '@/lib/parse-budget'

export type PipelineStage =
  | 'nieuw'
  | 'gekwalificeerd'
  | 'afspraak'
  | 'offerte'
  | 'opvolging'
  | 'gewonnen'
  | 'verloren'

export const PIPELINE_STAGES: { key: PipelineStage; label: string; color: string }[] = [
  { key: 'nieuw', label: 'Nieuwe aanvraag', color: 'text-zinc-400' },
  { key: 'gekwalificeerd', label: 'Gekwalificeerd', color: 'text-blue-400' },
  { key: 'afspraak', label: 'Afspraak gepland', color: 'text-purple-400' },
  { key: 'offerte', label: 'Offerte verstuurd', color: 'text-orange-400' },
  { key: 'opvolging', label: 'Opvolgen', color: 'text-yellow-400' },
]

export type PipelineLead = {
  id: string
  name: string
  ai_label: string | null
  ai_summary: string | null
  pipeline_stage: string | null
  budget_estimate: string | null
  phone: string | null
}

export function PipelineBoard({
  initialLeads,
  wonCount,
  lostCount,
}: {
  initialLeads: PipelineLead[]
  wonCount: number
  lostCount: number
}) {
  const router = useRouter()
  const [leads, setLeads] = useState(initialLeads)
  const [dragId, setDragId] = useState<string | null>(null)
  const [overStage, setOverStage] = useState<PipelineStage | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function moveLead(leadId: string, stage: PipelineStage) {
    const previous = leads
    // Optimistisch verplaatsen: het bord moet direct reageren op een sleepactie.
    if (stage === 'gewonnen' || stage === 'verloren') {
      setLeads((current) => current.filter((l) => l.id !== leadId))
    } else {
      setLeads((current) =>
        current.map((l) => (l.id === leadId ? { ...l, pipeline_stage: stage } : l))
      )
    }
    setError(null)

    const res = await fetch(`/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pipeline_stage: stage }),
    })

    if (!res.ok) {
      setLeads(previous)
      setError('Verplaatsen mislukt. Probeer opnieuw.')
      return
    }

    // Gewonnen/verloren verlaat het bord — tellers hertellen op de server.
    if (stage === 'gewonnen' || stage === 'verloren') router.refresh()
  }

  function stageIndex(stage: string | null) {
    const i = PIPELINE_STAGES.findIndex((s) => s.key === stage)
    return i === -1 ? 0 : i
  }

  // Het aantal kaarten zegt waar de drukte zit; het bedrag zegt waar het geld zit.
  const totalCents = leads.reduce((sum, l) => sum + (parseBudgetCents(l.budget_estimate) ?? 0), 0)
  const withBudget = leads.filter((l) => parseBudgetCents(l.budget_estimate) !== null).length

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-display)]">Pipeline</h1>
        <p className="text-sm text-zinc-400">
          {leads.length} actieve aanvragen &middot; {wonCount} gewonnen &middot; {lostCount} verloren
        </p>
        {totalCents > 0 && (
          <p className="mt-1 text-sm text-foundri-yellow">
            {formatEuroCents(totalCents)} in de pipeline
            {withBudget < leads.length && (
              <span className="text-zinc-500"> — van {withBudget} van de {leads.length} aanvragen is het budget bekend</span>
            )}
          </p>
        )}
        <p className="mt-1 text-xs text-zinc-500">
          Sleep een kaart naar een volgende kolom, of gebruik de pijltjes.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 240px)' }}>
        {PIPELINE_STAGES.map((stage) => {
          const stageLeads = leads.filter(
            (l) => (l.pipeline_stage ?? 'nieuw') === stage.key
          )
          const idx = stageIndex(stage.key)
          const stageCents = stageLeads.reduce(
            (sum, l) => sum + (parseBudgetCents(l.budget_estimate) ?? 0), 0
          )

          return (
            <div
              key={stage.key}
              onDragOver={(e) => {
                e.preventDefault()
                setOverStage(stage.key)
              }}
              onDragLeave={() => setOverStage((s) => (s === stage.key ? null : s))}
              onDrop={(e) => {
                e.preventDefault()
                setOverStage(null)
                if (dragId) moveLead(dragId, stage.key)
                setDragId(null)
              }}
              className={cn(
                'flex h-full w-72 shrink-0 flex-col rounded-lg border bg-foundri-deep transition-colors',
                overStage === stage.key
                  ? 'border-foundri-yellow/50 bg-foundri-yellow/5'
                  : 'border-white/5'
              )}
            >
              <div className="border-b border-white/5 px-4 py-3">
                <div className="flex items-center justify-between">
                  <h3 className={cn('text-sm font-semibold', stage.color)}>{stage.label}</h3>
                  <span className="text-xs text-zinc-500">{stageLeads.length}</span>
                </div>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {stageCents > 0 ? formatEuroCents(stageCents) : '—'}
                </p>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto p-2">
                {stageLeads.length === 0 && (
                  <p className="px-2 py-6 text-center text-xs text-zinc-600">Geen aanvragen</p>
                )}

                {stageLeads.map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={() => setDragId(lead.id)}
                    onDragEnd={() => setDragId(null)}
                    className={cn(
                      'group rounded-lg border border-white/5 bg-foundri-surface p-3 transition-colors hover:border-white/10',
                      dragId === lead.id && 'opacity-50'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'h-2 w-2 shrink-0 rounded-full',
                          lead.ai_label === 'hot'
                            ? 'bg-red-400'
                            : lead.ai_label === 'warm'
                              ? 'bg-orange-400'
                              : 'bg-zinc-500'
                        )}
                      />
                      <span className="flex-1 truncate text-sm font-medium text-white">{lead.name}</span>
                      <Link
                        href={`/dashboard/leads/${lead.id}`}
                        className="text-zinc-600 opacity-0 transition-opacity hover:text-zinc-300 group-hover:opacity-100"
                        title="Open aanvraag"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>

                    {lead.ai_summary && (
                      <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{lead.ai_summary}</p>
                    )}
                    {lead.budget_estimate && (
                      <p className="mt-1 text-xs text-foundri-yellow">{lead.budget_estimate}</p>
                    )}

                    {/* Stap-knoppen: op mobiel werkt slepen niet, hier wel. */}
                    <div className="mt-2 flex items-center gap-1 border-t border-white/5 pt-2">
                      <button
                        onClick={() => moveLead(lead.id, PIPELINE_STAGES[idx - 1].key)}
                        disabled={idx === 0}
                        className="rounded p-1 text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-300 disabled:invisible"
                        title="Stap terug"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => moveLead(lead.id, PIPELINE_STAGES[idx + 1].key)}
                        disabled={idx >= PIPELINE_STAGES.length - 1}
                        className="rounded p-1 text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-300 disabled:invisible"
                        title="Stap verder"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                      <div className="flex-1" />
                      <button
                        onClick={() => moveLead(lead.id, 'gewonnen')}
                        className="rounded p-1 text-zinc-500 transition-colors hover:bg-green-500/10 hover:text-green-400"
                        title="Gewonnen"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => moveLead(lead.id, 'verloren')}
                        className="rounded p-1 text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                        title="Verloren"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
