'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, ClipboardList, Search } from 'lucide-react'

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

const statusConfig: Record<string, { label: string; color: string }> = {
  concept: { label: 'Concept', color: 'bg-[#282A2E] text-zinc-200' },
  actief: { label: 'Actief', color: 'bg-blue-500/10 text-blue-400' },
  afgerond: { label: 'Afgerond', color: 'bg-green-500/10 text-green-400' },
  gefactureerd: { label: 'Gefactureerd', color: 'bg-emerald-500/10 text-emerald-400' },
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
  }

  const filtered = items.filter(wo =>
    !search || wo.title.toLowerCase().includes(search.toLowerCase()) ||
    wo.work_order_number?.toLowerCase().includes(search.toLowerCase()) ||
    wo.projects?.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-4 lg:p-6 pt-16 lg:pt-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Werkbonnen</h1>
          <p className="text-sm text-zinc-400">{filtered.length} werkbonnen</p>
        </div>
        <button onClick={() => setShowNew(true)} className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800">
          <Plus className="h-4 w-4" /> Nieuwe werkbon
        </button>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Zoek werkbon..." className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm" />
        </div>
        <div className="flex gap-1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setFilter(t.key)} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${filter === t.key ? 'bg-zinc-900 text-white' : 'bg-[#282A2E] text-zinc-300 hover:bg-white/15'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-zinc-400">Laden...</div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center">
          <ClipboardList className="mx-auto h-8 w-8 text-zinc-300" />
          <p className="mt-2 text-sm text-zinc-400">Nog geen werkbonnen</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(wo => {
            const sc = statusConfig[wo.status] || statusConfig.concept
            return (
              <div key={wo.id} onClick={() => router.push(`/dashboard/werkbonnen/${wo.id}`)} className="flex cursor-pointer items-center gap-4 rounded-lg border p-4 hover:bg-white/5 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white truncate">{wo.title}</span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${sc.color}`}>{sc.label}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">
                    {wo.work_order_number && <span>{wo.work_order_number}</span>}
                    {wo.projects && <span>{wo.projects.name}</span>}
                    <span>{new Date(wo.date).toLocaleDateString('nl-NL')}</span>
                    {wo.signed_by && <span>Getekend: {wo.signed_by}</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowNew(false)}>
          <div className="w-full max-w-md rounded-xl bg-[#1A1F29] p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Nieuwe werkbon</h2>
            <form onSubmit={create} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-zinc-300">Titel *</label>
                <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" placeholder="Dag 1 — terras uitgraven" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-zinc-300">Project *</label>
                  <select required value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm">
                    <option value="">Selecteer...</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-300">Datum</label>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
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
