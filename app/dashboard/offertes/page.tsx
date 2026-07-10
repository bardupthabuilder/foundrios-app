'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus, FileText, Search, ChevronRight, Trees, Shovel, Scissors, Leaf, Square } from 'lucide-react'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'

type Client = { id: string; name: string; company_name?: string; lead_id?: string | null }

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

const statusConfig: Record<string, { label: string; bar: string; text: string }> = {
  concept:    { label: 'Concept',    bar: 'bg-zinc-500',    text: 'text-zinc-300' },
  verstuurd:  { label: 'Verstuurd',  bar: 'bg-blue-500',    text: 'text-blue-400' },
  akkoord:    { label: 'Akkoord',    bar: 'bg-green-500',   text: 'text-green-400' },
  afgewezen:  { label: 'Afgewezen',  bar: 'bg-red-500',     text: 'text-red-400' },
  verlopen:   { label: 'Verlopen',   bar: 'bg-amber-500',   text: 'text-amber-400' },
}

const tabs = [
  { key: '', label: 'Alle' },
  { key: 'concept', label: 'Concept' },
  { key: 'verstuurd', label: 'Verstuurd' },
  { key: 'akkoord', label: 'Akkoord' },
  { key: 'afgewezen', label: 'Afgewezen' },
]

// Standaard-templates voor hoveniersbedrijven
type Template = {
  id: string
  label: string
  sub: string
  icon: React.ComponentType<{ className?: string }>
  titlePrefix: string
  vat_pct: number
  validDays: number
  iconColor: string
}

const TEMPLATES: Template[] = [
  {
    id: 'tuinaanleg',
    label: 'Tuinaanleg',
    sub: 'Complete tuinaanleg · 21% BTW · 14 dagen geldig',
    icon: Trees,
    titlePrefix: 'Tuinaanleg ',
    vat_pct: 21,
    validDays: 14,
    iconColor: 'text-green-400',
  },
  {
    id: 'onderhoud',
    label: 'Tuinonderhoud',
    sub: 'Onderhoudscontract · 9% BTW · 30 dagen geldig',
    icon: Leaf,
    titlePrefix: 'Tuinonderhoud ',
    vat_pct: 9,
    validDays: 30,
    iconColor: 'text-emerald-400',
  },
  {
    id: 'bestrating',
    label: 'Bestrating',
    sub: 'Terras, oprit of pad · 21% BTW · 14 dagen geldig',
    icon: Square,
    titlePrefix: 'Bestrating ',
    vat_pct: 21,
    validDays: 14,
    iconColor: 'text-stone-400',
  },
  {
    id: 'groenonderhoud',
    label: 'Groenonderhoud',
    sub: 'Periodiek groenonderhoud · 9% BTW · 30 dagen geldig',
    icon: Shovel,
    titlePrefix: 'Groenonderhoud ',
    vat_pct: 9,
    validDays: 30,
    iconColor: 'text-lime-400',
  },
  {
    id: 'snoeien',
    label: 'Snoeien / Hagen',
    sub: 'Snoeiwerk, hagen bijknippen · 9% BTW · 14 dagen geldig',
    icon: Scissors,
    titlePrefix: 'Snoeiwerk ',
    vat_pct: 9,
    validDays: 14,
    iconColor: 'text-teal-400',
  },
]

function dateAfterDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function OffertesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')

  // Sheet state: null | 'template' | 'form'
  const [sheet, setSheet] = useState<null | 'template' | 'form'>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [form, setForm] = useState({
    title: '',
    client_id: '',
    project_id: '',
    amount_excl_vat: 0,
    vat_pct: 21,
    valid_until: dateAfterDays(14),
  })
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchQuotes()
  }, [filter])

  useEffect(() => {
    fetch('/api/clients').then(r => r.json()).then(d => setClients(Array.isArray(d) ? d : []))
    fetch('/api/projects').then(r => r.json()).then(d => setProjects(Array.isArray(d) ? d : []))
  }, [])

  // "Maak offerte" vanaf een aanvraag of klant opent hier meteen het formulier,
  // met de klant al ingevuld. Zonder dit landde je op een lege lijst.
  const prefillClient = searchParams.get('client')
  const prefillLead = searchParams.get('lead')

  useEffect(() => {
    if (!prefillClient && !prefillLead) return
    if (clients.length === 0) return

    let cancelled = false

    async function prefill() {
      let clientId = prefillClient ?? ''
      let title = ''

      if (prefillLead) {
        // Een aanvraag heeft pas een klant zodra hij is omgezet. Zoek die op.
        clientId = clients.find(c => c.lead_id === prefillLead)?.id ?? ''
        const res = await fetch(`/api/leads/${prefillLead}`)
        if (res.ok) {
          const lead = await res.json()
          if (lead?.name) title = `Offerte ${lead.name}`
        }
      }

      if (cancelled) return

      setForm(f => ({ ...f, title: title || f.title, client_id: clientId }))
      setSheet('form')
    }

    prefill()
    return () => { cancelled = true }
  }, [prefillClient, prefillLead, clients])

  async function fetchQuotes() {
    setLoading(true)
    const url = filter ? `/api/quotes?status=${filter}` : '/api/quotes'
    const res = await fetch(url)
    const data = await res.json()
    setQuotes(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  function selectTemplate(tpl: Template) {
    setForm({
      title: tpl.titlePrefix,
      client_id: '',
      project_id: '',
      amount_excl_vat: 0,
      vat_pct: tpl.vat_pct,
      valid_until: dateAfterDays(tpl.validDays),
    })
    setSheet('form')
  }

  function openBlanco() {
    setForm({
      title: '',
      client_id: '',
      project_id: '',
      amount_excl_vat: 0,
      vat_pct: 21,
      valid_until: dateAfterDays(14),
    })
    setSheet('form')
  }

  async function createQuote(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)
    setSubmitting(true)
    try {
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
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        const msg =
          typeof data?.error === 'string'
            ? data.error
            : data?.error?.formErrors?.[0] || `Fout (${res.status})`
        setSubmitError(msg)
        return
      }
      setSheet(null)
      router.push(`/dashboard/offertes/${data.id}`)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Netwerkfout')
    } finally {
      setSubmitting(false)
    }
  }

  const fmt = (cents: number) =>
    new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100)

  function getDaysSince(dateStr: string): number {
    return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
  }

  const filtered = quotes.filter(q =>
    !search ||
    q.title.toLowerCase().includes(search.toLowerCase()) ||
    q.quote_number?.toLowerCase().includes(search.toLowerCase()) ||
    q.clients?.name?.toLowerCase().includes(search.toLowerCase()) ||
    q.clients?.company_name?.toLowerCase().includes(search.toLowerCase())
  )

  const totalExcl = filtered.reduce((s, q) => s + q.amount_excl_vat, 0)
  const totalAkkoord = filtered
    .filter(q => q.status === 'akkoord')
    .reduce((s, q) => s + q.amount_excl_vat, 0)

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white lg:text-2xl">Offertes</h1>
          <p className="text-sm text-zinc-400">
            {filtered.length} offertes · {fmt(totalExcl)} totaal · {fmt(totalAkkoord)} akkoord
          </p>
        </div>
        <button
          onClick={() => setSheet('template')}
          className="hidden lg:inline-flex items-center gap-2 rounded-lg bg-foundri-card px-4 py-2.5 text-sm font-medium text-white hover:bg-foundri-hover transition-colors"
        >
          <Plus className="h-4 w-4" /> Nieuwe offerte
        </button>
      </div>

      {/* Search */}
      <div className="mb-3 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Zoek op titel, klant..."
          className="w-full rounded-lg border border-white/8 bg-foundri-card py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-white/20"
        />
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 overflow-x-auto scrollbar-none pb-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              filter === t.key ? 'bg-white text-black' : 'bg-foundri-card text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl bg-foundri-card">
          <FileText className="mx-auto h-10 w-10 text-zinc-600 mb-3" />
          <p className="text-base font-medium text-zinc-300">Geen offertes</p>
          <p className="mt-1 text-sm text-zinc-500">
            {search ? 'Probeer een andere zoekterm' : 'Maak je eerste offerte aan'}
          </p>
          <button
            onClick={() => setSheet('template')}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-foundri-yellow px-4 py-2 text-sm font-medium text-black"
          >
            <Plus className="h-4 w-4" /> Nieuwe offerte
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(q => {
            const sc = statusConfig[q.status] || statusConfig.concept
            const clientName = q.clients?.company_name || q.clients?.name
            const daysSince = getDaysSince(q.created_at)
            return (
              <button
                key={q.id}
                onClick={() => router.push(`/dashboard/offertes/${q.id}`)}
                className="flex w-full items-center gap-0 rounded-xl bg-foundri-card hover:bg-foundri-hover active:scale-[0.99] transition-all overflow-hidden text-left"
              >
                {/* Status bar */}
                <div className={`w-1 self-stretch shrink-0 ${sc.bar}`} />

                <div className="flex flex-1 items-center gap-3 px-4 py-3.5 min-w-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-white text-sm truncate">{q.title}</span>
                      {q.status === 'verstuurd' && daysSince > 3 && (
                        <span className="shrink-0 text-xs text-orange-400">⚠ {daysSince}d open</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-zinc-400">
                      {q.quote_number && <span className="font-mono">{q.quote_number}</span>}
                      {clientName && <span className="truncate max-w-[120px]">{clientName}</span>}
                      {q.valid_until && (
                        <span>
                          Geldig t/m {new Date(q.valid_until).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-sm font-semibold text-white tabular-nums">{fmt(q.amount_excl_vat)}</span>
                    <span className={`text-xs font-medium ${sc.text}`}>{sc.label}</span>
                  </div>

                  <ChevronRight className="h-4 w-4 text-zinc-600 shrink-0" />
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Mobile FAB */}
      <button
        onClick={() => setSheet('template')}
        className="fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-foundri-yellow text-black shadow-xl active:scale-95 transition-transform lg:hidden"
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>

      {/* Sheet backdrop */}
      {sheet && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-black/60 sm:p-4"
          onClick={() => setSheet(null)}
        >
          <div
            className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-xl bg-foundri-deep border-t border-white/5 sm:border shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-white/15 mx-auto mt-3 mb-1 sm:hidden" />

            {/* Step 1 — Template kiezen */}
            {sheet === 'template' && (
              <div className="p-6">
                <h2 className="text-base font-semibold text-white mb-1">Nieuwe offerte</h2>
                <p className="text-xs text-zinc-400 mb-4">Kies een type om de offerte voor te vullen</p>

                <div className="space-y-2">
                  {TEMPLATES.map(tpl => {
                    const Icon = tpl.icon
                    return (
                      <button
                        key={tpl.id}
                        onClick={() => selectTemplate(tpl)}
                        className="flex w-full items-center gap-4 rounded-xl bg-foundri-card hover:bg-foundri-hover active:bg-foundri-hover p-4 text-left transition-colors group"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5">
                          <Icon className={`h-5 w-5 ${tpl.iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white">{tpl.label}</div>
                          <div className="text-xs text-zinc-400">{tpl.sub}</div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                      </button>
                    )
                  })}

                  {/* Blanco optie */}
                  <button
                    onClick={openBlanco}
                    className="flex w-full items-center gap-4 rounded-xl border border-white/8 hover:bg-white/5 p-4 text-left transition-colors group"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5">
                      <FileText className="h-5 w-5 text-zinc-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-zinc-300">Blanco offerte</div>
                      <div className="text-xs text-zinc-500">Helemaal zelf invullen</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2 — Formulier */}
            {sheet === 'form' && (
              <form onSubmit={createQuote} className="p-6 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <button
                    type="button"
                    onClick={() => setSheet('template')}
                    className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    ← Terug
                  </button>
                  <h2 className="text-base font-semibold text-white">Offerte aanmaken</h2>
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-400">Titel *</label>
                  <input
                    required
                    autoFocus
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-white/8 bg-foundri-card px-3 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-white/20"
                    placeholder="Naam of omschrijving"
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
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.company_name || c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-400">Project</label>
                    <select
                      value={form.project_id}
                      onChange={e => setForm({ ...form, project_id: e.target.value })}
                      className="mt-1.5 w-full rounded-lg border border-white/8 bg-foundri-card px-3 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                    >
                      <option value="">Selecteer...</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-zinc-400">Bedrag excl. BTW (€)</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      value={form.amount_excl_vat}
                      onChange={e => setForm({ ...form, amount_excl_vat: parseFloat(e.target.value) || 0 })}
                      className="mt-1.5 w-full rounded-lg border border-white/8 bg-foundri-card px-3 py-3 text-base font-semibold text-white focus:outline-none focus:ring-1 focus:ring-white/20 text-center"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-400">BTW %</label>
                    <div className="mt-1.5 flex gap-2">
                      {[9, 21].map(pct => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setForm({ ...form, vat_pct: pct })}
                          className={`flex-1 rounded-lg py-3 text-sm font-semibold transition-colors ${
                            form.vat_pct === pct
                              ? 'bg-foundri-yellow text-black'
                              : 'bg-foundri-card text-zinc-300 hover:bg-foundri-hover'
                          }`}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-400">Geldig tot</label>
                  <input
                    type="date"
                    value={form.valid_until}
                    onChange={e => setForm({ ...form, valid_until: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-white/8 bg-foundri-card px-3 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                  />
                </div>

                {/* Live total */}
                {form.amount_excl_vat > 0 && (
                  <div className="rounded-lg bg-foundri-card px-4 py-2.5 flex items-center justify-between">
                    <span className="text-xs text-zinc-400">Incl. {form.vat_pct}% BTW</span>
                    <span className="text-sm font-semibold text-white">
                      {new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(
                        form.amount_excl_vat * (1 + form.vat_pct / 100)
                      )}
                    </span>
                  </div>
                )}

                {submitError && (
                  <p className="rounded-lg bg-red-500/10 px-4 py-2.5 text-sm text-red-300">{submitError}</p>
                )}

                <div className="flex gap-3 pb-safe">
                  <button
                    type="button"
                    onClick={() => setSheet(null)}
                    className="flex-1 rounded-xl py-3.5 text-sm font-medium text-zinc-300 bg-foundri-card hover:bg-foundri-hover transition-colors"
                  >
                    Annuleren
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 rounded-xl bg-foundri-yellow py-3.5 text-sm font-semibold text-black disabled:opacity-50"
                  >
                    {submitting ? 'Aanmaken...' : 'Offerte aanmaken'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// useSearchParams vereist een Suspense-grens tijdens het bouwen.
export default function OffertesPageWrapper() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-foundri-muted">Laden...</div>}>
      <OffertesPage />
    </Suspense>
  )
}
