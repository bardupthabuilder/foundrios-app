'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { Loader2 } from 'lucide-react'

export default function DemoPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [retrying, setRetrying] = useState(false)

  async function startDemo() {
    setError(null)
    setRetrying(true)
    try {
      const res = await fetch('/api/demo/quick-start', { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Er ging iets mis bij het starten van de demo.')
        setRetrying(false)
        return
      }

      const supabase = createClient()
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      })

      if (sessionError) {
        setError('Sessie kon niet worden ingesteld. Probeer opnieuw.')
        setRetrying(false)
        return
      }

      router.push('/dashboard')
    } catch {
      setError('Netwerkfout — controleer je verbinding en probeer opnieuw.')
      setRetrying(false)
    }
  }

  useEffect(() => {
    startDemo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-foundri-graphite px-4">
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <Image src="/logo.svg" alt="FoundriOS" width={32} height={32} />
        <span className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-white">
          Foundri<span className="text-foundri-yellow">OS</span>
        </span>
      </div>

      {error ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={startDemo}
            disabled={retrying}
            className="rounded-md border border-white/10 bg-foundri-card px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-foundri-hover disabled:opacity-50"
          >
            {retrying ? 'Opnieuw proberen...' : 'Opnieuw proberen'}
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-foundri-yellow" />
          <div>
            <p className="font-[family-name:var(--font-display)] text-lg font-semibold text-white">
              Demo wordt geladen...
            </p>
            <p className="mt-1 text-sm text-foundri-muted">
              Je persoonlijke demo-omgeving wordt ingericht
            </p>
          </div>
          <div className="mt-2 flex flex-col items-center gap-1.5 rounded-lg border border-white/5 bg-foundri-deep px-6 py-4 text-sm text-foundri-muted">
            <span>✓ Demo account aanmaken</span>
            <span>✓ Realistische data laden</span>
            <span>✓ Dashboard klaarzetten</span>
          </div>
        </div>
      )}
    </div>
  )
}
