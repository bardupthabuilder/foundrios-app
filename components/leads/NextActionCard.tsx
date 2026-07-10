'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarClock, Check, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * De volgende actie op een aanvraag.
 *
 * Dit is de kern van het systeem: een open aanvraag zonder volgende actie is de
 * enige echte fout die een vakbedrijf kan maken. De kaart laat dat zien in plaats
 * van het stilletjes toe te staan.
 */

const PRESETS = [
  { label: 'Bellen', days: 0 },
  { label: 'Nabellen', days: 2 },
  { label: 'Offerte maken', days: 1 },
  { label: 'Afspraak inplannen', days: 3 },
]

function toDateInput(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toISOString().split('T')[0]
}

function daysOverdue(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
}

export function NextActionCard({
  leadId,
  nextAction,
  nextActionAt,
  closed,
}: {
  leadId: string
  nextAction: string | null
  nextActionAt: string | null
  closed: boolean
}) {
  const router = useRouter()
  const [action, setAction] = useState(nextAction ?? '')
  const [date, setDate] = useState(toDateInput(nextActionAt))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (closed) return null

  async function save(nextActionValue: string | null, nextDate: string | null) {
    setSaving(true)
    setError(null)

    const res = await fetch(`/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        next_action: nextActionValue,
        // De datumkiezer geeft een kale datum; de kolom is een timestamp.
        next_action_at: nextDate ? new Date(`${nextDate}T09:00:00`).toISOString() : null,
      }),
    })

    setSaving(false)
    if (!res.ok) {
      setError('Opslaan mislukt.')
      return
    }
    router.refresh()
  }

  function applyPreset(label: string, days: number) {
    const d = new Date()
    d.setDate(d.getDate() + days)
    const iso = d.toISOString().split('T')[0]
    setAction(label)
    setDate(iso)
    save(label, iso)
  }

  const overdue = nextActionAt ? daysOverdue(nextActionAt) >= 0 : false
  const missing = !nextActionAt

  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        missing
          ? 'border-red-500/30 bg-red-500/5'
          : overdue
            ? 'border-foundri-yellow/40 bg-foundri-yellow/5'
            : 'border-white/5 bg-foundri-deep'
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        {missing ? (
          <AlertTriangle className="h-4 w-4 text-red-400" />
        ) : (
          <CalendarClock className={cn('h-4 w-4', overdue ? 'text-foundri-yellow' : 'text-zinc-400')} />
        )}
        <h3 className="text-sm font-semibold text-white">Volgende actie</h3>
        {overdue && !missing && (
          <span className="ml-auto text-xs font-medium text-foundri-yellow">
            {daysOverdue(nextActionAt!) === 0 ? 'vandaag' : `${daysOverdue(nextActionAt!)}d te laat`}
          </span>
        )}
      </div>

      {missing && (
        <p className="mb-3 text-xs text-red-300">
          Deze aanvraag heeft geen volgende actie. Zo raak je hem kwijt.
        </p>
      )}

      <div className="mb-3 flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => applyPreset(p.label, p.days)}
            disabled={saving}
            className="rounded-md border border-white/10 px-2 py-1 text-xs text-zinc-300 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-50"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <input
          value={action}
          onChange={(e) => setAction(e.target.value)}
          placeholder="Wat ga je doen?"
          className="w-full rounded-lg border border-white/10 bg-foundri-surface px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-white/20 focus:outline-none"
        />
        <div className="flex gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="flex-1 rounded-lg border border-white/10 bg-foundri-surface px-3 py-2 text-sm text-white focus:border-white/20 focus:outline-none"
          />
          <button
            onClick={() => save(action || null, date || null)}
            disabled={saving || !date}
            className="rounded-lg bg-foundri-yellow px-3 py-2 text-sm font-medium text-foundri-graphite transition-colors hover:bg-foundri-yellow-dim disabled:opacity-50"
          >
            {saving ? '...' : 'Zet'}
          </button>
        </div>
      </div>

      {nextActionAt && (
        <button
          onClick={() => save(null, null)}
          disabled={saving}
          className="mt-2 inline-flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-emerald-400 disabled:opacity-50"
        >
          <Check className="h-3.5 w-3.5" /> Gedaan — actie afvinken
        </button>
      )}

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  )
}
