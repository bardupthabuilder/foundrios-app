'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, Bot, Cpu, BookOpen } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/workforce/dashboard', label: 'Leads', icon: Users },
  { href: '/workforce/dashboard/agents', label: 'Agents', icon: Bot },
  { href: '/workforce/dashboard/runs', label: 'Runs', icon: Cpu },
  { href: '/workforce/dashboard/knowledge', label: 'Knowledge', icon: BookOpen },
]

export function WorkforceSidebar({ tenantName }: { tenantName?: string }) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile top bar */}
      <header className="fixed top-0 left-0 right-0 z-30 flex h-14 items-center justify-between border-b border-white/10 bg-[#0a0a0a] px-4 lg:hidden">
        <Link href="/workforce/dashboard" className="text-lg font-semibold tracking-tight text-white">
          Foundri<span className="text-indigo-500">.</span>
        </Link>
        <nav className="flex gap-3">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = item.href === '/workforce/dashboard'
              ? pathname === '/workforce/dashboard' || pathname.startsWith('/workforce/dashboard/leads/')
              : pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md p-2 transition-colors ${
                  isActive ? 'bg-indigo-600/20 text-indigo-400' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
              </Link>
            )
          })}
        </nav>
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-56 lg:flex-col lg:border-r lg:border-white/10 lg:bg-[#0a0a0a]">
        <div className="flex h-14 items-center px-5 border-b border-white/10">
          <Link href="/workforce/dashboard" className="text-lg font-semibold tracking-tight text-white">
            Foundri<span className="text-indigo-500">.</span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = item.href === '/workforce/dashboard'
              ? pathname === '/workforce/dashboard' || pathname.startsWith('/workforce/dashboard/leads/')
              : pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-400 font-medium'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {tenantName && (
          <div className="border-t border-white/10 px-5 py-3">
            <p className="text-xs text-neutral-500 truncate">{tenantName}</p>
          </div>
        )}
      </aside>
    </>
  )
}
