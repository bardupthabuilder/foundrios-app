'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Circle, RefreshCw } from 'lucide-react'

type Step = { title: string; description?: string }
type Sop = { id: string; title: string; description: string | null; steps: Step[] }

export default function SopChecklistPage() {
  const { id } = useParams<{ id: string }>()
  const [sop, setSop] = useState<Sop | null>(null)
  const [checked, setChecked] = useState<Set<number>>(new Set())

  const storageKey = `sop-check-${id}`

  useEffect(() => {
    fetch(`/api/sops/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setSop(data))
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const arr = JSON.parse(raw) as number[]
        setChecked(new Set(arr))
      }
    } catch {
      /* noop */
    }
  }, [id, storageKey])

  function toggle(idx: number) {
    const next = new Set(checked)
    if (next.has(idx)) next.delete(idx)
    else next.add(idx)
    setChecked(next)
    try {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(next)))
    } catch {
      /* noop */
    }
  }

  function reset() {
    setChecked(new Set())
    try {
      localStorage.removeItem(storageKey)
    } catch {
      /* noop */
    }
  }

  if (!sop) return <div className="p-6 pt-16 text-sm text-zinc-400">Laden...</div>

  const completed = checked.size
  const total = sop.steps.length

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="sticky top-0 z-10 border-b border-white/5 bg-foundri-deep px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href={`/dashboard/sops/${id}`} className="inline-flex items-center gap-1.5 text-sm text-zinc-300 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Terug
          </Link>
          <button onClick={reset} className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white">
            <RefreshCw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>
        <h1 className="mt-2 text-lg font-bold">{sop.title}</h1>
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1.5 flex-1 rounded-full bg-white/10">
            <div
              className="h-1.5 rounded-full bg-foundri-yellow transition-all"
              style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }}
            />
          </div>
          <span className="text-xs font-medium text-foundri-yellow">{completed}/{total}</span>
        </div>
      </div>

      <div className="space-y-3 p-4">
        {sop.steps.map((step, idx) => {
          const done = checked.has(idx)
          return (
            <button
              key={idx}
              onClick={() => toggle(idx)}
              className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition ${
                done
                  ? 'border-foundri-yellow/40 bg-foundri-yellow/5'
                  : 'border-white/10 bg-foundri-deep active:bg-white/5'
              }`}
            >
              <div className="mt-0.5">
                {done ? (
                  <CheckCircle2 className="h-6 w-6 text-foundri-yellow" />
                ) : (
                  <Circle className="h-6 w-6 text-zinc-500" />
                )}
              </div>
              <div className="flex-1">
                <p className={`text-base font-semibold ${done ? 'text-white/60 line-through' : 'text-white'}`}>
                  {step.title}
                </p>
                {step.description && (
                  <p className={`mt-1 text-sm ${done ? 'text-white/40' : 'text-zinc-300'}`}>{step.description}</p>
                )}
              </div>
            </button>
          )
        })}

        {completed === total && total > 0 && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
            <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-400" />
            <p className="font-semibold text-emerald-300">Klaar — alles afgevinkt</p>
            <p className="mt-1 text-xs text-emerald-400/70">Klik &quot;Reset&quot; voor de volgende ronde.</p>
          </div>
        )}
      </div>
    </div>
  )
}
