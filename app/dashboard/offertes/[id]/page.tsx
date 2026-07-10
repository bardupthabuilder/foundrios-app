'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Send, X, Check, ArrowRightLeft, Download, MessageCircle, Mail, HardHat } from 'lucide-react'
import { SignLinkBlock } from '@/components/quotes/SignLinkBlock'

function normalizePhone(phone: string) {
  return phone.replace(/\s+/g, '').replace(/^00/, '+').replace(/^0([1-9])/, '+31$1')
}

type QuoteItem = {
  id: string; description: string; quantity: number; unit: string
  unit_price_cents: number; total_cents: number; sort_order: number
}

type Quote = {
  id: string; quote_number: string | null; title: string; description: string | null
  status: string; amount_excl_vat: number; amount_incl_vat: number; vat_pct: number
  valid_until: string | null; follow_up_at: string | null
  sent_at: string | null; accepted_at: string | null
  rejected_at: string | null; signed_at: string | null; signature_name: string | null
  sign_token: string | null; notes: string | null; created_at: string
  clients: any; projects: any; items: QuoteItem[]
}

const statusConfig: Record<string, { label: string; color: string }> = {
  concept:   { label: 'Concept',   color: 'bg-white/5 text-foundri-muted' },
  verstuurd: { label: 'Verstuurd', color: 'bg-foundri-yellow/10 text-foundri-yellow' },
  akkoord:   { label: 'Akkoord',   color: 'bg-green-500/10 text-green-400' },
  afgewezen: { label: 'Afgewezen', color: 'bg-red-500/10 text-red-400' },
  verlopen:  { label: 'Verlopen',  color: 'bg-white/5 text-foundri-muted' },
}

const statusActions: Record<string, { label: string; next: string; icon: any; color: string }[]> = {
  concept:   [{ label: 'Versturen', next: 'verstuurd', icon: Send,  color: 'bg-foundri-yellow text-foundri-graphite hover:bg-foundri-yellow-dim' }],
  verstuurd: [
    { label: 'Akkoord',   next: 'akkoord',   icon: Check, color: 'bg-green-600 text-white hover:bg-green-700' },
    { label: 'Afgewezen', next: 'afgewezen', icon: X,     color: 'bg-white/5 text-foundri-muted hover:bg-white/10' },
  ],
  akkoord: [], afgewezen: [], verlopen: [],
}

export default function QuoteDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddItem, setShowAddItem] = useState(false)
  const [itemForm, setItemForm] = useState({ description: '', quantity: 1, unit: 'stuk', unit_price: 0 })
  const [converting, setConverting] = useState(false)
  const [makingProject, setMakingProject] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => { fetchQuote() }, [id])

  async function fetchQuote() {
    const res = await fetch(`/api/quotes/${id}`)
    if (res.ok) setQuote(await res.json())
    setLoading(false)
  }

  async function updateStatus(status: string) {
    await fetch(`/api/quotes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    fetchQuote()
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/quote-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quote_id: id,
        description: itemForm.description,
        quantity: itemForm.quantity,
        unit: itemForm.unit,
        unit_price_cents: Math.round(itemForm.unit_price * 100),
        sort_order: (quote?.items.length ?? 0) + 1,
      }),
    })
    setShowAddItem(false)
    setItemForm({ description: '', quantity: 1, unit: 'stuk', unit_price: 0 })
    fetchQuote()
  }

  async function deleteItem(itemId: string) {
    await fetch(`/api/quote-items/${itemId}`, { method: 'DELETE' })
    fetchQuote()
  }

  async function convertToInvoice() {
    setConverting(true)
    setActionError(null)
    const res = await fetch(`/api/quotes/${id}/convert`, { method: 'POST' })
    if (res.ok) {
      const invoice = await res.json()
      router.push(`/dashboard/facturen/${invoice.id}`)
      return
    }
    setActionError(await errorMessage(res, 'Factuur maken mislukt.'))
    setConverting(false)
  }

  async function setFollowUp(date: string) {
    setActionError(null)
    const res = await fetch(`/api/quotes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        follow_up_at: date ? new Date(`${date}T09:00:00`).toISOString() : null,
      }),
    })
    if (!res.ok) {
      setActionError(await errorMessage(res, 'Opvolgdatum opslaan mislukt.'))
      return
    }
    fetchQuote()
  }

  async function convertToProject() {
    setMakingProject(true)
    setActionError(null)
    const res = await fetch(`/api/quotes/${id}/to-project`, { method: 'POST' })
    if (res.ok) {
      const project = await res.json()
      router.push(`/dashboard/projecten/${project.id}`)
      return
    }
    setActionError(await errorMessage(res, 'Klus aanmaken mislukt.'))
    setMakingProject(false)
  }

  async function errorMessage(res: Response, fallback: string) {
    try {
      const body = await res.json()
      return typeof body?.error === 'string' ? body.error : fallback
    } catch {
      return fallback
    }
  }

  const fmt = (cents: number) =>
    new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100)
  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })

  if (loading) return <div className="p-6 pt-16 lg:pt-6 text-sm text-foundri-muted">Laden...</div>
  if (!quote) return <div className="p-6 pt-16 lg:pt-6 text-sm text-red-400">Offerte niet gevonden</div>

  const sc = statusConfig[quote.status] || statusConfig.concept
  const actions = statusActions[quote.status] || []
  const clientName = quote.clients?.contact_name || quote.clients?.company_name || quote.clients?.name || ''

  const waMessage = [
    `Beste${clientName ? ' ' + clientName : ''},`,
    '',
    `Hierbij de offerte voor "${quote.title}"${quote.quote_number ? ` (${quote.quote_number})` : ''}.`,
    `Bedrag: ${fmt(quote.amount_incl_vat)} incl. BTW`,
    quote.valid_until ? `Geldig tot: ${fmtDate(quote.valid_until)}` : null,
    '',
    'Heb je vragen of wil je akkoord geven? Bel of app ons gerust.',
  ].filter(l => l !== null).join('\n')

  return (
    <div className="p-4 lg:p-6 pt-16 lg:pt-6 max-w-3xl">

      {/* Back */}
      <button
        onClick={() => router.push('/dashboard/offertes')}
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-foundri-muted hover:text-foundri-text transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Offertes
      </button>

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h1 className="text-xl font-semibold text-white">{quote.title}</h1>
              <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${sc.color}`}>{sc.label}</span>
            </div>
            <p className="text-sm text-foundri-muted">
              {quote.quote_number} · {fmtDate(quote.created_at)}
            </p>
          </div>
          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => window.open(`/print/offerte/${id}`, '_blank')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-sm text-foundri-muted hover:border-white/20 hover:text-foundri-text transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> PDF
            </button>
            {quote.clients?.phone && (
              <a
                href={`https://wa.me/${normalizePhone(quote.clients.phone)}?text=${encodeURIComponent(waMessage)}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-sm text-foundri-muted hover:border-white/20 hover:text-foundri-text transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
              </a>
            )}
            {quote.clients?.email && (
              <a
                href={`mailto:${quote.clients.email}?subject=${encodeURIComponent(`Offerte ${quote.quote_number || quote.title}`)}&body=${encodeURIComponent(waMessage)}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-sm text-foundri-muted hover:border-white/20 hover:text-foundri-text transition-colors"
              >
                <Mail className="h-3.5 w-3.5" /> E-mail
              </a>
            )}
            {actions.map(a => {
              const Icon = a.icon
              return (
                <button key={a.next} onClick={() => updateStatus(a.next)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${a.color}`}>
                  <Icon className="h-3.5 w-3.5" /> {a.label}
                </button>
              )
            })}
            {quote.status === 'akkoord' && !quote.projects && (
              <button onClick={convertToProject} disabled={makingProject}
                className="inline-flex items-center gap-1.5 rounded-lg bg-foundri-yellow text-foundri-graphite px-3 py-1.5 text-sm font-medium hover:bg-foundri-yellow-dim disabled:opacity-50">
                <HardHat className="h-3.5 w-3.5" />
                {makingProject ? 'Bezig...' : 'Maak klus'}
              </button>
            )}
            {quote.status === 'akkoord' && (
              <button onClick={convertToInvoice} disabled={converting}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-50 ${
                  quote.projects
                    ? 'bg-foundri-yellow text-foundri-graphite hover:bg-foundri-yellow-dim'
                    : 'border border-white/10 text-foundri-muted hover:border-white/20 hover:text-foundri-text'
                }`}>
                <ArrowRightLeft className="h-3.5 w-3.5" />
                {converting ? 'Bezig...' : 'Naar factuur'}
              </button>
            )}
          </div>
        </div>

        {/* Een verstuurde offerte die niemand nabelt is het grootste lek in een vakbedrijf. */}
        {quote.status === 'verstuurd' && (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-foundri-deep px-3 py-2.5">
            <span className="text-sm text-foundri-muted">Nabellen op</span>
            <input
              type="date"
              value={quote.follow_up_at ? quote.follow_up_at.split('T')[0] : ''}
              onChange={(e) => setFollowUp(e.target.value)}
              className="rounded-md border border-white/10 bg-foundri-surface px-2 py-1 text-sm text-white focus:border-white/20 focus:outline-none"
            />
            {quote.follow_up_at && new Date(quote.follow_up_at) <= new Date() && (
              <span className="text-xs font-medium text-foundri-yellow">Opvolgdatum verstreken</span>
            )}
          </div>
        )}

        {quote.projects && (
          <p className="mt-3 text-sm text-foundri-muted">
            Klus:{' '}
            <button
              onClick={() => router.push(`/dashboard/projecten/${quote.projects.id}`)}
              className="text-foundri-yellow hover:underline"
            >
              {quote.projects.name}
            </button>
          </p>
        )}

        {actionError && (
          <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {actionError}
          </div>
        )}
      </div>

      {/* Sign link */}
      {(quote.status === 'verstuurd' || quote.status === 'akkoord' || quote.status === 'verlopen') && (
        <div className="mb-6">
          <SignLinkBlock
            quoteId={quote.id}
            signToken={quote.sign_token}
            status={quote.status}
            validUntil={quote.valid_until}
            signedAt={quote.signed_at}
            signatureName={quote.signature_name}
          />
        </div>
      )}

      {/* Meta */}
      <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/8 rounded-lg overflow-hidden border border-white/8">
        <div className="bg-foundri-surface px-4 py-3">
          <p className="text-xs text-foundri-muted mb-0.5">Klant</p>
          <p className="text-sm font-medium text-foundri-text truncate">
            {quote.clients?.company_name || quote.clients?.name || '—'}
          </p>
        </div>
        <div className="bg-foundri-surface px-4 py-3">
          <p className="text-xs text-foundri-muted mb-0.5">Excl. BTW</p>
          <p className="text-sm font-semibold text-foundri-text">{fmt(quote.amount_excl_vat)}</p>
        </div>
        <div className="bg-foundri-surface px-4 py-3">
          <p className="text-xs text-foundri-muted mb-0.5">Incl. BTW</p>
          <p className="text-sm font-semibold text-white">{fmt(quote.amount_incl_vat)}</p>
        </div>
        <div className="bg-foundri-surface px-4 py-3">
          <p className="text-xs text-foundri-muted mb-0.5">Geldig tot</p>
          <p className="text-sm font-medium text-foundri-text">
            {quote.valid_until ? fmtDate(quote.valid_until) : '—'}
          </p>
        </div>
      </div>

      {/* Description */}
      {quote.description && (
        <div className="mb-5 text-sm text-foundri-muted leading-relaxed whitespace-pre-wrap">
          {quote.description}
        </div>
      )}

      {/* Line items */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-foundri-muted uppercase tracking-wider">Regels</h2>
          {quote.status === 'concept' && (
            <button onClick={() => setShowAddItem(true)}
              className="inline-flex items-center gap-1 text-xs text-foundri-muted hover:text-foundri-text transition-colors">
              <Plus className="h-3.5 w-3.5" /> Toevoegen
            </button>
          )}
        </div>

        {quote.items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/10 py-8 text-center text-sm text-foundri-muted">
            Nog geen regels. Voeg regels toe om het bedrag te berekenen.
          </div>
        ) : (
          <div className="rounded-lg border border-white/8 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8 bg-foundri-surface">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-foundri-muted">Omschrijving</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-foundri-muted w-16">Aantal</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-foundri-muted w-14">Eenh.</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-foundri-muted w-24">Prijs</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-foundri-muted w-24">Totaal</th>
                  {quote.status === 'concept' && <th className="w-10" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {quote.items.map(item => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-foundri-text">{item.description}</td>
                    <td className="px-4 py-3 text-right text-foundri-muted">{Number(item.quantity)}</td>
                    <td className="px-4 py-3 text-foundri-muted">{item.unit}</td>
                    <td className="px-4 py-3 text-right text-foundri-text">{fmt(item.unit_price_cents)}</td>
                    <td className="px-4 py-3 text-right font-medium text-foundri-text">{fmt(item.total_cents)}</td>
                    {quote.status === 'concept' && (
                      <td className="px-3 py-3 text-right">
                        <button onClick={() => deleteItem(item.id)} className="text-foundri-muted hover:text-red-400 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-white/10">
                <tr>
                  <td colSpan={quote.status === 'concept' ? 5 : 4} className="px-4 pt-3 text-right text-xs text-foundri-muted">Subtotaal excl. BTW</td>
                  <td className="px-4 pt-3 text-right text-sm font-semibold text-foundri-text">{fmt(quote.amount_excl_vat)}</td>
                  {quote.status === 'concept' && <td />}
                </tr>
                <tr>
                  <td colSpan={quote.status === 'concept' ? 5 : 4} className="px-4 py-1 text-right text-xs text-foundri-muted">BTW ({quote.vat_pct}%)</td>
                  <td className="px-4 py-1 text-right text-sm text-foundri-text">{fmt(quote.amount_incl_vat - quote.amount_excl_vat)}</td>
                  {quote.status === 'concept' && <td />}
                </tr>
                <tr className="border-t border-white/10">
                  <td colSpan={quote.status === 'concept' ? 5 : 4} className="px-4 py-3 text-right text-sm font-semibold text-foundri-text">Totaal incl. BTW</td>
                  <td className="px-4 py-3 text-right text-base font-bold text-white">{fmt(quote.amount_incl_vat)}</td>
                  {quote.status === 'concept' && <td />}
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Notes */}
      {quote.notes && (
        <div className="rounded-lg border border-white/8 p-4">
          <p className="text-xs text-foundri-muted mb-2">Notities</p>
          <p className="text-sm text-foundri-text whitespace-pre-wrap leading-relaxed">{quote.notes}</p>
        </div>
      )}

      {/* Add Item Dialog */}
      {showAddItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowAddItem(false)}>
          <div className="w-full max-w-md rounded-xl bg-foundri-deep border border-white/10 p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-semibold mb-4 text-foundri-text">Regel toevoegen</h2>
            <form onSubmit={addItem} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-foundri-muted">Omschrijving *</label>
                <input required value={itemForm.description}
                  onChange={e => setItemForm({ ...itemForm, description: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-foundri-graphite px-3 py-2 text-sm text-foundri-text placeholder-foundri-muted focus:outline-none focus:border-white/25"
                  placeholder="Bestrating terras 40m²" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-foundri-muted">Aantal</label>
                  <input type="number" step="0.01" min="0.01" value={itemForm.quantity}
                    onChange={e => setItemForm({ ...itemForm, quantity: parseFloat(e.target.value) || 1 })}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-foundri-graphite px-3 py-2 text-sm text-foundri-text focus:outline-none focus:border-white/25" />
                </div>
                <div>
                  <label className="text-xs font-medium text-foundri-muted">Eenheid</label>
                  <select value={itemForm.unit}
                    onChange={e => setItemForm({ ...itemForm, unit: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-foundri-graphite px-3 py-2 text-sm text-foundri-text focus:outline-none focus:border-white/25">
                    {['stuk', 'uur', 'm²', 'm³', 'm¹', 'dag', 'post'].map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-foundri-muted">Prijs (€)</label>
                  <input type="number" step="0.01" min="0" value={itemForm.unit_price}
                    onChange={e => setItemForm({ ...itemForm, unit_price: parseFloat(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-foundri-graphite px-3 py-2 text-sm text-foundri-text focus:outline-none focus:border-white/25" />
                </div>
              </div>
              <p className="text-xs text-foundri-muted text-right">
                Totaal: {new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(itemForm.quantity * itemForm.unit_price)}
              </p>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowAddItem(false)}
                  className="rounded-lg px-4 py-2 text-sm text-foundri-muted hover:text-foundri-text transition-colors">
                  Annuleren
                </button>
                <button type="submit"
                  className="rounded-lg bg-foundri-yellow text-foundri-graphite px-4 py-2 text-sm font-medium hover:bg-foundri-yellow-dim">
                  Toevoegen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
