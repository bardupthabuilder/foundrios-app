'use client'

import { useEffect, useState } from 'react'
import { Plus, CalendarCheck, MapPin, Pause, Play, ClipboardList, RotateCcw } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Contract = {
  id: string
  title: string
  frequency: string
  price_cents: number
  mrr_cents: number | null
  next_visit: string | null
  status: string
  description: string | null
  notes: string | null
  start_date: string
  contract_start: string | null
  contract_end: string | null
  visit_count: number | null
  clients: { id: string; company_name: string; phone: string | null; city: string | null } | null
  projects?: { id: string; name: string } | null
}

const FREQ_LABELS: Record<string, string> = {
  monthly: 'Maandelijks',
  quarterly: 'Per kwartaal',
  biannual: 'Halfjaarlijks',
  annual: 'Jaarlijks',
}

const FREQ_MONTHS: Record<string, number> = {
  monthly: 1,
  quarterly: 3,
  biannual: 6,
  annual: 12,
}

function shiftNextVisit(current: string, frequency: string): string {
  const d = new Date(current)
  d.setMonth(d.getMonth() + (FREQ_MONTHS[frequency] ?? 3))
  return d.toISOString().split('T')[0]
}

function nextVisitStatus(next_visit: string | null): 'overdue' | 'soon' | 'upcoming' | 'none' {
  if (!next_visit) return 'none'
  const days = Math.floor((new Date(next_visit).getTime() - Date.now()) / 86400000)
  if (days < 0) return 'overdue'
  if (days <= 7) return 'soon'
  return 'upcoming'
}

export default function OnderhoudPage() {
  const router = useRouter()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [clients, setClients] = useState<{ id: string; company_name: string }[]>([])
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '', client_id: '', project_id: '', frequency: 'quarterly',
    price: '', description: '', next_visit: '', contract_start: '', contract_end: '', notes: '',
  })

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
        price_cents: Math.round(parseFloat(form.price || '0') * 100),
        description: form.description || null,
        next_visit: form.next_visit || null,
        contract_start: form.contract_start || null,
        contract_end: form.contract_end || null,
        notes: form.notes || null,
      }),
    })
    if (res.ok) {
      const c = await res.json()
      setContracts(prev => [c, ...prev])
      setShowNew(false)
      setForm({ title: '', client_id: '', project_id: '', frequency: 'quarterly', price: '', description: '', next_visit: '', contract_start: '', contract_end: '', notes: '' })
    }
  }

  async function toggleStatus(id: string, current: string) {
    const next = current === 'active' ? 'paused' : 'active'
    const res = await fetch(`/api/maintenance/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    if (res.ok) setContracts(prev => prev.map(c => c.id === id ? { ...c, status: next } : c))
  }

  async function generateWerkbon(contract: Contract) {
    setGeneratingId(contract.id)
    const today = new Date().toISOString().split('T')[0]

    const res = await fetch('/api/work-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: contract.title,
        client_id: contract.clients?.id || null,
        project_id: contract.projects?.id || null,
        description: contract.description || null,
        date: today,
      }),
    })

    if (res.ok) {
      const wo = await res.json()

      // Bezoek afgerond: datum vooruit, teller omhoog, laatste bezoek vastgelegd.
      // visit_count werd tot nu toe wel getoond maar nooit opgehoogd.
      const newNextVisit = contract.next_visit
        ? shiftNextVisit(contract.next_visit, contract.frequency)
        : shiftNextVisit(today, contract.frequency)
      const newVisitCount = (contract.visit_count ?? 0) + 1

      await fetch(`/api/maintenance/${contract.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          next_visit: newNextVisit,
          last_visit: today,
          visit_count: newVisitCount,
        }),
      })

      setContracts(prev => prev.map(c =>
        c.id === contract.id
          ? { ...c, next_visit: newNextVisit, visit_count: newVisitCount }
          : c
      ))

      router.push(`/dashboard/werkbonnen/${wo.id}`)
    }
    setGeneratingId(null)
  }

  const fmt = (cents: number) =>
    new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100)

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })

  const activeContracts = contracts.filter(c => c.status === 'active')
  const monthlyRecurring = activeContracts.reduce((sum, c) => {
    if (c.mrr_cents) return sum + c.mrr_cents
    const m = FREQ_MONTHS[c.frequency] ?? 3
    return sum + Math.round(c.price_cents / m)
  }, 0)
  const overdueCount = activeContracts.filter(c => nextVisitStatus(c.next_visit) === 'overdue').length
  const soonCount = activeContracts.filter(c => nextVisitStatus(c.next_visit) === 'soon').length

  return (
    <div className="p-4 lg:p-6 pt-16 lg:pt-6 max-w-4xl pb-24 lg:pb-6">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white lg:text-2xl">Onderhoud</h1>
          <p className="text-sm text-zinc-400">
            {activeContracts.length} actieve contracten · {fmt(monthlyRecurring)}/mnd
            {overdueCount > 0 && <span className="text-red-400 font-medium"> · {overdueCount} verlopen</span>}
            {soonCount > 0 && <span className="text-orange-400 font-medium"> · {soonCount} deze week</span>}
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="hidden lg:inline-flex items-center gap-2 rounded-lg bg-foundri-card px-4 py-2.5 text-sm font-medium text-white hover:bg-foundri-hover transition-colors"
        >
          <Plus className="h-4 w-4" /> Nieuw contract
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-xl bg-foundri-card animate-pulse" />)}
        </div>
      ) : contracts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl bg-foundri-card border border-white/5">
          <CalendarCheck className="h-10 w-10 text-zinc-600 mb-3" />
          <p className="text-sm font-medium text-zinc-300">Nog geen onderhoudscontracten</p>
          <p className="text-xs text-zinc-500 mt-1">Maak een contract na een afgerond project om recurring omzet te genereren.</p>
          <button
            onClick={() => setShowNew(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-foundri-yellow px-4 py-2 text-sm font-medium text-black"
          >
            <Plus className="h-4 w-4" /> Nieuw contract
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {contracts.map(c => {
            const visitStatus = nextVisitStatus(c.next_visit)
            const isGenerating = generatingId === c.id
            const showAction = c.status === 'active' && (visitStatus === 'overdue' || visitStatus === 'soon')

            return (
              <div
                key={c.id}
                className={`rounded-xl border overflow-hidden ${
                  visitStatus === 'overdue' && c.status === 'active'
                    ? 'bg-foundri-card border-red-500/20'
                    : visitStatus === 'soon' && c.status === 'active'
                    ? 'bg-foundri-card border-orange-500/15'
                    : 'bg-foundri-card border-white/5'
                }`}
              >
                <div className="flex items-start gap-3 px-4 py-3.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-medium text-white text-sm">{c.title}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        c.status === 'active' ? 'bg-green-500/10 text-green-400' :
                        c.status === 'paused' ? 'bg-yellow-500/10 text-yellow-400' :
                        'bg-foundri-deep text-zinc-400'
                      }`}>
                        {c.status === 'active' ? 'Actief' : c.status === 'paused' ? 'Gepauzeerd' : 'Gestopt'}
                      </span>
                      <span className="text-xs text-zinc-500">{FREQ_LABELS[c.frequency]}</span>
                    </div>

                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-zinc-400">
                      {c.clients && <span>{c.clients.company_name}</span>}
                      {c.clients?.city && (
                        <span className="flex items-center gap-0.5">
                          <MapPin className="h-3 w-3" />{c.clients.city}
                        </span>
                      )}
                      {c.next_visit && (
                        <span className={`flex items-center gap-0.5 ${
                          visitStatus === 'overdue' ? 'text-red-400 font-medium' :
                          visitStatus === 'soon' ? 'text-orange-400 font-medium' : ''
                        }`}>
                          <CalendarCheck className="h-3 w-3" />
                          Volgende: {fmtDate(c.next_visit)}
                          {visitStatus === 'overdue' && ' — verlopen!'}
                          {visitStatus === 'soon' && ' — deze week'}
                        </span>
                      )}
                      {c.visit_count != null && <span>{c.visit_count}× bezocht</span>}
                    </div>

                    {c.description && (
                      <p className="text-xs text-zinc-500 mt-1 truncate">{c.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-semibold text-white">{fmt(c.price_cents)}</div>
                      <div className="text-xs text-zinc-500">per bezoek</div>
                    </div>
                    <button
                      onClick={() => toggleStatus(c.id, c.status)}
                      className="h-8 w-8 flex items-center justify-center rounded-lg bg-foundri-deep text-zinc-400 hover:text-zinc-200 hover:bg-white/10 transition-colors"
                      title={c.status === 'active' ? 'Pauzeren' : 'Hervatten'}
                    >
                      {c.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Generate werkbon row — only when overdue/soon */}
                {showAction && (
                  <div className={`px-4 pb-3 pt-1 border-t ${
                    visitStatus === 'overdue' ? 'border-red-500/15' : 'border-orange-500/10'
                  }`}>
                    <button
                      onClick={() => generateWerkbon(c)}
                      disabled={isGenerating}
                      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors disabled:opacity-60 ${
                        visitStatus === 'overdue'
                          ? 'bg-red-500/10 text-red-300 hover:bg-red-500/20'
                          : 'bg-orange-500/10 text-orange-300 hover:bg-orange-500/20'
                      }`}
                    >
                      <ClipboardList className="h-3.5 w-3.5" />
                      {isGenerating ? 'Aanmaken...' : 'Werkbon aanmaken'}
                      <span className="text-zinc-500 font-normal">→ volgende bezoek wordt automatisch verschoven</span>
                    </button>
                  </div>
                )}
              </div>
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

      {/* Bottom sheet — nieuw contract */}
      {showNew && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-black/60"
          onClick={() => setShowNew(false)}
        >
          <div
            className="w-full sm:max-w-md rounded-t-2xl sm:rounded-xl bg-foundri-deep border-t border-white/5 sm:border sm:border-white/8 p-5 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-white/15 mx-auto mb-4 sm:hidden" />
            <h2 className="text-base font-semibold text-white mb-4">Nieuw onderhoudscontract</h2>
            <form onSubmit={createContract} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-zinc-400">Titel *</label>
                <input
                  required
                  autoFocus
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Tuinonderhoud fam. De Vries"
                  className="mt-1.5 w-full rounded-lg border border-white/8 bg-foundri-card px-3 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-white/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-zinc-400">Klant</label>
                  <select
                    value={form.client_id}
                    onChange={e => setForm({ ...form, client_id: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-white/8 bg-foundri-card px-3 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                  >
                    <option value="">Selecteer...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-400">Frequentie</label>
                  <select
                    value={form.frequency}
                    onChange={e => setForm({ ...form, frequency: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-white/8 bg-foundri-card px-3 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                  >
                    {Object.entries(FREQ_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-zinc-400">Prijs per bezoek (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    inputMode="decimal"
                    value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-white/8 bg-foundri-card px-3 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-400">Eerste bezoek</label>
                  <input
                    type="date"
                    value={form.next_visit}
                    onChange={e => setForm({ ...form, next_visit: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-white/8 bg-foundri-card px-3 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-zinc-400">Contractstart</label>
                  <input
                    type="date"
                    value={form.contract_start}
                    onChange={e => setForm({ ...form, contract_start: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-white/8 bg-foundri-card px-3 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-400">Contracteinde</label>
                  <input
                    type="date"
                    value={form.contract_end}
                    onChange={e => setForm({ ...form, contract_end: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-white/8 bg-foundri-card px-3 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-400">Omschrijving</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Snoeien, onkruid, bladruimen..."
                  className="mt-1.5 w-full rounded-lg border border-white/8 bg-foundri-card px-3 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-white/20"
                  rows={2}
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
                  className="flex-1 rounded-lg bg-foundri-yellow py-3 text-sm font-medium text-black"
                >
                  Aanmaken
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
