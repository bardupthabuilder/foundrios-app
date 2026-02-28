import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { LeadScoreBadge } from '@/components/leads/LeadScoreBadge'
import { LeadSourceIcon } from '@/components/leads/LeadSourceIcon'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { nl } from 'date-fns/locale'
import { AddLeadDialog } from '@/components/leads/AddLeadDialog'

const filters = [
  { label: 'Alle leads', value: '' },
  { label: 'Hot', value: 'hot' },
  { label: 'Warm', value: 'warm' },
  { label: 'Cold', value: 'cold' },
  { label: 'Gewonnen', value: 'won' },
  { label: 'Verloren', value: 'lost' },
]

interface PageProps {
  searchParams: Promise<{ label?: string }>
}

export default async function LeadsPage({ searchParams }: PageProps) {
  const { label: labelFilter } = await searchParams
  const supabase = await createClient()
  const { tenantId } = await requireTenant()

  let query = supabase
    .from('leads')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (labelFilter) {
    if (labelFilter === 'won' || labelFilter === 'lost') {
      query = query.eq('status', labelFilter)
    } else {
      query = query.eq('ai_label', labelFilter)
    }
  }

  const { data: leads } = await query

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Lead Inbox</h1>
          <p className="text-sm text-zinc-500">
            {leads?.length ?? 0} leads
            {labelFilter ? ` · gefilterd op ${labelFilter}` : ''}
          </p>
        </div>
        <AddLeadDialog tenantId={tenantId} />
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-2 flex-wrap">
        {filters.map((filter) => (
          <Link
            key={filter.value}
            href={filter.value ? `/dashboard/leads?label=${filter.value}` : '/dashboard/leads'}
          >
            <Badge
              variant={labelFilter === filter.value || (!labelFilter && filter.value === '') ? 'default' : 'outline'}
              className="cursor-pointer"
            >
              {filter.label}
            </Badge>
          </Link>
        ))}
      </div>

      {/* Lead lijst */}
      <div className="space-y-2">
        {!leads || leads.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-zinc-200 p-12 text-center">
            <p className="text-zinc-400">Nog geen leads.</p>
            <p className="mt-1 text-sm text-zinc-400">
              Koppel WhatsApp of een formulier, of voeg een lead handmatig toe.
            </p>
          </div>
        ) : (
          leads.map((lead) => (
            <Link
              key={lead.id}
              href={`/dashboard/leads/${lead.id}`}
              className="flex items-center justify-between rounded-xl border bg-white p-4 hover:border-zinc-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-4 min-w-0">
                {/* Score dot */}
                <div
                  className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${
                    lead.ai_label === 'hot'
                      ? 'bg-red-500'
                      : lead.ai_label === 'warm'
                      ? 'bg-orange-400'
                      : 'bg-zinc-300'
                  }`}
                />
                <div className="min-w-0">
                  <p className="font-medium text-zinc-900 truncate">{lead.name}</p>
                  {lead.intent && (
                    <p className="text-sm text-zinc-500 truncate">{lead.intent}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                <LeadSourceIcon source={lead.source} />
                <LeadScoreBadge label={lead.ai_label} score={lead.ai_score} />
                <span className="text-xs text-zinc-400 hidden sm:block">
                  {formatDistanceToNow(new Date(lead.created_at), {
                    addSuffix: true,
                    locale: nl,
                  })}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
