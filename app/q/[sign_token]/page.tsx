import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { SignatureWidget } from './SignatureWidget'
import { ViewLogger } from './ViewLogger'
import { CheckCircle2, FileText, Calendar, Building2 } from 'lucide-react'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Offerte',
  robots: { index: false, follow: false },
}

function formatCents(cents: number | null | undefined) {
  if (cents == null) return '€0,00'
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('nl-NL', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default async function PublicQuotePage({ params }: { params: Promise<{ sign_token: string }> }) {
  const { sign_token } = await params
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svc = createServiceClient() as any

  const { data: quote } = await svc
    .from('quotes')
    .select('id, tenant_id, quote_number, title, description, status, amount_excl_vat, amount_incl_vat, vat_pct, valid_until, sent_at, signed_at, signature_name, advance_pct, milestone_pct, final_pct, payment_note, notes, client_id')
    .eq('sign_token', sign_token)
    .maybeSingle()

  if (!quote) notFound()

  // Items
  const { data: items } = await svc
    .from('quote_items')
    .select('description, quantity, unit, unit_price_cents, sort_order')
    .eq('quote_id', quote.id)
    .order('sort_order', { ascending: true })

  // Tenant (alleen publieke profielvelden)
  const { data: tenant } = await svc
    .from('tenants')
    .select('name, website, email, owner_phone, kvk_number, vat_number, logo_url, primary_color, iban')
    .eq('id', quote.tenant_id)
    .maybeSingle()

  // Klantnaam (alleen lezen, geen andere PII tonen die niet op deze offerte hoort)
  const { data: client } = quote.client_id
    ? await svc.from('clients').select('name, company_name, city').eq('id', quote.client_id).maybeSingle()
    : { data: null }

  const now = new Date()
  const validUntil = quote.valid_until ? new Date(quote.valid_until) : null
  const isExpired = validUntil ? validUntil < now : false
  const isSigned = !!quote.signed_at
  const isRejected = quote.status === 'afgewezen'

  // Status-overrides voor weergave (auto-expire visueel zonder DB-update)
  const displayStatus = isSigned
    ? 'akkoord'
    : isExpired
      ? 'verlopen'
      : isRejected
        ? 'afgewezen'
        : quote.status

  const canSign = !isSigned && !isExpired && !isRejected && (quote.status === 'verstuurd' || quote.status === 'concept')

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <ViewLogger token={sign_token} />

      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {tenant?.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tenant.logo_url} alt={tenant.name || ''} className="h-10 w-10 rounded object-contain" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded bg-foundri-yellow/20 text-foundri-yellow">
                <Building2 className="h-5 w-5" />
              </div>
            )}
            <div>
              <p className="text-sm font-semibold">{tenant?.name || 'Offerte'}</p>
              {tenant?.website && <p className="text-xs text-white/50">{tenant.website}</p>}
            </div>
          </div>
          <StatusBadge status={displayStatus} />
        </div>

        {/* Title card */}
        <div className="rounded-2xl border border-white/10 bg-foundri-deep p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-white/40">{quote.quote_number}</p>
              <h1 className="mt-1 text-2xl font-bold text-white">{quote.title}</h1>
              {client && (
                <p className="mt-2 text-sm text-white/60">
                  Voor: {client.company_name || client.name}{client.city ? ` · ${client.city}` : ''}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-white/40">Geldig tot</p>
              <p className="text-sm font-medium">{formatDate(quote.valid_until)}</p>
              {validUntil && !isSigned && !isExpired && (
                <p className="mt-1 text-xs text-foundri-yellow">
                  {Math.max(0, Math.ceil((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))} dagen
                </p>
              )}
            </div>
          </div>

          {quote.description && (
            <p className="mt-4 whitespace-pre-wrap text-sm text-white/70">{quote.description}</p>
          )}
        </div>

        {/* Items */}
        {items && items.length > 0 && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-foundri-deep p-6">
            <h2 className="mb-4 text-sm font-semibold text-white/80">Specificatie</h2>
            <div className="space-y-3">
              {items.map((it: any, i: number) => (
                <div key={i} className="flex items-start justify-between gap-4 border-b border-white/5 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm text-white">{it.description}</p>
                    <p className="text-xs text-white/50">{it.quantity} {it.unit}</p>
                  </div>
                  <p className="whitespace-nowrap text-sm font-medium">{formatCents(it.unit_price_cents * (it.quantity || 1))}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Totals */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-foundri-deep p-6">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/60">Subtotaal</span>
              <span>{formatCents(quote.amount_excl_vat)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">BTW ({quote.vat_pct}%)</span>
              <span>{formatCents(quote.amount_incl_vat - quote.amount_excl_vat)}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-white/10 pt-2 text-base font-semibold">
              <span>Totaal</span>
              <span className="text-foundri-yellow">{formatCents(quote.amount_incl_vat)}</span>
            </div>
          </div>

          {(quote.advance_pct || quote.milestone_pct || quote.payment_note) && (
            <div className="mt-4 rounded-md bg-white/5 p-3 text-xs text-white/70">
              <p className="font-medium text-white/80">Betalingsstructuur</p>
              {quote.advance_pct ? <p>Aanbetaling: {quote.advance_pct}%</p> : null}
              {quote.milestone_pct ? <p>Tussentijds: {quote.milestone_pct}%</p> : null}
              {quote.final_pct ? <p>Eindbetaling: {quote.final_pct}%</p> : null}
              {quote.payment_note && <p className="mt-1">{quote.payment_note}</p>}
            </div>
          )}
        </div>

        {/* Signature / status footer */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-foundri-deep p-6">
          {isSigned ? (
            <div className="flex items-center gap-3 text-foundri-yellow">
              <CheckCircle2 className="h-6 w-6" />
              <div>
                <p className="font-semibold text-white">Akkoord gegeven</p>
                <p className="text-xs text-white/60">
                  Door {quote.signature_name} op {formatDate(quote.signed_at)}
                </p>
              </div>
            </div>
          ) : isExpired ? (
            <div className="flex items-center gap-3 text-red-400">
              <Calendar className="h-6 w-6" />
              <div>
                <p className="font-semibold text-white">Offerte verlopen</p>
                <p className="text-xs text-white/60">
                  Neem contact op met {tenant?.name || 'de aanbieder'} voor een nieuwe offerte.
                </p>
              </div>
            </div>
          ) : isRejected ? (
            <div className="flex items-center gap-3 text-red-400">
              <FileText className="h-6 w-6" />
              <p className="font-semibold text-white">Deze offerte is afgewezen</p>
            </div>
          ) : canSign ? (
            <SignatureWidget token={sign_token} quoteNumber={quote.quote_number} tenantName={tenant?.name || ''} />
          ) : (
            <p className="text-sm text-white/60">Deze offerte is nog niet verzonden.</p>
          )}
        </div>

        {/* Tenant footer */}
        {tenant && (
          <div className="mt-6 text-center text-xs text-white/40">
            <p>{tenant.name}{tenant.kvk_number ? ` · KvK ${tenant.kvk_number}` : ''}{tenant.vat_number ? ` · BTW ${tenant.vat_number}` : ''}</p>
            {tenant.email && <p>{tenant.email}{tenant.owner_phone ? ` · ${tenant.owner_phone}` : ''}</p>}
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    concept: { label: 'Concept', cls: 'bg-white/10 text-white/70' },
    verstuurd: { label: 'Verstuurd', cls: 'bg-blue-500/20 text-blue-300' },
    akkoord: { label: 'Akkoord', cls: 'bg-emerald-500/20 text-emerald-300' },
    afgewezen: { label: 'Afgewezen', cls: 'bg-red-500/20 text-red-300' },
    verlopen: { label: 'Verlopen', cls: 'bg-zinc-500/20 text-zinc-300' },
  }
  const m = map[status] || map.concept
  return <span className={`rounded-full px-3 py-1 text-xs font-medium ${m.cls}`}>{m.label}</span>
}
