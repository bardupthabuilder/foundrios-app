'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Send, Check, Ban, AlertTriangle, Download, MessageCircle, Mail, Plus, Trash2 } from 'lucide-react'

function normalizePhone(phone: string) {
  return phone.replace(/\s+/g, '').replace(/^00/, '+').replace(/^0([1-9])/, '+31$1')
}

type InvoiceItem = {
  id: string; description: string; quantity: number; unit: string
  unit_price_cents: number; total_cents: number
}

type Invoice = {
  id: string; invoice_number: string | null; title: string | null
  status: string; amount_excl_vat: number; vat_pct: number
  issue_date: string | null; due_date: string | null; paid_at: string | null
  notes: string | null; quote_id: string | null; created_at: string
  clients: any; projects: any; items: InvoiceItem[]
}

const statusConfig: Record<string, { label: string; color: string }> = {
  draft:     { label: 'Concept',     color: 'bg-white/5 text-foundri-muted' },
  sent:      { label: 'Verstuurd',   color: 'bg-foundri-yellow/10 text-foundri-yellow' },
  paid:      { label: 'Betaald',     color: 'bg-green-500/10 text-green-400' },
  overdue:   { label: 'Verlopen',    color: 'bg-red-500/10 text-red-400' },
  cancelled: { label: 'Geannuleerd', color: 'bg-white/5 text-foundri-muted' },
}

const statusActions: Record<string, { label: string; next: string; icon: any; color: string }[]> = {
  draft:   [{ label: 'Markeer verstuurd', next: 'sent',      icon: Send,          color: 'bg-foundri-yellow text-foundri-graphite hover:bg-foundri-yellow-dim' }],
  sent:    [
    { label: 'Betaald',   next: 'paid',      icon: Check,          color: 'bg-green-600 text-white hover:bg-green-700' },
    { label: 'Verlopen',  next: 'overdue',   icon: AlertTriangle,  color: 'bg-white/8 text-foundri-text hover:bg-white/12' },
  ],
  overdue: [
    { label: 'Betaald',   next: 'paid',      icon: Check, color: 'bg-green-600 text-white hover:bg-green-700' },
    { label: 'Annuleren', next: 'cancelled', icon: Ban,   color: 'bg-white/5 text-foundri-muted hover:bg-white/10' },
  ],
  paid: [], cancelled: [],
}

export default function InvoiceDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddItem, setShowAddItem] = useState(false)
  const [itemBusy, setItemBusy] = useState(false)
  const [itemForm, setItemForm] = useState({ description: '', quantity: 1, unit: 'stuk', unit_price: 0 })

  useEffect(() => { fetchInvoice() }, [id])

  async function fetchInvoice() {
    const res = await fetch(`/api/invoices/${id}`)
    if (res.ok) setInvoice(await res.json())
    setLoading(false)
  }

  // Regels aanpassen mag alleen zolang de factuur nog niet de deur uit is.
  async function addItem(e: React.FormEvent) {
    e.preventDefault()
    setItemBusy(true)
    await fetch('/api/invoice-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invoice_id: id,
        description: itemForm.description,
        quantity: itemForm.quantity,
        unit: itemForm.unit || 'stuk',
        unit_price_cents: Math.round(itemForm.unit_price * 100),
        sort_order: (invoice?.items.length ?? 0) + 1,
      }),
    })
    setItemForm({ description: '', quantity: 1, unit: 'stuk', unit_price: 0 })
    setShowAddItem(false)
    setItemBusy(false)
    fetchInvoice()
  }

  async function deleteItem(itemId: string) {
    await fetch(`/api/invoice-items/${itemId}`, { method: 'DELETE' })
    fetchInvoice()
  }

  async function updateStatus(status: string) {
    await fetch(`/api/invoices/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    fetchInvoice()
  }

  const fmt = (cents: number) =>
    new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100)
  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })

  if (loading) return <div className="p-6 pt-16 lg:pt-6 text-sm text-foundri-muted">Laden...</div>
  if (!invoice) return <div className="p-6 pt-16 lg:pt-6 text-sm text-red-400">Factuur niet gevonden</div>

  const sc = statusConfig[invoice.status] || statusConfig.draft
  const actions = statusActions[invoice.status] || []
  const vatAmount = Math.round(invoice.amount_excl_vat * (invoice.vat_pct / 100))
  const totalIncl = invoice.amount_excl_vat + vatAmount
  const isOverdue = invoice.status === 'sent' && invoice.due_date && new Date(invoice.due_date) < new Date()
  const isDraft = invoice.status === 'draft'
  const clientName = invoice.clients?.contact_name || invoice.clients?.company_name || invoice.clients?.name || ''

  const waMessage = [
    `Beste${clientName ? ' ' + clientName : ''},`,
    '',
    `Hierbij${invoice.title ? ` de factuur voor "${invoice.title}"` : ` factuur ${invoice.invoice_number || ''}`}.`,
    `Bedrag: ${fmt(totalIncl)} incl. BTW`,
    invoice.due_date ? `Vervaldatum: ${fmtDate(invoice.due_date)}` : null,
    '',
    'Heb je vragen? Bel of app ons gerust.',
  ].filter(l => l !== null).join('\n')

  return (
    <div className="p-4 lg:p-6 pt-16 lg:pt-6 max-w-3xl">

      {/* Back */}
      <button
        onClick={() => router.push('/dashboard/facturen')}
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-foundri-muted hover:text-foundri-text transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Facturen
      </button>

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h1 className="text-xl font-semibold text-white">
                {invoice.title || invoice.invoice_number || 'Factuur'}
              </h1>
              <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${isOverdue ? 'bg-red-500/10 text-red-400' : sc.color}`}>
                {isOverdue ? 'Verlopen' : sc.label}
              </span>
            </div>
            {invoice.invoice_number && (
              <p className="text-sm text-foundri-muted">{invoice.invoice_number}</p>
            )}
          </div>
          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => window.open(`/print/factuur/${id}`, '_blank')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-sm text-foundri-muted hover:border-white/20 hover:text-foundri-text transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> PDF
            </button>
            {invoice.clients?.phone && (
              <a
                href={`https://wa.me/${normalizePhone(invoice.clients.phone)}?text=${encodeURIComponent(waMessage)}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-sm text-foundri-muted hover:border-white/20 hover:text-foundri-text transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
              </a>
            )}
            {invoice.clients?.email && (
              <a
                href={`mailto:${invoice.clients.email}?subject=${encodeURIComponent(`Factuur ${invoice.invoice_number || ''}`)}&body=${encodeURIComponent(waMessage)}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-sm text-foundri-muted hover:border-white/20 hover:text-foundri-text transition-colors"
              >
                <Mail className="h-3.5 w-3.5" /> E-mail
              </a>
            )}
            {actions.map(a => {
              const Icon = a.icon
              return (
                <button
                  key={a.next}
                  onClick={() => updateStatus(a.next)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${a.color}`}
                >
                  <Icon className="h-3.5 w-3.5" /> {a.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Meta */}
      <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/8 rounded-lg overflow-hidden border border-white/8">
        <div className="bg-foundri-surface px-4 py-3">
          <p className="text-xs text-foundri-muted mb-0.5">Klant</p>
          <p className="text-sm font-medium text-foundri-text truncate">
            {invoice.clients?.company_name || invoice.clients?.name || '—'}
          </p>
        </div>
        <div className="bg-foundri-surface px-4 py-3">
          <p className="text-xs text-foundri-muted mb-0.5">Bedrag excl. BTW</p>
          <p className="text-sm font-semibold text-foundri-text">{fmt(invoice.amount_excl_vat)}</p>
        </div>
        <div className="bg-foundri-surface px-4 py-3">
          <p className="text-xs text-foundri-muted mb-0.5">Totaal incl. BTW</p>
          <p className="text-sm font-semibold text-white">{fmt(totalIncl)}</p>
        </div>
        <div className={`bg-foundri-surface px-4 py-3 ${isOverdue ? 'bg-red-950/30' : ''}`}>
          <p className="text-xs text-foundri-muted mb-0.5">Vervaldatum</p>
          <p className={`text-sm font-medium ${isOverdue ? 'text-red-400' : 'text-foundri-text'}`}>
            {invoice.due_date ? fmtDate(invoice.due_date) : '—'}
          </p>
        </div>
      </div>

      {/* Line items */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold text-foundri-muted uppercase tracking-wider">Regels</h2>
          {isDraft && (
            <button
              onClick={() => setShowAddItem(v => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1 text-xs text-foundri-muted transition-colors hover:border-white/20 hover:text-foundri-text"
            >
              <Plus className="h-3.5 w-3.5" /> Regel
            </button>
          )}
        </div>

        {showAddItem && isDraft && (
          <form onSubmit={addItem} className="mb-3 grid gap-2 rounded-lg border border-white/10 bg-foundri-deep p-3 sm:grid-cols-[1fr_5rem_5rem_7rem_auto]">
            <input required value={itemForm.description} onChange={e => setItemForm({ ...itemForm, description: e.target.value })}
              placeholder="Omschrijving"
              className="rounded-md border border-white/10 bg-foundri-surface px-2 py-1.5 text-sm text-white placeholder:text-zinc-600 focus:border-white/20 focus:outline-none" />
            <input type="number" step="0.01" min="0.01" required value={itemForm.quantity} onChange={e => setItemForm({ ...itemForm, quantity: Number(e.target.value) })}
              placeholder="Aantal"
              className="rounded-md border border-white/10 bg-foundri-surface px-2 py-1.5 text-sm text-white focus:border-white/20 focus:outline-none" />
            <input value={itemForm.unit} onChange={e => setItemForm({ ...itemForm, unit: e.target.value })}
              placeholder="stuk"
              className="rounded-md border border-white/10 bg-foundri-surface px-2 py-1.5 text-sm text-white focus:border-white/20 focus:outline-none" />
            <input type="number" step="0.01" min="0" required value={itemForm.unit_price} onChange={e => setItemForm({ ...itemForm, unit_price: Number(e.target.value) })}
              placeholder="Prijs €"
              className="rounded-md border border-white/10 bg-foundri-surface px-2 py-1.5 text-sm text-white focus:border-white/20 focus:outline-none" />
            <button type="submit" disabled={itemBusy}
              className="rounded-md bg-foundri-yellow px-3 py-1.5 text-sm font-medium text-foundri-graphite hover:bg-foundri-yellow-dim disabled:opacity-50">
              {itemBusy ? '...' : 'Voeg toe'}
            </button>
          </form>
        )}

        {(!invoice.items || invoice.items.length === 0) ? (
          <p className="rounded-lg border border-dashed border-white/10 px-4 py-6 text-center text-sm text-foundri-muted">
            Nog geen regels. {isDraft ? 'Voeg er een toe zodat de klant ziet waarvoor hij betaalt.' : ''}
          </p>
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
                  {isDraft && <th className="w-10" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {invoice.items.map(item => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-foundri-text">{item.description}</td>
                    <td className="px-4 py-3 text-right text-foundri-muted">{Number(item.quantity)}</td>
                    <td className="px-4 py-3 text-foundri-muted">{item.unit}</td>
                    <td className="px-4 py-3 text-right text-foundri-text">{fmt(item.unit_price_cents)}</td>
                    <td className="px-4 py-3 text-right font-medium text-foundri-text">{fmt(item.total_cents)}</td>
                    {isDraft && (
                      <td className="px-2 py-3 text-right">
                        <button onClick={() => deleteItem(item.id)} title="Regel verwijderen"
                          className="text-zinc-600 transition-colors hover:text-red-400">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-white/10">
                <tr>
                  <td colSpan={4} className="px-4 pt-3 text-right text-xs text-foundri-muted">Subtotaal excl. BTW</td>
                  <td className="px-4 pt-3 text-right text-sm font-semibold text-foundri-text">{fmt(invoice.amount_excl_vat)}</td>
                  {isDraft && <td />}
                </tr>
                <tr>
                  <td colSpan={4} className="px-4 py-1 text-right text-xs text-foundri-muted">BTW ({invoice.vat_pct}%)</td>
                  <td className="px-4 py-1 text-right text-sm text-foundri-text">{fmt(vatAmount)}</td>
                  {isDraft && <td />}
                </tr>
                <tr className="border-t border-white/10">
                  <td colSpan={4} className="px-4 py-3 text-right text-sm font-semibold text-foundri-text">Totaal incl. BTW</td>
                  <td className="px-4 py-3 text-right text-base font-bold text-white">{fmt(totalIncl)}</td>
                  {isDraft && <td />}
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Project */}
      {invoice.projects && (
        <div className="mb-4">
          <p className="text-xs text-foundri-muted mb-1">Project</p>
          <button
            onClick={() => router.push(`/dashboard/projecten/${invoice.projects.id}`)}
            className="text-sm text-foundri-yellow hover:underline"
          >
            {invoice.projects.name}
          </button>
        </div>
      )}

      {/* Notes */}
      {invoice.notes && (
        <div className="rounded-lg border border-white/8 p-4">
          <p className="text-xs text-foundri-muted mb-2">Notities</p>
          <p className="text-sm text-foundri-text whitespace-pre-wrap leading-relaxed">{invoice.notes}</p>
        </div>
      )}

    </div>
  )
}
