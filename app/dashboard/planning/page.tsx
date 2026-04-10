'use client'

import { useEffect, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CalendarDays, ChevronLeft, ChevronRight, Plus, MapPin, Trash2 } from 'lucide-react'
import type { Employee, PlanningEntryWithDetails } from '@/lib/types/project'

interface ProjectOption { id: string; name: string; address: string | null; city: string | null }

function getWeekDates(offset: number) {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1) + offset * 7
  const monday = new Date(now.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  const dates: Date[] = []
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    dates.push(d)
  }
  return dates
}

function toDateStr(d: Date) {
  return d.toISOString().split('T')[0]
}

function getWeekNumber(d: Date) {
  const oneJan = new Date(d.getFullYear(), 0, 1)
  const days = Math.floor((d.getTime() - oneJan.getTime()) / 86400000)
  return Math.ceil((days + oneJan.getDay() + 1) / 7)
}

const DAY_LABELS_FULL = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag']
const DAY_LABELS_SHORT = ['Ma', 'Di', 'Wo', 'Do', 'Vr']

export default function PlanningPage() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [entries, setEntries] = useState<PlanningEntryWithDetails[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogDate, setDialogDate] = useState('')
  const [dialogEmployee, setDialogEmployee] = useState('')
  const [selProject, setSelProject] = useState('')
  const [selHours, setSelHours] = useState('8')
  const [selNotes, setSelNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset])
  const weekStart = toDateStr(weekDates[0])
  const weekEnd = toDateStr(weekDates[4])
  const weekNum = getWeekNumber(weekDates[0])
  const year = weekDates[0].getFullYear()

  useEffect(() => {
    Promise.all([
      fetch('/api/employees').then((r) => r.json()),
      fetch('/api/projects?status=actief').then((r) => r.json()),
    ]).then(([emps, projs]) => {
      setEmployees(emps)
      setProjects(projs.map((p: ProjectOption) => ({ id: p.id, name: p.name, address: p.address, city: p.city })))
    })
  }, [])

  useEffect(() => {
    setLoading(true)
    fetch(`/api/planning?start=${weekStart}&end=${weekEnd}`)
      .then((r) => r.json())
      .then(setEntries)
      .finally(() => setLoading(false))
  }, [weekStart, weekEnd])

  function openDialog(date: string, employeeId: string) {
    setDialogDate(date)
    setDialogEmployee(employeeId)
    setSelProject('')
    setSelHours('8')
    setSelNotes('')
    setDialogOpen(true)
  }

  async function handleAdd() {
    setSaving(true)
    const res = await fetch('/api/planning', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employee_id: dialogEmployee,
        project_id: selProject,
        planned_date: dialogDate,
        planned_hours: parseFloat(selHours) || 8,
        notes: selNotes || null,
      }),
    })
    if (res.ok) {
      const entry = await res.json()
      setEntries((prev) => [...prev, entry])
      setDialogOpen(false)
    }
    setSaving(false)
  }

  async function handleDelete(entryId: string) {
    const res = await fetch(`/api/planning/${entryId}`, { method: 'DELETE' })
    if (res.ok) {
      setEntries((prev) => prev.filter((e) => e.id !== entryId))
    }
  }

  // Build grid: employee → date → entries[]
  const grid = useMemo(() => {
    const map = new Map<string, Map<string, PlanningEntryWithDetails[]>>()
    for (const emp of employees) {
      map.set(emp.id, new Map())
    }
    for (const entry of entries) {
      if (!map.has(entry.employee_id)) {
        map.set(entry.employee_id, new Map())
      }
      const empMap = map.get(entry.employee_id)!
      if (!empMap.has(entry.planned_date)) {
        empMap.set(entry.planned_date, [])
      }
      empMap.get(entry.planned_date)!.push(entry)
    }
    return map
  }, [entries, employees])

  const todayStr = toDateStr(new Date())

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Werkplanning</h1>
          <p className="text-sm text-zinc-500 mt-1">Wie werkt waar en wanneer</p>
        </div>
      </div>

      {/* Week navigatie */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => setWeekOffset((w) => w - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <div className="font-medium">Week {weekNum} — {year}</div>
          <div className="text-xs text-zinc-500">
            {weekDates[0].toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })} t/m{' '}
            {weekDates[4].toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
          </div>
        </div>
        <div className="flex gap-2">
          {weekOffset !== 0 && (
            <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)}>Vandaag</Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setWeekOffset((w) => w + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-zinc-400">Laden...</div>
      ) : employees.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CalendarDays className="h-10 w-10 mx-auto text-zinc-300 mb-3" />
            <p className="text-zinc-500">Voeg eerst medewerkers toe om de planning te gebruiken.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop: Week grid */}
          <div className="hidden lg:block overflow-x-auto">
            <div className="grid gap-px bg-zinc-200 rounded-lg overflow-hidden" style={{ gridTemplateColumns: '160px repeat(5, 1fr)' }}>
              {/* Header row */}
              <div className="bg-zinc-50 p-2 text-sm font-medium text-zinc-500" />
              {weekDates.map((d, i) => (
                <div
                  key={i}
                  className={`bg-zinc-50 p-2 text-center text-sm ${toDateStr(d) === todayStr ? 'bg-blue-50 font-bold' : ''}`}
                >
                  <div className="font-medium">{DAY_LABELS_SHORT[i]}</div>
                  <div className="text-xs text-zinc-400">
                    {d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
              ))}

              {/* Employee rows */}
              {employees.map((emp) => (
                <>
                  <div key={`name-${emp.id}`} className="bg-white p-2 flex items-start gap-2">
                    <div
                      className="h-6 w-6 rounded-full shrink-0 flex items-center justify-center text-white text-[10px] font-bold mt-0.5"
                      style={{ backgroundColor: emp.color }}
                    >
                      {emp.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="text-sm font-medium truncate">{emp.name}</div>
                  </div>
                  {weekDates.map((d) => {
                    const dateStr = toDateStr(d)
                    const cellEntries = grid.get(emp.id)?.get(dateStr) ?? []
                    return (
                      <div
                        key={`${emp.id}-${dateStr}`}
                        className={`bg-white p-1 min-h-[60px] cursor-pointer hover:bg-zinc-50 transition-colors ${
                          dateStr === todayStr ? 'bg-blue-50/50' : ''
                        }`}
                        onClick={() => openDialog(dateStr, emp.id)}
                      >
                        {cellEntries.map((entry) => (
                          <div
                            key={entry.id}
                            className="text-xs p-1.5 rounded mb-1 bg-zinc-100 hover:bg-zinc-200 group relative"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="font-medium truncate">{entry.projects?.name ?? '—'}</div>
                            <div className="text-zinc-400">{entry.planned_hours ?? 8}u</div>
                            {entry.projects?.city && (
                              <div className="text-zinc-400 flex items-center gap-0.5 truncate">
                                <MapPin className="h-2.5 w-2.5 shrink-0" />{entry.projects.city}
                              </div>
                            )}
                            <button
                              className="absolute top-1 right-1 h-4 w-4 rounded bg-red-100 text-red-600 items-center justify-center hidden group-hover:flex"
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
                </>
              ))}
            </div>

            {/* Capaciteitsbalk per dag */}
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
                    <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
                      <span>{dayHours}u / {capacity}u</span>
                      <span className={pct >= 90 ? 'text-green-600 font-medium' : pct >= 50 ? 'text-orange-500' : 'text-zinc-400'}>{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${pct >= 90 ? 'bg-green-500' : pct >= 50 ? 'bg-orange-400' : 'bg-zinc-300'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Mobile: Day list */}
          <div className="lg:hidden space-y-4">
            {weekDates.map((d, i) => {
              const dateStr = toDateStr(d)
              const dayEntries = entries.filter((e) => e.planned_date === dateStr)
              const isToday = dateStr === todayStr

              return (
                <div key={dateStr}>
                  <div className={`text-sm font-medium mb-2 ${isToday ? 'text-blue-600' : 'text-zinc-500'}`}>
                    {isToday ? 'Vandaag — ' : ''}{DAY_LABELS_FULL[i]}{' '}
                    {d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}
                  </div>
                  {dayEntries.length === 0 ? (
                    <Card>
                      <CardContent className="py-3 text-center text-sm text-zinc-400">
                        Geen planning
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {dayEntries.map((entry) => (
                        <Card key={entry.id}>
                          <CardContent className="flex items-center gap-3 py-3">
                            {entry.employees && (
                              <div
                                className="h-8 w-8 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold"
                                style={{ backgroundColor: entry.employees.color }}
                              >
                                {entry.employees.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium">{entry.employees?.name ?? '—'}</div>
                              <div className="text-sm text-zinc-500">{entry.projects?.name ?? '—'} — {entry.planned_hours ?? 8}u</div>
                              {entry.projects?.city && (
                                <div className="text-xs text-zinc-400 flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />{[entry.projects.address, entry.projects.city].filter(Boolean).join(', ')}
                                </div>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-zinc-400 hover:text-red-600 shrink-0"
                              onClick={() => handleDelete(entry.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-1 text-zinc-400"
                    onClick={() => {
                      setDialogDate(dateStr)
                      setDialogEmployee(employees[0]?.id ?? '')
                      setSelProject('')
                      setSelHours('8')
                      setSelNotes('')
                      setDialogOpen(true)
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />Inplannen
                  </Button>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Planning Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inplannen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Medewerker</Label>
              <Select value={dialogEmployee} onValueChange={setDialogEmployee}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Datum</Label>
              <Input type="date" value={dialogDate} onChange={(e) => setDialogDate(e.target.value)} />
            </div>
            <div>
              <Label>Project *</Label>
              <Select value={selProject} onValueChange={setSelProject}>
                <SelectTrigger><SelectValue placeholder="Selecteer project..." /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}{p.city ? ` — ${p.city}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Uren</Label>
              <Input type="number" step="0.5" value={selHours} onChange={(e) => setSelHours(e.target.value)} />
            </div>
            <div>
              <Label>Notities</Label>
              <Input value={selNotes} onChange={(e) => setSelNotes(e.target.value)} placeholder="Bijzonderheden..." />
            </div>
            <Button onClick={handleAdd} disabled={!selProject || saving} className="w-full">
              {saving ? 'Opslaan...' : 'Inplannen'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
