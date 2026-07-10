'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Rocket, ChevronRight, Lock, Megaphone, Workflow, Image as ImageIcon, FileText } from 'lucide-react'
import { useFeature } from '@/lib/hooks/useFeature'

type Playbook = {
  id: string
  category_slug: string
  slug: string
  title: string
  purpose: string | null
}

const GROWTH_CATEGORIES = [
  { slug: 'meta-ads', label: 'Meta Ads', description: 'Campagnes opzetten, optimaliseren, opschalen', icon: Megaphone },
  { slug: 'growzy-setup', label: 'Growzy & Automations', description: 'Lead-opvolging, WhatsApp, agenda-flow', icon: Workflow },
  { slug: 'creatives', label: 'Creatives', description: 'Beelden, video, voor/na content', icon: ImageIcon },
  { slug: 'copy', label: 'Copy', description: 'Advertentiecopy, captions, scripts', icon: FileText },
]

export default function GrowthUnlockPage() {
  const { allowed, loading, currentTier } = useFeature('growth_unlock')
  const [items, setItems] = useState<Playbook[]>([])
  const [loadingItems, setLoadingItems] = useState(true)

  useEffect(() => {
    if (!allowed) {
      setLoadingItems(false)
      return
    }
    fetch('/api/playbooks')
      .then(r => (r.ok ? r.json() : []))
      .then((data: Playbook[]) => {
        const filtered = data.filter(p =>
          GROWTH_CATEGORIES.some(c => c.slug === p.category_slug)
        )
        setItems(filtered)
      })
      .finally(() => setLoadingItems(false))
  }, [allowed])

  if (loading) {
    return (
      <div className="p-4 lg:p-6 pt-16 lg:pt-6">
        <p className="text-sm text-zinc-400">Laden...</p>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 pt-16 lg:pt-6 max-w-5xl">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Rocket className="h-6 w-6 text-foundri-yellow" />
          <h1 className="text-2xl font-bold text-white">Groei zelf doen</h1>
        </div>
        <p className="mt-1 text-sm text-zinc-400">
          De stappenplannen, prompts en templates waarmee wij hoveniersbedrijven aan voorspelbare aanvragen helpen. Zelf uitvoeren met je eigen tools.
        </p>
      </div>

      {!allowed ? (
        <div className="rounded-xl border border-foundri-yellow/30 bg-foundri-yellow/5 p-6">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 h-5 w-5 shrink-0 text-foundri-yellow" />
            <div className="flex-1">
              <h2 className="text-base font-semibold text-white">Scale vereist</h2>
              <p className="mt-1 text-sm text-zinc-300">
                Het Groei Systeem zit in Scale. Je gebruikt nu <span className="font-medium">{currentTier || 'Free'}</span>.
                Krijg toegang tot Meta Ads flows, Growzy automations, creatives en copy templates.
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Link
                  href="/dashboard/billing"
                  className="inline-flex items-center justify-center rounded-lg bg-foundri-yellow px-3 py-2 text-sm font-medium text-foundri-deep transition hover:brightness-110"
                >
                  Upgraden naar Scale
                </Link>
                <Link
                  href="/dashboard/managed/request"
                  className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-foundri-deep px-3 py-2 text-sm font-medium text-white transition hover:border-foundri-yellow/30"
                >
                  Laat Groeneveld Media het voor je doen
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-2">
            {GROWTH_CATEGORIES.map(cat => {
              const Icon = cat.icon
              const count = items.filter(p => p.category_slug === cat.slug).length
              return (
                <Link
                  key={cat.slug}
                  href={`/dashboard/playbooks?category=${cat.slug}`}
                  className="group flex items-start gap-3 rounded-xl border border-white/5 bg-foundri-deep p-4 transition hover:border-foundri-yellow/30"
                >
                  <div className="rounded-lg bg-foundri-yellow/10 p-2">
                    <Icon className="h-5 w-5 text-foundri-yellow" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-white">{cat.label}</h3>
                      <span className="text-xs text-zinc-500">{count} playbooks</span>
                    </div>
                    <p className="mt-0.5 text-xs text-zinc-400">{cat.description}</p>
                  </div>
                </Link>
              )
            })}
          </div>

          <div>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Alle groei-playbooks</h2>
            {loadingItems ? (
              <p className="text-sm text-zinc-400">Laden...</p>
            ) : items.length === 0 ? (
              <div className="rounded-lg border border-dashed border-white/10 p-8 text-center text-sm text-zinc-400">
                Nog geen groei-playbooks geseed. Vraag de admin om <code className="rounded bg-white/5 px-1">npx tsx scripts/seed-playbooks.ts</code> te draaien.
              </div>
            ) : (
              <div className="space-y-1.5">
                {items.map(p => (
                  <Link
                    key={p.id}
                    href={`/dashboard/playbooks/${p.slug}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-foundri-deep px-4 py-3 transition hover:border-foundri-yellow/30"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{p.title}</p>
                      {p.purpose && <p className="mt-0.5 truncate text-xs text-zinc-400">{p.purpose}</p>}
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-zinc-500" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
