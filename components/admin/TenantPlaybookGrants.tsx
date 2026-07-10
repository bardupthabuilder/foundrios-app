'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpenCheck, Check } from 'lucide-react'

type GrantPlaybook = {
  id: string
  category_slug: string
  slug: string
  title: string
  audience: 'internal' | 'tier' | 'granted'
  min_tier: 'free' | 'pro' | 'scale'
  granted: boolean
}

export function TenantPlaybookGrants({ tenantId }: { tenantId: string }) {
  const router = useRouter()
  const [playbooks, setPlaybooks] = useState<GrantPlaybook[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/admin/tenants/${tenantId}/playbook-grants`)
      .then(r => (r.ok ? r.json() : { playbooks: [] }))
      .then(data => {
        const list: GrantPlaybook[] = data.playbooks ?? []
        setPlaybooks(list)
        setSelected(new Set(list.filter(p => p.granted).map(p => p.id)))
      })
      .finally(() => setLoading(false))
  }, [tenantId])

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setDirty(true)
    setSaved(false)
  }

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const r = await fetch(`/api/admin/tenants/${tenantId}/playbook-grants`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playbook_ids: Array.from(selected) }),
      })
      if (!r.ok) {
        const data = await r.json().catch(() => ({}))
        throw new Error(data.error || 'Opslaan mislukt')
      }
      setDirty(false)
      setSaved(true)
      router.refresh()
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Opslaan mislukt')
    } finally {
      setSaving(false)
    }
  }

  const byCategory = playbooks.reduce<Record<string, GrantPlaybook[]>>((acc, p) => {
    if (!acc[p.category_slug]) acc[p.category_slug] = []
    acc[p.category_slug].push(p)
    return acc
  }, {})

  return (
    <div className="rounded-xl border border-white/5 bg-foundri-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          <BookOpenCheck className="h-3.5 w-3.5" />
          Playbook toegang
        </h2>
        {playbooks.length > 0 && (
          <span className="text-xs text-zinc-500">{selected.size} / {playbooks.length}</span>
        )}
      </div>

      {loading ? (
        <p className="text-xs text-zinc-400">Laden...</p>
      ) : playbooks.length === 0 ? (
        <p className="text-xs text-zinc-400">
          Geen granted-audience playbooks beschikbaar. Zet een playbook op audience &quot;granted&quot; via{' '}
          <a href="/admin/playbooks" className="text-foundri-yellow hover:underline">/admin/playbooks</a>.
        </p>
      ) : (
        <>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {Object.entries(byCategory).map(([cat, list]) => (
              <div key={cat}>
                <h3 className="mb-1 text-[10px] uppercase tracking-wider text-zinc-600">{cat}</h3>
                <div className="space-y-1">
                  {list.map(p => {
                    const checked = selected.has(p.id)
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggle(p.id)}
                        className={`flex w-full items-center gap-2 rounded border px-2 py-1.5 text-left text-xs transition ${
                          checked
                            ? 'border-foundri-yellow/40 bg-foundri-yellow/5 text-white'
                            : 'border-white/5 bg-foundri-deep text-zinc-300 hover:border-white/15'
                        }`}
                      >
                        <span className={`inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border ${
                          checked
                            ? 'border-foundri-yellow bg-foundri-yellow text-foundri-deep'
                            : 'border-white/20'
                        }`}>
                          {checked && <Check className="h-2.5 w-2.5" />}
                        </span>
                        <span className="truncate flex-1">{p.title}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div className="mt-2 rounded border border-red-500/30 bg-red-500/10 p-2 text-[10px] text-red-300">{error}</div>
          )}
          {saved && (
            <div className="mt-2 rounded border border-emerald-500/30 bg-emerald-500/10 p-2 text-[10px] text-emerald-300">Opgeslagen.</div>
          )}

          {dirty && (
            <button
              onClick={save}
              disabled={saving}
              className="mt-3 w-full rounded-lg bg-foundri-yellow px-3 py-1.5 text-xs font-semibold text-foundri-deep transition hover:brightness-110 disabled:opacity-50"
            >
              {saving ? 'Opslaan...' : 'Toegang opslaan'}
            </button>
          )}
        </>
      )}
    </div>
  )
}
