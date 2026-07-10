'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'

export function DemoBanner() {
  const [active, setActive] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch('/api/demo-mode')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!cancelled && data) setActive(data.active === true)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  if (loading || !active) return null

  return (
    <div className="sticky top-0 z-40 flex items-center justify-center gap-2 bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-md">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span>DEMO MODUS ACTIEF — alle data is fictief. Mutaties zijn geblokkeerd.</span>
    </div>
  )
}
