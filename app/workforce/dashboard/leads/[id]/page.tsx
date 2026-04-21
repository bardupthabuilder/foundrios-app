'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, User, Building2, MapPin, Briefcase, DollarSign, Zap, Clock } from 'lucide-react'
import type { FwLead, FwAgentRun } from '@/lib/workforce/types'

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-400',
  qualified: 'bg-green-500/20 text-green-400',
  conversation: 'bg-yellow-500/20 text-yellow-400',
  booking: 'bg-purple-500/20 text-purple-400',
  booked: 'bg-emerald-500/20 text-emerald-400',
  rejected: 'bg-red-500/20 text-red-400',
  reactivation: 'bg-orange-500/20 text-orange-400',
}

const QUAL_COLORS: Record<string, string> = {
  hot: 'bg-red-500/20 text-red-400 border-red-500/30',
  warm: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  cold: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  reject: 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30',
}

const RUN_STATUS_COLORS: Record<string, string> = {
  running: 'bg-yellow-500/20 text-yellow-400',
  success: 'bg-green-500/20 text-green-400',
  error: 'bg-red-500/20 text-red-400',
  fallback: 'bg-orange-500/20 text-orange-400',
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 text-neutral-500 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-neutral-500">{label}</p>
        <p className="text-sm">{value || <span className="text-neutral-600">—</span>}</p>
      </div>
    </div>
  )
}

export default function LeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [lead, setLead] = useState<FwLead | null>(null)
  const [runs, setRuns] = useState<FwAgentRun[]>([])
  const [loading, setLoading] = useState(true)
  const [showRaw, setShowRaw] = useState(false)

  useEffect(() => {
    async function fetchLead() {
      const res = await fetch(`/workforce/api/leads/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setLead(data.lead)
        setRuns(data.runs || [])
      }
      setLoading(false)
    }
    if (params.id) fetchLead()
  }, [params.id])

  if (loading) {
    return <div className="text-neutral-400 text-sm">Laden...</div>
  }

  if (!lead) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-400">Lead niet gevonden.</p>
        <button onClick={() => router.push('/workforce/dashboard')} className="mt-4 text-sm text-indigo-400 hover:underline">
          Terug naar overzicht
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      {/* Back + Header */}
      <button
        onClick={() => router.push('/workforce/dashboard')}
        className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white transition-colors mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Terug naar leads
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">{lead.name || 'Onbekende lead'}</h1>
          <p className="text-sm text-neutral-400 mt-1">
            {lead.company || 'Geen bedrijf'} · Binnengekomen {formatDate(lead.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${STATUS_COLORS[lead.status] || ''}`}>
            {lead.status}
          </span>
          {lead.qualification && (
            <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${QUAL_COLORS[lead.qualification] || ''}`}>
              {lead.qualification}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Info */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-xl border border-white/10 p-4">
            <h2 className="text-sm font-medium text-neutral-400 mb-3">Lead informatie</h2>
            <div className="divide-y divide-white/[0.06]">
              <InfoRow icon={User} label="Naam" value={lead.name} />
              <InfoRow icon={Building2} label="Bedrijf" value={lead.company} />
              <InfoRow icon={Briefcase} label="Dienst" value={lead.service} />
              <InfoRow icon={MapPin} label="Regio" value={lead.region} />
              <InfoRow icon={DollarSign} label="Budget" value={lead.budget} />
              <InfoRow icon={Zap} label="Urgentie" value={lead.urgency} />
              <InfoRow icon={Clock} label="Bron" value={lead.source} />
            </div>
            {lead.email && (
              <p className="mt-3 text-sm">
                <span className="text-neutral-500">E-mail:</span>{' '}
                <a href={`mailto:${lead.email}`} className="text-indigo-400 hover:underline">{lead.email}</a>
              </p>
            )}
            {lead.phone && (
              <p className="text-sm mt-1">
                <span className="text-neutral-500">Telefoon:</span>{' '}
                <a href={`tel:${lead.phone}`} className="text-indigo-400 hover:underline">{lead.phone}</a>
              </p>
            )}
          </div>

          {/* Notes */}
          {lead.notes && (
            <div className="rounded-xl border border-white/10 p-4">
              <h2 className="text-sm font-medium text-neutral-400 mb-2">Notities</h2>
              <p className="text-sm text-neutral-300 whitespace-pre-wrap">{lead.notes}</p>
            </div>
          )}

          {/* Raw data */}
          {lead.raw_data && (
            <div className="rounded-xl border border-white/10 p-4">
              <button
                onClick={() => setShowRaw(!showRaw)}
                className="text-sm font-medium text-neutral-400 hover:text-white transition-colors"
              >
                Raw data {showRaw ? '\u25B2' : '\u25BC'}
              </button>
              {showRaw && (
                <pre className="mt-2 text-xs text-neutral-500 overflow-x-auto bg-neutral-900 rounded-lg p-3">
                  {JSON.stringify(lead.raw_data, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Agent Runs Timeline */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-white/10 p-4">
            <h2 className="text-sm font-medium text-neutral-400 mb-4">
              Agent activiteit ({runs.length} runs)
            </h2>

            {runs.length === 0 ? (
              <p className="text-sm text-neutral-500">Nog geen agent runs voor deze lead.</p>
            ) : (
              <div className="space-y-3">
                {runs.map((run, i) => (
                  <div key={run.id} className="relative">
                    {/* Timeline connector */}
                    {i < runs.length - 1 && (
                      <div className="absolute left-[17px] top-10 bottom-0 w-px bg-white/[0.06]" />
                    )}

                    <div className="flex gap-3">
                      {/* Timeline dot */}
                      <div className={`mt-1 h-[9px] w-[9px] rounded-full shrink-0 ${
                        run.status === 'success' ? 'bg-emerald-400' : run.status === 'error' ? 'bg-red-400' : 'bg-yellow-400'
                      }`} />

                      <div className="flex-1 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{run.agent_name}</span>
                            <span className="text-xs text-neutral-500">{run.agent_version}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${RUN_STATUS_COLORS[run.status] || ''}`}>
                              {run.status}
                            </span>
                          </div>
                          <span className="text-xs text-neutral-500">{formatDate(run.created_at)}</span>
                        </div>

                        {/* Tools called */}
                        {run.tools_called && run.tools_called.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {run.tools_called.map((tool, j) => (
                              <span key={j} className="inline-flex items-center rounded bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-medium text-indigo-400">
                                {tool.name}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Output */}
                        {run.output && (
                          <pre className="text-xs text-neutral-400 overflow-x-auto bg-neutral-900 rounded p-2 max-h-40">
                            {JSON.stringify(run.output, null, 2)}
                          </pre>
                        )}

                        {/* Error */}
                        {run.error && (
                          <p className="text-xs text-red-400 mt-1">{run.error}</p>
                        )}

                        {/* Meta */}
                        <div className="flex gap-3 mt-2 text-[10px] text-neutral-600">
                          {run.duration_ms && <span>{run.duration_ms}ms</span>}
                          {run.tokens_input && <span>{run.tokens_input + (run.tokens_output || 0)} tokens</span>}
                          <span>{run.model}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
