'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, ClipboardList, Search, ChevronRight } from 'lucide-react'

type WorkOrder = {
  id: string
  work_order_number: string | null
  title: string
  status: string
  date: string
  signed_by: string | null
  created_at: string
  clients: { id: string; name: string; company_name: string } | null
  projects: { id: string; name: string } | null
}

const statusConfig: Record<string, { label: string; color: string; bar: string }> = {
  concept:     { label: 'Concept',     color: 'text-zinc-300',  bar: 'bg-zinc-500' },
  actief:      { label: 'Actief',      color: 'text-blue-400',  bar: 'bg-blue-500' },
  afgerond:    { label: 'Afgerond',    color: 'text-green-400', bar: 'bg-green-500' },
  gefactureerd:{ label: 'Gefactureerd',color: 'text-emerald-400',bar: 'bg-emerald-500' },
}

const tabs = [
  { key: '', label: 'Alle' },
  { key: 'concept', label: 'Concept' },
  { key: 'actief', label: 'Actief' },
  { key: 'afgerond', label: 'Afgerond' },
]

export default function WerkbonnenPage() {
  const router = useRouter()
  const [items, setItems] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [projects, setProjects] = useState<{ id: string; name: string; client_id?: string }[]>([])
  const [form, setForm] = useState({ title: '', project_id: '', date: new Date().toISOString().split('T')[0] })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchItems()
    fetch('/api/projects').then(r => r.json()).then(d => setProjects(Array.isArray(d) ? d : []))
  }, [filter])

  async function fetchItems() {
    setLoading(true)
    const url = filter ? `/api/work-orders?status=${filter}` : '/api/work-orders'
    const res = await fetch(url)
    const data = await res.json()
    setItems(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function create(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const project = projects.find(p => p.id === form.project_id)
    const res = await fetch('/api/work-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        client_id: (project as any)?.client_id || null,
      }),
    })
    if (res.ok) {
      const wo = await res.json()
      setShowNew(false)
      setForm({ title: '', project_id: '', date: new Date().toISOString().split('T')[0] })
      router.push(`/dashboard/werkbonnen/${wo.id}`)
    }
    setSaving(false)
  }

  const filtered = items.filter(wo =>
    !search || wo.title.toLowerCase().includes(search.toLowerCase()) ||
    wo.work_order_number?.toLowerCase().includes(search.toLowerCase()) ||
    wo.projects?.name?.toLowerCase().includes(search.toLowerCase()) ||
    wo.clients?.name?.toLowerCase().includes(search.toLowerCase())
  )

  // Group by status for mobile: actief first
  const sorted = [...filtered].sort((a, b) => {
    const order: Record<string, number> = { actief: 0, concept: 1, afgerond: 2, gefactureerd: 3 }
    return (order[a.status] ?? 9) - (order[b.status] ?? 9)
  })

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white lg:text-2xl">Werkbonnen</h1>
          <p className="text-sm text-zinc-400">{filtered.length} werkbonnen</p>
        </div>
        {/* Desktop: inline button */}
        <button
          onClick={() => setShowNew(true)}
          className="hidden lg:inline-flex items-center gap-2 rounded-lg bg-foundri-card px-4 py-2.5 text-sm font-medium text-white hover:bg-foundri-hover transition-colors"
        >
          <Plus className="h-4 w-4" /> Nieuwe werkbon
        </button>
      </div>

      {/* Search */}
      <div className="mb-3 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Zoek op naam, project, klant..."
          className="w-full rounded-lg border border-white/8 bg-foundri-card py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-white/20"
        />
      </div>

      {/* Status tabs — scrollable on mobile */}
      <div className="mb-4 flex gap-1 overflow-x-auto scrollbar-none pb-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              filter === t.key
                ? 'bg-white text-black'
                : 'bg-foundri-card text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 rounded-xl bg-foundri-card animate-pulse" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ClipboardList className="mx-auto h-10 w-10 text-zinc-600 mb-3" />
          <p className="text-base font-medium text-zinc-300">Geen werkbonnen</p>
          <p className="mt-1 text-sm text-zinc-500">
            {search ? 'Probeer een andere zoekterm' : 'Maak je eerste werkbon aan'}
          </p>
          <button
            onClick={() => setShowNew(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-foundri-yellow px-4 py-2 text-sm font-medium text-black"
          >
            <Plus className="h-4 w-4" /> Nieuwe werkbon
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map(wo => {
            const sc = statusConfig[wo.status] || statusConfig.concept
            const clientName = wo.clients?.company_name || wo.clients?.name
            return (
              <button
                key={wo.id}
                onClick={() => router.push(`/dashboard/werkbonnen/${wo.id}`)}
                className="flex w-full items-center gap-0 rounded-xl bg-foundri-card hover:bg-foundri-hover active:scale-[0.99] transition-all overflow-hidden text-left"
              >
                {/* Status bar — left side */}
                <div className={`w-1 self-stretch shrink-0 ${sc.bar}`} />

                <div className="flex flex-1 items-center gap-3 px-4 py-3.5 min-w-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-white text-sm truncate">{wo.title}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-zinc-400">
                      {wo.work_order_number && (
                        <span className="font-mono">{wo.work_order_number}</span>
                      )}
                      {clientName && <span className="truncate max-w-[120px]">{clientName}</span>}
                      {wo.projects && <span className="truncate max-w-[120px]">{wo.projects.name}</span>}
                      <span>{new Date(wo.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`text-xs font-medium ${sc.color}`}>{sc.label}</span>
                    <ChevronRight className="h-4 w-4 text-zinc-600" />
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Mobile FAB */}
      <button
        onClick={() => setShowNew(true)}
        className="fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-foundri-yellow text-black shadow-xl active:scale-95 transition-transform lg:hidden"
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>

      {/* New werkbon sheet / modal */}
      {showNew && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 sm:p-4"
          onClick={() => setShowNew(false)}
        >
          <div
            className="w-full sm:max-w-md rounded-t-2xl sm:rounded-xl bg-foundri-deep border-t border-white/5 sm:border p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Drag handle — mobile only */}
            <div className="w-10 h-1 rounded-full bg-white/15 mx-auto mb-5 sm:hidden" />
            <h2 className="text-base font-semibold text-white mb-4">Nieuwe werkbon</h2>
            <form onSubmit={create} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-zinc-400">Titel *</label>
                <input
                  required
                  autoFocus
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="mt-1.5 w-full rounded-lg border border-white/8 bg-foundri-card px-3 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-white/20"
                  placeholder="Dag 1 — terras uitgraven"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-400">Project *</label>
                <select
                  required
                  value={form.project_id}
                  onChange={e => setForm({ ...form, project_id: e.target.value })}
                  className="mt-1.5 w-full rounded-lg border border-white/8 bg-foundri-card px-3 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                >
                  <option value="">Selecteer project...</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-400">Datum</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                  className="mt-1.5 w-full rounded-lg border border-white/8 bg-foundri-card px-3 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowNew(false)}
                  className="flex-1 rounded-lg py-3 text-sm font-medium text-zinc-300 bg-foundri-card hover:bg-foundri-hover transition-colors"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-lg bg-foundri-yellow py-3 text-sm font-medium text-black disabled:opacity-50 transition-opacity"
                >
                  {saving ? 'Aanmaken...' : 'Aanmaken'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
