'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Status = 'new' | 'reviewing' | 'qualified' | 'rejected' | 'scheduled' | 'won' | 'lost'

const STATUS_OPTIONS: Array<{ value: Status; label: string }> = [
  { value: 'new', label: 'Nieuw' },
  { value: 'reviewing', label: 'In review' },
  { value: 'qualified', label: 'Gekwalificeerd' },
  { value: 'scheduled', label: 'Gesprek gepland' },
  { value: 'rejected', label: 'Afgewezen' },
  { value: 'won', label: 'Gewonnen' },
  { value: 'lost', label: 'Verloren' },
]

export function ManagedRequestActions({
  requestId,
  currentStatus,
  currentNotes,
}: {
  requestId: string
  currentStatus: Status
  currentNotes: string | null
}) {
  const router = useRouter()
  const [status, setStatus] = useState<Status>(currentStatus)
  const [notes, setNotes] = useState(currentNotes || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const r = await fetch(`/api/admin/managed-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, internal_notes: notes }),
      })
      if (!r.ok) {
        const data = await r.json().catch(() => ({}))
        throw new Error(data.error || 'Opslaan mislukt')
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Opslaan mislukt')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-white/5 bg-foundri-card p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Beheer</h3>

      <div>
        <label className="mb-1 block text-xs text-zinc-400">Status</label>
        <select
          value={status}
          onChange={e => setStatus(e.target.value as Status)}
          className="w-full rounded-lg border border-white/10 bg-foundri-deep px-3 py-2 text-sm text-white focus:border-foundri-yellow/40 focus:outline-none"
        >
          {STATUS_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs text-zinc-400">Interne notities</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={6}
          className="w-full rounded-lg border border-white/10 bg-foundri-deep px-3 py-2 text-sm text-white focus:border-foundri-yellow/40 focus:outline-none"
          placeholder="Niet zichtbaar voor klant. Voor team-coördinatie."
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-300">{error}</div>
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
