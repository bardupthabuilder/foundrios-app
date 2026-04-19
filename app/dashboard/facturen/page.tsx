'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Receipt, Search } from 'lucide-react'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'

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
  created_at: string
  clients: { id: string; name: string; company_name: string } | null
  projects: { id: string; name: string } | null
}

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: 'Concept', color: 'bg-foundri-card text-zinc-200' },
  sent: { label: 'Verstuurd', color: 'bg-blue-500/10 text-blue-400' },
  paid: { label: 'Betaald', color: 'bg-green-500/10 text-green-400' },
  overdue: { label: 'Verlopen', color: 'bg-red-500/10 text-red-400' },
  cancelled: { label: 'Geannuleerd', color: 'bg-foundri-card text-zinc-400' },
}

const tabs = [
  { key: '', label: 'Alle' },
  { key: 'draft', label: 'Concept' },
  { key: 'sent', label: 'Verstuurd' },
  { key: 'paid', label: 'Betaald' },
  { key: 'overdue', label: 'Verlopen' },
]

export default function FacturenPage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [clients, setClients] = useState<{ id: string; name: string }[]>([])
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [form, setForm] = useState({ title: '', client_id: '', project_id: '', amount_excl_vat: 0, vat_pct: 21, due_date: '' })

  useEffect(() => {
    fetchInvoices()
    fetch('/api/clients').then(r => r.json()).then(d => setClients(Array.isArray(d) ? d : []))
    fetch('/api/projects').then(r => r.json()).then(d => setProjects(Array.isArray(d) ? d : []))
  }, [filter])

  async function fetchInvoices() {
    setLoading(true)
    const url = filter ? `/api/invoices?status=${filter}` : '/api/invoices'
    const res = await fetch(url)
    const data = await res.json()
    setInvoices(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function createInvoice(e: React.FormEvent) {
    e.preventDefault()
    const today = new Date().toISOString().split('T')[0]
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        client_id: form.client_id || null,
        project_id: form.project_id || null,
        amount_excl_vat: Math.round(form.amount_excl_vat * 100),
        issue_date: today,
        due_date: form.due_date || null,
      }),
    })
    if (res.ok) {
      const invoice = await res.json()
      setShowNew(false)
      setForm({ title: '', client_id: '', project_id: '', amount_excl_vat: 0, vat_pct: 21, due_date: '' })
      router.push(`/dashboard/facturen/${invoice.id}`)
    }
  }

  const fmt = (cents: number) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100)

  const filtered = invoices.filter(inv =>
    !search || inv.title?.toLowerCase().includes(search.toLowerCase()) ||
    inv.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
    inv.clients?.name?.toLowerCase().includes(search.toLowerCase()) ||
    inv.clients?.company_name?.toLowerCase().includes(search.toLowerCase())
  )

  const totalOpen = filtered.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((s, i) => s + i.amount_excl_vat, 0)
  const totalPaid = filtered.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount_excl_vat, 0)

  return (
    <div className="p-4 lg:p-6 pt-16 lg:pt-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Facturen</h1>
          <p className="text-sm text-zinc-400">{filtered.length} facturen · {fmt(totalOpen)} openstaand · {fmt(totalPaid)} betaald</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
        >
          <Plus className="h-4 w-4" /> Nieuwe factuur
        </button>
      </div>

      {/* Search + Tabs */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Zoek factuur..."
            className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <div className="flex gap-1">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${filter === t.key ? 'bg-zinc-900 text-white' : 'bg-foundri-card text-zinc-300 hover:bg-white/15'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center">
          <Receipt className="mx-auto h-8 w-8 text-zinc-300" />
          <p className="mt-2 text-sm text-zinc-400">Nog geen facturen</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(inv => {
            const sc = statusConfig[inv.status] || statusConfig.draft
            const isOverdue = inv.status === 'sent' && inv.due_date && new Date(inv.due_date) < new Date()
            return (
              <div
                key={inv.id}
                onClick={() => router.push(`/dashboard/facturen/${inv.id}`)}
                className="flex cursor-pointer items-center gap-4 rounded-lg border p-4 hover:bg-white/5 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white truncate">{inv.title || inv.invoice_number || 'Factuur'}</span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${isOverdue ? 'bg-red-500/10 text-red-400' : sc.color}`}>
                      {isOverdue ? 'Verlopen' : sc.label}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">
                    {inv.invoice_number && <span>{inv.invoice_number}</span>}
                    {inv.clients && <span>{inv.clients.company_name || inv.clients.name}</span>}
                    {inv.issue_date && <span>Datum: {new Date(inv.issue_date).toLocaleDateString('nl-NL')}</span>}
                    {inv.due_date && <span>Vervalt: {new Date(inv.due_date).toLocaleDateString('nl-NL')}</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-semibold text-white">{fmt(inv.amount_excl_vat)}</div>
                  <div className="text-xs text-zinc-400">excl. BTW</div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* New Invoice Dialog */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowNew(false)}>
          <div className="w-full max-w-md rounded-xl bg-foundri-deep p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Nieuwe factuur</h2>
            <form onSubmit={createInvoice} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-zinc-300">Titel</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" placeholder="Tuinaanleg fase 1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-zinc-300">Klant</label>
                  <select value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm">
                    <option value="">Selecteer...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-300">Project</label>
                  <select value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm">
                    <option value="">Selecteer...</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-zinc-300">Bedrag excl. BTW (€)</label>
                  <input type="number" step="0.01" min="0" value={form.amount_excl_vat} onChange={e => setForm({ ...form, amount_excl_vat: parseFloat(e.target.value) || 0 })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-300">Vervaldatum</label>
                  <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowNew(false)} className="rounded-lg px-4 py-2 text-sm text-zinc-300 hover:bg-white/10">Annuleren</button>
                <button type="submit" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">Aanmaken</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
