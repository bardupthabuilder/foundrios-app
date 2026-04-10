'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Phone, Mail, MapPin, FolderOpen, FileText, Save } from 'lucide-react'

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

const projectStatusConfig: Record<string, { label: string; color: string }> = {
  gepland: { label: 'Gepland', color: 'bg-zinc-100 text-zinc-700' },
  actief: { label: 'Actief', color: 'bg-blue-100 text-blue-700' },
  opgeleverd: { label: 'Opgeleverd', color: 'bg-green-100 text-green-700' },
  gefactureerd: { label: 'Gefactureerd', color: 'bg-emerald-100 text-emerald-700' },
  planning: { label: 'Planning', color: 'bg-zinc-100 text-zinc-700' },
  active: { label: 'Actief', color: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Afgerond', color: 'bg-green-100 text-green-700' },
}

export default function ClientDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', contact_name: '', phone: '', email: '', address: '', city: '', notes: '',
  })

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

  const fmt = (cents: number) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100)

  if (loading) return <div className="p-6 pt-16 lg:pt-6 text-sm text-zinc-400">Laden...</div>
  if (!client) return <div className="p-6 pt-16 lg:pt-6 text-sm text-red-500">Klant niet gevonden</div>

  const displayName = client.company_name || client.name || '—'
  const projects = client.projects || []

  return (
    <div className="p-4 lg:p-6 pt-16 lg:pt-6 max-w-4xl">
      <button onClick={() => router.push('/dashboard/klanten')} className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700">
        <ArrowLeft className="h-4 w-4" /> Terug naar klanten
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 text-lg font-bold">
            {displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">{displayName}</h1>
            {client.contact_name && <p className="text-sm text-zinc-500">{client.contact_name}</p>}
          </div>
        </div>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="rounded-lg border px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50">
            Bewerken
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="rounded-lg border px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50">
              Annuleren
            </button>
            <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50">
              <Save className="h-4 w-4" /> {saving ? 'Opslaan...' : 'Opslaan'}
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Contact info */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-lg border p-4 space-y-3">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Contact</h2>
            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-zinc-500">Bedrijfsnaam</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-zinc-500">Contactpersoon</label>
                  <input value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-zinc-500">Telefoon</label>
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-zinc-500">E-mail</label>
                  <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-zinc-500">Adres</label>
                  <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-zinc-500">Plaats</label>
                  <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-zinc-500">Notities</label>
                  <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" rows={3} />
                </div>
              </div>
            ) : (
              <>
                {client.phone && (
                  <a href={`tel:${client.phone}`} className="flex items-center gap-2 text-sm text-zinc-700 hover:text-zinc-900">
                    <Phone className="h-4 w-4 text-zinc-400" /> {client.phone}
                  </a>
                )}
                {client.email && (
                  <a href={`mailto:${client.email}`} className="flex items-center gap-2 text-sm text-zinc-700 hover:text-zinc-900">
                    <Mail className="h-4 w-4 text-zinc-400" /> {client.email}
                  </a>
                )}
                {(client.address || client.city) && (
                  <div className="flex items-center gap-2 text-sm text-zinc-700">
                    <MapPin className="h-4 w-4 text-zinc-400" />
                    {[client.address, client.city].filter(Boolean).join(', ')}
                  </div>
                )}
                {client.notes && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-zinc-500 mb-1">Notities</p>
                    <p className="text-sm text-zinc-700 whitespace-pre-wrap">{client.notes}</p>
                  </div>
                )}
                {!client.phone && !client.email && !client.address && !client.notes && (
                  <p className="text-sm text-zinc-400">Geen contactgegevens. Klik op Bewerken om toe te voegen.</p>
                )}
              </>
            )}
          </div>

          {/* Quick actions */}
          <div className="rounded-lg border p-4 space-y-2">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Acties</h2>
            {client.phone && (
              <a href={`tel:${client.phone}`} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-zinc-50 transition-colors">
                <Phone className="h-4 w-4 text-zinc-400" /> Bellen
              </a>
            )}
            {client.phone && (
              <a href={`https://wa.me/${client.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-zinc-50 transition-colors">
                💬 WhatsApp
              </a>
            )}
            <button onClick={() => router.push('/dashboard/offertes')} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-zinc-50 transition-colors text-left">
              <FileText className="h-4 w-4 text-zinc-400" /> Nieuwe offerte
            </button>
          </div>
        </div>

        {/* Projecten */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-zinc-400" />
                Projecten ({projects.length})
              </h2>
            </div>

            {projects.length === 0 ? (
              <p className="text-sm text-zinc-400 py-4 text-center">Nog geen projecten voor deze klant.</p>
            ) : (
              <div className="space-y-2">
                {projects.map((project: Project) => {
                  const sc = projectStatusConfig[project.status] || { label: project.status, color: 'bg-zinc-100 text-zinc-700' }
                  return (
                    <div
                      key={project.id}
                      onClick={() => router.push(`/dashboard/projecten/${project.id}`)}
                      className="flex items-center justify-between rounded-lg border p-3 cursor-pointer hover:bg-zinc-50 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-zinc-900">{project.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${sc.color}`}>{sc.label}</span>
                          {project.city && <span className="text-xs text-zinc-400">{project.city}</span>}
                        </div>
                      </div>
                      {project.budget && (
                        <span className="text-sm font-medium text-zinc-600">{fmt(project.budget)}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
