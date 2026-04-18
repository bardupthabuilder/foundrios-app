'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Send, Check, Ban, AlertTriangle, Download } from 'lucide-react'

type InvoiceItem = {
  id: string
  description: string
  quantity: number
  unit: string
  unit_price_cents: number
  total_cents: number
}

type Invoice = {
  id: string
  invoice_number: string | null
  title: string | null
  status: string
  amount_excl_vat: number
  vat_pct: number
  issue_date: string | null
  due_date: string | null
  paid_at: string | null
  notes: string | null
  quote_id: string | null
  created_at: string
  clients: any
  projects: any
  items: InvoiceItem[]
}

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: 'Concept', color: 'bg-foundri-card text-zinc-200' },
  sent: { label: 'Verstuurd', color: 'bg-blue-500/10 text-blue-400' },
  paid: { label: 'Betaald', color: 'bg-green-500/10 text-green-400' },
  overdue: { label: 'Verlopen', color: 'bg-red-500/10 text-red-400' },
  cancelled: { label: 'Geannuleerd', color: 'bg-foundri-card text-zinc-400' },
}

const statusActions: Record<string, { label: string; next: string; icon: any; color: string }[]> = {
  draft: [
    { label: 'Markeer als verstuurd', next: 'sent', icon: Send, color: 'bg-blue-600 hover:bg-blue-700' },
  ],
  sent: [
    { label: 'Markeer als betaald', next: 'paid', icon: Check, color: 'bg-green-600 hover:bg-green-700' },
    { label: 'Markeer als verlopen', next: 'overdue', icon: AlertTriangle, color: 'bg-amber-600 hover:bg-amber-700' },
  ],
  overdue: [
    { label: 'Markeer als betaald', next: 'paid', icon: Check, color: 'bg-green-600 hover:bg-green-700' },
    { label: 'Annuleren', next: 'cancelled', icon: Ban, color: 'bg-red-600 hover:bg-red-700' },
  ],
  paid: [],
  cancelled: [],
}

export default function InvoiceDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchInvoice() }, [id])

  async function fetchInvoice() {
    const res = await fetch(`/api/invoices/${id}`)
    if (res.ok) setInvoice(await res.json())
    setLoading(false)
  }

  async function updateStatus(status: string) {
    await fetch(`/api/invoices/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    fetchInvoice()
  }

  const fmt = (cents: number) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100)

  if (loading) return <div className="p-6 pt-16 lg:pt-6 text-sm text-zinc-400">Laden...</div>
  if (!invoice) return <div className="p-6 pt-16 lg:pt-6 text-sm text-red-500">Factuur niet gevonden</div>

  const sc = statusConfig[invoice.status] || statusConfig.draft
  const actions = statusActions[invoice.status] || []
  const vatAmount = Math.round(invoice.amount_excl_vat * (invoice.vat_pct / 100))
  const totalIncl = invoice.amount_excl_vat + vatAmount
  const isOverdue = invoice.status === 'sent' && invoice.due_date && new Date(invoice.due_date) < new Date()

  return (
    <div className="p-4 lg:p-6 pt-16 lg:pt-6 max-w-4xl">
      <button onClick={() => router.push('/dashboard/facturen')} className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200">
        <ArrowLeft className="h-4 w-4" /> Terug naar facturen
      </button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{invoice.title || invoice.invoice_number || 'Factuur'}</h1>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${isOverdue ? 'bg-red-500/10 text-red-400' : sc.color}`}>
              {isOverdue ? 'Verlopen' : sc.label}
            </span>
          </div>
          <p className="text-sm text-zinc-400 mt-1">{invoice.invoice_number}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => window.open(`/dashboard/facturen/${id}/print`, '_blank')}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-white/5"
          >
            <Download className="h-4 w-4" /> PDF
          </button>
          {actions.map(a => {
            const Icon = a.icon
            return (
              <button key={a.next} onClick={() => updateStatus(a.next)} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white ${a.color}`}>
                <Icon className="h-4 w-4" /> {a.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="rounded-lg border p-3">
          <div className="text-xs text-zinc-400">Bedrag excl. BTW</div>
          <div className="text-lg font-semibold">{fmt(invoice.amount_excl_vat)}</div>
        </div>
        <div className="rounded-lg border p-3">
          <div className="text-xs text-zinc-400">Incl. BTW ({invoice.vat_pct}%)</div>
          <div className="text-lg font-semibold">{fmt(totalIncl)}</div>
        </div>
        <div className="rounded-lg border p-3">
          <div className="text-xs text-zinc-400">Klant</div>
          <div className="text-sm font-medium truncate">{invoice.clients?.company_name || invoice.clients?.name || (invoice as any).client_name || '—'}</div>
        </div>
        <div className={`rounded-lg border p-3 ${isOverdue ? 'border-red-500/30 bg-red-500/10' : ''}`}>
          <div className="text-xs text-zinc-400">Vervaldatum</div>
          <div className={`text-sm font-medium ${isOverdue ? 'text-red-400' : ''}`}>
            {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('nl-NL') : '—'}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg bg-foundri-surface p-3">
          <div className="text-xs text-zinc-400">Aangemaakt</div>
          <div className="text-sm">{new Date(invoice.created_at).toLocaleDateString('nl-NL')}</div>
        </div>
        <div className="rounded-lg bg-foundri-surface p-3">
          <div className="text-xs text-zinc-400">Factuurdatum</div>
          <div className="text-sm">{invoice.issue_date ? new Date(invoice.issue_date).toLocaleDateString('nl-NL') : '—'}</div>
        </div>
        <div className="rounded-lg bg-foundri-surface p-3">
          <div className="text-xs text-zinc-400">Vervaldatum</div>
          <div className="text-sm">{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('nl-NL') : '—'}</div>
        </div>
        <div className="rounded-lg bg-foundri-surface p-3">
          <div className="text-xs text-zinc-400">Betaald op</div>
          <div className="text-sm">{invoice.paid_at ? new Date(invoice.paid_at).toLocaleDateString('nl-NL') : '—'}</div>
        </div>
      </div>

      {/* Line Items */}
      {invoice.items && invoice.items.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-white mb-3">Regels</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-zinc-400">
                  <th className="pb-2 font-medium">Omschrijving</th>
                  <th className="pb-2 font-medium text-right w-20">Aantal</th>
                  <th className="pb-2 font-medium w-16">Eenheid</th>
                  <th className="pb-2 font-medium text-right w-24">Prijs</th>
                  <th className="pb-2 font-medium text-right w-24">Totaal</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map(item => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-2.5">{item.description}</td>
                    <td className="py-2.5 text-right">{Number(item.quantity)}</td>
                    <td className="py-2.5">{item.unit}</td>
                    <td className="py-2.5 text-right">{fmt(item.unit_price_cents)}</td>
                    <td className="py-2.5 text-right font-medium">{fmt(item.total_cents)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t">
                  <td colSpan={4} className="pt-2.5 text-right text-xs text-zinc-400">Subtotaal</td>
                  <td className="pt-2.5 text-right font-semibold">{fmt(invoice.amount_excl_vat)}</td>
                </tr>
                <tr>
                  <td colSpan={4} className="py-1 text-right text-xs text-zinc-400">BTW ({invoice.vat_pct}%)</td>
                  <td className="py-1 text-right text-sm">{fmt(vatAmount)}</td>
                </tr>
                <tr className="border-t">
                  <td colSpan={4} className="pt-2 text-right text-sm font-semibold">Totaal incl. BTW</td>
                  <td className="pt-2 text-right text-base font-bold">{fmt(totalIncl)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Project link */}
      {invoice.projects && (
        <div className="mb-6 rounded-lg border p-4">
          <h3 className="text-xs font-medium text-zinc-400 mb-1">Project</h3>
          <button onClick={() => router.push(`/dashboard/projecten/${invoice.projects.id}`)} className="text-sm font-medium text-blue-400 hover:underline">
            {invoice.projects.name}
          </button>
        </div>
      )}

      {/* Notes */}
      {invoice.notes && (
        <div className="rounded-lg border p-4">
          <h3 className="text-xs font-medium text-zinc-400 mb-1">Notities</h3>
          <p className="text-sm text-zinc-200 whitespace-pre-wrap">{invoice.notes}</p>
        </div>
      )}
    </div>
  )
}
