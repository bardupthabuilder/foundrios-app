'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import {
  Clock, ChevronLeft, ChevronRight, Check, X, Plus,
  Package, Play, Square, Timer, AlertTriangle,
} from 'lucide-react'
import type { Employee, TimeEntryWithDetails } from '@/lib/types/project'
import { calculateBurn } from '@/lib/project-burn'

// De projectlijst levert uren en materiaal mee, zodat we hier kunnen laten zien
// welke klussen uitlopen. Precies daar lekt de marge weg.
interface ProjectOption {
  id: string
  name: string
  budget_cents?: number | null
  hourly_rate_cents?: number | null
  time_entries?: { hours: number | null; employees?: { hourly_cost_cents: number | null } | null }[]
  material_entries?: { total_cents: number | null }[]
}

const TIMER_KEY = 'foundrios_timer'

interface TimerData {
  startTime: number
  projectId: string
  projectName: string
  employeeId: string
  employeeName: string
}

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

function fmtElapsed(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const DAY_LABELS = ['Ma', 'Di', 'Wo', 'Do', 'Vr']
const QUICK_HOURS = [4, 6, 7.5, 8]
const UNITS = ['stuk', 'm²', 'm³', 'liter', 'kg', 'uur']

export default function UrenPage() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [entries, setEntries] = useState<TimeEntryWithDetails[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [loading, setLoading] = useState(true)
  const [sheet, setSheet] = useState<'uren' | 'materiaal' | null>(null)
  const [saving, setSaving] = useState(false)

  // Uren form
  const [selEmployee, setSelEmployee] = useState('')
  const [selProject, setSelProject] = useState('')
  const [selDate, setSelDate] = useState(toDateStr(new Date()))
  const [hours, setHours] = useState('')
  const [description, setDescription] = useState('')

  // Materiaal form
  const [matProject, setMatProject] = useState('')
  const [matDate, setMatDate] = useState(toDateStr(new Date()))
  const [matDesc, setMatDesc] = useState('')
  const [matQty, setMatQty] = useState('1')
  const [matUnit, setMatUnit] = useState('stuk')
  const [matPrice, setMatPrice] = useState('')

  // Timer
  const [timer, setTimer] = useState<TimerData | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [timerEmployee, setTimerEmployee] = useState('')
  const [timerProject, setTimerProject] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset])
  const weekStart = toDateStr(weekDates[0])
  const weekEnd = toDateStr(weekDates[4])
  const weekNum = getWeekNumber(weekDates[0])
  const year = weekDates[0].getFullYear()

  useEffect(() => {
    Promise.all([
      fetch('/api/employees').then((r) => r.json()),
      fetch('/api/projects?status=open').then((r) => r.json()),
    ]).then(([emps, projs]) => {
      const empList = Array.isArray(emps) ? emps : []
      const projList = Array.isArray(projs) ? projs : []
      setEmployees(empList)
      setProjects(projList)
      if (empList[0]) { setSelEmployee(empList[0].id); setTimerEmployee(empList[0].id) }
      if (projList[0]) { setTimerProject(projList[0].id) }
    })
  }, [])

  useEffect(() => {
    setLoading(true)
    fetch(`/api/time-entries?week_start=${weekStart}&week_end=${weekEnd}`)
      .then((r) => r.json())
      .then((d) => setEntries(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false))
  }, [weekStart, weekEnd])

  // Restore timer from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(TIMER_KEY)
      if (stored) {
        const data: TimerData = JSON.parse(stored)
        setTimer(data)
        setElapsed(Math.floor((Date.now() - data.startTime) / 1000))
      }
    } catch {}
  }, [])

  // Timer tick
  useEffect(() => {
    if (timer) {
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - timer.startTime) / 1000))
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [timer])

  function startTimer() {
    const emp = employees.find(e => e.id === timerEmployee)
    const proj = projects.find(p => p.id === timerProject)
    if (!timerEmployee || !timerProject || !emp || !proj) return
    const data: TimerData = {
      startTime: Date.now(),
      projectId: timerProject,
      projectName: proj.name,
      employeeId: timerEmployee,
      employeeName: emp.name,
    }
    localStorage.setItem(TIMER_KEY, JSON.stringify(data))
    setTimer(data)
    setElapsed(0)
  }

  function stopTimer() {
    if (!timer) return
    const totalHours = Math.round((elapsed / 3600) * 4) / 4 // round to 0.25h
    localStorage.removeItem(TIMER_KEY)
    setTimer(null)
    setElapsed(0)
    // Pre-fill uren form
    setSelEmployee(timer.employeeId)
    setSelProject(timer.projectId)
    setSelDate(toDateStr(new Date()))
    setHours(String(Math.max(0.25, totalHours)))
    setDescription('')
    setSheet('uren')
  }

  async function addEntry(e: React.FormEvent) {
    e.preventDefault()
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
      setSheet(null)
      setHours(''); setDescription('')
    }
    setSaving(false)
  }

  async function addMaterial(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/material-entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: matProject,
        entry_date: matDate,
        description: matDesc,
        quantity: parseFloat(matQty) || 1,
        unit: matUnit,
        unit_price_cents: matPrice ? Math.round(parseFloat(matPrice) * 100) : null,
      }),
    })
    if (res.ok) {
      setSheet(null)
      setMatDesc(''); setMatQty('1'); setMatUnit('stuk'); setMatPrice('')
    }
    setSaving(false)
  }

  async function handleApprove(entryId: string, status: 'goedgekeurd' | 'afgekeurd') {
    await fetch(`/api/time-entries/${entryId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setEntries((prev) => prev.map((e) => e.id === entryId ? { ...e, status } : e))
  }

  const pendingEntries = entries.filter((e) => e.status === 'ingevoerd')

  async function approveAll() {
    for (const entry of pendingEntries) {
      await fetch(`/api/time-entries/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'goedgekeurd' }),
      })
    }
    setEntries((prev) => prev.map((e) => e.status === 'ingevoerd' ? { ...e, status: 'goedgekeurd' } : e))
  }

  const gridData = useMemo(() => {
    const map = new Map<string, { name: string; days: Record<string, { hours: number; entries: TimeEntryWithDetails[] }> }>()
    for (const entry of entries) {
      const empId = entry.employee_id
      if (!map.has(empId)) map.set(empId, { name: entry.employees?.name ?? '—', days: {} })
      const emp = map.get(empId)!
      const day = entry.entry_date
      if (!emp.days[day]) emp.days[day] = { hours: 0, entries: [] }
      emp.days[day].hours += entry.hours
      emp.days[day].entries.push(entry)
    }
    return map
  }, [entries])

  const weekTotal = entries.reduce((sum, e) => sum + e.hours, 0)

  const overrunProjects = projects
    .map((p) => ({ project: p, burn: calculateBurn(p) }))
    .filter(({ burn }) => burn.status !== 'ok')

  return (
    <div className="p-4 lg:p-6 max-w-6xl pb-24 lg:pb-6">
      {/* Uren registreren zonder te zien dat een klus uitloopt is precies hoe je
          erachter komt als het te laat is. */}
      {overrunProjects.length > 0 && (
        <div className="mb-5 rounded-xl border border-orange-500/25 bg-orange-500/5 p-4">
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-400" />
            <p className="text-sm font-semibold text-orange-300">
              {overrunProjects.length === 1 ? 'Eén klus loopt uit' : `${overrunProjects.length} klussen lopen uit`}
            </p>
          </div>
          <ul className="space-y-1">
            {overrunProjects.map(({ project, burn }) => (
              <li key={project.id} className="flex items-center justify-between text-xs">
                <span className="truncate text-zinc-300">{project.name}</span>
                <span className={burn.status === 'over' ? 'font-medium text-red-400' : 'text-orange-400'}>
                  {Math.round(burn.ratio! * 100)}% van budget
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Timer widget ── */}
      {timer ? (
        <div className="mb-5 rounded-xl bg-blue-500/8 border border-blue-500/20 p-4 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <Timer className="h-4 w-4 text-blue-400 animate-pulse" />
              <span className="text-xs text-blue-400 font-medium">Timer loopt</span>
            </div>
            <p className="text-sm text-zinc-300 truncate">
              {timer.employeeName} · {timer.projectName}
            </p>
          </div>
          <div className="font-mono text-2xl font-bold text-white tabular-nums">
            {fmtElapsed(elapsed)}
          </div>
          <button
            onClick={stopTimer}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 active:scale-[0.98] transition-all shrink-0"
          >
            <Square className="h-4 w-4" /> Stop
          </button>
        </div>
      ) : (
        <div className="mb-5 rounded-xl bg-foundri-card border border-white/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Timer className="h-4 w-4 text-zinc-400" />
            <span className="text-xs font-medium text-zinc-400">Urentimer</span>
          </div>
          <div className="flex gap-2">
            <select
              value={timerEmployee}
              onChange={e => setTimerEmployee(e.target.value)}
              className="flex-1 min-w-0 rounded-lg border border-white/8 bg-foundri-deep px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
            >
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <select
              value={timerProject}
              onChange={e => setTimerProject(e.target.value)}
              className="flex-1 min-w-0 rounded-lg border border-white/8 bg-foundri-deep px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
            >
              <option value="">Project...</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button
              onClick={startTimer}
              disabled={!timerEmployee || !timerProject}
              className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 active:scale-[0.98] transition-all disabled:opacity-40 shrink-0"
            >
              <Play className="h-4 w-4" />
              <span className="hidden sm:inline">Start</span>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-white lg:text-2xl">Uren</h1>
          <p className="text-sm text-zinc-400">{weekTotal} uur deze week</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSheet('materiaal')}
            className="hidden lg:inline-flex items-center gap-2 rounded-lg bg-foundri-card px-3 py-2.5 text-sm font-medium text-zinc-300 hover:bg-foundri-hover transition-colors"
          >
            <Package className="h-4 w-4" /> Materiaal
          </button>
          <button
            onClick={() => setSheet('uren')}
            className="hidden lg:inline-flex items-center gap-2 rounded-lg bg-foundri-card px-4 py-2.5 text-sm font-medium text-white hover:bg-foundri-hover transition-colors"
          >
            <Plus className="h-4 w-4" /> Uren invoeren
          </button>
        </div>
      </div>

      {/* Week nav */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => setWeekOffset(w => w - 1)}
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
              Nu
            </button>
          )}
          <button
            onClick={() => setWeekOffset(w => w + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-foundri-card hover:bg-foundri-hover transition-colors"
          >
            <ChevronRight className="h-4 w-4 text-zinc-300" />
          </button>
        </div>
      </div>

      {/* Goedkeuring banner */}
      {pendingEntries.length > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-xl bg-orange-500/8 border border-orange-500/20 px-4 py-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-400 shrink-0" />
            <span className="text-sm font-medium text-orange-300">
              {pendingEntries.length} {pendingEntries.length === 1 ? 'urenstaat wacht' : 'urenstaten wachten'} op goedkeuring
            </span>
          </div>
          <button
            onClick={approveAll}
            className="rounded-lg bg-orange-500/15 px-3 py-1.5 text-xs font-medium text-orange-300 hover:bg-orange-500/25 transition-colors"
          >
            Alles goedkeuren
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl bg-foundri-card animate-pulse" />)}
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl bg-foundri-card border border-white/5">
          <Clock className="h-10 w-10 text-zinc-600 mb-3" />
          <p className="text-sm font-medium text-zinc-300">Geen uren deze week</p>
          <p className="text-xs text-zinc-500 mt-1">Start de timer of voer uren handmatig in.</p>
        </div>
      ) : (
        <>
          {/* Desktop week grid */}
          <div className="hidden md:block rounded-xl bg-foundri-card border border-white/5 overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 w-40">Medewerker</th>
                  {weekDates.map((d, i) => (
                    <th key={i} className="text-center px-3 py-3 text-xs font-medium text-zinc-400 min-w-[72px]">
                      <div>{DAY_LABELS[i]}</div>
                      <div className="font-normal text-zinc-500">
                        {d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                      </div>
                    </th>
                  ))}
                  <th className="text-center px-3 py-3 text-xs font-medium text-zinc-400 w-20">Totaal</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(gridData.entries()).map(([empId, emp]) => {
                  const empTotal = Object.values(emp.days).reduce((s, d) => s + d.hours, 0)
                  return (
                    <tr key={empId} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                      <td className="px-4 py-3 text-sm font-medium text-white">{emp.name}</td>
                      {weekDates.map((d) => {
                        const dateStr = toDateStr(d)
                        const dayData = emp.days[dateStr]
                        return (
                          <td key={dateStr} className="text-center px-3 py-3">
                            {dayData ? (
                              <span className="text-sm font-semibold text-white">{dayData.hours}</span>
                            ) : (
                              <span className="text-zinc-600">—</span>
                            )}
                          </td>
                        )
                      })}
                      <td className="text-center px-3 py-3 text-sm font-bold text-white">{empTotal}</td>
                    </tr>
                  )
                })}
                <tr className="border-t-2 border-white/10 bg-white/[0.02]">
                  <td className="px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wide">Totaal</td>
                  {weekDates.map((d) => {
                    const dateStr = toDateStr(d)
                    const dayTotal = entries.filter((e) => e.entry_date === dateStr).reduce((s, e) => s + e.hours, 0)
                    return (
                      <td key={dateStr} className="text-center px-3 py-3 text-sm font-bold text-white">
                        {dayTotal || <span className="text-zinc-600">—</span>}
                      </td>
                    )
                  })}
                  <td className="text-center px-3 py-3 text-base font-bold text-foundri-yellow">{weekTotal}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pending goedkeuring list (desktop) */}
          {pendingEntries.length > 0 && (
            <div className="hidden md:block space-y-1.5 mb-4">
              <p className="text-xs font-medium text-zinc-400 mb-2">Te goedkeuren</p>
              {pendingEntries.map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 rounded-xl bg-foundri-card border border-white/5 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-white">{entry.employees?.name ?? '—'}</span>
                      <span className="text-zinc-500">→</span>
                      <span className="text-zinc-300">{entry.projects?.name ?? '—'}</span>
                      <span className="text-zinc-500">
                        {new Date(entry.entry_date).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    {entry.description && <p className="text-xs text-zinc-500 mt-0.5">{entry.description}</p>}
                  </div>
                  <span className="text-sm font-semibold text-white shrink-0">{entry.hours}u</span>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => handleApprove(entry.id, 'goedgekeurd')}
                      className="h-8 px-3 rounded-lg bg-green-500/10 text-green-400 text-xs font-medium hover:bg-green-500/20 flex items-center gap-1 transition-colors"
                    >
                      <Check className="h-3.5 w-3.5" /> Goed
                    </button>
                    <button
                      onClick={() => handleApprove(entry.id, 'afgekeurd')}
                      className="h-8 w-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Mobile entry list */}
          <div className="md:hidden space-y-1.5">
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-center gap-3 rounded-xl bg-foundri-card border border-white/5 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-white">{entry.employees?.name ?? '—'}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      entry.status === 'goedgekeurd'
                        ? 'bg-green-500/10 text-green-400'
                        : entry.status === 'afgekeurd'
                        ? 'bg-red-500/10 text-red-400'
                        : 'bg-orange-500/10 text-orange-400'
                    }`}>
                      {entry.status === 'goedgekeurd' ? 'Goed' : entry.status === 'afgekeurd' ? 'Afgek.' : 'Wacht'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 truncate">{entry.projects?.name ?? '—'}</p>
                  <p className="text-xs text-zinc-500">
                    {new Date(entry.entry_date).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-white">{entry.hours}u</div>
                  {entry.status === 'ingevoerd' && (
                    <div className="flex gap-1 mt-1 justify-end">
                      <button
                        onClick={() => handleApprove(entry.id, 'goedgekeurd')}
                        className="h-7 w-7 rounded-lg bg-green-500/10 text-green-400 flex items-center justify-center hover:bg-green-500/20 transition-colors"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleApprove(entry.id, 'afgekeurd')}
                        className="h-7 w-7 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Mobile FAB */}
      <button
        onClick={() => setSheet('uren')}
        className="fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-foundri-yellow text-black shadow-xl active:scale-95 transition-transform lg:hidden"
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>

      {/* Bottom sheets */}
      {sheet && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-black/60"
          onClick={() => setSheet(null)}
        >
          <div
            className="w-full sm:max-w-md rounded-t-2xl sm:rounded-xl bg-foundri-deep border-t border-white/5 sm:border sm:border-white/8 p-5 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-white/15 mx-auto mb-4 sm:hidden" />

            {/* Uren invoeren */}
            {sheet === 'uren' && (
              <form onSubmit={addEntry} className="space-y-4">
                <h2 className="text-base font-semibold text-white">Uren invoeren</h2>
                <div>
                  <label className="text-xs font-medium text-zinc-400">Medewerker</label>
                  <select
                    value={selEmployee}
                    onChange={e => setSelEmployee(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-white/8 bg-foundri-card px-3 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                  >
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-400">Project *</label>
                  <select
                    required
                    value={selProject}
                    onChange={e => setSelProject(e.target.value)}
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
                    value={selDate}
                    onChange={e => setSelDate(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-white/8 bg-foundri-card px-3 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-400">Uren *</label>
                  <input
                    required
                    type="number"
                    step="0.25"
                    min="0.25"
                    max="24"
                    inputMode="decimal"
                    value={hours}
                    onChange={e => setHours(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-white/8 bg-foundri-card px-3 py-3 text-sm text-white text-center text-lg font-semibold focus:outline-none focus:ring-1 focus:ring-white/20"
                    placeholder="8"
                  />
                  <div className="flex gap-2 mt-2">
                    {QUICK_HOURS.map(h => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setHours(String(h))}
                        className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                          hours === String(h)
                            ? 'bg-foundri-yellow text-black'
                            : 'bg-foundri-card text-zinc-300 hover:bg-foundri-hover'
                        }`}
                      >
                        {h}u
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-400">Notities</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Wat heb je gedaan?"
                    className="mt-1.5 w-full rounded-lg border border-white/8 bg-foundri-card px-3 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-white/20"
                    rows={2}
                  />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setSheet(null)} className="flex-1 rounded-lg py-3 text-sm font-medium text-zinc-300 bg-foundri-card hover:bg-foundri-hover transition-colors">
                    Annuleren
                  </button>
                  <button type="submit" disabled={!selProject || !hours || saving} className="flex-1 rounded-lg bg-foundri-yellow py-3 text-sm font-medium text-black disabled:opacity-50">
                    {saving ? 'Opslaan...' : 'Opslaan'}
                  </button>
                </div>
              </form>
            )}

            {/* Materiaal toevoegen */}
            {sheet === 'materiaal' && (
              <form onSubmit={addMaterial} className="space-y-3">
                <h2 className="text-base font-semibold text-white">Materiaal toevoegen</h2>
                <div>
                  <label className="text-xs font-medium text-zinc-400">Project *</label>
                  <select
                    required
                    value={matProject}
                    onChange={e => setMatProject(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-white/8 bg-foundri-card px-3 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                  >
                    <option value="">Selecteer project...</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-400">Datum</label>
                  <input type="date" value={matDate} onChange={e => setMatDate(e.target.value)} className="mt-1.5 w-full rounded-lg border border-white/8 bg-foundri-card px-3 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20" />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-400">Omschrijving *</label>
                  <input required value={matDesc} onChange={e => setMatDesc(e.target.value)} placeholder="Grind 2-8mm" className="mt-1.5 w-full rounded-lg border border-white/8 bg-foundri-card px-3 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-white/20" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-zinc-400">Aantal</label>
                    <input type="number" inputMode="decimal" value={matQty} onChange={e => setMatQty(e.target.value)} className="mt-1.5 w-full rounded-lg border border-white/8 bg-foundri-card px-3 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-400">Eenheid</label>
                    <select value={matUnit} onChange={e => setMatUnit(e.target.value)} className="mt-1.5 w-full rounded-lg border border-white/8 bg-foundri-card px-3 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20">
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-400">€/stuk</label>
                    <input type="number" step="0.01" inputMode="decimal" value={matPrice} onChange={e => setMatPrice(e.target.value)} placeholder="0.00" className="mt-1.5 w-full rounded-lg border border-white/8 bg-foundri-card px-3 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-white/20" />
                  </div>
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setSheet(null)} className="flex-1 rounded-lg py-3 text-sm font-medium text-zinc-300 bg-foundri-card hover:bg-foundri-hover transition-colors">
                    Annuleren
                  </button>
                  <button type="submit" disabled={!matProject || !matDesc.trim() || saving} className="flex-1 rounded-lg bg-foundri-yellow py-3 text-sm font-medium text-black disabled:opacity-50">
                    {saving ? 'Opslaan...' : 'Toevoegen'}
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
