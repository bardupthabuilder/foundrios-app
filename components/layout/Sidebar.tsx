'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Inbox,
  Users,
  FolderOpen,
  CalendarDays,
  Clock,
  HardHat,
  Settings,
  CreditCard,
  LogOut,
  Menu,
  X,
  FileText,
  Receipt,
  ClipboardList,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const navGroups = [
  {
    label: null,
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Acquisitie',
    items: [
      { href: '/dashboard/leads', label: 'Leads', icon: Inbox },
      { href: '/dashboard/klanten', label: 'Klanten', icon: Users },
    ],
  },
  {
    label: 'Uitvoering',
    items: [
      { href: '/dashboard/projecten', label: 'Projecten', icon: FolderOpen },
      { href: '/dashboard/planning', label: 'Planning', icon: CalendarDays },
      { href: '/dashboard/uren', label: 'Uren', icon: Clock },
      { href: '/dashboard/werkbonnen', label: 'Werkbonnen', icon: ClipboardList },
    ],
  },
  {
    label: 'Financieel',
    items: [
      { href: '/dashboard/offertes', label: 'Offertes', icon: FileText },
      { href: '/dashboard/facturen', label: 'Facturen', icon: Receipt },
    ],
  },
  {
    label: 'Team',
    items: [
      { href: '/dashboard/team', label: 'Medewerkers', icon: HardHat },
    ],
  },
  {
    label: 'Systeem',
    items: [
      { href: '/dashboard/settings', label: 'Instellingen', icon: Settings },
      { href: '/dashboard/billing', label: 'Abonnement', icon: CreditCard },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  const navContent = (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 border-b px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-white text-xs font-bold">
          V
        </div>
        <span className="font-semibold tracking-tight">Vakbedrijf OS</span>
      </div>

      {/* Nav Groups */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-3">
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <div className="mt-4 mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                {group.label}
              </div>
            )}
            {group.items.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-zinc-100 text-zinc-900'
                      : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="border-t px-3 py-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-700"
        >
          <LogOut className="h-4 w-4" />
          Uitloggen
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile header */}
      <div className="fixed inset-x-0 top-0 z-50 flex h-14 items-center gap-3 border-b bg-white px-4 lg:hidden">
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-zinc-600">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-zinc-900 text-white text-[10px] font-bold">
            V
          </div>
          <span className="text-sm font-semibold">Vakbedrijf OS</span>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 pt-14 lg:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="h-full w-64 bg-white flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {navContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex h-screen w-60 shrink-0 flex-col border-r bg-white">
        {navContent}
      </aside>
    </>
  )
}
