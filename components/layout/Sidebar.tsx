'use client'

import Image from 'next/image'
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
  Newspaper,
  CalendarCheck,
  Megaphone,
  GitBranch,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

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
      { href: '/dashboard/leads', label: 'Lead Inbox', icon: Inbox },
      { href: '/dashboard/pipeline', label: 'Pipeline', icon: GitBranch },
      { href: '/dashboard/klanten', label: 'Klanten', icon: Users },
      { href: '/dashboard/campagnes', label: 'Campagnes', icon: Megaphone },
    ],
  },
  {
    label: 'Uitvoering',
    items: [
      { href: '/dashboard/projecten', label: 'Projecten', icon: FolderOpen },
      { href: '/dashboard/planning', label: 'Planning', icon: CalendarDays },
      { href: '/dashboard/uren', label: 'Uren', icon: Clock },
      { href: '/dashboard/werkbonnen', label: 'Werkbonnen', icon: ClipboardList },
      { href: '/dashboard/onderhoud', label: 'Onderhoud', icon: CalendarCheck },
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
    label: 'Content',
    items: [
      { href: '/dashboard/content', label: 'Content', icon: Newspaper },
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
  const [tenantName, setTenantName] = useState('FoundriOS')

  useEffect(() => {
    fetch('/api/tenant')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.name) setTenantName(data.name) })
      .catch(() => {})
  }, [])

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
      <div className="flex h-16 items-center gap-2.5 border-b border-white/5 px-5">
        <Image src="/logo.svg" alt="FoundriOS" width={24} height={24} />
        <span className="font-semibold tracking-tight truncate text-white">{tenantName}</span>
      </div>

      {/* Nav Groups */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-3">
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <div className="mt-4 mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
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
                      ? 'bg-white/10 text-white'
                      : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
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
      <div className="border-t border-white/5 px-3 py-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-200"
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
      <div className="fixed inset-x-0 top-0 z-50 flex h-14 items-center gap-3 border-b border-white/5 bg-[#111317] px-4 lg:hidden">
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-zinc-300">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-zinc-900 text-white text-[10px] font-bold">
            {tenantName[0]?.toUpperCase() || 'F'}
          </div>
          <span className="text-sm font-semibold truncate">{tenantName}</span>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 pt-14 lg:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="h-full w-64 bg-[#111317] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {navContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex h-screen w-60 shrink-0 flex-col border-r border-white/5 bg-[#111317]">
        {navContent}
      </aside>
    </>
  )
}
