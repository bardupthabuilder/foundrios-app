'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'

const STATUS_OPTIONS = ['nieuw', 'bekeken', 'gepland', 'gebouwd', 'afgewezen']
const PRIORITY_OPTIONS = ['laag', 'normaal', 'hoog', 'kritiek']
const TYPE_LABELS: Record<string, string> = { bug: '🐛 Bug', verbetering: '💡 Verbetering', feature: '🚀 Feature', vraag: '❓ Vraag' }
const STATUS_COLORS: Record<string, string> = {
  nieuw: 'bg-blue-500/20 text-blue-400',
  bekeken: 'bg-zinc-500/20 text-zinc-400',
  gepland: 'bg-foundri-yellow/20 text-foundri-yellow',
  gebouwd: 'bg-green-500/20 text-green-400',
  afgewezen: 'bg-red-500/20 text-red-400',
}
const PRIORITY_COLORS: Record<string, string> = {
  laag: 'text-zinc-500', normaal: 'text-zinc-300', hoog: 'text-orange-400', kritiek: 'text-red-400',
}

type Feedback = { id: string; type: string; message: string; page: string; status: string; priority: string; admin_notes: string; created_at: string; tenants?: { name: string } }

export default function FeedbackAdmin() {
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('alle')

  useEffect(() => { fetchFeedback() }, [])

  async function fetchFeedback() {
    const res = await fetch('/api/admin/feedback')
    if (res.ok) { const d = await res.json(); setFeedback(d.feedback || []) }
    setLoading(false)
  }

  async function updateFeedback(id: string, updates: Record<string, unknown>) {
    await fetch('/api/admin/feedback', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    })
    fetchFeedback()
  }

  const filtered = filter === 'alle' ? feedback : feedback.filter(f => f.status === filter)
  const countByStatus = (s: string) => feedback.filter(f => f.status === s).length

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="h-6 w-6 animate-spin text-zinc-400" /></div>

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-white">Feedback</h1>
        <p className="text-sm text-zinc-400">{feedback.length} items · {countByStatus('nieuw')} nieuw</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-lg bg-foundri-card p-1 overflow-x-auto">
        {['alle', ...STATUS_OPTIONS].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${filter === s ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white'}`}>
            {s === 'alle' ? `Alle (${feedback.length})` : `${s.charAt(0).toUpperCase() + s.slice(1)} (${countByStatus(s)})`}
          </button>
        ))}
      </div>

      {/* Feedback list */}
      <div className="space-y-3">
        {filtered.length === 0 && <p className="py-10 text-center text-sm text-zinc-500">Geen feedback gevonden</p>}
        {filtered.map(f => (
          <div key={f.id} className="rounded-lg border border-white/5 bg-foundri-deep p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">{TYPE_LABELS[f.type] || f.type}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] ${STATUS_COLORS[f.status]}`}>{f.status}</span>
                  <span className={`text-[10px] ${PRIORITY_COLORS[f.priority]}`}>● {f.priority}</span>
                </div>
                <p className="text-sm text-white">{f.message}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-zinc-500">
                  <span>{(f.tenants as any)?.name || 'Onbekend'}</span>
                  {f.page && <span>op {f.page}</span>}
                  <span>{new Date(f.created_at).toLocaleDateString('nl-NL')}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <select value={f.status} onChange={e => updateFeedback(f.id, { status: e.target.value })}
                  className="rounded border-0 bg-foundri-card px-2 py-1 text-xs text-white">
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={f.priority} onChange={e => updateFeedback(f.id, { priority: e.target.value })}
                  className="rounded border-0 bg-foundri-card px-2 py-1 text-xs text-white">
                  {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
