'use client'

import { useEffect, useState } from 'react'
import { tierAtLeast, getRequiredTier, type Tier } from '@/lib/tier-client'

type TenantCache = { plan: Tier; fetchedAt: number } | null
let cache: TenantCache = null
const CACHE_MS = 60_000

export function useFeature(feature: string) {
  const [state, setState] = useState<{
    loading: boolean
    allowed: boolean
    currentTier: Tier
    requiredTier: Tier
  }>(() => ({
    loading: !cache,
    allowed: cache ? tierAtLeast(cache.plan, getRequiredTier(feature)) : false,
    currentTier: cache?.plan || 'free',
    requiredTier: getRequiredTier(feature),
  }))

  useEffect(() => {
    const requiredTier = getRequiredTier(feature)
    const useCached = cache && Date.now() - cache.fetchedAt < CACHE_MS

    if (useCached && cache) {
      setState({
        loading: false,
        allowed: tierAtLeast(cache.plan, requiredTier),
        currentTier: cache.plan,
        requiredTier,
      })
      return
    }

    let cancelled = false
    fetch('/api/tenant')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return
        const plan = (data?.plan || 'free') as Tier
        cache = { plan, fetchedAt: Date.now() }
        setState({
          loading: false,
          allowed: tierAtLeast(plan, requiredTier),
          currentTier: plan,
          requiredTier,
        })
      })
      .catch(() => {
        if (cancelled) return
        setState({ loading: false, allowed: false, currentTier: 'free', requiredTier })
      })

    return () => {
      cancelled = true
    }
  }, [feature])

  return state
}

export function invalidateFeatureCache() {
  cache = null
}
