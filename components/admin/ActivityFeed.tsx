import type { LucideIcon } from 'lucide-react'

export interface ActivityItem {
  id: string
  icon?: LucideIcon
  iconColor?: string
  title: string
  subtitle?: string
  timestamp: string | Date
  href?: string
}

interface ActivityFeedProps {
  items: ActivityItem[]
  emptyText?: string
}

function formatRelative(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const diffMs = Date.now() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'zojuist'
  if (diffMin < 60) return `${diffMin} min`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr} uur`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay} dag${diffDay > 1 ? 'en' : ''}`
  if (diffDay < 30) return `${Math.floor(diffDay / 7)} wk`
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
}

export function ActivityFeed({ items, emptyText = 'Geen recente activiteit' }: ActivityFeedProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-white/5 bg-foundri-deep p-6 text-center">
        <p className="text-sm text-zinc-500">{emptyText}</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-white/5 bg-foundri-deep overflow-hidden">
      <ul className="divide-y divide-white/5">
        {items.map(item => {
          const Icon = item.icon
          const inner = (
            <div className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">
              {Icon && (
                <div className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-500/10 shrink-0`}>
                  <Icon className={`h-3.5 w-3.5 ${item.iconColor ?? 'text-zinc-400'}`} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-200 truncate">{item.title}</p>
                {item.subtitle && <p className="text-xs text-zinc-500 truncate mt-0.5">{item.subtitle}</p>}
              </div>
              <span className="text-xs text-zinc-600 shrink-0 mt-0.5">{formatRelative(item.timestamp)}</span>
            </div>
          )
          if (item.href) {
            return (
              <li key={item.id}>
                <a href={item.href} className="block">{inner}</a>
              </li>
            )
          }
          return <li key={item.id}>{inner}</li>
        })}
      </ul>
    </div>
  )
}
