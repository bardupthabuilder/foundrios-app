'use client'

import { useEffect, useState } from 'react'

function minutesSince(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000)
}

function formatTime(minutes: number): string {
  if (minutes < 1) return 'Zojuist'
  if (minutes < 60) return `${minutes}m geleden`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h < 24) return m > 0 ? `${h}u ${m}m geleden` : `${h}u geleden`
  const d = Math.floor(h / 24)
  return `${d}d geleden`
}

interface Props {
  createdAt: string
  status: string
}

export function ReactieTimer({ createdAt, status }: Props) {
  const [minutes, setMinutes] = useState(() => minutesSince(createdAt))

  useEffect(() => {
    const interval = setInterval(() => setMinutes(minutesSince(createdAt)), 30000)
    return () => clearInterval(interval)
  }, [createdAt])

  const label = formatTime(minutes)

  // Only nieuwe (onbehandelde) leads krijgen urgentie-kleur
  if (status === 'new') {
    if (minutes < 5) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-400">
          <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
          {label}
        </span>
      )
    }
    if (minutes < 30) {
      return (
        <span className="text-xs font-medium text-orange-400">
          ⚡ {label}
        </span>
      )
    }
    if (minutes < 1440) {
      return (
        <span className="text-xs font-semibold text-red-400">
          🔴 {label} — bel nu
        </span>
      )
    }
  }

  return <span className="text-xs text-zinc-500">{label}</span>
}
