'use client'

import { Lock } from 'lucide-react'
import Link from 'next/link'

interface TierGateProps {
  feature: string
  requiredTier: 'pro' | 'scale'
  currentTier: string
  children: React.ReactNode
}

export function TierGate({ feature, requiredTier, currentTier, children }: TierGateProps) {
  const tierOrder = { free: 0, pro: 1, scale: 2 }
  const allowed = (tierOrder[currentTier as keyof typeof tierOrder] || 0) >= tierOrder[requiredTier]

  if (allowed) return <>{children}</>

  return (
    <div className="relative" data-feature={feature}>
      <div className="pointer-events-none opacity-30 blur-[1px]">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="rounded-lg border border-foundri-yellow/20 bg-foundri-deep px-4 py-3 text-center shadow-lg">
          <Lock className="mx-auto mb-2 h-5 w-5 text-foundri-yellow" />
          <p className="text-sm font-medium text-white">{requiredTier === 'scale' ? 'Scale' : 'Pro'} functie</p>
          <Link href="/dashboard/billing" className="mt-1 text-xs text-foundri-yellow hover:underline">
            Upgrade je plan →
          </Link>
        </div>
      </div>
    </div>
  )
}
