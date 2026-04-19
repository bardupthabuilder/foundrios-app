'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Loader2 } from 'lucide-react'

const TYPES = [
  { value: 'offerte', label: 'Offerte', color: 'bg-foundri-yellow/20 text-foundri-yellow' },
  { value: 'werkbon', label: 'Werkbon', color: 'bg-blue-500/20 text-blue-400' },
  { value: 'email', label: 'E-mail', color: 'bg-green-500/20 text-green-400' },
  { value: 'campagne', label: 'Campagne', color: 'bg-purple-500/20 text-purple-400' },
  { value: 'sop', label: 'SOP', color: 'bg-orange-500/20 text-orange-400' },
]

type Template = { id: string; name: string; type: string; content: any; description: string; is_default: boolean; status: string }

export default function TemplatesAdmin() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('alle')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', type: 'offerte', content: '{}', description: '', is_default: false, status: 'published' })

  useEffect(() => { fetchTemplates() }, [])

  async function fetchTemplates() {
    const res = await fetch('/api/admin/templates')
    if (res.ok) { const d = await res.json(); setTemplates(d.templates || []) }
    setLoading(false)
  }

  async function handleSave() {
    let content: any
    try { content = JSON.parse(form.content) } catch { content = { text: form.content } }

    const url = editId ? `/api/admin/templates/${editId}` : '/api/admin/templates'
    const method = editId ? 'PATCH' : 'POST'
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, content }) })
    setForm({ name: '', type: 'offerte', content: '{}', description: '', is_default: false, status: 'published' })
    setShowForm(false); setEditId(null); fetchTemplates()
  }

  async function handleDelete(id: string) {
    if (!confirm('Template verwijderen?')) return
    await fetch(`/api/admin/templates/${id}`, { method: 'DELETE' })
    fetchTemplates()
  }

  function startEdit(t: Template) {
    setForm({ name: t.name, type: t.type, content: JSON.stringify(t.content, null, 2), description: t.description || '', is_default: t.is_default, status: t.status })
    setEditId(t.id); setShowForm(true)
  }

  const filtered = filter === 'alle' ? templates : templates.filter(t => t.type === filter)

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="h-6 w-6 animate-spin text-zinc-400" /></div>

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-white">Templates</h1>
          <p className="text-sm text-zinc-400">{templates.length} templates</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ name: '', type: 'offerte', content: '{}', description: '', is_default: false, status: 'published' }) }}
          className="flex items-center gap-2 rounded-lg bg-foundri-yellow px-4 py-2 text-sm font-semibold text-foundri-graphite">
          <Plus className="h-4 w-4" />{showForm ? 'Annuleren' : 'Nieuwe template'}
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-lg bg-foundri-card p-1">
        {[{ value: 'alle', label: 'Alle' }, ...TYPES].map(t => (
          <button key={t.value} onClick={() => setFilter(t.value)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${filter === t.value ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="rounded-lg border border-white/10 bg-foundri-deep p-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <input placeholder="Template naam" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="rounded-md border-0 bg-foundri-card px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-foundri-yellow/50 focus:outline-none" />
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
              className="rounded-md border-0 bg-foundri-card px-3 py-2.5 text-sm text-white">
              {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <textarea placeholder="Beschrijving" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
            className="w-full rounded-md border-0 bg-foundri-card px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-foundri-yellow/50 focus:outline-none" />
          <textarea placeholder='Content (JSON of tekst)' rows={8} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
            className="w-full rounded-md border-0 bg-foundri-card px-3 py-2.5 text-sm text-white font-mono placeholder:text-zinc-500 focus:ring-2 focus:ring-foundri-yellow/50 focus:outline-none" />
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-zinc-400">
              <input type="checkbox" checked={form.is_default} onChange={e => setForm({ ...form, is_default: e.target.checked })}
                className="rounded border-white/20 bg-foundri-card" />
              Standaard template
            </label>
            <button onClick={handleSave} className="rounded-lg bg-foundri-yellow px-4 py-2 text-sm font-semibold text-foundri-graphite">
              {editId ? 'Bijwerken' : 'Opslaan'}
            </button>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-white/5 bg-foundri-deep">
        {filtered.length === 0 && <p className="px-4 py-8 text-center text-sm text-zinc-500">Geen templates gevonden</p>}
        {filtered.map(t => {
          const typeInfo = TYPES.find(ty => ty.value === t.type)
          return (
            <div key={t.id} className="flex items-center justify-between border-b border-white/5 px-4 py-3 last:border-0">
              <div className="cursor-pointer flex-1" onClick={() => startEdit(t)}>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white">{t.name}</p>
                  {t.is_default && <span className="rounded-full bg-foundri-yellow/20 px-1.5 py-0.5 text-[9px] text-foundri-yellow">Standaard</span>}
                </div>
                <p className="text-xs text-zinc-500">{t.description || 'Geen beschrijving'}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] ${typeInfo?.color || 'bg-zinc-500/20 text-zinc-400'}`}>{typeInfo?.label}</span>
                <button onClick={() => handleDelete(t.id)} className="p-1 text-zinc-500 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
