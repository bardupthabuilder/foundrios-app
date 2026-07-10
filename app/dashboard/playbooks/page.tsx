'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { BookOpenCheck, ChevronRight, Search } from 'lucide-react'

type Playbook = {
  id: string
  tenant_id: string | null
  category_slug: string
  subcategory: string | null
  slug: string
  title: string
  purpose: string | null
  min_tier: 'free' | 'pro' | 'scale'
  status: string
  updated_at: string
}

const CATEGORY_LABELS: Record<string, string> = {
  'aanvragen': 'Aanvragen',
  'opvolging': 'Opvolging',
  'kwalificatie': 'Kwalificatie',
  'planning': 'Planning',
  'offertes': 'Offertes',
  'onderhoudscontracten': 'Onderhoudscontracten',
  'content': 'Content',
  'meta-ads': 'Meta Ads',
  'growzy-setup': 'Growzy Setup',
  'creatives': 'Creatives',
  'copy': 'Copy',
  'rapportage': 'Rapportage',
  'reviews': 'Reviews & Referrals',
  'klantcommunicatie': 'Klantcommunicatie',
  'projectdocumentatie': 'Projectdocumentatie',
  'sales': 'Sales',
  'retentie': 'Retentie',
  'partner': 'Partner & Leadverdeling',
  'outreach-hooks': 'Hooks',
  'outreach-angles': 'Outreach Angles',
  'outreach-signals': 'Marktsignalen',
  'sales-bezwaren': 'Sales Bezwaren',
  'content-topics': 'Content Topics',
  'delivery': 'Delivery',
  'governance': 'Governance',
}

export default function PlaybooksPage() {
  const [items, setItems] = useState<Playbook[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/playbooks')
      .then(r => (r.ok ? r.json() : []))
      .then(data => setItems(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    return items.filter(p => {
      if (activeCategory && p.category_slug !== activeCategory) return false
      if (!q) return true
      return (
        p.title.toLowerCase().includes(q) ||
        (p.purpose || '').toLowerCase().includes(q) ||
        (CATEGORY_LABELS[p.category_slug] || '').toLowerCase().includes(q)
      )
    })
  }, [items, filter, activeCategory])

  const grouped = useMemo(() => {
    return filtered.reduce<Record<string, Playbook[]>>((acc, p) => {
      if (!acc[p.category_slug]) acc[p.category_slug] = []
      acc[p.category_slug].push(p)
      return acc
    }, {})
  }, [filtered])

  const categories = useMemo(() => {
    const cats = Array.from(new Set(items.map(i => i.category_slug)))
    return cats.sort((a, b) => (CATEGORY_LABELS[a] || a).localeCompare(CATEGORY_LABELS[b] || b))
  }, [items])

  return (
    <div className="p-4 lg:p-6 pt-16 lg:pt-6 max-w-5xl">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <BookOpenCheck className="h-6 w-6 text-foundri-yellow" />
          <h1 className="text-2xl font-bold text-white">Playbooks</h1>
        </div>
        <p className="mt-1 text-sm text-zinc-400">
          Stappenplannen voor setup, onderhoud en groei. Stap voor stap, met prompts en checklists.
        </p>
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Zoek op titel of categorie..."
            className="w-full rounded-lg border border-white/10 bg-foundri-deep py-2 pl-9 pr-3 text-sm text-white placeholder:text-zinc-500 focus:border-foundri-yellow/40 focus:outline-none"
          />
        </div>
      </div>

      {categories.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveCategory(null)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              !activeCategory
                ? 'bg-foundri-yellow text-foundri-deep'
                : 'bg-white/5 text-zinc-400 hover:bg-white/10'
            }`}
          >
            Alles
          </button>
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                activeCategory === c
                  ? 'bg-foundri-yellow text-foundri-deep'
                  : 'bg-white/5 text-zinc-400 hover:bg-white/10'
              }`}
            >
              {CATEGORY_LABELS[c] || c}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-zinc-400">Laden...</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/10 p-8 text-center text-sm text-zinc-400">
          {items.length === 0
            ? 'Nog geen playbooks beschikbaar voor je account. Vraag je accountmanager om toegang.'
            : 'Geen playbooks gevonden voor deze filter.'}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, list]) => (
            <div key={cat}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {CATEGORY_LABELS[cat] || cat}
              </h2>
              <div className="space-y-1.5">
                {list.map(p => (
                  <Link
                    key={p.id}
                    href={`/dashboard/playbooks/${p.slug}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-foundri-deep px-4 py-3 transition hover:border-foundri-yellow/30"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-white">{p.title}</p>
                        {p.tenant_id === null && (
                          <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] uppercase text-white/40">
                            Standaard
                          </span>
                        )}
                      </div>
                      {p.purpose && (
                        <p className="mt-0.5 truncate text-xs text-zinc-400">{p.purpose}</p>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-zinc-500" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
