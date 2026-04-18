'use client'

import { useEffect, useState } from 'react'
import { Plus, CalendarCheck, Phone, MapPin, Pause, Play, RotateCcw } from 'lucide-react'

type Contract = {
  id: string
  title: string
  frequency: string
  price_cents: number
  next_visit: string | null
  status: string
  description: string | null
  notes: string | null
  start_date: string
  clients: { id: string; company_name: string; phone: string | null; city: string | null } | null
}

const FREQ_LABELS: Record<string, string> = { monthly: 'Maandelijks', quarterly: 'Per kwartaal', biannual: 'Halfjaarlijks', annual: 'Jaarlijks' }
const STATUS_COLORS: Record<string, string> = { active: 'bg-green-500/10 text-green-400', paused: 'bg-yellow-500/10 text-yellow-400', cancelled: 'bg-[#282A2E] text-zinc-400' }

export default function OnderhoudPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [clients, setClients] = useState<{ id: string; company_name: string }[]>([])
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ title: '', client_id: '', project_id: '', frequency: 'quarterly', price: 0, description: '', next_visit: '' })

  useEffect(() => {
    fetch('/api/maintenance').then(r => r.json()).then(d => setContracts(Array.isArray(d) ? d : [])).finally(() => setLoading(false))
    fetch('/api/clients').then(r => r.json()).then(d => setClients(Array.isArray(d) ? d : []))
    fetch('/api/projects').then(r => r.json()).then(d => setProjects(Array.isArray(d) ? d : []))
  }, [])

  async function createContract(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        client_id: form.client_id || null,
        project_id: form.project_id || null,
        frequency: form.frequency,
        price_cents: Math.round(form.price * 100),
        description: form.description || null,
        next_visit: form.next_visit || null,
      }),
    })
    if (res.ok) {
      const c = await res.json()
      setContracts(prev => [c, ...prev])
      setShowNew(false)
      setForm({ title: '', client_id: '', project_id: '', frequency: 'quarterly', price: 0, description: '', next_visit: '' })
    }
  }

  async function toggleStatus(id: string, current: string) {
    const next = current === 'active' ? 'paused' : 'active'
    const res = await fetch(`/api/maintenance/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: next }) })
    if (res.ok) setContracts(prev => prev.map(c => c.id === id ? { ...c, status: next } : c))
  }

  const fmt = (cents: number) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100)
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })

  const activeContracts = contracts.filter(c => c.status === 'active')
  const monthlyRecurring = activeContracts.reduce((sum, c) => {
    const multiplier = { monthly: 1, quarterly: 1/3, biannual: 1/6, annual: 1/12 }[c.frequency] ?? 0
    return sum + (c.price_cents * multiplier)
  }, 0)
  const upcomingVisits = activeContracts.filter(c => c.next_visit && new Date(c.next_visit) <= new Date(Date.now() + 30 * 86400000)).length

  return (
    <div className="p-4 lg:p-6 pt-16 lg:pt-6 max-w-4xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Onderhoud</h1>
          <p className="text-sm text-zinc-400">{activeContracts.length} actieve contracten · {fmt(Math.round(monthlyRecurring))}/mnd recurring · {upcomingVisits} bezoeken komende 30 dagen</p>
        </div>
        <button onClick={() => setShowNew(true)} className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800">
          <Plus className="h-4 w-4" /> Nieuw contract
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-zinc-400">Laden...</div>
      ) : contracts.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-white/10 p-12 text-center">
          <CalendarCheck className="mx-auto h-8 w-8 text-zinc-300" />
          <p className="mt-2 text-sm text-zinc-400">Nog geen onderhoudscontracten.</p>
          <p className="text-xs text-zinc-400 mt-1">Maak een contract aan na een afgerond project om recurring omzet te genereren.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {contracts.map(c => (
            <div key={c.id} className="rounded-lg border p-4 hover:bg-white/5 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{c.title}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_COLORS[c.status]}`}>
                      {c.status === 'active' ? 'Actief' : c.status === 'paused' ? 'Gepauzeerd' : 'Gestopt'}
                    </span>
                    <span className="text-xs text-zinc-400">{FREQ_LABELS[c.frequency]}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400 mt-1">
                    {c.clients && <span>{c.clients.company_name}</span>}
                    {c.clients?.city && <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{c.clients.city}</span>}
                    {c.next_visit && (
                      <span className={`flex items-center gap-0.5 ${new Date(c.next_visit) <= new Date() ? 'text-red-400 font-medium' : ''}`}>
                        <CalendarCheck className="h-3 w-3" />
                        Volgende bezoek: {fmtDate(c.next_visit)}
                        {new Date(c.next_visit) <= new Date() && ' (verlopen!)'}
                      </span>
                    )}
                  </div>
                  {c.description && <p className="text-xs text-zinc-400 mt-1">{c.description}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <div className="text-sm font-semibold">{fmt(c.price_cents)}</div>
                    <div className="text-xs text-zinc-400">per bezoek</div>
                  </div>
                  <button onClick={() => toggleStatus(c.id, c.status)} className="rounded-lg border p-2 text-zinc-400 hover:text-zinc-200 hover:bg-white/10" title={c.status === 'active' ? 'Pauzeren' : 'Hervatten'}>
                    {c.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Contract Dialog */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowNew(false)}>
          <div className="w-full max-w-md rounded-xl bg-[#1A1F29] p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Nieuw onderhoudscontract</h2>
            <form onSubmit={createContract} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-zinc-300">Titel *</label>
                <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" placeholder="Tuinonderhoud fam. De Vries" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-zinc-300">Klant</label>
                  <select value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm">
                    <option value="">Selecteer...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-300">Frequentie</label>
                  <select value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm">
                    {Object.entries(FREQ_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-zinc-300">Prijs per bezoek (€)</label>
                  <input type="number" step="0.01" min="0" value={form.price} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-300">Eerste bezoek</label>
                  <input type="date" value={form.next_visit} onChange={e => setForm({ ...form, next_visit: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-300">Omschrijving</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" rows={2} placeholder="Snoeien, onkruid, bladruimen..." />
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
