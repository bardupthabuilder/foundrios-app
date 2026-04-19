'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react'

const CATEGORIES = [
  { value: 'starten', label: 'Aan de slag' },
  { value: 'leads', label: 'Leads & Acquisitie' },
  { value: 'offertes', label: 'Offertes & Facturen' },
  { value: 'projecten', label: 'Projecten & Uitvoering' },
  { value: 'planning', label: 'Planning & Uren' },
  { value: 'financieel', label: 'Financieel' },
  { value: 'tips', label: 'Tips & Tricks' },
]

type Article = { id: string; title: string; slug: string; content: string; category: string; sort_order: number; status: string; created_at: string }

function toSlug(t: string) { return t.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') }

export default function KennisbankAdmin() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', slug: '', content: '', category: 'starten', sort_order: 0, status: 'draft' as string })

  useEffect(() => { fetchArticles() }, [])

  async function fetchArticles() {
    const res = await fetch('/api/admin/knowledge')
    if (res.ok) { const d = await res.json(); setArticles(d.articles || []) }
    setLoading(false)
  }

  async function handleSave() {
    const url = editId ? `/api/admin/knowledge/${editId}` : '/api/admin/knowledge'
    const method = editId ? 'PATCH' : 'POST'
    const payload = { ...form, slug: form.slug || toSlug(form.title) }
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    setForm({ title: '', slug: '', content: '', category: 'starten', sort_order: 0, status: 'draft' })
    setShowForm(false); setEditId(null); fetchArticles()
  }

  async function handleDelete(id: string) {
    if (!confirm('Artikel verwijderen?')) return
    await fetch(`/api/admin/knowledge/${id}`, { method: 'DELETE' })
    fetchArticles()
  }

  async function togglePublish(a: Article) {
    await fetch(`/api/admin/knowledge/${a.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: a.status === 'published' ? 'draft' : 'published' }),
    })
    fetchArticles()
  }

  function startEdit(a: Article) {
    setForm({ title: a.title, slug: a.slug, content: a.content, category: a.category, sort_order: a.sort_order, status: a.status })
    setEditId(a.id); setShowForm(true)
  }

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="h-6 w-6 animate-spin text-zinc-400" /></div>

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-white">Kennisbank</h1>
          <p className="text-sm text-zinc-400">{articles.length} artikelen</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ title: '', slug: '', content: '', category: 'starten', sort_order: 0, status: 'draft' }) }}
          className="flex items-center gap-2 rounded-lg bg-foundri-yellow px-4 py-2 text-sm font-semibold text-foundri-graphite">
          <Plus className="h-4 w-4" />{showForm ? 'Annuleren' : 'Nieuw artikel'}
        </button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-white/10 bg-foundri-deep p-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <input placeholder="Titel" value={form.title} onChange={e => setForm({ ...form, title: e.target.value, slug: form.slug || toSlug(e.target.value) })}
              className="rounded-md border-0 bg-foundri-card px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-foundri-yellow/50 focus:outline-none" />
            <input placeholder="slug" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })}
              className="rounded-md border-0 bg-foundri-card px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-foundri-yellow/50 focus:outline-none" />
          </div>
          <textarea placeholder="Content (HTML)" rows={10} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
            className="w-full rounded-md border-0 bg-foundri-card px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-foundri-yellow/50 focus:outline-none" />
          <div className="grid gap-4 sm:grid-cols-3">
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              className="rounded-md border-0 bg-foundri-card px-3 py-2.5 text-sm text-white">
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <input type="number" placeholder="Sorteervolgorde" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
              className="rounded-md border-0 bg-foundri-card px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-foundri-yellow/50 focus:outline-none" />
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
              className="rounded-md border-0 bg-foundri-card px-3 py-2.5 text-sm text-white">
              <option value="draft">Concept</option>
              <option value="published">Gepubliceerd</option>
            </select>
          </div>
          <button onClick={handleSave} className="rounded-lg bg-foundri-yellow px-4 py-2 text-sm font-semibold text-foundri-graphite">
            {editId ? 'Bijwerken' : 'Opslaan'}
          </button>
        </div>
      )}

      <div className="rounded-lg border border-white/5 bg-foundri-deep">
        {articles.length === 0 && <p className="px-4 py-8 text-center text-sm text-zinc-500">Nog geen artikelen</p>}
        {articles.map(a => (
          <div key={a.id} className="flex items-center justify-between border-b border-white/5 px-4 py-3 last:border-0">
            <div className="cursor-pointer flex-1" onClick={() => startEdit(a)}>
              <p className="text-sm font-medium text-white">{a.title}</p>
              <p className="text-xs text-zinc-500">{CATEGORIES.find(c => c.value === a.category)?.label} · /{a.slug}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-[10px] ${a.status === 'published' ? 'bg-green-500/20 text-green-400' : 'bg-zinc-500/20 text-zinc-400'}`}>
                {a.status === 'published' ? 'Live' : 'Concept'}
              </span>
              <button onClick={() => togglePublish(a)} className="p-1 text-zinc-500 hover:text-white">
                {a.status === 'published' ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
              <button onClick={() => handleDelete(a.id)} className="p-1 text-zinc-500 hover:text-red-400">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
