import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { LeadScoreBadge } from '@/components/leads/LeadScoreBadge'
import { AddLeadDialog } from '@/components/leads/AddLeadDialog'
import { LeadSearch } from './LeadSearch'
import { ReactieTimer } from '@/components/leads/ReactieTimer'
import Link from 'next/link'
import { Inbox, Phone, MessageCircle } from 'lucide-react'

const filters = [
  { label: 'Alle', value: '' },
  { label: 'Nieuw', value: 'new' },
  { label: 'Hot', value: 'hot' },
  { label: 'Open', value: 'open' },
  { label: 'Gewonnen', value: 'won' },
  { label: 'Verloren', value: 'lost' },
]

const statusDot: Record<string, string> = {
  hot:  'bg-red-400',
  warm: 'bg-orange-400',
  new:  'bg-blue-400',
  won:  'bg-green-400',
  lost: 'bg-zinc-600',
}

interface PageProps {
  searchParams: Promise<{ label?: string; q?: string }>
}

export default async function LeadsPage({ searchParams }: PageProps) {
  const { label: labelFilter, q: searchQuery } = await searchParams
  const supabase = await createClient()
  const { tenantId } = await requireTenant()

  const { count: totalCount } = await supabase
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)

  let query = supabase
    .from('leads')
    .select('id, name, status, ai_label, ai_score, ai_summary, intent, phone, email, created_at, urgency')
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
    query = query.or(
      `name.ilike.%${searchQuery}%,intent.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`
    )
  }

  const { data: leads } = await query

  return (
    <div className="p-4 lg:p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-white lg:text-2xl">Lead Inbox</h1>
          <p className="text-sm text-zinc-400">{totalCount ?? 0} leads totaal</p>
        </div>
        <AddLeadDialog tenantId={tenantId} />
      </div>

      {/* Search + Filters */}
      <div className="mb-4 flex flex-col gap-3">
        <LeadSearch defaultValue={searchQuery} />
        <div className="flex gap-1 overflow-x-auto scrollbar-none pb-1">
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
                className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-white text-black'
                    : 'bg-foundri-card text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {filter.label}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Lead list */}
      {!leads || leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl bg-foundri-card">
          <Inbox className="h-10 w-10 text-zinc-600 mb-4" />
          <h3 className="text-base font-medium text-white">
            {searchQuery ? `Geen resultaten voor "${searchQuery}"` : 'Nog geen leads'}
          </h3>
          <p className="mt-1 text-sm text-zinc-400">
            {searchQuery ? 'Probeer een andere zoekterm.' : 'Voeg je eerste lead toe of koppel je formulieren.'}
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {leads.map((lead) => {
            const dotColor = statusDot[lead.ai_label ?? lead.status] ?? 'bg-zinc-600'
            const phoneClean = lead.phone?.replace(/\D/g, '')
            const isNew = lead.status === 'new'

            return (
              <div
                key={lead.id}
                className={`relative rounded-xl transition-colors ${
                  isNew ? 'bg-foundri-card ring-1 ring-white/8' : 'bg-foundri-card'
                }`}
              >
                {/* Main row — tappable area */}
                <Link
                  href={`/dashboard/leads/${lead.id}`}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 active:bg-white/8 rounded-xl transition-colors"
                >
                  {/* Status dot */}
                  <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${dotColor}`} />

                  {/* Lead info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-white text-sm truncate">{lead.name}</span>
                      {lead.urgency === 'high' && (
                        <span className="text-xs text-red-400 font-medium shrink-0">Urgent</span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 truncate">
                      {lead.ai_summary || lead.intent || '—'}
                    </p>
                    {/* Reactietimer — altijd zichtbaar op mobiel */}
                    <div className="mt-1">
                      <ReactieTimer createdAt={lead.created_at} status={lead.status} />
                    </div>
                  </div>

                  {/* Score badge — desktop */}
                  <div className="shrink-0 hidden sm:block">
                    <LeadScoreBadge
                      label={lead.ai_label as any}
                      score={lead.ai_score}
                    />
                  </div>
                </Link>

                {/* Quick actions — bellen + WhatsApp direct op de kaart (mobiel zichtbaar) */}
                {(lead.phone) && (
                  <div className="flex items-center gap-1 px-4 pb-3 -mt-1">
                    {lead.phone && (
                      <a
                        href={`tel:${lead.phone}`}
                        className="flex items-center gap-1.5 rounded-lg bg-foundri-deep px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-white/10 active:bg-white/15 transition-colors"
                      >
                        <Phone className="h-3.5 w-3.5 text-green-400" />
                        {lead.phone}
                      </a>
                    )}
                    {phoneClean && (
                      <a
                        href={`https://wa.me/${phoneClean}`}
                        target="_blank"
                        rel="noopener"
                        className="flex items-center gap-1.5 rounded-lg bg-foundri-deep px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-white/10 active:bg-white/15 transition-colors"
                      >
                        <MessageCircle className="h-3.5 w-3.5 text-green-400" />
                        WhatsApp
                      </a>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
