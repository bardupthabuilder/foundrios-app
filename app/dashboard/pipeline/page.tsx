import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import Link from 'next/link'

const PIPELINE_STAGES = [
  { key: 'nieuw', label: 'Nieuw', color: 'text-zinc-400' },
  { key: 'gekwalificeerd', label: 'Gekwalificeerd', color: 'text-blue-400' },
  { key: 'afspraak', label: 'Afspraak', color: 'text-purple-400' },
  { key: 'offerte', label: 'Offerte', color: 'text-orange-400' },
  { key: 'opvolging', label: 'Opvolging', color: 'text-yellow-400' },
]

export default async function PipelinePage() {
  const { tenantId } = await requireTenant()
  const supabase = await createClient()

  const { data: leads } = await supabase
    .from('leads')
    .select('id, name, ai_label, ai_score, ai_summary, pipeline_stage, source, phone, email, budget_estimate, created_at')
    .eq('tenant_id', tenantId)
    .not('pipeline_stage', 'in', '("gewonnen","verloren")')
    .order('created_at', { ascending: false })

  // Also fetch won/lost counts for display
  const { count: wonCount } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('pipeline_stage', 'gewonnen')

  const { count: lostCount } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('pipeline_stage', 'verloren')

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-display)]">Pipeline</h1>
          <p className="text-sm text-zinc-400">
            {leads?.length || 0} actieve leads &middot; {wonCount || 0} gewonnen &middot; {lostCount || 0} verloren
          </p>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 200px)' }}>
        {PIPELINE_STAGES.map((stage) => {
          const stageLeads = (leads || []).filter((l) => l.pipeline_stage === stage.key)
          return (
            <div key={stage.key} className="flex h-full w-72 shrink-0 flex-col rounded-lg border border-white/5 bg-foundri-deep">
              <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
                <h3 className={`text-sm font-semibold ${stage.color}`}>{stage.label}</h3>
                <span className="text-xs text-zinc-500">{stageLeads.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {stageLeads.map((lead) => (
                  <Link
                    href={`/dashboard/leads/${lead.id}`}
                    key={lead.id}
                    className="block rounded-lg border border-white/5 bg-foundri-surface p-3 transition-colors hover:border-white/10"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          lead.ai_label === 'hot'
                            ? 'bg-red-400'
                            : lead.ai_label === 'warm'
                              ? 'bg-orange-400'
                              : 'bg-zinc-500'
                        }`}
                      />
                      <span className="text-sm font-medium text-white truncate">{lead.name}</span>
                    </div>
                    {lead.ai_summary && (
                      <p className="mt-1 text-xs text-zinc-500 line-clamp-2">{lead.ai_summary}</p>
                    )}
                    {lead.budget_estimate && (
                      <p className="mt-1 text-xs text-foundri-yellow">{lead.budget_estimate}</p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
