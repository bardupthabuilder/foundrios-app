'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Circle } from 'lucide-react'

const STEPS = [
  { key: 'qualified_at', stage: 'gekwalificeerd', label: 'Gekwalificeerd', desc: 'Lead beoordeeld op budget, urgentie en fit' },
  { key: 'appointment_at', stage: 'afspraak', label: 'Afspraak gepland', desc: 'Intake of adviesgesprek ingepland' },
  { key: 'quote_sent_at', stage: 'offerte', label: 'Offerte verstuurd', desc: 'Offerte gemaakt en verstuurd' },
  { key: 'followed_up_at', stage: 'opvolging', label: 'Opgevolgd', desc: 'Offerte is opgevolgd' },
]

type Props = {
  leadId: string
  qualifiedAt: string | null
  appointmentAt: string | null
  quoteSentAt: string | null
  followedUpAt: string | null
}

export function ProcessChecklist({ leadId, qualifiedAt, appointmentAt, quoteSentAt, followedUpAt }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const timestamps: Record<string, string | null> = {
    qualified_at: qualifiedAt,
    appointment_at: appointmentAt,
    quote_sent_at: quoteSentAt,
    followed_up_at: followedUpAt,
  }

  async function toggleStep(key: string, stage: string) {
    setLoading(key)
    const isCompleted = !!timestamps[key]

    await fetch(`/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        [key]: isCompleted ? null : new Date().toISOString(),
        pipeline_stage: isCompleted ? getPreviousStage(key) : stage,
      }),
    })

    router.refresh()
    setLoading(null)
  }

  function getPreviousStage(currentKey: string): string {
    const idx = STEPS.findIndex(s => s.key === currentKey)
    if (idx <= 0) return 'nieuw'
    // Find the last completed step before this one
    for (let i = idx - 1; i >= 0; i--) {
      if (timestamps[STEPS[i].key]) return STEPS[i].stage
    }
    return 'nieuw'
  }

  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
        Conversieproces
      </h3>
      <div className="space-y-1">
        {STEPS.map((step) => {
          const completed = !!timestamps[step.key]
          const isLoading = loading === step.key
          return (
            <button
              key={step.key}
              onClick={() => toggleStep(step.key, step.stage)}
              disabled={isLoading}
              className="flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-white/5 disabled:opacity-50"
            >
              <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                completed
                  ? 'border-foundri-yellow bg-foundri-yellow/20'
                  : 'border-white/20'
              }`}>
                {completed ? (
                  <Check className="h-3 w-3 text-foundri-yellow" />
                ) : (
                  <Circle className="h-3 w-3 text-zinc-600" />
                )}
              </div>
              <div>
                <p className={`text-sm font-medium ${completed ? 'text-white' : 'text-zinc-400'}`}>
                  {step.label}
                </p>
                <p className="text-xs text-zinc-500">{step.desc}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
