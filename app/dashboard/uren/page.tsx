'use client'

import { useEffect, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Clock, ChevronLeft, ChevronRight, Check, X, Plus, Package } from 'lucide-react'
import type { Employee, TimeEntryWithDetails, MaterialEntry } from '@/lib/types/project'

interface ProjectOption { id: string; name: string }

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

const DAY_LABELS = ['Ma', 'Di', 'Wo', 'Do', 'Vr']
const QUICK_HOURS = [4, 6, 7.5, 8]

export default function UrenPage() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [entries, setEntries] = useState<TimeEntryWithDetails[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [materialOpen, setMaterialOpen] = useState(false)

  // Form state (uren invoer)
  const [selEmployee, setSelEmployee] = useState('')
  const [selProject, setSelProject] = useState('')
  const [selDate, setSelDate] = useState(toDateStr(new Date()))
  const [hours, setHours] = useState('')
  const [description, setDescription] = useState('')

  // Material form
  const [matProject, setMatProject] = useState('')
  const [matDate, setMatDate] = useState(toDateStr(new Date()))
  const [matDesc, setMatDesc] = useState('')
  const [matQty, setMatQty] = useState('1')
  const [matUnit, setMatUnit] = useState('stuk')
  const [matPriceEur, setMatPriceEur] = useState('')

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
      setProjects(projs.map((p: ProjectOption) => ({ id: p.id, name: p.name })))
    })
  }, [])

  useEffect(() => {
    setLoading(true)
    fetch(`/api/time-entries?week_start=${weekStart}&week_end=${weekEnd}`)
      .then((r) => r.json())
      .then(setEntries)
      .finally(() => setLoading(false))
  }, [weekStart, weekEnd])

  async function handleAddEntry() {
    setSaving(true)
    const res = await fetch('/api/time-entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employee_id: selEmployee,
        project_id: selProject,
        entry_date: selDate,
        hours: parseFloat(hours),
        description: description || null,
      }),
    })
    if (res.ok) {
      const entry = await res.json()
      setEntries((prev) => [entry, ...prev])
      setDialogOpen(false)
      setHours(''); setDescription('')
    }
    setSaving(false)
  }

  async function handleAddMaterial() {
    setSaving(true)
    const qty = parseFloat(matQty) || 1
    const priceCents = matPriceEur ? Math.round(parseFloat(matPriceEur) * 100) : null
    const res = await fetch('/api/material-entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: matProject,
        entry_date: matDate,
        description: matDesc,
        quantity: qty,
        unit: matUnit,
        unit_price_cents: priceCents,
      }),
    })
    if (res.ok) {
      setMaterialOpen(false)
      setMatDesc(''); setMatQty('1'); setMatUnit('stuk'); setMatPriceEur('')
    }
    setSaving(false)
  }

  async function handleApprove(entryId: string, status: 'goedgekeurd' | 'afgekeurd') {
    const res = await fetch(`/api/time-entries/${entryId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      setEntries((prev) => prev.map((e) => e.id === entryId ? { ...e, status } : e))
    }
  }

  // Build week grid data: employee → day → hours
  const gridData = useMemo(() => {
    const empMap = new Map<string, { name: string; days: Record<string, { hours: number; entries: TimeEntryWithDetails[] }> }>()

    for (const entry of entries) {
      const empId = entry.employee_id
      const empName = entry.employees?.name ?? '—'
      if (!empMap.has(empId)) {
        empMap.set(empId, { name: empName, days: {} })
      }
      const emp = empMap.get(empId)!
      const day = entry.entry_date
      if (!emp.days[day]) emp.days[day] = { hours: 0, entries: [] }
      emp.days[day].hours += entry.hours
      emp.days[day].entries.push(entry)
    }

    return empMap
  }, [entries])

  const weekTotal = entries.reduce((sum, e) => sum + e.hours, 0)

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Uren</h1>
          <p className="text-sm text-zinc-500 mt-1">Registreer en beheer werkuren</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={materialOpen} onOpenChange={setMaterialOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><Package className="h-4 w-4 mr-2" />Materiaal</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Materiaal toevoegen</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Project *</Label>
                  <Select value={matProject} onValueChange={setMatProject}>
                    <SelectTrigger><SelectValue placeholder="Selecteer project..." /></SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Datum</Label>
                  <Input type="date" value={matDate} onChange={(e) => setMatDate(e.target.value)} />
                </div>
                <div>
                  <Label>Omschrijving *</Label>
                  <Input value={matDesc} onChange={(e) => setMatDesc(e.target.value)} placeholder="Grind 2-8mm" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Aantal</Label>
                    <Input type="number" value={matQty} onChange={(e) => setMatQty(e.target.value)} />
                  </div>
                  <div>
                    <Label>Eenheid</Label>
                    <Select value={matUnit} onValueChange={setMatUnit}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['stuk', 'm2', 'm3', 'liter', 'kg', 'uur'].map((u) => (
                          <SelectItem key={u} value={u}>{u}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Prijs/stuk (€)</Label>
                    <Input type="number" step="0.01" value={matPriceEur} onChange={(e) => setMatPriceEur(e.target.value)} placeholder="12.50" />
                  </div>
                </div>
                <Button onClick={handleAddMaterial} disabled={!matProject || !matDesc.trim() || saving} className="w-full">
                  {saving ? 'Opslaan...' : 'Toevoegen'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Uren invoeren</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Uren invoeren</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Medewerker *</Label>
                  <Select value={selEmployee} onValueChange={setSelEmployee}>
                    <SelectTrigger><SelectValue placeholder="Selecteer..." /></SelectTrigger>
                    <SelectContent>
                      {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Project *</Label>
                  <Select value={selProject} onValueChange={setSelProject}>
                    <SelectTrigger><SelectValue placeholder="Selecteer project..." /></SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Datum</Label>
                  <Input type="date" value={selDate} onChange={(e) => setSelDate(e.target.value)} />
                </div>
                <div>
                  <Label>Uren *</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="24"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    placeholder="8"
                    className="text-center text-lg"
                  />
                  <div className="flex gap-2 mt-2">
                    {QUICK_HOURS.map((h) => (
                      <Button
                        key={h}
                        variant={hours === String(h) ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1"
                        onClick={() => setHours(String(h))}
                      >
                        {h}u
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Notities</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Wat heb je gedaan?" rows={2} />
                </div>
                <Button
                  onClick={handleAddEntry}
                  disabled={!selEmployee || !selProject || !hours || saving}
                  className="w-full"
                >
                  {saving ? 'Opslaan...' : 'Opslaan'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
        <Button variant="outline" size="sm" onClick={() => setWeekOffset((w) => w + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-zinc-400">Laden...</div>
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="h-10 w-10 mx-auto text-zinc-300 mb-3" />
            <p className="text-zinc-500">Geen uren deze week. Begin met invoeren.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop: Week grid */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 w-[160px]">Medewerker</th>
                  {weekDates.map((d, i) => (
                    <th key={i} className="text-center py-2 px-2 min-w-[80px]">
                      <div>{DAY_LABELS[i]}</div>
                      <div className="text-xs text-zinc-400 font-normal">
                        {d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                      </div>
                    </th>
                  ))}
                  <th className="text-center py-2 px-2 w-[80px]">Totaal</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(gridData.entries()).map(([empId, emp]) => {
                  const empTotal = Object.values(emp.days).reduce((s, d) => s + d.hours, 0)
                  return (
                    <tr key={empId} className="border-b hover:bg-zinc-50">
                      <td className="py-2 pr-4 font-medium">{emp.name}</td>
                      {weekDates.map((d) => {
                        const dateStr = toDateStr(d)
                        const dayData = emp.days[dateStr]
                        return (
                          <td key={dateStr} className="text-center py-2 px-2">
                            {dayData ? (
                              <span className="font-medium">{dayData.hours}</span>
                            ) : (
                              <span className="text-zinc-300">—</span>
                            )}
                          </td>
                        )
                      })}
                      <td className="text-center py-2 px-2 font-bold">{empTotal}</td>
                    </tr>
                  )
                })}
                <tr className="border-t-2">
                  <td className="py-2 pr-4 font-bold">Totaal</td>
                  {weekDates.map((d) => {
                    const dateStr = toDateStr(d)
                    const dayTotal = entries
                      .filter((e) => e.entry_date === dateStr)
                      .reduce((s, e) => s + e.hours, 0)
                    return (
                      <td key={dateStr} className="text-center py-2 px-2 font-bold">
                        {dayTotal || '—'}
                      </td>
                    )
                  })}
                  <td className="text-center py-2 px-2 font-bold text-lg">{weekTotal}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mobile: Entry list */}
          <div className="md:hidden space-y-2">
            <div className="text-sm font-medium text-zinc-500 mb-2">Totaal: {weekTotal} uur</div>
            {entries.map((entry) => (
              <Card key={entry.id}>
                <CardContent className="flex items-center gap-3 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{entry.employees?.name ?? '—'}</span>
                      <Badge variant={entry.status === 'goedgekeurd' ? 'default' : 'secondary'} className="text-xs">
                        {entry.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-zinc-500">{entry.projects?.name ?? '—'}</div>
                    <div className="text-xs text-zinc-400">
                      {new Date(entry.entry_date).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold">{entry.hours}u</div>
                    {entry.status === 'ingevoerd' && (
                      <div className="flex gap-1 mt-1">
                        <button
                          onClick={() => handleApprove(entry.id, 'goedgekeurd')}
                          className="h-6 w-6 rounded bg-green-100 text-green-700 flex items-center justify-center hover:bg-green-200"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleApprove(entry.id, 'afgekeurd')}
                          className="h-6 w-6 rounded bg-red-100 text-red-700 flex items-center justify-center hover:bg-red-200"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop: Entries met goedkeuring */}
          <div className="hidden md:block space-y-2">
            <h2 className="text-sm font-medium text-zinc-500">Detail — per invoer</h2>
            {entries.filter((e) => e.status === 'ingevoerd').length > 0 && (
              <div className="space-y-2">
                {entries.filter((e) => e.status === 'ingevoerd').map((entry) => (
                  <Card key={entry.id}>
                    <CardContent className="flex items-center gap-4 py-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">{entry.employees?.name ?? '—'}</span>
                          <span className="text-zinc-400">→</span>
                          <span>{entry.projects?.name ?? '—'}</span>
                          <span className="text-zinc-400">
                            {new Date(entry.entry_date).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        {entry.description && <p className="text-sm text-zinc-500 mt-0.5">{entry.description}</p>}
                      </div>
                      <div className="font-medium shrink-0">{entry.hours}u</div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-green-700 hover:bg-green-50"
                          onClick={() => handleApprove(entry.id, 'goedgekeurd')}
                        >
                          <Check className="h-3 w-3 mr-1" />Goed
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-red-600 hover:bg-red-50"
                          onClick={() => handleApprove(entry.id, 'afgekeurd')}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
