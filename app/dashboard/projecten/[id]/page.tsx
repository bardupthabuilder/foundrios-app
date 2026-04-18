'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, MapPin, Clock, Euro, Package, Calendar, User } from 'lucide-react'
import type { Project, ProjectStatus, TimeEntry, MaterialEntry, PlanningEntry } from '@/lib/types/project'

const STATUS_LABELS: Record<ProjectStatus, string> = {
  gepland: 'Gepland',
  actief: 'Actief',
  pauze: 'Pauze',
  opgeleverd: 'Opgeleverd',
  gefactureerd: 'Gefactureerd',
  gearchiveerd: 'Gearchiveerd',
}

const STATUS_COLORS: Record<ProjectStatus, string> = {
  gepland: 'bg-blue-500/10 text-blue-400',
  actief: 'bg-green-500/10 text-green-400',
  pauze: 'bg-yellow-500/10 text-yellow-400',
  opgeleverd: 'bg-purple-500/10 text-purple-400',
  gefactureerd: 'bg-[#282A2E] text-zinc-200',
  gearchiveerd: 'bg-[#282A2E] text-zinc-400',
}

type TabKey = 'overzicht' | 'uren' | 'materiaal' | 'planning' | 'nacalculatie'

interface ProjectDetail extends Project {
  clients: { id: string; name: string; contact_name: string | null; phone: string | null; email: string | null; address: string | null; city: string | null } | null
  time_entries: (TimeEntry & { employees?: { id: string; name: string } | null })[]
  material_entries: MaterialEntry[]
  planning_entries: (PlanningEntry & { employees?: { id: string; name: string; color: string } | null })[]
  totals: { hours: number; material_cents: number; labor_cents: number }
}

interface NacalculatieData {
  project: { id: string; name: string; budget_cents: number }
  summary: {
    total_hours: number
    total_labor_cents: number
    total_material_cents: number
    wo_hours_cents: number
    wo_materials_cents: number
    total_cost_cents: number
    budget_cents: number
    remaining_cents: number
    margin_pct: number
    total_quoted_cents: number
    total_invoiced_cents: number
    total_paid_cents: number
  }
  work_orders: { id: string; title: string; status: string; date: string }[]
  quotes: { id: string; title: string; status: string; amount_excl_vat: number }[]
  invoices: { id: string; title: string; invoice_number: string; status: string; amount_excl_vat: number }[]
}

export default function ProjectDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabKey>('overzicht')
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [nacalculatie, setNacalculatie] = useState<NacalculatieData | null>(null)
  const [nacLoading, setNacLoading] = useState(false)

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then(setProject)
      .catch(() => router.push('/dashboard/projecten'))
      .finally(() => setLoading(false))
  }, [id, router])

  useEffect(() => {
    if (tab === 'nacalculatie' && !nacalculatie && !nacLoading) {
      setNacLoading(true)
      fetch(`/api/projects/${id}/nacalculatie`)
        .then(r => r.json())
        .then(setNacalculatie)
        .catch(() => {})
        .finally(() => setNacLoading(false))
    }
  }, [tab, id, nacalculatie, nacLoading])

  async function handleStatusChange(status: string) {
    setUpdatingStatus(true)
    const res = await fetch(`/api/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      setProject((prev) => prev ? { ...prev, status: status as ProjectStatus } : null)
    }
    setUpdatingStatus(false)
  }

  const formatCents = (cents: number) =>
    new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100)

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })

  const formatDateShort = (d: string) =>
    new Date(d).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })

  if (loading) return <div className="p-6 text-center text-zinc-400">Laden...</div>
  if (!project) return null

  const totalCents = project.totals.labor_cents + project.totals.material_cents
  const tabs: { key: TabKey; label: string }[] = [
    { key: 'overzicht', label: 'Overzicht' },
    { key: 'uren', label: `Uren (${project.totals.hours}u)` },
    { key: 'materiaal', label: `Materiaal (${project.material_entries.length})` },
    { key: 'planning', label: `Planning (${project.planning_entries.length})` },
    { key: 'nacalculatie', label: 'Nacalculatie' },
  ]

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/projecten')} className="mb-3 -ml-2 text-zinc-400">
          <ArrowLeft className="h-4 w-4 mr-1" />Terug
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <Badge variant="secondary" className={STATUS_COLORS[project.status]}>
                {STATUS_LABELS[project.status]}
              </Badge>
            </div>
            {project.clients && (
              <p className="text-sm text-zinc-400 mt-1">{project.clients.name}</p>
            )}
            {(project.address || project.city) && (
              <p className="text-sm text-zinc-400 flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" />
                {[project.address, project.city].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
          <Select
            value={project.status}
            onValueChange={handleStatusChange}
            disabled={updatingStatus}
          >
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="py-3">
            <div className="text-xs text-zinc-400 flex items-center gap-1"><Clock className="h-3 w-3" />Uren</div>
            <div className="text-xl font-bold mt-1">{project.totals.hours}u</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3">
            <div className="text-xs text-zinc-400 flex items-center gap-1"><Euro className="h-3 w-3" />Arbeid</div>
            <div className="text-xl font-bold mt-1">{formatCents(project.totals.labor_cents)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3">
            <div className="text-xs text-zinc-400 flex items-center gap-1"><Package className="h-3 w-3" />Materiaal</div>
            <div className="text-xl font-bold mt-1">{formatCents(project.totals.material_cents)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3">
            <div className="text-xs text-zinc-400">Budget</div>
            <div className="text-xl font-bold mt-1">
              {project.budget_cents ? (
                <span className={totalCents > project.budget_cents ? 'text-red-400' : ''}>
                  {formatCents(totalCents)} / {formatCents(project.budget_cents)}
                </span>
              ) : (
                <span className="text-zinc-400">—</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === t.key ? 'border-zinc-900 text-white' : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'overzicht' && (
        <div className="grid sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Projectinfo</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {project.description && <p className="text-zinc-300">{project.description}</p>}
              {project.project_type && (
                <div className="flex justify-between">
                  <span className="text-zinc-400">Type</span>
                  <span className="capitalize">{project.project_type}</span>
                </div>
              )}
              {project.start_date && (
                <div className="flex justify-between">
                  <span className="text-zinc-400">Start</span>
                  <span>{formatDate(project.start_date)}</span>
                </div>
              )}
              {project.end_date && (
                <div className="flex justify-between">
                  <span className="text-zinc-400">Eind</span>
                  <span>{formatDate(project.end_date)}</span>
                </div>
              )}
              {project.hourly_rate_cents && (
                <div className="flex justify-between">
                  <span className="text-zinc-400">Uurtarief</span>
                  <span>{formatCents(project.hourly_rate_cents)}/u</span>
                </div>
              )}
              {project.notes && (
                <div className="pt-2 border-t">
                  <span className="text-zinc-400 block mb-1">Notities</span>
                  <p className="text-zinc-300 whitespace-pre-wrap">{project.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
          {project.clients && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Klant</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="font-medium">{project.clients.name}</div>
                {project.clients.contact_name && <div className="text-zinc-400">{project.clients.contact_name}</div>}
                {project.clients.phone && <div className="text-zinc-400">{project.clients.phone}</div>}
                {project.clients.email && <div className="text-zinc-400">{project.clients.email}</div>}
                {(project.clients.address || project.clients.city) && (
                  <div className="text-zinc-400 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {[project.clients.address, project.clients.city].filter(Boolean).join(', ')}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {tab === 'uren' && (
        <div>
          {project.time_entries.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-zinc-400">
                Nog geen uren geboekt op dit project.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {project.time_entries.map((entry) => (
                <Card key={entry.id}>
                  <CardContent className="flex items-center gap-4 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">{entry.employees?.name ?? '—'}</span>
                        <span className="text-zinc-400">{formatDateShort(entry.entry_date)}</span>
                        <Badge variant={entry.status === 'goedgekeurd' ? 'default' : 'secondary'} className="text-xs">
                          {entry.status}
                        </Badge>
                      </div>
                      {entry.description && <p className="text-sm text-zinc-400 mt-0.5">{entry.description}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-medium">{entry.hours}u</div>
                      {project.hourly_rate_cents && entry.is_billable && (
                        <div className="text-xs text-zinc-400">{formatCents(entry.hours * project.hourly_rate_cents)}</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'materiaal' && (
        <div>
          {project.material_entries.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-zinc-400">
                Nog geen materiaal geboekt op dit project.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {project.material_entries.map((entry) => (
                <Card key={entry.id}>
                  <CardContent className="flex items-center gap-4 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{entry.description}</div>
                      <div className="text-sm text-zinc-400">
                        {entry.quantity} {entry.unit ?? 'stuk'} · {formatDateShort(entry.entry_date)}
                      </div>
                    </div>
                    <div className="text-right shrink-0 font-medium text-sm">
                      {entry.total_cents ? formatCents(entry.total_cents) : '—'}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'planning' && (
        <div>
          {project.planning_entries.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-zinc-400">
                Nog geen planning voor dit project.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {project.planning_entries.map((entry) => (
                <Card key={entry.id}>
                  <CardContent className="flex items-center gap-4 py-3">
                    {entry.employees && (
                      <div
                        className="h-8 w-8 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: entry.employees.color }}
                      >
                        {entry.employees.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">{entry.employees?.name ?? '—'}</span>
                        <span className="text-zinc-400">{formatDateShort(entry.planned_date)}</span>
                      </div>
                      {entry.notes && <p className="text-sm text-zinc-400 mt-0.5">{entry.notes}</p>}
                    </div>
                    <div className="text-sm font-medium shrink-0">
                      {entry.planned_hours ?? 8}u
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'nacalculatie' && (
        <div>
          {nacLoading ? (
            <div className="py-8 text-center text-zinc-400">Laden...</div>
          ) : !nacalculatie ? (
            <Card>
              <CardContent className="py-8 text-center text-zinc-400">
                Kon nacalculatie niet laden.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Kosten overzicht */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Kostenoverzicht</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Uren (urenregistratie)</span>
                      <span>{nacalculatie.summary.total_hours}u · {formatCents(nacalculatie.summary.total_labor_cents)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Materiaal (urenregistratie)</span>
                      <span>{formatCents(nacalculatie.summary.total_material_cents)}</span>
                    </div>
                    {(nacalculatie.summary.wo_hours_cents > 0 || nacalculatie.summary.wo_materials_cents > 0) && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Uren (werkbonnen)</span>
                          <span>{formatCents(nacalculatie.summary.wo_hours_cents)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Materiaal (werkbonnen)</span>
                          <span>{formatCents(nacalculatie.summary.wo_materials_cents)}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between border-t pt-2 font-semibold">
                      <span>Totale kosten</span>
                      <span>{formatCents(nacalculatie.summary.total_cost_cents)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Budget vs Werkelijk */}
              {nacalculatie.summary.budget_cents > 0 && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Budget vs Werkelijk</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Budget</span>
                        <span className="font-medium">{formatCents(nacalculatie.summary.budget_cents)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Besteed</span>
                        <span className="font-medium">{formatCents(nacalculatie.summary.total_cost_cents)}</span>
                      </div>
                      <div className="w-full bg-[#282A2E] rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all ${nacalculatie.summary.remaining_cents < 0 ? 'bg-red-500' : nacalculatie.summary.margin_pct < 20 ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min(100, Math.round((nacalculatie.summary.total_cost_cents / nacalculatie.summary.budget_cents) * 100))}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Resterend</span>
                        <span className={`font-semibold ${nacalculatie.summary.remaining_cents < 0 ? 'text-red-400' : 'text-green-400'}`}>
                          {formatCents(nacalculatie.summary.remaining_cents)} ({nacalculatie.summary.margin_pct}%)
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Financieel */}
              <div className="grid sm:grid-cols-3 gap-3">
                <Card>
                  <CardContent className="py-3">
                    <div className="text-xs text-zinc-400">Geoffreerd (akkoord)</div>
                    <div className="text-xl font-bold mt-1">{formatCents(nacalculatie.summary.total_quoted_cents)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="py-3">
                    <div className="text-xs text-zinc-400">Gefactureerd</div>
                    <div className="text-xl font-bold mt-1">{formatCents(nacalculatie.summary.total_invoiced_cents)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="py-3">
                    <div className="text-xs text-zinc-400">Betaald</div>
                    <div className="text-xl font-bold mt-1 text-green-400">{formatCents(nacalculatie.summary.total_paid_cents)}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Werkbonnen lijst */}
              {nacalculatie.work_orders.length > 0 && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Werkbonnen ({nacalculatie.work_orders.length})</CardTitle></CardHeader>
                  <CardContent className="space-y-1">
                    {nacalculatie.work_orders.map(wo => (
                      <div key={wo.id} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                        <div>
                          <span className="font-medium">{wo.title}</span>
                          <span className="text-zinc-400 ml-2">{formatDateShort(wo.date)}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs capitalize">{wo.status}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Offertes + Facturen */}
              {(nacalculatie.quotes.length > 0 || nacalculatie.invoices.length > 0) && (
                <div className="grid sm:grid-cols-2 gap-4">
                  {nacalculatie.quotes.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm">Offertes</CardTitle></CardHeader>
                      <CardContent className="space-y-1">
                        {nacalculatie.quotes.map(q => (
                          <div key={q.id} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                            <span className="font-medium truncate">{q.title}</span>
                            <span className="shrink-0 ml-2">{formatCents(q.amount_excl_vat)}</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                  {nacalculatie.invoices.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm">Facturen</CardTitle></CardHeader>
                      <CardContent className="space-y-1">
                        {nacalculatie.invoices.map(inv => (
                          <div key={inv.id} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                            <span className="font-medium truncate">{inv.invoice_number || inv.title}</span>
                            <span className="shrink-0 ml-2">{formatCents(inv.amount_excl_vat)}</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
