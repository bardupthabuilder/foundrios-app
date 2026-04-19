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
  Shield,
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
  TrendingUp,
  Zap,
  ListChecks,
  Brain,
  Plug,
} from 'lucide-react'
import { NotificationBell } from '@/components/NotificationBell'
import { TenantSwitcher } from '@/components/layout/TenantSwitcher'
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
      { href: '/dashboard/financieel', label: 'Overzicht', icon: TrendingUp },
      { href: '/dashboard/offertes', label: 'Offertes', icon: FileText },
      { href: '/dashboard/facturen', label: 'Facturen', icon: Receipt },
    ],
  },
  {
    label: 'Systeem',
    items: [
      { href: '/dashboard/content', label: 'Content', icon: Newspaper },
      { href: '/dashboard/team', label: 'Medewerkers', icon: HardHat },
      { href: '/dashboard/inzichten', label: 'Inzichten', icon: Brain },
      { href: '/dashboard/settings', label: 'Instellingen', icon: Settings },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [tenantName, setTenantName] = useState('FoundriOS')
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    fetch('/api/tenant')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.name) setTenantName(data.name) })
      .catch(() => {})
    fetch('/api/admin/stats')
      .then(r => setIsAdmin(r.ok))
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
      <div className="flex h-16 items-center justify-between gap-2 border-b border-white/5 px-4">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Image src="/logo.svg" alt="FoundriOS" width={24} height={24} className="shrink-0" />
          <TenantSwitcher currentName={tenantName} />
        </div>
        <NotificationBell />
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

      {/* Admin + Logout */}
      <div className="border-t border-white/5 px-3 py-4 space-y-1">
        {isAdmin && (
          <Link
            href="/admin"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foundri-yellow transition-colors hover:bg-foundri-yellow/10"
          >
            <Shield className="h-4 w-4" />
            Admin
          </Link>
        )}
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
      <div className="fixed inset-x-0 top-0 z-50 flex h-14 items-center gap-3 border-b border-white/5 bg-foundri-surface px-4 lg:hidden">
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
            className="h-full w-64 bg-foundri-surface flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {navContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex h-screen w-60 shrink-0 flex-col border-r border-white/5 bg-foundri-surface">
        {navContent}
      </aside>
    </>
  )
}
