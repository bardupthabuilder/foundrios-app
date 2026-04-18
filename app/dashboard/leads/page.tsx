import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { LeadScoreBadge } from '@/components/leads/LeadScoreBadge'
import { LeadSourceIcon } from '@/components/leads/LeadSourceIcon'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { nl } from 'date-fns/locale'
import { AddLeadDialog } from '@/components/leads/AddLeadDialog'
import { LeadSearch } from './LeadSearch'
import { Phone, Mail, FileText } from 'lucide-react'

const filters = [
  { label: 'Alle leads', value: '' },
  { label: 'Hot', value: 'hot' },
  { label: 'Warm', value: 'warm' },
  { label: 'Cold', value: 'cold' },
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

  if (searchQuery) {
    query = query.or(`name.ilike.%${searchQuery}%,intent.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
  }

  const { data: leads } = await query

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Lead Inbox</h1>
          <p className="text-sm text-zinc-400">
            {leads?.length ?? 0} leads
            {labelFilter ? ` · ${labelFilter}` : ''}
          </p>
        </div>
        <AddLeadDialog tenantId={tenantId} />
      </div>

      {/* Search + Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <LeadSearch defaultValue={searchQuery} />
        <div className="flex gap-2 flex-wrap">
          {filters.map((filter) => (
            <Link
              key={filter.value}
              href={
                filter.value
                  ? `/dashboard/leads?label=${filter.value}${searchQuery ? `&q=${searchQuery}` : ''}`
                  : `/dashboard/leads${searchQuery ? `?q=${searchQuery}` : ''}`
              }
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
      </div>

      {/* Lead lijst */}
      <div className="space-y-2">
        {!leads || leads.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-white/10 p-12 text-center">
            <p className="text-zinc-400">
              {searchQuery ? `Geen leads gevonden voor "${searchQuery}"` : 'Nog geen leads.'}
            </p>
            {!searchQuery && (
              <p className="mt-1 text-sm text-zinc-400">
                Voeg een lead handmatig toe of koppel een leadkanaal via Instellingen.
              </p>
            )}
          </div>
        ) : (
          leads.map((lead) => (
            <div
              key={lead.id}
              className="rounded-xl border bg-[#1A1F29] hover:border-white/15 hover:shadow-sm transition-all"
            >
              <Link
                href={`/dashboard/leads/${lead.id}`}
                className="flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-4 min-w-0">
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
                    <p className="font-medium text-white truncate">{lead.name}</p>
                    {lead.ai_summary ? (
                      <p className="text-sm text-zinc-400 truncate max-w-md">{lead.ai_summary}</p>
                    ) : lead.intent ? (
                      <p className="text-sm text-zinc-400 truncate">{lead.intent}</p>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  <LeadSourceIcon source={lead.source as any} />
                  <LeadScoreBadge label={lead.ai_label as any} score={lead.ai_score} />
                  {lead.urgency === 'high' && (
                    <Badge variant="destructive" className="text-xs">Urgent</Badge>
                  )}
                  <span className="text-xs text-zinc-400 hidden sm:block">
                    {formatDistanceToNow(new Date(lead.created_at), {
                      addSuffix: true,
                      locale: nl,
                    })}
                  </span>
                </div>
              </Link>

              {/* Quick actions */}
              <div className="flex items-center gap-1 border-t px-4 py-2">
                {lead.phone && (
                  <a
                    href={`tel:${lead.phone}`}
                    className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs text-zinc-300 hover:bg-white/10 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Phone className="h-3 w-3" />
                    Bellen
                  </a>
                )}
                {lead.email && (
                  <a
                    href={`mailto:${lead.email}`}
                    className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs text-zinc-300 hover:bg-white/10 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Mail className="h-3 w-3" />
                    E-mail
                  </a>
                )}
                {lead.phone && (
                  <a
                    href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs text-zinc-300 hover:bg-white/10 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    💬 WhatsApp
                  </a>
                )}
                <Link
                  href={`/dashboard/offertes?lead=${lead.id}`}
                  className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs text-zinc-300 hover:bg-white/10 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <FileText className="h-3 w-3" />
                  Offerte
                </Link>
                {lead.budget_estimate && (
                  <span className="ml-auto text-xs text-zinc-400">
                    Budget: {lead.budget_estimate}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
