import { redirect } from 'next/navigation'
import { requireSuperadmin } from '@/lib/admin'
import Link from 'next/link'
import Image from 'next/image'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireSuperadmin()
  } catch {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen bg-foundri-graphite">
      <aside className="hidden lg:flex w-56 shrink-0 flex-col border-r border-white/5 bg-foundri-surface">
        <div className="flex h-16 items-center gap-2.5 border-b border-white/5 px-5">
          <Image src="/logo.svg" alt="FoundriOS" width={24} height={24} />
          <span className="font-semibold text-white">Admin</span>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          <Link href="/admin" className="rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-white/5 hover:text-white">
            Dashboard
          </Link>
          <Link href="/admin/tenants" className="rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-white/5 hover:text-white">
            Bedrijven
          </Link>
          <Link href="/admin/cron" className="rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-white/5 hover:text-white">
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
