import { Lock, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { TIER_LABELS, type Tier } from '@/lib/tier-client'

interface UpgradeCardProps {
  feature?: string
  requiredTier: Tier
  currentTier?: Tier
  title?: string
  description?: string
  compact?: boolean
}

const UPGRADE_COPY: Record<Tier, { title: string; desc: string; cta: string }> = {
  free: { title: 'Free functie', desc: '', cta: 'Bekijk plannen' },
  pro: {
    title: 'Deze functie zit in Pro',
    desc: 'Upgrade naar Pro om AI, automatische opvolging, reviewverzoeken, Content Engine en Sparks te gebruiken.',
    cta: 'Start Pro trial',
  },
  scale: {
    title: 'Deze functie zit in Scale',
    desc: 'Scale is gebouwd voor grotere vakbedrijven met meerdere teams, locaties, pipelines en serieuze omzetcontrole.',
    cta: 'Plan Scale demo',
  },
}

export function UpgradeCard({
  requiredTier,
  currentTier = 'free',
  title,
  description,
  compact = false,
}: UpgradeCardProps) {
  const copy = UPGRADE_COPY[requiredTier]
  const headline = title || copy.title
  const desc = description || copy.desc || `Deze functie is beschikbaar in het ${TIER_LABELS[requiredTier]}-plan. Je huidige plan: ${TIER_LABELS[currentTier]}.`

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 rounded-md border border-foundri-yellow/30 bg-foundri-deep/60 px-3 py-2 text-xs">
        <Lock className="h-3.5 w-3.5 text-foundri-yellow" />
        <span className="text-white/80">{TIER_LABELS[requiredTier]} vereist</span>
        <Link href="/dashboard/billing/upgrade" className="font-medium text-foundri-yellow hover:underline">
          {copy.cta} →
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-foundri-yellow/30 bg-foundri-deep p-6 text-center shadow-lg">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-foundri-yellow/10">
        <Lock className="h-5 w-5 text-foundri-yellow" />
      </div>
      <h3 className="text-base font-semibold text-white">{headline}</h3>
      <p className="mx-auto mt-1.5 max-w-md text-sm text-white/70">{desc}</p>
      <Link
        href="/dashboard/billing/upgrade"
        className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-foundri-yellow px-4 py-2 text-sm font-medium text-foundri-deep transition hover:brightness-110"
      >
        {copy.cta}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}
