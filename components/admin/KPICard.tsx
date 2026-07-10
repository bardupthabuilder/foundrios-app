import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'

type Trend = 'up' | 'down' | 'flat'

interface KPICardProps {
  label: string
  value: string | number
  sublabel?: string
  delta?: { value: string; trend: Trend }
  icon?: LucideIcon
  href?: string
  accent?: 'green' | 'amber' | 'red' | 'blue' | 'violet' | 'rose' | 'zinc'
}

const ACCENT_STYLES = {
  green: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  red: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  violet: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20' },
  rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
  zinc: { bg: 'bg-zinc-500/10', text: 'text-zinc-300', border: 'border-zinc-500/20' },
} as const

const TREND_STYLES = {
  up: 'text-emerald-400',
  down: 'text-red-400',
  flat: 'text-zinc-400',
} as const

const TREND_ICONS = { up: '↑', down: '↓', flat: '→' } as const

export function KPICard({ label, value, sublabel, delta, icon: Icon, href, accent = 'zinc' }: KPICardProps) {
  const style = ACCENT_STYLES[accent]

  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{label}</p>
        {Icon && (
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${style.bg}`}>
            <Icon className={`h-4 w-4 ${style.text}`} />
          </div>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
        {delta && (
          <span className={`text-xs font-medium ${TREND_STYLES[delta.trend]}`}>
            {TREND_ICONS[delta.trend]} {delta.value}
          </span>
        )}
      </div>
      {sublabel && <p className="mt-1 text-xs text-zinc-500">{sublabel}</p>}
    </>
  )

  if (href) {
    return (
      <Link
        href={href}
        className="rounded-xl border border-white/5 bg-foundri-deep p-4 transition-colors hover:border-white/10 hover:bg-foundri-deep/80"
      >
        {inner}
      </Link>
    )
  }

  return (
    <div className="rounded-xl border border-white/5 bg-foundri-deep p-4">
      {inner}
    </div>
  )
}
