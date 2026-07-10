'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'

type Plan = 'free' | 'pro' | 'scale'
type Pkg = 'light' | 'core' | 'premium' | null

export function TenantAdminControls({
  tenantId,
  initial,
}: {
  tenantId: string
  initial: {
    plan: Plan
    is_managed: boolean
    managed_package: Pkg
    is_platform_case: boolean
    internal_notes: string | null
  }
}) {
  const router = useRouter()
  const [plan, setPlan] = useState<Plan>(initial.plan)
  const [isManaged, setIsManaged] = useState(initial.is_managed)
  const [managedPackage, setManagedPackage] = useState<Pkg>(initial.managed_package)
  const [isPlatformCase, setIsPlatformCase] = useState(initial.is_platform_case)
  const [notes, setNotes] = useState(initial.internal_notes || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function save() {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const r = await fetch(`/api/admin/tenants/${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          is_managed: isManaged,
          managed_package: isManaged ? managedPackage : null,
          is_platform_case: isPlatformCase,
          internal_notes: notes || null,
        }),
      })
      if (!r.ok) {
        const data = await r.json().catch(() => ({}))
        throw new Error(data.error || 'Opslaan mislukt')
      }
      setSaved(true)
      router.refresh()
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Opslaan mislukt')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-foundri-yellow/20 bg-foundri-card p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-foundri-yellow" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-foundri-yellow">Admin Beheer</h2>
      </div>

      <div>
        <label className="mb-1 block text-xs text-zinc-400">Plan (handmatig, geen Stripe)</label>
        <div className="flex gap-1">
          {(['free', 'pro', 'scale'] as Plan[]).map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setPlan(p)}
              className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium uppercase transition ${
                plan === p
                  ? 'border-foundri-yellow bg-foundri-yellow/10 text-foundri-yellow'
                  : 'border-white/10 bg-foundri-deep text-zinc-400 hover:border-white/20'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2 text-xs text-zinc-300">
          <input
            type="checkbox"
            checked={isManaged}
            onChange={e => setIsManaged(e.target.checked)}
            className="h-4 w-4"
          />
          <span>Managed by Groeneveld Media</span>
        </label>
        {isManaged && (
          <div className="mt-2 flex gap-1">
            {(['light', 'core', 'premium'] as const).map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setManagedPackage(p)}
                className={`flex-1 rounded-lg border px-2 py-1.5 text-[10px] font-medium uppercase transition ${
                  managedPackage === p
                    ? 'border-foundri-yellow bg-foundri-yellow/10 text-foundri-yellow'
                    : 'border-white/10 bg-foundri-deep text-zinc-400 hover:border-white/20'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="flex items-center gap-2 text-xs text-zinc-300">
          <input
            type="checkbox"
            checked={isPlatformCase}
            onChange={e => setIsPlatformCase(e.target.checked)}
            className="h-4 w-4"
          />
          <span>Platform Case (zoals Groeneveld Tuinen)</span>
        </label>
      </div>

      <div>
        <label className="mb-1 block text-xs text-zinc-400">Interne notities</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={4}
          placeholder="Niet zichtbaar voor klant. Voor team-context."
          className="w-full rounded-lg border border-white/10 bg-foundri-deep px-3 py-2 text-sm text-white focus:border-foundri-yellow/40 focus:outline-none"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-300">{error}</div>
      )}
      {saved && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2 text-xs text-emerald-300">Opgeslagen.</div>
      )}

      <button
        onClick={save}
        disabled={saving}
        className="w-full rounded-lg bg-foundri-yellow px-3 py-2 text-sm font-semibold text-foundri-deep transition hover:brightness-110 disabled:opacity-50"
      >
        {saving ? 'Opslaan...' : 'Opslaan'}
      </button>
    </div>
  )
}
