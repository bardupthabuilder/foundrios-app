'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Loader2, LayoutDashboard, Building2, Users, Activity,
  BookOpen, BookOpenCheck, FileText, Newspaper, MessageSquare, Heart, Clock, Sparkles, Briefcase,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => {
        if (r.ok) {
          setAuthorized(true)
        } else {
          router.push('/dashboard')
        }
      })
      .catch(() => router.push('/dashboard'))
      .finally(() => setLoading(false))
  }, [router])

  if (loading || !authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-foundri-graphite">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-foundri-graphite">
      <aside className="hidden lg:flex w-56 shrink-0 flex-col border-r border-white/5 bg-foundri-surface">
        <div className="flex h-16 items-center gap-2.5 border-b border-white/5 px-5">
          <Image src="/logo.svg" alt="FoundriOS" width={24} height={24} />
          <span className="font-semibold text-white">Admin</span>
        </div>
        <nav className="flex flex-col gap-0.5 p-3 overflow-y-auto">
          <NavItem href="/admin" icon={LayoutDashboard} label="Cockpit" pathname={pathname} exact />

          <NavGroup label="Klanten" />
          <NavItem href="/admin/tenants" icon={Building2} label="Bedrijven" pathname={pathname} />
          <NavItem href="/admin/managed-requests" icon={Briefcase} label="Managed Aanvragen" pathname={pathname} />
          <NavItem href="/admin/gebruikers" icon={Users} label="Gebruikers" pathname={pathname} />
          <NavItem href="/admin/activity" icon={Activity} label="Activiteit" pathname={pathname} />

          <NavGroup label="Content" />
          <NavItem href="/admin/playbooks" icon={BookOpenCheck} label="Playbooks" pathname={pathname} />
          <NavItem href="/admin/content-studio" icon={Sparkles} label="Content Studio" pathname={pathname} />
          <NavItem href="/admin/kennisbank" icon={BookOpen} label="Kennisbank" pathname={pathname} />
          <NavItem href="/admin/templates" icon={FileText} label="Templates" pathname={pathname} />
          <NavItem href="/admin/blog" icon={Newspaper} label="Blog" pathname={pathname} />

          <NavGroup label="Operations" />
          <NavItem href="/admin/feedback" icon={MessageSquare} label="Feedback" pathname={pathname} />
          <NavItem href="/admin/health" icon={Heart} label="Health" pathname={pathname} />
          <NavItem href="/admin/cron" icon={Clock} label="Cron Jobs" pathname={pathname} />

          <div className="my-3 border-t border-white/5" />
          <Link href="/dashboard" className="rounded-lg px-3 py-2 text-sm text-zinc-500 hover:bg-white/5 hover:text-zinc-300">
            &#8592; Terug naar app
          </Link>
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
    </div>
  )
}

function NavGroup({ label }: { label: string }) {
  return (
    <div className="mt-3 mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
      {label}
    </div>
  )
}

function NavItem({ href, icon: Icon, label, pathname, exact }: {
  href: string
  icon: LucideIcon
  label: string
  pathname: string
  exact?: boolean
}) {
  const active = exact ? pathname === href : pathname.startsWith(href)
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
        active ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  )
}
