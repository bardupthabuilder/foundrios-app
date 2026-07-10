'use client'

import { Fragment, useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, ChevronLeft, ChevronRight, Plus, MapPin, Trash2, Users, ClipboardList } from 'lucide-react'
import type { Employee, PlanningEntryWithDetails } from '@/lib/types/project'

interface ProjectOption { id: string; name: string; address: string | null; city: string | null }

function getWeekDates(offset: number) {
  const base = new Date()
  const day = base.getDay()
  const diff = base.getDate() - day + (day === 0 ? -6 : 1) + offset * 7
  const monday = new Date(base.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  const dates: Date[] = []
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    dates.push(d)
  }
  return dates
}

function toDateStr(d: Date) { return d.toISOString().split('T')[0] }

function getWeekNumber(d: Date) {
  const oneJan = new Date(d.getFullYear(), 0, 1)
  const days = Math.floor((d.getTime() - oneJan.getTime()) / 86400000)
  return Math.ceil((days + oneJan.getDay() + 1) / 7)
}

const DAY_LABELS_FULL = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag']
const DAY_LABELS_SHORT = ['Ma', 'Di', 'Wo', 'Do', 'Vr']

export default function PlanningPage() {
  const [weekOffset, setWeekOffset] = useState(0)
  const router = useRouter()
  const [werkbonBusyId, setWerkbonBusyId] = useState<string | null>(null)
  const [entries, setEntries] = useState<PlanningEntryWithDetails[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [loading, setLoading] = useState(true)

  const [sheet, setSheet] = useState(false)
  const [formDate, setFormDate] = useState('')
  const [formEmployee, setFormEmployee] = useState('')
  const [formProject, setFormProject] = useState('')
  const [formHours, setFormHours] = useState('8')
  const [formNotes, setFormNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset])
  const weekStart = toDateStr(weekDates[0])
  const weekEnd = toDateStr(weekDates[4])
  const weekNum = getWeekNumber(weekDates[0])
  const year = weekDates[0].getFullYear()
  const todayStr = toDateStr(new Date())

  useEffect(() => {
    Promise.all([
      fetch('/api/employees').then((r) => r.json()),
      fetch('/api/projects?status=open').then((r) => r.json()),
    ]).then(([emps, projs]) => {
      setEmployees(Array.isArray(emps) ? emps : [])
      setProjects(Array.isArray(projs) ? projs : [])
      if (emps?.[0]) setFormEmployee(emps[0].id)
    })
  }, [])

  useEffect(() => {
    setLoading(true)
    fetch(`/api/planning?start=${weekStart}&end=${weekEnd}`)
      .then((r) => r.json())
      .then((d) => setEntries(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false))
  }, [weekStart, weekEnd])

  function openSheet(date: string, employeeId?: string) {
    setFormDate(date)
    setFormEmployee(employeeId || employees[0]?.id || '')
    setFormProject('')
    setFormHours('8')
    setFormNotes('')
    setSheet(true)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!formProject) return
    setSaving(true)
    const res = await fetch('/api/planning', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employee_id: formEmployee,
        project_id: formProject,
        planned_date: formDate,
        planned_hours: parseFloat(formHours) || 8,
        notes: formNotes || null,
      }),
    })
    if (res.ok) {
      const entry = await res.json()
      setEntries((prev) => [...prev, entry])
      setSheet(false)
    }
    setSaving(false)
  }

  async function handleDelete(entryId: string) {
    const res = await fetch(`/api/planning/${entryId}`, { method: 'DELETE' })
    if (res.ok) setEntries((prev) => prev.filter((e) => e.id !== entryId))
  }

  // De geplande klus wordt de werkbon: zelfde project, zelfde klant, zelfde dag.
  // De monteur hoeft op locatie alleen nog uren en materiaal in te vullen.
  async function handleCreateWerkbon(entry: PlanningEntryWithDetails) {
    if (!entry.projects) return
    setWerkbonBusyId(entry.id)

    const res = await fetch('/api/work-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: entry.projects.name,
        project_id: entry.project_id,
        date: entry.planned_date,
        description: entry.notes ?? null,
      }),
    })

    if (res.ok) {
      const wo = await res.json()
      router.push(`/dashboard/werkbonnen/${wo.id}`)
      return
    }
    setWerkbonBusyId(null)
  }

  const grid = useMemo(() => {
    const map = new Map<string, Map<string, PlanningEntryWithDetails[]>>()
    for (const emp of employees) map.set(emp.id, new Map())
    for (const entry of entries) {
      if (!map.has(entry.employee_id)) map.set(entry.employee_id, new Map())
      const empMap = map.get(entry.employee_id)!
      if (!empMap.has(entry.planned_date)) empMap.set(entry.planned_date, [])
      empMap.get(entry.planned_date)!.push(entry)
    }
    return map
  }, [entries, employees])

  const todayEntries = entries.filter((e) => e.planned_date === todayStr)

  return (
    <div className="p-4 lg:p-6 max-w-7xl pb-24 lg:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-white lg:text-2xl">Planning</h1>
          <p className="text-sm text-zinc-400">Wie werkt waar en wanneer</p>
        </div>
        <button
          onClick={() => openSheet(todayStr)}
          className="hidden lg:inline-flex items-center gap-2 rounded-lg bg-foundri-card px-4 py-2.5 text-sm font-medium text-white hover:bg-foundri-hover transition-colors"
        >
          <Plus className="h-4 w-4" /> Inplannen
        </button>
      </div>

      {/* Week navigatie */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => setWeekOffset((w) => w - 1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-foundri-card hover:bg-foundri-hover transition-colors"
        >
          <ChevronLeft className="h-4 w-4 text-zinc-300" />
        </button>
        <div className="text-center">
          <div className="text-sm font-semibold text-white">Week {weekNum} — {year}</div>
          <div className="text-xs text-zinc-400">
            {weekDates[0].toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })} t/m{' '}
            {weekDates[4].toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
          </div>
        </div>
        <div className="flex gap-2">
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="rounded-lg bg-foundri-card px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-foundri-hover transition-colors"
            >
              Vandaag
            </button>
          )}
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-foundri-card hover:bg-foundri-hover transition-colors"
          >
            <ChevronRight className="h-4 w-4 text-zinc-300" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-foundri-card animate-pulse" />)}
        </div>
      ) : employees.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl bg-foundri-card border border-white/5">
          <Users className="h-10 w-10 text-zinc-600 mb-3" />
          <p className="text-sm font-medium text-zinc-300">Geen medewerkers</p>
          <p className="text-xs text-zinc-500 mt-1">Voeg eerst medewerkers toe om te plannen.</p>
        </div>
      ) : (
        <>
          {/* ── MOBILE ── */}
          <div className="lg:hidden space-y-5">
            {/* VANDAAG — prominent block (only show in current week) */}
            {weekOffset === 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-white">
                    Vandaag —{' '}
                    {new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </span>
                  <button
                    onClick={() => openSheet(todayStr)}
                    className="flex items-center gap-1 rounded-lg bg-foundri-yellow px-3 py-1.5 text-xs font-medium text-black"
                  >
                    <Plus className="h-3.5 w-3.5" /> Inplannen
                  </button>
                </div>
                {todayEntries.length === 0 ? (
                  <div className="rounded-xl bg-foundri-card border border-white/5 px-4 py-5 text-center">
                    <CalendarDays className="h-6 w-6 text-zinc-600 mx-auto mb-2" />
                    <p className="text-sm text-zinc-400">Nog niets ingepland vandaag</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {todayEntries.map((entry) => (
                      <EntryCard key={entry.id} entry={entry} onDelete={handleDelete} onCreateWerkbon={handleCreateWerkbon} creatingWerkbon={werkbonBusyId === entry.id} highlight />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Rest of week */}
            {weekDates.map((d, i) => {
              const dateStr = toDateStr(d)
              if (weekOffset === 0 && dateStr === todayStr) return null
              const dayEntries = entries.filter((e) => e.planned_date === dateStr)

              return (
                <div key={dateStr}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-zinc-400">
                      {DAY_LABELS_FULL[i]}{' '}
                      {d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                    </span>
                    <button
                      onClick={() => openSheet(dateStr)}
                      className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      <Plus className="h-3 w-3" /> Inplannen
                    </button>
                  </div>
                  {dayEntries.length === 0 ? (
                    <div className="rounded-xl bg-foundri-card border border-white/5 px-4 py-3 text-center">
                      <p className="text-xs text-zinc-500">Geen planning</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {dayEntries.map((entry) => (
                        <EntryCard key={entry.id} entry={entry} onDelete={handleDelete} onCreateWerkbon={handleCreateWerkbon} creatingWerkbon={werkbonBusyId === entry.id} />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* ── DESKTOP: week grid ── */}
          <div className="hidden lg:block">
            <div className="overflow-x-auto">
              <div
                className="grid gap-px bg-white/5 rounded-xl overflow-hidden"
                style={{ gridTemplateColumns: '160px repeat(5, 1fr)' }}
              >
                {/* Header */}
                <div className="bg-foundri-deep p-2 text-xs font-medium text-zinc-400" />
                {weekDates.map((d, i) => (
                  <div
                    key={i}
                    className={`p-2 text-center text-sm ${
                      toDateStr(d) === todayStr ? 'bg-blue-500/10' : 'bg-foundri-deep'
                    }`}
                  >
                    <div className={`font-medium text-xs ${toDateStr(d) === todayStr ? 'text-blue-400' : 'text-zinc-300'}`}>
                      {DAY_LABELS_SHORT[i]}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                ))}

                {/* Fragment heeft zelf een key nodig; de keys op de kinderen tellen niet. */}
                {employees.map((emp) => (
                  <Fragment key={emp.id}>
                    <div className="bg-foundri-deep p-2 flex items-start gap-2">
                      <div
                        className="h-6 w-6 rounded-full shrink-0 flex items-center justify-center text-white text-[10px] font-bold mt-0.5"
                        style={{ backgroundColor: emp.color }}
                      >
                        {emp.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="text-xs font-medium text-zinc-200 truncate pt-0.5">{emp.name}</div>
                    </div>
                    {weekDates.map((d) => {
                      const dateStr = toDateStr(d)
                      const cellEntries = grid.get(emp.id)?.get(dateStr) ?? []
                      return (
                        <div
                          key={`${emp.id}-${dateStr}`}
                          className={`p-1 min-h-[60px] cursor-pointer hover:bg-white/5 transition-colors ${
                            dateStr === todayStr ? 'bg-blue-500/5' : 'bg-foundri-deep'
                          }`}
                          onClick={() => openSheet(dateStr, emp.id)}
                        >
                          {cellEntries.map((entry) => (
                            <div
                              key={entry.id}
                              className="text-xs p-1.5 rounded mb-1 bg-foundri-card hover:bg-white/15 group relative"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="font-medium truncate text-zinc-200">{entry.projects?.name ?? '—'}</div>
                              <div className="text-zinc-500">{entry.planned_hours ?? 8}u</div>
                              {entry.projects?.city && (
                                <div className="text-zinc-500 flex items-center gap-0.5 truncate">
                                  <MapPin className="h-2.5 w-2.5 shrink-0" />{entry.projects.city}
                                </div>
                              )}
                              <button
                                className="absolute top-1 right-1 h-4 w-4 rounded bg-red-500/10 text-red-400 items-center justify-center hidden group-hover:flex"
                                onClick={() => handleDelete(entry.id)}
                              >
                                <Trash2 className="h-2.5 w-2.5" />
                              </button>
                            </div>
                          ))}
                          {cellEntries.length === 0 && (
                            <div className="h-full flex items-center justify-center opacity-0 hover:opacity-30">
                              <Plus className="h-4 w-4 text-zinc-400" />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </Fragment>
                ))}
              </div>

              {/* Bezettingsbalk */}
              <div className="mt-3 grid gap-px" style={{ gridTemplateColumns: '160px repeat(5, 1fr)' }}>
                <div className="text-xs text-zinc-400 flex items-center px-2">Bezetting</div>
                {weekDates.map((d) => {
                  const dateStr = toDateStr(d)
                  const dayHours = entries
                    .filter((e) => e.planned_date === dateStr)
                    .reduce((sum, e) => sum + (e.planned_hours ?? 8), 0)
                  const capacity = employees.length * 8
                  const pct = capacity > 0 ? Math.min(Math.round((dayHours / capacity) * 100), 100) : 0
                  return (
                    <div key={dateStr} className="px-2">
                      <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                        <span>{dayHours}u / {capacity}u</span>
                        <span className={pct >= 90 ? 'text-green-400 font-medium' : pct >= 50 ? 'text-orange-500' : 'text-zinc-400'}>
                          {pct}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-foundri-card overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            pct >= 90 ? 'bg-green-500' : pct >= 50 ? 'bg-orange-400' : 'bg-zinc-600'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Mobile FAB */}
      <button
        onClick={() => openSheet(todayStr)}
        className="fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-foundri-yellow text-black shadow-xl active:scale-95 transition-transform lg:hidden"
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>

      {/* Bottom sheet — inplannen */}
      {sheet && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-black/60"
          onClick={() => setSheet(false)}
        >
          <div
            className="w-full sm:max-w-md rounded-t-2xl sm:rounded-xl bg-foundri-deep border-t border-white/5 sm:border sm:border-white/8 p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-white/15 mx-auto mb-4 sm:hidden" />
            <h2 className="text-base font-semibold text-white mb-4">Inplannen</h2>
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-zinc-400">Medewerker</label>
                <select
                  value={formEmployee}
                  onChange={e => setFormEmployee(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-white/8 bg-foundri-card px-3 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                >
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-400">Datum</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-white/8 bg-foundri-card px-3 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-400">Project *</label>
                <select
                  required
                  value={formProject}
                  onChange={e => setFormProject(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-white/8 bg-foundri-card px-3 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                >
                  <option value="">Selecteer project...</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}{p.city ? ` — ${p.city}` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-400">Uren</label>
                <input
                  type="number"
                  step="0.5"
                  inputMode="decimal"
                  value={formHours}
                  onChange={e => setFormHours(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-white/8 bg-foundri-card px-3 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-400">Notities</label>
                <input
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="Bijzonderheden..."
                  className="mt-1.5 w-full rounded-lg border border-white/8 bg-foundri-card px-3 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-white/20"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setSheet(false)}
                  className="flex-1 rounded-lg py-3 text-sm font-medium text-zinc-300 bg-foundri-card hover:bg-foundri-hover transition-colors"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  disabled={saving || !formProject}
                  className="flex-1 rounded-lg bg-foundri-yellow py-3 text-sm font-medium text-black disabled:opacity-50"
                >
                  {saving ? 'Opslaan...' : 'Inplannen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function EntryCard({
  entry,
  onDelete,
  onCreateWerkbon,
  creatingWerkbon,
  highlight = false,
}: {
  entry: PlanningEntryWithDetails
  onDelete: (id: string) => void
  onCreateWerkbon: (entry: PlanningEntryWithDetails) => void
  creatingWerkbon: boolean
  highlight?: boolean
}) {
  return (
    <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
      highlight ? 'bg-blue-500/8 border-blue-500/20' : 'bg-foundri-card border-white/5'
    }`}>
      {entry.employees && (
        <div
          className="h-8 w-8 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold"
          style={{ backgroundColor: entry.employees.color }}
        >
          {entry.employees.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{entry.employees?.name ?? '—'}</p>
        <p className="text-xs text-zinc-400 truncate">
          {entry.projects?.name ?? '—'} · {entry.planned_hours ?? 8}u
        </p>
        {entry.projects?.city && (
          <div className="flex items-center gap-1 text-xs text-zinc-500 mt-0.5">
            <MapPin className="h-3 w-3 shrink-0" />
            {[entry.projects.address, entry.projects.city].filter(Boolean).join(', ')}
          </div>
        )}
      </div>
      {/* Een geplande dag hoort met één tik een werkbon te worden. Anders typt de
          vakman op locatie alles opnieuw over. */}
      <button
        onClick={() => onCreateWerkbon(entry)}
        disabled={creatingWerkbon || !entry.projects}
        title="Werkbon maken voor deze dag"
        className="h-8 w-8 flex items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors shrink-0 disabled:opacity-40"
      >
        <ClipboardList className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => onDelete(entry.id)}
        className="h-8 w-8 flex items-center justify-center rounded-lg bg-red-500/8 text-red-400 hover:bg-red-500/15 transition-colors shrink-0"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
