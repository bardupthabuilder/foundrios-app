'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Inbox, ClipboardList, CalendarDays, Plus, FileText } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Vandaag' },
  { href: '/dashboard/leads', icon: Inbox, label: 'Aanvragen' },
  { href: '/dashboard/werkbonnen', icon: ClipboardList, label: 'Werkbonnen' },
  { href: '/dashboard/planning', icon: CalendarDays, label: 'Planning' },
]

const quickActions = [
  {
    href: '/dashboard/werkbonnen',
    icon: ClipboardList,
    color: 'text-blue-400',
    label: 'Werkbon',
    sub: 'Dagelijkse uitvoering vastleggen',
  },
  {
    href: '/dashboard/leads',
    icon: Inbox,
    color: 'text-green-400',
    label: 'Aanvraag',
    sub: 'Nieuwe aanvraag registreren',
  },
  {
    href: '/dashboard/offertes',
    icon: FileText,
    color: 'text-foundri-yellow',
    label: 'Offerte',
    sub: 'Nieuwe offerte opstellen',
  },
]

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [showQuick, setShowQuick] = useState(false)

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <>
      <nav className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-foundri-surface border-t border-white/5 flex items-center pb-safe">
        {tabs.slice(0, 2).map(tab => {
          const Icon = tab.icon
          const active = isActive(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 pt-3 pb-3 text-[10px] font-medium transition-colors',
                active ? 'text-white' : 'text-zinc-500 active:text-zinc-300'
              )}
            >
              <Icon className={cn('h-5 w-5', active && 'drop-shadow-sm')} />
              {tab.label}
            </Link>
          )
        })}

        {/* Center FAB */}
        <div className="flex flex-col items-center pb-2 pt-1 px-3">
          <button
            onClick={() => setShowQuick(true)}
            className="flex h-13 w-13 items-center justify-center rounded-full bg-foundri-yellow text-black shadow-lg active:scale-95 transition-transform"
            style={{ width: 52, height: 52 }}
          >
            <Plus className="h-6 w-6" strokeWidth={2.5} />
          </button>
        </div>

        {tabs.slice(2).map(tab => {
          const Icon = tab.icon
          const active = isActive(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 pt-3 pb-3 text-[10px] font-medium transition-colors',
                active ? 'text-white' : 'text-zinc-500 active:text-zinc-300'
              )}
            >
              <Icon className={cn('h-5 w-5', active && 'drop-shadow-sm')} />
              {tab.label}
            </Link>
          )
        })}
      </nav>

      {/* Quick create sheet */}
      {showQuick && (
        <div
          className="fixed inset-0 z-50 flex items-end lg:hidden"
          onClick={() => setShowQuick(false)}
        >
          <div
            className="w-full rounded-t-2xl bg-foundri-deep border-t border-white/5 p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-white/15 mx-auto mb-5" />
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">Nieuw aanmaken</p>
            <div className="space-y-2 pb-safe">
              {quickActions.map(action => {
                const Icon = action.icon
                return (
                  <button
                    key={action.href}
                    onClick={() => { setShowQuick(false); router.push(action.href) }}
                    className="flex w-full items-center gap-4 rounded-xl bg-foundri-card active:bg-foundri-hover p-4 text-left transition-colors"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5">
                      <Icon className={cn('h-5 w-5', action.color)} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{action.label}</div>
                      <div className="text-xs text-zinc-400">{action.sub}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
