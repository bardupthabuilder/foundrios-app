import Image from 'next/image'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-foundri-graphite px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <Image src="/logo.svg" alt="FoundriOS" width={28} height={28} />
          <span className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-white">
            Foundri<span className="text-foundri-yellow">OS</span>
          </span>
        </Link>
        {children}
      </div>
    </div>
  )
}
