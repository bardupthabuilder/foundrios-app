import Link from 'next/link'

export default function WorkforceAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-sm">
        <Link href="/workforce" className="mb-8 flex items-center justify-center gap-2">
          <span className="text-xl font-bold tracking-tight text-white">
            Foundri<span className="text-indigo-500">.</span>
          </span>
        </Link>
        {children}
      </div>
    </div>
  )
}
