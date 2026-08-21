'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import type { ContentChannel } from '@/lib/content-channels'
import type { ScorecardResponse } from './page'

type EnabledChannel = ContentChannel & { enabled: boolean }

interface WeeklyMetricRow {
  platform: string
  profile_type: string
  posts_published: number
  reach: number
  interactions: number
  dms: number
}

type EntryState = Record<string, { posts_published: string; reach: string; interactions: string; dms: string }>

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function formatWeekLabel(weekStartDate: string): string {
  const start = new Date(`${weekStartDate}T00:00:00Z`)
  const end = new Date(`${addDays(weekStartDate, 6)}T00:00:00Z`)
  return `${start.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}`
}

const EMPTY_ENTRY = { posts_published: '0', reach: '0', interactions: '0', dms: '0' }

const ROWS = [
  { key: 'posts_published', label: 'Posts' },
  { key: 'reach', label: 'Bereik' },
  { key: 'interactions', label: 'Interacties' },
  { key: 'dms', label: "DM's" },
  { key: 'qualified_leads', label: 'Gekwalificeerde aanvragen' },
  { key: 'klanten', label: 'Klanten' },
  { key: 'omzet', label: 'Omzet' },
] as const

export function ResultatenView({
  channels,
  weekStartDate,
  onWeekChange,
  scorecard,
  scorecardLoading,
  onSaved,
}: {
  channels: EnabledChannel[]
  weekStartDate: string
  onWeekChange: (week: string) => void
  scorecard: ScorecardResponse | null
  scorecardLoading: boolean
  onSaved: () => void
}) {
  const enabledChannels = channels.filter((c) => c.enabled)
  const [entries, setEntries] = useState<EntryState>({})
  const [loadingEntries, setLoadingEntries] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoadingEntries(true)
    fetch(`/api/content/metrics?week_start_date=${weekStartDate}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: WeeklyMetricRow[]) => {
        if (cancelled) return
        const next: EntryState = {}
        for (const c of enabledChannels) {
          const row = rows.find((r) => r.platform === c.platform && r.profile_type === c.profile_type)
          next[c.key] = row
            ? {
                posts_published: String(row.posts_published),
                reach: String(row.reach),
                interactions: String(row.interactions),
                dms: String(row.dms),
              }
            : { ...EMPTY_ENTRY }
        }
        setEntries(next)
        setLoadingEntries(false)
      })
      .catch(() => setLoadingEntries(false))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStartDate, channels.length])

  const updateEntry = (channelKey: string, field: keyof (typeof EMPTY_ENTRY), value: string) => {
    setEntries((prev) => ({
      ...prev,
      [channelKey]: { ...(prev[channelKey] ?? EMPTY_ENTRY), [field]: value },
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/content/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          week_start_date: weekStartDate,
          entries: enabledChannels.map((c) => {
            const e = entries[c.key] ?? EMPTY_ENTRY
            return {
              platform: c.platform,
              profile_type: c.profile_type,
              posts_published: Number(e.posts_published) || 0,
              reach: Number(e.reach) || 0,
              interactions: Number(e.interactions) || 0,
              dms: Number(e.dms) || 0,
            }
          }),
        }),
      })
      if (res.ok) onSaved()
    } finally {
      setSaving(false)
    }
  }

  const channelByKey = (key: string) => scorecard?.channels.find((c) => `${c.platform}:${c.profile_type}` === key)

  return (
    <div className="space-y-6">
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => onWeekChange(addDays(weekStartDate, -7))} className="rounded-lg p-1.5 hover:bg-white/10 transition-colors">
          <ChevronLeft className="h-4 w-4 text-zinc-300" />
        </button>
        <span className="text-sm font-medium text-zinc-200">Week {formatWeekLabel(weekStartDate)}</span>
        <button onClick={() => onWeekChange(addDays(weekStartDate, 7))} className="rounded-lg p-1.5 hover:bg-white/10 transition-colors">
          <ChevronRight className="h-4 w-4 text-zinc-300" />
        </button>
      </div>

      {enabledChannels.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-zinc-400">
          Geen kanalen actief. Zet een kanaal aan via het instellingen-icoon om resultaten bij te houden.
        </div>
      ) : (
        <>
          {/* Entry form */}
          <div className="rounded-lg border bg-foundri-deep p-4">
            <h3 className="mb-3 text-sm font-semibold text-white">Wekelijkse check-in</h3>
            {loadingEntries ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
              </div>
            ) : (
              <div className="space-y-3">
                {enabledChannels.map((c) => {
                  const e = entries[c.key] ?? EMPTY_ENTRY
                  return (
                    <div key={c.key} className="grid grid-cols-5 items-center gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-200">
                        <span className="h-2 w-2 rounded-full inline-block" style={{ backgroundColor: c.color }} />
                        {c.label}
                      </div>
                      {(['posts_published', 'reach', 'interactions', 'dms'] as const).map((field) => (
                        <input
                          key={field}
                          type="number"
                          min={0}
                          inputMode="numeric"
                          value={e[field]}
                          onChange={(ev) => updateEntry(c.key, field, ev.target.value)}
                          onFocus={(ev) => ev.target.select()}
                          className="w-full rounded-lg border bg-foundri-surface px-2 py-1.5 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-300"
                        />
                      ))}
                    </div>
                  )
                })}
                <div className="grid grid-cols-5 gap-2 text-[10px] text-zinc-500 pt-1">
                  <div />
                  <span>Posts</span>
                  <span>Bereik</span>
                  <span>Interacties</span>
                  <span>DM&apos;s</span>
                </div>
              </div>
            )}
            <div className="flex justify-end pt-3">
              <button
                onClick={handleSave}
                disabled={saving || loadingEntries}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Opslaan...' : 'Opslaan'}
              </button>
            </div>
          </div>

          {/* Scorecard table */}
          <div className="rounded-lg border bg-foundri-deep overflow-x-auto">
            <h3 className="px-4 pt-4 text-sm font-semibold text-white">Weekly Content Scorecard</h3>
            {scorecardLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
              </div>
            ) : !scorecard || scorecard.channels.every((c) => c.reach === 0 && c.qualified_leads === 0 && c.posts_published === 0) ? (
              <div className="py-8 px-4 text-center text-sm text-zinc-400">Nog geen data voor deze week.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-2 text-left text-xs font-medium text-zinc-400">KPI</th>
                    {enabledChannels.map((c) => (
                      <th key={c.key} className="px-4 py-2 text-right text-xs font-medium text-zinc-400 whitespace-nowrap">
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((row) => (
                    <tr key={row.key} className="border-b last:border-0">
                      <td className="px-4 py-2 text-zinc-300">{row.label}</td>
                      {enabledChannels.map((c) => {
                        const data = channelByKey(c.key)
                        const value = data?.[row.key] ?? 0
                        return (
                          <td key={c.key} className="px-4 py-2 text-right text-zinc-100 font-medium">
                            {row.key === 'omzet' ? `€${Number(value).toLocaleString('nl-NL')}` : Number(value).toLocaleString('nl-NL')}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
