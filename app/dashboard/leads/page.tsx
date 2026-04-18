import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { LeadScoreBadge } from '@/components/leads/LeadScoreBadge'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { nl } from 'date-fns/locale'
import { AddLeadDialog } from '@/components/leads/AddLeadDialog'
import { LeadSearch } from './LeadSearch'
import { Inbox } from 'lucide-react'

const filters = [
  { label: 'Alle', value: '' },
  { label: 'Nieuw', value: 'new' },
  { label: 'Hot', value: 'hot' },
  { label: 'Open', value: 'open' },
  { label: 'Gewonnen', value: 'won' },
  { label: 'Verloren', value: 'lost' },
]

interface PageProps {
  searchParams: Promise<{ label?: string; q?: string }>
}

export default async function LeadsPage({ searchParams }: PageProps) {
  const { label: labelFilter, q: searchQuery } = await searchParams
  const supabase = await createClient()
  const { tenantId } = await requireTenant()

  // Total count query (unfiltered) for header
  const { count: totalCount } = await supabase
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)

  let query = supabase
    .from('leads')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (labelFilter) {
    if (labelFilter === 'won' || labelFilter === 'lost') {
      query = query.eq('status', labelFilter)
    } else if (labelFilter === 'new') {
      query = query.eq('status', 'new')
    } else if (labelFilter === 'open') {
      query = query.not('status', 'in', '("won","lost")')
    } else {
      query = query.eq('ai_label', labelFilter)
    }
  }

  if (searchQuery) {
    query = query.or(`name.ilike.%${searchQuery}%,intent.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
  }

  const { data: leads } = await query

  // Counts per filter for tabs
  const filteredCount = leads?.length ?? 0

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-display)]">Lead Inbox</h1>
          <p className="text-sm text-zinc-400">{totalCount ?? 0} leads</p>
        </div>
        <AddLeadDialog tenantId={tenantId} />
      </div>

      {/* Search + Filter Tabs */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <LeadSearch defaultValue={searchQuery} />
        <div className="flex gap-1 rounded-lg bg-white/5 p-1">
          {filters.map((filter) => {
            const isActive = labelFilter === filter.value || (!labelFilter && filter.value === '')
            return (
              <Link
                key={filter.value}
                href={
                  filter.value
                    ? `/dashboard/leads?label=${filter.value}${searchQuery ? `&q=${searchQuery}` : ''}`
                    : `/dashboard/leads${searchQuery ? `?q=${searchQuery}` : ''}`
                }
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {filter.label}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Lead List */}
      <div className="rounded-lg border border-white/5 bg-[#1A1F29] overflow-hidden">
        {!leads || leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Inbox className="h-10 w-10 text-zinc-600 mb-4" />
            <h3 className="text-lg font-medium text-white">
              {searchQuery ? `Geen leads gevonden voor "${searchQuery}"` : 'Nog geen leads'}
            </h3>
            <p className="mt-1 text-sm text-zinc-400">
              {searchQuery
                ? 'Probeer een andere zoekterm.'
                : 'Voeg je eerste lead toe of koppel je formulieren.'}
            </p>
          </div>
        ) : (
          leads.map((lead) => (
            <Link
              key={lead.id}
              href={`/dashboard/leads/${lead.id}`}
              className="flex items-center gap-4 border-b border-white/5 px-4 py-3 transition-colors hover:bg-white/5 last:border-b-0"
            >
              {/* Color dot */}
              <div
                className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                  lead.ai_label === 'hot'
                    ? 'bg-red-400'
                    : lead.ai_label === 'warm'
                    ? 'bg-orange-400'
                    : 'bg-zinc-500'
                }`}
              />

              {/* Lead info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white truncate">{lead.name}</span>
                  {lead.urgency === 'high' && (
                    <span className="text-xs text-red-400 font-medium">Urgent</span>
                  )}
                </div>
                <p className="text-sm text-zinc-400 truncate">
                  {lead.ai_summary || lead.intent || '—'}
                </p>
              </div>

              {/* Source + time */}
              <div className="flex items-center gap-3 shrink-0">
                <LeadScoreBadge label={lead.ai_label as any} score={lead.ai_score} />
                <span className="text-xs text-zinc-500 hidden sm:block">
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
