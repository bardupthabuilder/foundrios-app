'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, FileCheck, Send, X, Check, ArrowRightLeft } from 'lucide-react'

type QuoteItem = {
  id: string
  description: string
  quantity: number
  unit: string
  unit_price_cents: number
  total_cents: number
  sort_order: number
}

type Quote = {
  id: string
  quote_number: string | null
  title: string
  description: string | null
  status: string
  amount_excl_vat: number
  amount_incl_vat: number
  vat_pct: number
  valid_until: string | null
  sent_at: string | null
  accepted_at: string | null
  rejected_at: string | null
  notes: string | null
  created_at: string
  clients: any
  projects: any
  items: QuoteItem[]
}

const statusActions: Record<string, { label: string; next: string; icon: any; color: string }[]> = {
  concept: [
    { label: 'Versturen', next: 'verstuurd', icon: Send, color: 'bg-blue-600 hover:bg-blue-700' },
  ],
  verstuurd: [
    { label: 'Akkoord', next: 'akkoord', icon: Check, color: 'bg-green-600 hover:bg-green-700' },
    { label: 'Afgewezen', next: 'afgewezen', icon: X, color: 'bg-red-600 hover:bg-red-700' },
  ],
  akkoord: [],
  afgewezen: [],
  verlopen: [],
}

const statusConfig: Record<string, { label: string; color: string }> = {
  concept: { label: 'Concept', color: 'bg-zinc-100 text-zinc-700' },
  verstuurd: { label: 'Verstuurd', color: 'bg-blue-100 text-blue-700' },
  akkoord: { label: 'Akkoord', color: 'bg-green-100 text-green-700' },
  afgewezen: { label: 'Afgewezen', color: 'bg-red-100 text-red-700' },
  verlopen: { label: 'Verlopen', color: 'bg-amber-100 text-amber-700' },
}

export default function QuoteDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddItem, setShowAddItem] = useState(false)
  const [itemForm, setItemForm] = useState({ description: '', quantity: 1, unit: 'stuk', unit_price: 0 })
  const [converting, setConverting] = useState(false)

  useEffect(() => { fetchQuote() }, [id])

  async function fetchQuote() {
    const res = await fetch(`/api/quotes/${id}`)
    if (res.ok) {
      setQuote(await res.json())
    }
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
    const res = await fetch(`/api/quotes/${id}/convert`, { method: 'POST' })
    if (res.ok) {
      const invoice = await res.json()
      router.push(`/dashboard/facturen/${invoice.id}`)
    }
    setConverting(false)
  }

  const fmt = (cents: number) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100)

  if (loading) return <div className="p-6 pt-16 lg:pt-6 text-sm text-zinc-400">Laden...</div>
  if (!quote) return <div className="p-6 pt-16 lg:pt-6 text-sm text-red-500">Offerte niet gevonden</div>

  const sc = statusConfig[quote.status] || statusConfig.concept
  const actions = statusActions[quote.status] || []

  return (
    <div className="p-4 lg:p-6 pt-16 lg:pt-6 max-w-4xl">
      {/* Back + Title */}
      <button onClick={() => router.push('/dashboard/offertes')} className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700">
        <ArrowLeft className="h-4 w-4" /> Terug naar offertes
      </button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-zinc-900">{quote.title}</h1>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${sc.color}`}>{sc.label}</span>
          </div>
          <p className="text-sm text-zinc-500 mt-1">{quote.quote_number} · Aangemaakt {new Date(quote.created_at).toLocaleDateString('nl-NL')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {actions.map(a => {
            const Icon = a.icon
            return (
              <button key={a.next} onClick={() => updateStatus(a.next)} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white ${a.color}`}>
                <Icon className="h-4 w-4" /> {a.label}
              </button>
            )
          })}
          {quote.status === 'akkoord' && (
            <button onClick={convertToInvoice} disabled={converting} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
              <ArrowRightLeft className="h-4 w-4" /> {converting ? 'Bezig...' : 'Omzetten naar factuur'}
            </button>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="rounded-lg border p-3">
          <div className="text-xs text-zinc-500">Excl. BTW</div>
          <div className="text-lg font-semibold">{fmt(quote.amount_excl_vat)}</div>
        </div>
        <div className="rounded-lg border p-3">
          <div className="text-xs text-zinc-500">Incl. BTW ({quote.vat_pct}%)</div>
          <div className="text-lg font-semibold">{fmt(quote.amount_incl_vat)}</div>
        </div>
        <div className="rounded-lg border p-3">
          <div className="text-xs text-zinc-500">Klant</div>
          <div className="text-sm font-medium truncate">{quote.clients?.company_name || quote.clients?.name || '—'}</div>
        </div>
        <div className="rounded-lg border p-3">
          <div className="text-xs text-zinc-500">Geldig tot</div>
          <div className="text-sm font-medium">{quote.valid_until ? new Date(quote.valid_until).toLocaleDateString('nl-NL') : '—'}</div>
        </div>
      </div>

      {/* Description */}
      {quote.description && (
        <div className="mb-6 rounded-lg border p-4">
          <h3 className="text-xs font-medium text-zinc-500 mb-1">Omschrijving</h3>
          <p className="text-sm text-zinc-700 whitespace-pre-wrap">{quote.description}</p>
        </div>
      )}

      {/* Line Items */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-zinc-900">Regels</h2>
          {(quote.status === 'concept') && (
            <button onClick={() => setShowAddItem(true)} className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 hover:text-zinc-900">
              <Plus className="h-3.5 w-3.5" /> Regel toevoegen
            </button>
          )}
        </div>

        {quote.items.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-zinc-400">
            Nog geen regels. Voeg regels toe om het bedrag te berekenen.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-zinc-500">
                  <th className="pb-2 font-medium">Omschrijving</th>
                  <th className="pb-2 font-medium text-right w-20">Aantal</th>
                  <th className="pb-2 font-medium w-16">Eenheid</th>
                  <th className="pb-2 font-medium text-right w-24">Prijs</th>
                  <th className="pb-2 font-medium text-right w-24">Totaal</th>
                  {quote.status === 'concept' && <th className="w-10"></th>}
                </tr>
              </thead>
              <tbody>
                {quote.items.map(item => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-2.5">{item.description}</td>
                    <td className="py-2.5 text-right">{Number(item.quantity)}</td>
                    <td className="py-2.5">{item.unit}</td>
                    <td className="py-2.5 text-right">{fmt(item.unit_price_cents)}</td>
                    <td className="py-2.5 text-right font-medium">{fmt(item.total_cents)}</td>
                    {quote.status === 'concept' && (
                      <td className="py-2.5 text-right">
                        <button onClick={() => deleteItem(item.id)} className="text-zinc-400 hover:text-red-500">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t">
                  <td colSpan={4} className="pt-2.5 text-right text-xs text-zinc-500">Subtotaal excl. BTW</td>
                  <td className="pt-2.5 text-right font-semibold">{fmt(quote.amount_excl_vat)}</td>
                  {quote.status === 'concept' && <td></td>}
                </tr>
                <tr>
                  <td colSpan={4} className="py-1 text-right text-xs text-zinc-500">BTW ({quote.vat_pct}%)</td>
                  <td className="py-1 text-right text-sm">{fmt(quote.amount_incl_vat - quote.amount_excl_vat)}</td>
                  {quote.status === 'concept' && <td></td>}
                </tr>
                <tr className="border-t">
                  <td colSpan={4} className="pt-2 text-right text-sm font-semibold">Totaal incl. BTW</td>
                  <td className="pt-2 text-right text-base font-bold">{fmt(quote.amount_incl_vat)}</td>
                  {quote.status === 'concept' && <td></td>}
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Notes */}
      {quote.notes && (
        <div className="rounded-lg border p-4">
          <h3 className="text-xs font-medium text-zinc-500 mb-1">Notities</h3>
          <p className="text-sm text-zinc-700 whitespace-pre-wrap">{quote.notes}</p>
        </div>
      )}

      {/* Add Item Dialog */}
      {showAddItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowAddItem(false)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Regel toevoegen</h2>
            <form onSubmit={addItem} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-zinc-600">Omschrijving *</label>
                <input required value={itemForm.description} onChange={e => setItemForm({ ...itemForm, description: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" placeholder="Bestrating terras 40m²" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-zinc-600">Aantal</label>
                  <input type="number" step="0.01" min="0.01" value={itemForm.quantity} onChange={e => setItemForm({ ...itemForm, quantity: parseFloat(e.target.value) || 1 })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-600">Eenheid</label>
                  <select value={itemForm.unit} onChange={e => setItemForm({ ...itemForm, unit: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm">
                    <option value="stuk">Stuk</option>
                    <option value="uur">Uur</option>
                    <option value="m²">m²</option>
                    <option value="m³">m³</option>
                    <option value="m¹">m¹</option>
                    <option value="dag">Dag</option>
                    <option value="post">Post</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-600">Prijs (€)</label>
                  <input type="number" step="0.01" min="0" value={itemForm.unit_price} onChange={e => setItemForm({ ...itemForm, unit_price: parseFloat(e.target.value) || 0 })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="text-right text-sm text-zinc-500">
                Totaal: {new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(itemForm.quantity * itemForm.unit_price)}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddItem(false)} className="rounded-lg px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100">Annuleren</button>
                <button type="submit" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">Toevoegen</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
