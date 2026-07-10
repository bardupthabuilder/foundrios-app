'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Phone, Mail, MapPin, FolderOpen, FileText, Save,
  ClipboardList, Receipt, MessageCircle, Calendar, Building2, Plus, X,
} from 'lucide-react'

type Project = {
  id: string
  name: string
  status: string
  budget: number | null
  city: string | null
}

type Client = {
  id: string
  name: string | null
  company_name: string
  contact_name: string | null
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  notes: string | null
  created_at: string
  projects: Project[]
}

type HistoryItem = {
  id: string
  type: 'project' | 'werkbon' | 'offerte' | 'factuur'
  title: string
  status: string
  date: string
  amount?: number | null
}

const projectStatusConfig: Record<string, { label: string; color: string }> = {
  gepland:      { label: 'Gepland',      color: 'bg-foundri-card text-zinc-200' },
  actief:       { label: 'Actief',       color: 'bg-blue-500/10 text-blue-400' },
  active:       { label: 'Actief',       color: 'bg-blue-500/10 text-blue-400' },
  opgeleverd:   { label: 'Opgeleverd',   color: 'bg-green-500/10 text-green-400' },
  completed:    { label: 'Afgerond',     color: 'bg-green-500/10 text-green-400' },
  gefactureerd: { label: 'Gefactureerd', color: 'bg-emerald-500/10 text-emerald-400' },
  planning:     { label: 'Planning',     color: 'bg-foundri-card text-zinc-200' },
}

const historyTypeConfig: Record<HistoryItem['type'], { icon: React.ElementType; color: string; label: string }> = {
  project: { icon: FolderOpen,    color: 'text-violet-400',  label: 'Project' },
  werkbon: { icon: ClipboardList, color: 'text-blue-400',    label: 'Werkbon' },
  offerte: { icon: FileText,      color: 'text-foundri-yellow', label: 'Offerte' },
  factuur: { icon: Receipt,       color: 'text-green-400',   label: 'Factuur' },
}

export default function ClientDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'overzicht' | 'geschiedenis'>('overzicht')
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [form, setForm] = useState({
    name: '', contact_name: '', phone: '', email: '', address: '', city: '', notes: '',
  })
  const [projectDialogOpen, setProjectDialogOpen] = useState(false)
  const [projectSaving, setProjectSaving] = useState(false)
  const [projectForm, setProjectForm] = useState({ name: '', project_type: 'vakwerk', start_date: '', budget: '', description: '' })

  async function handleCreateProject() {
    if (!projectForm.name.trim()) return
    setProjectSaving(true)
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: projectForm.name,
        client_id: id,
        project_type: projectForm.project_type,
        start_date: projectForm.start_date || null,
        budget: projectForm.budget ? Math.round(parseFloat(projectForm.budget) * 100) : null,
        description: projectForm.description || null,
      }),
    })
    if (res.ok) {
      const project = await res.json()
      setProjectDialogOpen(false)
      setProjectForm({ name: '', project_type: 'vakwerk', start_date: '', budget: '', description: '' })
      router.push(`/dashboard/projecten/${project.id}`)
    }
    setProjectSaving(false)
  }

  useEffect(() => { fetchClient() }, [id])

  async function fetchClient() {
    const res = await fetch(`/api/clients/${id}`)
    if (res.ok) {
      const data = await res.json()
      setClient(data)
      setForm({
        name: data.company_name || data.name || '',
        contact_name: data.contact_name || '',
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
        city: data.city || '',
        notes: data.notes || '',
      })
    }
    setLoading(false)
  }

  async function fetchHistory() {
    if (historyLoaded || historyLoading) return
    setHistoryLoading(true)
    try {
      const [woRes, quotesRes, invoicesRes] = await Promise.allSettled([
        fetch('/api/work-orders'),
        fetch('/api/quotes'),
        fetch('/api/invoices'),
      ])

      const items: HistoryItem[] = []

      if (woRes.status === 'fulfilled' && woRes.value.ok) {
        const wos = await woRes.value.json()
        if (Array.isArray(wos)) {
          wos
            .filter((wo: any) => wo.clients?.id === id || wo.client_id === id)
            .forEach((wo: any) => {
              items.push({
                id: wo.id,
                type: 'werkbon',
                title: wo.title || wo.work_order_number || 'Werkbon',
                status: wo.status,
                date: wo.date || wo.created_at,
                amount: null,
              })
            })
        }
      }

      if (quotesRes.status === 'fulfilled' && quotesRes.value.ok) {
        const quotes = await quotesRes.value.json()
        if (Array.isArray(quotes)) {
          quotes
            .filter((q: any) => q.clients?.id === id || q.client_id === id)
            .forEach((q: any) => {
              items.push({
                id: q.id,
                type: 'offerte',
                title: q.title || q.quote_number || 'Offerte',
                status: q.status,
                date: q.issue_date || q.created_at,
                amount: q.total_incl_vat ?? q.amount ?? null,
              })
            })
        }
      }

      if (invoicesRes.status === 'fulfilled' && invoicesRes.value.ok) {
        const invoices = await invoicesRes.value.json()
        if (Array.isArray(invoices)) {
          invoices
            .filter((inv: any) => inv.clients?.id === id || inv.client_id === id)
            .forEach((inv: any) => {
              items.push({
                id: inv.id,
                type: 'factuur',
                title: inv.title || inv.invoice_number || 'Factuur',
                status: inv.status,
                date: inv.issue_date || inv.created_at,
                amount: inv.total_incl_vat ?? inv.amount ?? null,
              })
            })
        }
      }

      // Add projects from already-loaded client data
      if (client?.projects) {
        client.projects.forEach((p) => {
          items.push({
            id: p.id,
            type: 'project',
            title: p.name,
            status: p.status,
            date: '',
            amount: p.budget,
          })
        })
      }

      items.sort((a, b) => {
        if (!a.date) return 1
        if (!b.date) return -1
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      })

      setHistory(items)
      setHistoryLoaded(true)
    } finally {
      setHistoryLoading(false)
    }
  }

  function handleTabChange(t: 'overzicht' | 'geschiedenis') {
    setTab(t)
    if (t === 'geschiedenis') fetchHistory()
  }

  async function handleSave() {
    setSaving(true)
    const res = await fetch(`/api/clients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        contact_name: form.contact_name || null,
        phone: form.phone || null,
        email: form.email || null,
        address: form.address || null,
        city: form.city || null,
        notes: form.notes || null,
      }),
    })
    if (res.ok) {
      await fetchClient()
      setEditing(false)
    }
    setSaving(false)
  }

  const fmt = (cents: number) =>
    new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100)

  const fmtDate = (d: string) =>
    d ? new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

  if (loading) return <div className="p-6 pt-16 lg:pt-6 text-sm text-zinc-400">Laden...</div>
  if (!client) return <div className="p-6 pt-16 lg:pt-6 text-sm text-red-500">Klant niet gevonden</div>

  const displayName = client.company_name || client.name || '—'
  const projects = client.projects || []
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0)
  const klantSince = fmtDate(client.created_at)

  return (
    <div className="p-4 lg:p-6 pt-16 lg:pt-6 max-w-4xl pb-24 lg:pb-6">
      <button
        onClick={() => router.push('/dashboard/klanten')}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Terug naar klanten
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-foundri-card flex items-center justify-center text-zinc-300 text-base font-bold shrink-0">
            {initials}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white lg:text-2xl">{displayName}</h1>
            {client.contact_name && <p className="text-sm text-zinc-400">{client.contact_name}</p>}
          </div>
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="rounded-lg bg-foundri-card border border-white/8 px-3 py-2 text-sm text-zinc-300 hover:bg-foundri-hover transition-colors"
          >
            Bewerken
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(false)}
              className="rounded-lg bg-foundri-card border border-white/8 px-3 py-2 text-sm text-zinc-300 hover:bg-foundri-hover transition-colors"
            >
              Annuleren
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-foundri-yellow px-3 py-2 text-sm font-medium text-black disabled:opacity-50 transition-opacity"
            >
              <Save className="h-4 w-4" /> {saving ? 'Opslaan...' : 'Opslaan'}
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5">
        {(['overzicht', 'geschiedenis'] as const).map((t) => (
          <button
            key={t}
            onClick={() => handleTabChange(t)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium capitalize transition-colors ${
              tab === t ? 'bg-white text-black' : 'bg-foundri-card text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t === 'overzicht' ? 'Overzicht' : 'Geschiedenis'}
          </button>
        ))}
      </div>

      {/* ── OVERZICHT TAB ── */}
      {tab === 'overzicht' && (
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Contact info */}
          <div className="lg:col-span-1 space-y-4">
            <div className="rounded-xl bg-foundri-card border border-white/5 p-4 space-y-3">
              <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Contact</h2>
              {editing ? (
                <div className="space-y-3">
                  {[
                    { label: 'Bedrijfsnaam', key: 'name' },
                    { label: 'Contactpersoon', key: 'contact_name' },
                    { label: 'Telefoon', key: 'phone' },
                    { label: 'E-mail', key: 'email' },
                    { label: 'Adres', key: 'address' },
                    { label: 'Plaats', key: 'city' },
                  ].map(({ label, key }) => (
                    <div key={key}>
                      <label className="text-xs text-zinc-400">{label}</label>
                      <input
                        value={form[key as keyof typeof form]}
                        onChange={e => setForm({ ...form, [key]: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-white/8 bg-foundri-deep px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-white/20"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="text-xs text-zinc-400">Notities</label>
                    <textarea
                      value={form.notes}
                      onChange={e => setForm({ ...form, notes: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-white/8 bg-foundri-deep px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-white/20"
                      rows={3}
                    />
                  </div>
                </div>
              ) : (
                <>
                  {client.phone && (
                    <a href={`tel:${client.phone}`} className="flex items-center gap-2 text-sm text-zinc-200 hover:text-white transition-colors">
                      <Phone className="h-4 w-4 text-zinc-400 shrink-0" /> {client.phone}
                    </a>
                  )}
                  {client.email && (
                    <a href={`mailto:${client.email}`} className="flex items-center gap-2 text-sm text-zinc-200 hover:text-white transition-colors">
                      <Mail className="h-4 w-4 text-zinc-400 shrink-0" /> {client.email}
                    </a>
                  )}
                  {(client.address || client.city) && (
                    <div className="flex items-center gap-2 text-sm text-zinc-200">
                      <MapPin className="h-4 w-4 text-zinc-400 shrink-0" />
                      {[client.address, client.city].filter(Boolean).join(', ')}
                    </div>
                  )}
                  {client.notes && (
                    <div className="pt-2 border-t border-white/5">
                      <p className="text-xs text-zinc-400 mb-1">Notities</p>
                      <p className="text-sm text-zinc-200 whitespace-pre-wrap">{client.notes}</p>
                    </div>
                  )}
                  {!client.phone && !client.email && !client.address && !client.notes && (
                    <p className="text-sm text-zinc-500">Geen contactgegevens. Klik op Bewerken.</p>
                  )}
                </>
              )}
            </div>

            {/* Quick actions */}
            <div className="rounded-xl bg-foundri-card border border-white/5 p-4 space-y-1">
              <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Acties</h2>
              {client.phone && (
                <a
                  href={`tel:${client.phone}`}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-200 hover:bg-white/5 transition-colors"
                >
                  <Phone className="h-4 w-4 text-green-400" /> Bellen
                </a>
              )}
              {client.phone && (
                <a
                  href={`https://wa.me/${client.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-200 hover:bg-white/5 transition-colors"
                >
                  <MessageCircle className="h-4 w-4 text-green-400" /> WhatsApp
                </a>
              )}
              <button
                onClick={() => router.push(`/dashboard/offertes?client=${id}`)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-200 hover:bg-white/5 transition-colors text-left"
              >
                <FileText className="h-4 w-4 text-zinc-400" /> Nieuwe offerte
              </button>
              <button
                onClick={() => setProjectDialogOpen(true)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-200 hover:bg-white/5 transition-colors text-left"
              >
                <Plus className="h-4 w-4 text-foundri-yellow" /> Maak project
              </button>
            </div>
          </div>

          {/* Projecten */}
          <div className="lg:col-span-2">
            <div className="rounded-xl bg-foundri-card border border-white/5 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-zinc-400" />
                  Projecten ({projects.length})
                </h2>
              </div>

              {projects.length === 0 ? (
                <p className="text-sm text-zinc-400 py-4 text-center">Nog geen projecten voor deze klant.</p>
              ) : (
                <div className="space-y-2">
                  {projects.map((project: Project) => {
                    const sc = projectStatusConfig[project.status] || { label: project.status, color: 'bg-foundri-card text-zinc-200' }
                    return (
                      <button
                        key={project.id}
                        onClick={() => router.push(`/dashboard/projecten/${project.id}`)}
                        className="flex w-full items-center justify-between rounded-lg bg-foundri-deep border border-white/5 p-3 hover:bg-white/5 transition-colors text-left"
                      >
                        <div>
                          <p className="text-sm font-medium text-white">{project.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${sc.color}`}>
                              {sc.label}
                            </span>
                            {project.city && <span className="text-xs text-zinc-400">{project.city}</span>}
                          </div>
                        </div>
                        {project.budget && (
                          <span className="text-sm font-medium text-zinc-300 shrink-0 ml-2">
                            {fmt(project.budget)}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── GESCHIEDENIS TAB ── */}
      {tab === 'geschiedenis' && (
        <div className="space-y-4">
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-xl bg-foundri-card border border-white/5 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                <span className="text-xs text-zinc-400">Klant sinds</span>
              </div>
              <p className="text-sm font-semibold text-white">{klantSince}</p>
            </div>
            <div className="rounded-xl bg-foundri-card border border-white/5 p-4">
              <div className="flex items-center gap-2 mb-1">
                <FolderOpen className="h-3.5 w-3.5 text-zinc-400" />
                <span className="text-xs text-zinc-400">Projecten</span>
              </div>
              <p className="text-sm font-semibold text-white">{projects.length}</p>
            </div>
            <div className="rounded-xl bg-foundri-card border border-white/5 p-4">
              <div className="flex items-center gap-2 mb-1">
                <ClipboardList className="h-3.5 w-3.5 text-zinc-400" />
                <span className="text-xs text-zinc-400">Werkbonnen</span>
              </div>
              <p className="text-sm font-semibold text-white">
                {historyLoaded ? history.filter(h => h.type === 'werkbon').length : '—'}
              </p>
            </div>
            <div className="rounded-xl bg-foundri-card border border-white/5 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="h-3.5 w-3.5 text-zinc-400" />
                <span className="text-xs text-zinc-400">Totaalwaarde</span>
              </div>
              <p className="text-sm font-semibold text-white">
                {totalBudget > 0 ? fmt(totalBudget) : '—'}
              </p>
            </div>
          </div>

          {/* Timeline */}
          {historyLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-16 rounded-xl bg-foundri-card animate-pulse" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl bg-foundri-card border border-white/5">
              <Building2 className="h-8 w-8 text-zinc-600 mb-3" />
              <p className="text-sm font-medium text-zinc-300">Nog geen geschiedenis</p>
              <p className="text-xs text-zinc-500 mt-1">Werkbonnen, offertes en facturen verschijnen hier.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {history.map((item) => {
                const cfg = historyTypeConfig[item.type]
                const Icon = cfg.icon
                const navigate = () => {
                  if (item.type === 'werkbon') router.push(`/dashboard/werkbonnen/${item.id}`)
                  else if (item.type === 'offerte') router.push(`/dashboard/offertes/${item.id}`)
                  else if (item.type === 'factuur') router.push(`/dashboard/facturen/${item.id}`)
                  else if (item.type === 'project') router.push(`/dashboard/projecten/${item.id}`)
                }
                return (
                  <button
                    key={`${item.type}-${item.id}`}
                    onClick={navigate}
                    className="flex w-full items-center gap-3 rounded-xl bg-foundri-card border border-white/5 px-4 py-3.5 hover:bg-foundri-hover active:scale-[0.99] transition-all text-left"
                  >
                    <div className={`shrink-0 ${cfg.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{item.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-zinc-500">{cfg.label}</span>
                        {item.status && (
                          <>
                            <span className="text-zinc-600">·</span>
                            <span className="text-xs text-zinc-400 capitalize">{item.status}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      {item.amount ? (
                        <p className="text-sm font-medium text-zinc-300">{fmt(item.amount)}</p>
                      ) : null}
                      {item.date ? (
                        <p className="text-xs text-zinc-500">
                          {new Date(item.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                        </p>
                      ) : null}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Project aanmaken dialog */}
      {projectDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setProjectDialogOpen(false)}>
          <div className="w-full max-w-md rounded-xl bg-foundri-deep border border-white/10 p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white">Nieuw project</h2>
              <button onClick={() => setProjectDialogOpen(false)} className="text-zinc-400 hover:text-white transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-zinc-400">Projectnaam *</label>
                <input
                  autoFocus
                  value={projectForm.name}
                  onChange={e => setProjectForm({ ...projectForm, name: e.target.value })}
                  placeholder="Bijv. Tuin renovatie achtertuin"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-foundri-graphite px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/25"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-zinc-400">Type</label>
                  <select
                    value={projectForm.project_type}
                    onChange={e => setProjectForm({ ...projectForm, project_type: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-foundri-graphite px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/25"
                  >
                    <option value="vakwerk">Vakwerk</option>
                    <option value="onderhoud">Onderhoud</option>
                    <option value="advies">Advies</option>
                    <option value="service">Service</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-400">Startdatum</label>
                  <input
                    type="date"
                    value={projectForm.start_date}
                    onChange={e => setProjectForm({ ...projectForm, start_date: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-foundri-graphite px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/25"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-400">Budget (€)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={projectForm.budget}
                  onChange={e => setProjectForm({ ...projectForm, budget: e.target.value })}
                  placeholder="0.00"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-foundri-graphite px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/25"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-400">Omschrijving</label>
                <textarea
                  value={projectForm.description}
                  onChange={e => setProjectForm({ ...projectForm, description: e.target.value })}
                  rows={2}
                  placeholder="Optioneel"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-foundri-graphite px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/25 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setProjectDialogOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleCreateProject}
                  disabled={!projectForm.name.trim() || projectSaving}
                  className="rounded-lg bg-foundri-yellow px-4 py-2 text-sm font-medium text-foundri-graphite hover:bg-foundri-yellow-dim disabled:opacity-50 transition-opacity"
                >
                  {projectSaving ? 'Aanmaken...' : 'Maak project'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
