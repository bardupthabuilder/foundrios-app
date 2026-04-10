'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { FolderOpen, Plus, MapPin, Calendar, Euro, Clock } from 'lucide-react'
import type { ProjectWithClient, Client, ProjectStatus, ProjectType } from '@/lib/types/project'

const STATUS_LABELS: Record<ProjectStatus, string> = {
  gepland: 'Gepland',
  actief: 'Actief',
  pauze: 'Pauze',
  opgeleverd: 'Opgeleverd',
  gefactureerd: 'Gefactureerd',
  gearchiveerd: 'Gearchiveerd',
}

const STATUS_COLORS: Record<ProjectStatus, string> = {
  gepland: 'bg-blue-100 text-blue-700',
  actief: 'bg-green-100 text-green-700',
  pauze: 'bg-yellow-100 text-yellow-700',
  opgeleverd: 'bg-purple-100 text-purple-700',
  gefactureerd: 'bg-zinc-100 text-zinc-700',
  gearchiveerd: 'bg-zinc-100 text-zinc-400',
}

const TYPE_LABELS: Record<ProjectType, string> = {
  vakwerk: 'Vakwerk',
  onderhoud: 'Onderhoud',
  advies: 'Advies',
  service: 'Service',
}

const FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'alle', label: 'Alle projecten' },
  { value: 'actief', label: 'Actief' },
  { value: 'gepland', label: 'Gepland' },
  { value: 'opgeleverd', label: 'Opgeleverd' },
  { value: 'gefactureerd', label: 'Gefactureerd' },
]

export default function ProjectenPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<ProjectWithClient[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('alle')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [clientId, setClientId] = useState<string>('')
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [projectType, setProjectType] = useState<ProjectType>('vakwerk')
  const [startDate, setStartDate] = useState('')
  const [budgetEur, setBudgetEur] = useState('')
  const [hourlyRateEur, setHourlyRateEur] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    const url = filter === 'alle' ? '/api/projects' : `/api/projects?status=${filter}`
    fetch(url)
      .then((r) => r.json())
      .then(setProjects)
      .finally(() => setLoading(false))
  }, [filter])

  useEffect(() => {
    fetch('/api/clients').then((r) => r.json()).then(setClients)
  }, [])

  function resetForm() {
    setName(''); setClientId(''); setDescription(''); setAddress(''); setCity('')
    setProjectType('vakwerk'); setStartDate(''); setBudgetEur(''); setHourlyRateEur(''); setNotes('')
  }

  async function handleAdd() {
    setSaving(true)
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        client_id: clientId || null,
        description: description || null,
        address: address || null,
        city: city || null,
        project_type: projectType,
        start_date: startDate || null,
        budget_cents: budgetEur ? Math.round(parseFloat(budgetEur) * 100) : null,
        hourly_rate_cents: hourlyRateEur ? Math.round(parseFloat(hourlyRateEur) * 100) : null,
        notes: notes || null,
      }),
    })
    if (res.ok) {
      const project = await res.json()
      setProjects((prev) => [project, ...prev])
      setDialogOpen(false)
      resetForm()
    }
    setSaving(false)
  }

  const formatCents = (cents: number | null) => {
    if (!cents) return null
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100)
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Projecten</h1>
          <p className="text-sm text-zinc-500 mt-1">Je opdrachten en werkzaamheden</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={(v) => { setLoading(true); setFilter(v) }}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {FILTER_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Nieuw project</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Nieuw project</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2 max-h-[70vh] overflow-y-auto">
                <div>
                  <Label>Projectnaam *</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tuinaanleg De Vries" />
                </div>
                <div>
                  <Label>Klant</Label>
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger><SelectValue placeholder="Selecteer klant..." /></SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Omschrijving</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Korte omschrijving van het project..." rows={2} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <Label>Projectadres</Label>
                    <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Dorpsstraat 12" />
                  </div>
                  <div>
                    <Label>Plaats</Label>
                    <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Amersfoort" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Type</Label>
                    <Select value={projectType} onValueChange={(v) => setProjectType(v as ProjectType)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(TYPE_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Startdatum</Label>
                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Budget (€)</Label>
                    <Input type="number" step="0.01" value={budgetEur} onChange={(e) => setBudgetEur(e.target.value)} placeholder="5000" />
                  </div>
                  <div>
                    <Label>Uurtarief (€)</Label>
                    <Input type="number" step="0.01" value={hourlyRateEur} onChange={(e) => setHourlyRateEur(e.target.value)} placeholder="55" />
                  </div>
                </div>
                <div>
                  <Label>Notities</Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Bijzonderheden..." rows={2} />
                </div>
                <Button onClick={handleAdd} disabled={!name.trim() || saving} className="w-full">
                  {saving ? 'Opslaan...' : 'Project aanmaken'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-zinc-400">Laden...</div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderOpen className="h-10 w-10 mx-auto text-zinc-300 mb-3" />
            <p className="text-zinc-500">Geen projecten gevonden. Maak je eerste project aan.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="cursor-pointer hover:bg-zinc-50 transition-colors"
              onClick={() => router.push(`/dashboard/projecten/${project.id}`)}
            >
              <CardContent className="flex items-start gap-4 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{project.name}</span>
                    <Badge variant="secondary" className={`text-xs ${STATUS_COLORS[project.status]}`}>
                      {STATUS_LABELS[project.status]}
                    </Badge>
                    {project.project_type && project.project_type !== 'vakwerk' && (
                      <Badge variant="outline" className="text-xs">{TYPE_LABELS[project.project_type]}</Badge>
                    )}
                  </div>
                  {project.clients && (
                    <div className="text-sm text-zinc-500 mt-0.5">{project.clients.name}</div>
                  )}
                  <div className="flex items-center gap-3 text-sm text-zinc-400 mt-1 flex-wrap">
                    {(project.address || project.city) && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {[project.address, project.city].filter(Boolean).join(', ')}
                      </span>
                    )}
                    {project.start_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(project.start_date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                    {project.budget_cents && (
                      <span className="flex items-center gap-1">
                        <Euro className="h-3 w-3" />
                        {formatCents(project.budget_cents)}
                      </span>
                    )}
                    {(() => {
                      const entries = (project as any).time_entries as { hours: number }[] | undefined
                      const totalHours = entries?.reduce((sum: number, e: { hours: number }) => sum + (e.hours ?? 0), 0) ?? 0
                      if (totalHours === 0) return null
                      const costCents = project.hourly_rate_cents ? totalHours * project.hourly_rate_cents : 0
                      const marginPct = project.budget_cents && costCents > 0 ? Math.round(((project.budget_cents - costCents) / project.budget_cents) * 100) : null
                      return (
                        <>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {totalHours}u geregistreerd
                          </span>
                          {marginPct !== null && (
                            <span className={`font-medium ${marginPct >= 30 ? 'text-green-600' : marginPct >= 10 ? 'text-orange-500' : 'text-red-500'}`}>
                              {marginPct}% marge
                            </span>
                          )}
                        </>
                      )
                    })()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
