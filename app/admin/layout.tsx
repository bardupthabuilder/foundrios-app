'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Loader2 } from 'lucide-react'

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
        <nav className="flex flex-col gap-1 p-3">
          <Link href="/admin" className={`rounded-lg px-3 py-2 text-sm transition-colors ${pathname === '/admin' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}>
            Dashboard
          </Link>
          <Link href="/admin/tenants" className={`rounded-lg px-3 py-2 text-sm transition-colors ${pathname.startsWith('/admin/tenants') ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}>
            Bedrijven
          </Link>
          <Link href="/admin/blog" className={`rounded-lg px-3 py-2 text-sm transition-colors ${pathname.startsWith('/admin/blog') ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}>
            Blog
          </Link>
          <Link href="/admin/kennisbank" className={`rounded-lg px-3 py-2 text-sm transition-colors ${pathname.startsWith('/admin/kennisbank') ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}>
            Kennisbank
          </Link>
          <Link href="/admin/templates" className={`rounded-lg px-3 py-2 text-sm transition-colors ${pathname.startsWith('/admin/templates') ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}>
            Templates
          </Link>
          <Link href="/admin/cron" className={`rounded-lg px-3 py-2 text-sm transition-colors ${pathname.startsWith('/admin/cron') ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}>
            Cron Jobs
          </Link>
          <div className="my-2 border-t border-white/5" />
          <Link href="/dashboard" className="rounded-lg px-3 py-2 text-sm text-zinc-500 hover:bg-white/5 hover:text-zinc-300">
            &#8592; Terug naar app
          </Link>
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
    </div>
  )
}
