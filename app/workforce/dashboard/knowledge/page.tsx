'use client'

import { useEffect, useState } from 'react'
import type { FwKnowledgeItem, KnowledgeCategory } from '@/lib/workforce/types'

const CATEGORIES: KnowledgeCategory[] = ['services', 'regions', 'pricing', 'faq', 'company_info']

const CAT_LABELS: Record<string, string> = {
  services: 'Diensten',
  regions: "Regio's",
  pricing: 'Prijzen',
  faq: 'FAQ',
  company_info: 'Bedrijfsinfo',
}

export default function WorkforceKnowledgePage() {
  const [items, setItems] = useState<FwKnowledgeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ category: 'services' as KnowledgeCategory, title: '', content: '' })

  async function fetchKnowledge() {
    const res = await fetch('/workforce/api/knowledge')
    if (res.ok) {
      const data = await res.json()
      setItems(data.items || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchKnowledge()
  }, [])

  async function addItem(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.content) return
    setAdding(true)

    await fetch('/workforce/api/knowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    setForm({ category: 'services', title: '', content: '' })
    setAdding(false)
    fetchKnowledge()
  }

  async function deleteItem(id: string) {
    await fetch(`/workforce/api/knowledge?id=${id}`, { method: 'DELETE' })
    fetchKnowledge()
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Knowledge Base</h1>
        <p className="text-sm text-neutral-400 mt-1">
          {items.length} items — dit is wat agents weten over het bedrijf
        </p>
      </div>

      {/* Add form */}
      <form onSubmit={addItem} className="border border-white/10 rounded-xl p-4 mb-6 space-y-3">
        <div className="flex gap-3">
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as KnowledgeCategory })}
            className="bg-neutral-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{CAT_LABELS[cat]}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Titel"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="flex-1 bg-neutral-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-500"
          />
        </div>
        <textarea
          placeholder="Inhoud — wat moet de agent weten?"
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          rows={3}
          className="w-full bg-neutral-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-500 resize-none"
        />
        <button
          type="submit"
          disabled={adding || !form.title || !form.content}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
        >
          {adding ? 'Opslaan...' : 'Toevoegen'}
        </button>
      </form>

      {/* Items per category */}
      {loading ? (
        <div className="text-neutral-400 text-sm">Laden...</div>
      ) : (
        <div className="space-y-6">
          {CATEGORIES.map((cat) => {
            const catItems = items.filter((i) => i.category === cat)
            if (catItems.length === 0) return null
            return (
              <div key={cat}>
                <h2 className="text-sm font-medium text-neutral-400 mb-2">{CAT_LABELS[cat]}</h2>
                <div className="space-y-2">
                  {catItems.map((item) => (
                    <div
                      key={item.id}
                      className="border border-white/10 rounded-lg px-4 py-3 flex justify-between items-start"
                    >
                      <div>
                        <p className="font-medium text-sm">{item.title}</p>
                        <p className="text-sm text-neutral-400 mt-1 whitespace-pre-wrap">{item.content}</p>
                      </div>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="text-neutral-600 hover:text-red-400 text-xs ml-4 shrink-0 transition-colors"
                      >
                        Verwijder
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
