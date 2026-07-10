'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ListChecks, Plus, ChevronRight, Lock } from 'lucide-react'
import { useFeature } from '@/lib/hooks/useFeature'

type Sop = {
  id: string
  title: string
  category: 'operations' | 'field_work' | 'sales' | 'admin'
  description: string | null
  steps: { title: string }[]
  version: number
  source: 'tenant' | 'foundri_seed'
  updated_at: string
}

const CATEGORY_LABELS: Record<string, string> = {
  operations: 'Operations',
  field_work: 'In het veld',
  sales: 'Sales',
  admin: 'Administratie',
}

export default function SopsPage() {
  const router = useRouter()
  const [sops, setSops] = useState<Sop[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const { allowed: canEdit } = useFeature('sops_edit')

  useEffect(() => {
    fetch('/api/sops')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setSops(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [])

  async function createSop() {
    if (!canEdit || creating) return
    setCreating(true)
    try {
      const r = await fetch('/api/sops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Nieuwe SOP',
          category: 'operations',
          steps: [{ title: 'Stap 1', description: '' }],
        }),
      })
      if (r.ok) {
        const sop = await r.json()
        router.push(`/dashboard/sops/${sop.id}`)
      }
    } finally {
      setCreating(false)
    }
  }

  const grouped = sops.reduce<Record<string, Sop[]>>((acc, s) => {
    if (!acc[s.category]) acc[s.category] = []
    acc[s.category].push(s)
    return acc
  }, {})

  return (
    <div className="p-4 lg:p-6 pt-16 lg:pt-6 max-w-4xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ListChecks className="h-6 w-6 text-foundri-yellow" />
            <h1 className="text-2xl font-bold text-white">SOPs</h1>
          </div>
          <p className="mt-1 text-sm text-zinc-400">
            Standaard werkwijzen — voor kantoor én in het veld. Klik op een SOP om te bekijken of aan te passen.
          </p>
        </div>
        <button
          onClick={createSop}
          disabled={!canEdit || creating}
          className="inline-flex items-center gap-1.5 rounded-lg bg-foundri-yellow px-3 py-2 text-sm font-medium text-foundri-deep transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          title={!canEdit ? 'Pro vereist om SOPs te maken' : undefined}
        >
          {!canEdit ? <Lock className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          Nieuwe SOP
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-400">Laden...</p>
      ) : sops.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/10 p-8 text-center text-sm text-zinc-400">
          Nog geen SOPs. Standaard SOPs worden bij eerste login geseed.
        </div>
      ) : (
        <div className="space-y-6">
          {(['operations', 'field_work', 'sales', 'admin'] as const).map((cat) => {
            const items = grouped[cat]
            if (!items?.length) return null
            return (
              <div key={cat}>
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  {CATEGORY_LABELS[cat]}
                </h2>
                <div className="space-y-1.5">
                  {items.map((s) => (
                    <Link
                      key={s.id}
                      href={`/dashboard/sops/${s.id}`}
                      className="flex items-center justify-between rounded-lg border border-white/5 bg-foundri-deep px-4 py-3 transition hover:border-foundri-yellow/30"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-white">{s.title}</p>
                          {s.source === 'foundri_seed' && (
                            <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] uppercase text-white/40">standaard</span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-zinc-400">
                          {s.steps?.length || 0} stappen · v{s.version}
                          {s.description ? ` · ${s.description.substring(0, 60)}${s.description.length > 60 ? '…' : ''}` : ''}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-zinc-500" />
                    </Link>
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
