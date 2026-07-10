'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Flame, Clock, AlertCircle, FileCheck2, ChevronRight, CheckCircle2, BellRing, PhoneCall } from 'lucide-react'

type DueAction = { id: string; name: string; next_action: string | null; next_action_at: string; ai_label: string | null }
type QuoteToFollowUp = { id: string; quote_number: string | null; title: string; follow_up_at: string; amount_incl_vat: number; clients?: { name: string; company_name: string | null } | null }
type HotLead = { id: string; name: string; created_at: string; ai_score: number | null }
type ExpiringQuote = { id: string; quote_number: string | null; title: string; valid_until: string; amount_incl_vat: number; clients?: { name: string; company_name: string | null } | null }
type OverdueInvoice = { id: string; invoice_number: string | null; amount_incl_vat: number; due_date: string; clients?: { name: string; company_name: string | null } | null }
type SignedQuote = { id: string; quote_number: string | null; title: string; signed_at: string; signature_name: string | null; clients?: { name: string; company_name: string | null } | null }

type TodayData = {
  due_actions: DueAction[]
  quotes_to_follow_up: QuoteToFollowUp[]
  hot_leads: HotLead[]
  expiring_quotes: ExpiringQuote[]
  overdue_invoices: OverdueInvoice[]
  signed_not_converted: SignedQuote[]
  counts: {
    due_actions: number
    quotes_to_follow_up: number
    hot_leads: number
    expiring_quotes: number
    overdue_invoices: number
    signed_not_converted: number
  }
}

function formatEuro(cents: number) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

function daysFromNow(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

/** "vandaag" leest natuurlijker dan "0d te laat". */
function overdueLabel(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))
  if (days <= 0) return 'vandaag'
  if (days === 1) return '1d te laat'
  return `${days}d te laat`
}

export function TodayWidget() {
  const [data, setData] = useState<TodayData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/today')
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="rounded-lg border border-white/5 bg-foundri-deep p-4 text-sm text-zinc-400">Vandaag laden...</div>
  }
  if (!data) return null

  const total =
    data.counts.due_actions +
    data.counts.quotes_to_follow_up +
    data.counts.hot_leads +
    data.counts.expiring_quotes +
    data.counts.overdue_invoices +
    data.counts.signed_not_converted

  if (total === 0) {
    return (
      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
        <div className="flex items-center gap-2 text-emerald-300">
          <CheckCircle2 className="h-5 w-5" />
          <p className="text-sm font-semibold">Niks dringend vandaag</p>
        </div>
        <p className="mt-1 text-xs text-emerald-400/70">Geen achterstallige acties, geen koude aanvragen, geen verlopen offertes, geen openstaande facturen.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Vandaag</h2>
        <span className="rounded-full bg-foundri-yellow/20 px-2.5 py-0.5 text-xs font-medium text-foundri-yellow">
          {total} actie{total === 1 ? '' : 's'}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {data.counts.due_actions > 0 && (
          <SectionCard
            icon={BellRing}
            color="text-foundri-yellow"
            title="Je hebt dit beloofd"
            count={data.counts.due_actions}
            description="Opvolgdatum verstreken"
            href="/dashboard/leads"
          >
            {data.due_actions.slice(0, 3).map((a) => (
              <li key={a.id}>
                <Link href={`/dashboard/leads/${a.id}`} className="flex items-center justify-between gap-2 text-xs hover:text-white">
                  <span className="truncate text-white/80">
                    {a.name}
                    {a.next_action && <span className="text-white/40"> — {a.next_action}</span>}
                  </span>
                  <span className="shrink-0 text-foundri-yellow">{overdueLabel(a.next_action_at)}</span>
                </Link>
              </li>
            ))}
          </SectionCard>
        )}

        {data.counts.quotes_to_follow_up > 0 && (
          <SectionCard
            icon={PhoneCall}
            color="text-sky-400"
            title="Offertes nabellen"
            count={data.counts.quotes_to_follow_up}
            description="Opvolgdatum verstreken"
            href="/dashboard/offertes?status=verstuurd"
          >
            {data.quotes_to_follow_up.slice(0, 3).map((q) => (
              <li key={q.id}>
                <Link href={`/dashboard/offertes/${q.id}`} className="flex items-center justify-between gap-2 text-xs hover:text-white">
                  <span className="truncate text-white/80">{q.clients?.company_name || q.clients?.name || q.title}</span>
                  <span className="shrink-0 text-sky-400">{formatEuro(q.amount_incl_vat)}</span>
                </Link>
              </li>
            ))}
          </SectionCard>
        )}

        {data.counts.hot_leads > 0 && (
          <SectionCard
            icon={Flame}
            color="text-orange-400"
            title="Koude hot leads"
            count={data.counts.hot_leads}
            description="Leads >72u zonder reactie"
            href="/dashboard/leads"
          >
            {data.hot_leads.slice(0, 3).map((l) => (
              <li key={l.id}>
                <Link href={`/dashboard/leads/${l.id}`} className="flex items-center justify-between text-xs hover:text-white">
                  <span className="truncate text-white/80">{l.name}</span>
                  <span className="text-white/40">{daysFromNow(l.created_at) * -1}d stil</span>
                </Link>
              </li>
            ))}
          </SectionCard>
        )}

        {data.counts.expiring_quotes > 0 && (
          <SectionCard
            icon={Clock}
            color="text-amber-400"
            title="Offertes verlopen bijna"
            count={data.counts.expiring_quotes}
            description="Binnen 3 dagen — bel ze na"
            href="/dashboard/offertes"
          >
            {data.expiring_quotes.slice(0, 3).map((q) => (
              <li key={q.id}>
                <Link href={`/dashboard/offertes/${q.id}`} className="flex items-center justify-between text-xs hover:text-white">
                  <span className="truncate text-white/80">{q.clients?.company_name || q.clients?.name || q.title}</span>
                  <span className="text-amber-400">{daysFromNow(q.valid_until)}d</span>
                </Link>
              </li>
            ))}
          </SectionCard>
        )}

        {data.counts.overdue_invoices > 0 && (
          <SectionCard
            icon={AlertCircle}
            color="text-red-400"
            title="Facturen open"
            count={data.counts.overdue_invoices}
            description="Vervaltermijn voorbij"
            href="/dashboard/facturen"
          >
            {data.overdue_invoices.slice(0, 3).map((i) => (
              <li key={i.id}>
                <Link href={`/dashboard/facturen/${i.id}`} className="flex items-center justify-between text-xs hover:text-white">
                  <span className="truncate text-white/80">{i.clients?.company_name || i.clients?.name || i.invoice_number}</span>
                  <span className="text-red-400">{formatEuro(i.amount_incl_vat)}</span>
                </Link>
              </li>
            ))}
          </SectionCard>
        )}

        {data.counts.signed_not_converted > 0 && (
          <SectionCard
            icon={FileCheck2}
            color="text-emerald-400"
            title="Akkoord, geen project"
            count={data.counts.signed_not_converted}
            description="Maak project of factuur"
            href="/dashboard/offertes"
          >
            {data.signed_not_converted.slice(0, 3).map((q) => (
              <li key={q.id}>
                <Link href={`/dashboard/offertes/${q.id}`} className="flex items-center justify-between text-xs hover:text-white">
                  <span className="truncate text-white/80">{q.clients?.company_name || q.title}</span>
                  <span className="text-emerald-400">{q.signature_name || 'getekend'}</span>
                </Link>
              </li>
            ))}
          </SectionCard>
        )}
      </div>
    </div>
  )
}

function SectionCard({
  icon: Icon,
  color,
  title,
  count,
  description,
  href,
  children,
}: {
  icon: typeof Flame
  color: string
  title: string
  count: number
  description: string
  href: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-white/5 bg-foundri-deep p-4">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <Icon className={`mt-0.5 h-4 w-4 ${color}`} />
          <div>
            <p className="text-sm font-semibold text-white">{title}</p>
            <p className="text-xs text-zinc-400">{description}</p>
          </div>
        </div>
        <span className={`rounded-full bg-white/5 px-2 py-0.5 text-xs font-medium ${color}`}>{count}</span>
      </div>
      <ul className="space-y-1">{children}</ul>
      <Link href={href} className="mt-3 inline-flex items-center gap-1 text-xs text-foundri-yellow hover:underline">
        Alle bekijken <ChevronRight className="h-3 w-3" />
      </Link>
    </div>
  )
}
