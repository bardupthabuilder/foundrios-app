'use client'

import { useState } from 'react'
import Link from 'next/link'
import { X, Check, Rocket, Users, FileText, Settings, Inbox } from 'lucide-react'

const STEPS = [
  { key: 'profile', label: 'Bedrijfsprofiel invullen', desc: 'Naam, branche, diensten en werkgebied', link: '/dashboard/settings', icon: Settings },
  { key: 'team', label: 'Team toevoegen', desc: 'Voeg je medewerkers toe', link: '/dashboard/team', icon: Users },
  { key: 'lead', label: 'Eerste lead toevoegen', desc: 'Handmatig of via formulier', link: '/dashboard/leads', icon: Inbox },
  { key: 'quote', label: 'Eerste offerte maken', desc: 'Maak een offerte voor een lead', link: '/dashboard/offertes', icon: FileText },
]

interface WelcomeBannerProps {
  tenantName: string
  onboardingStep: number
  hasLeads: boolean
  hasEmployees: boolean
  hasQuotes: boolean
  profileComplete: boolean
}

export function WelcomeBanner({ tenantName, onboardingStep, hasLeads, hasEmployees, hasQuotes, profileComplete }: WelcomeBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  // Compute completion
  const completion = [
    profileComplete,
    hasEmployees,
    hasLeads,
    hasQuotes,
  ]
  const completedCount = completion.filter(Boolean).length
  const allDone = completedCount === STEPS.length

  if (dismissed || allDone) return null

  async function handleDismiss() {
    setDismissed(true)
    await fetch('/api/tenant', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ onboarding_dismissed: true }),
    })
  }

  return (
    <div className="mb-6 rounded-lg border border-foundri-yellow/20 bg-gradient-to-r from-foundri-yellow/5 to-transparent p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-foundri-yellow/20">
            <Rocket className="h-5 w-5 text-foundri-yellow" />
          </div>
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-white">
              Welkom bij FoundriOS, {tenantName}!
            </h2>
            <p className="text-sm text-zinc-400">{completedCount} van {STEPS.length} stappen voltooid</p>
          </div>
        </div>
        <button onClick={handleDismiss} className="text-zinc-500 hover:text-zinc-300">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-4 h-1.5 rounded-full bg-foundri-card">
        <div
          className="h-full rounded-full bg-foundri-yellow transition-all"
          style={{ width: `${(completedCount / STEPS.length) * 100}%` }}
        />
      </div>

      {/* Steps */}
      <div className="grid gap-2 sm:grid-cols-2">
        {STEPS.map((step, i) => {
          const done = completion[i]
          const Icon = step.icon
          return (
            <Link
              key={step.key}
              href={step.link}
              className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                done
                  ? 'border-green-500/20 bg-green-500/5'
                  : 'border-white/5 bg-foundri-card hover:border-foundri-yellow/20'
              }`}
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                done ? 'bg-green-500/20' : 'bg-white/5'
              }`}>
                {done ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Icon className="h-4 w-4 text-zinc-400" />
                )}
              </div>
              <div>
                <p className={`text-sm font-medium ${done ? 'text-green-400' : 'text-white'}`}>{step.label}</p>
                <p className="text-xs text-zinc-500">{step.desc}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
