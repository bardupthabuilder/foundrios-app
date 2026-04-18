'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, FileText, Search } from 'lucide-react'

type Quote = {
  id: string
  quote_number: string | null
  title: string
  status: string
  amount_excl_vat: number
  amount_incl_vat: number
  vat_pct: number
  valid_until: string | null
  created_at: string
  clients: { id: string; name: string; company_name: string } | null
  projects: { id: string; name: string } | null
}

const statusConfig: Record<string, { label: string; color: string }> = {
  concept: { label: 'Concept', color: 'bg-foundri-card text-zinc-200' },
  verstuurd: { label: 'Verstuurd', color: 'bg-blue-500/10 text-blue-400' },
  akkoord: { label: 'Akkoord', color: 'bg-green-500/10 text-green-400' },
  afgewezen: { label: 'Afgewezen', color: 'bg-red-500/10 text-red-400' },
  verlopen: { label: 'Verlopen', color: 'bg-amber-100 text-amber-400' },
}

const tabs = [
  { key: '', label: 'Alle' },
  { key: 'concept', label: 'Concept' },
  { key: 'verstuurd', label: 'Verstuurd' },
  { key: 'akkoord', label: 'Akkoord' },
  { key: 'afgewezen', label: 'Afgewezen' },
]

export default function OffertesPage() {
  const router = useRouter()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [clients, setClients] = useState<{ id: string; name: string }[]>([])
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [form, setForm] = useState({ title: '', client_id: '', project_id: '', amount_excl_vat: 0, vat_pct: 21, valid_until: '' })

  useEffect(() => {
    fetchQuotes()
    fetch('/api/clients').then(r => r.json()).then(d => setClients(Array.isArray(d) ? d : []))
    fetch('/api/projects').then(r => r.json()).then(d => setProjects(Array.isArray(d) ? d : []))
  }, [filter])

  async function fetchQuotes() {
    setLoading(true)
    const url = filter ? `/api/quotes?status=${filter}` : '/api/quotes'
    const res = await fetch(url)
    const data = await res.json()
    setQuotes(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function createQuote(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        client_id: form.client_id || null,
        project_id: form.project_id || null,
        amount_excl_vat: Math.round(form.amount_excl_vat * 100),
        valid_until: form.valid_until || null,
      }),
    })
    if (res.ok) {
      const quote = await res.json()
      setShowNew(false)
      setForm({ title: '', client_id: '', project_id: '', amount_excl_vat: 0, vat_pct: 21, valid_until: '' })
      router.push(`/dashboard/offertes/${quote.id}`)
    }
  }

  const fmt = (cents: number) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100)

  function getDaysSince(dateStr: string): number {
    return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
  }

  const filtered = quotes.filter(q =>
    !search || q.title.toLowerCase().includes(search.toLowerCase()) ||
    q.quote_number?.toLowerCase().includes(search.toLowerCase()) ||
    q.clients?.name?.toLowerCase().includes(search.toLowerCase()) ||
    q.clients?.company_name?.toLowerCase().includes(search.toLowerCase())
  )

  // Totals
  const totalExcl = filtered.reduce((s, q) => s + q.amount_excl_vat, 0)
  const totalAkkoord = filtered.filter(q => q.status === 'akkoord').reduce((s, q) => s + q.amount_excl_vat, 0)

  return (
    <div className="p-4 lg:p-6 pt-16 lg:pt-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Offertes</h1>
          <p className="text-sm text-zinc-400">{filtered.length} offertes · {fmt(totalExcl)} totaal · {fmt(totalAkkoord)} akkoord</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
        >
          <Plus className="h-4 w-4" /> Nieuwe offerte
        </button>
      </div>

      {/* Search + Tabs */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Zoek offerte..."
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
        <div className="py-12 text-center text-sm text-zinc-400">Laden...</div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center">
          <FileText className="mx-auto h-8 w-8 text-zinc-300" />
          <p className="mt-2 text-sm text-zinc-400">Nog geen offertes</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(q => {
            const sc = statusConfig[q.status] || statusConfig.concept
            return (
              <div
                key={q.id}
                onClick={() => router.push(`/dashboard/offertes/${q.id}`)}
                className="flex cursor-pointer items-center gap-4 rounded-lg border p-4 hover:bg-white/5 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white truncate">{q.title}</span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${sc.color}`}>{sc.label}</span>
                    {q.status === 'verstuurd' && getDaysSince(q.created_at) > 3 && (
                      <span className="text-xs text-orange-400">
                        ⚠ {getDaysSince(q.created_at)} dagen open
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">
                    {q.quote_number && <span>{q.quote_number}</span>}
                    {q.clients && <span>{q.clients.company_name || q.clients.name}</span>}
                    {q.projects && <span>{q.projects.name}</span>}
                    {q.valid_until && <span>Geldig t/m {new Date(q.valid_until).toLocaleDateString('nl-NL')}</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-semibold text-white">{fmt(q.amount_excl_vat)}</div>
                  <div className="text-xs text-zinc-400">excl. BTW</div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* New Quote Dialog */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowNew(false)}>
          <div className="w-full max-w-md rounded-xl bg-foundri-deep p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Nieuwe offerte</h2>
            <form onSubmit={createQuote} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-zinc-300">Titel *</label>
                <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" placeholder="Tuinaanleg fam. Janssen" />
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
                  <label className="text-xs font-medium text-zinc-300">Geldig tot</label>
                  <input type="date" value={form.valid_until} onChange={e => setForm({ ...form, valid_until: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
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
