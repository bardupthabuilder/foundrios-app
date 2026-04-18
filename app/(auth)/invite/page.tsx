'use client'

import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { UserPlus, Loader2, CheckCircle, XCircle } from 'lucide-react'

function InviteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'loading' | 'accepting' | 'success' | 'error' | 'no-token'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setStatus('no-token')
      return
    }
    setStatus('accepting')
    acceptInvite()
  }, [token])

  async function acceptInvite() {
    try {
      const res = await fetch('/api/tenant/invites/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      if (res.ok) {
        setStatus('success')
        setTimeout(() => {
          router.push('/dashboard')
          router.refresh()
        }, 2000)
      } else if (res.status === 401) {
        router.push(`/register?invite=${token}`)
      } else {
        const data = await res.json().catch(() => null)
        setError(data?.error || 'Er ging iets mis')
        setStatus('error')
      }
    } catch {
      setError('Netwerkfout — probeer opnieuw')
      setStatus('error')
    }
  }

  const iconWrap = 'mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-foundri-border'

  return (
    <div className="w-full rounded-lg border border-foundri-border bg-foundri-deep p-6 text-center">
      {status === 'accepting' && (
        <>
          <div className={`${iconWrap} bg-foundri-card`}>
            <Loader2 className="h-5 w-5 text-foundri-yellow animate-spin" />
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-white">Uitnodiging accepteren...</h1>
          <p className="mt-1 text-sm text-foundri-muted">Je wordt gekoppeld aan het bedrijf.</p>
        </>
      )}
      {status === 'success' && (
        <>
          <div className={`${iconWrap} border-foundri-yellow/30 bg-foundri-yellow/10`}>
            <CheckCircle className="h-5 w-5 text-foundri-yellow" />
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-white">Welkom!</h1>
          <p className="mt-1 text-sm text-foundri-muted">Je bent gekoppeld. Je wordt doorgestuurd naar het dashboard...</p>
        </>
      )}
      {status === 'error' && (
        <>
          <div className={`${iconWrap} border-red-500/30 bg-red-500/10`}>
            <XCircle className="h-5 w-5 text-red-400" />
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-white">Uitnodiging mislukt</h1>
          <p className="mt-1 text-sm text-foundri-muted">{error}</p>
        </>
      )}
      {status === 'no-token' && (
        <>
          <div className={`${iconWrap} bg-foundri-card`}>
            <UserPlus className="h-5 w-5 text-foundri-muted" />
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-white">Geen uitnodiging</h1>
          <p className="mt-1 text-sm text-foundri-muted">Er is geen geldige uitnodigingslink gevonden.</p>
        </>
      )}
      {(status === 'error' || status === 'no-token') && (
        <button
          onClick={() => router.push('/login')}
          className="mt-6 rounded-md border border-foundri-border bg-transparent px-4 py-2 text-sm font-medium text-foundri-text transition-colors hover:bg-foundri-card"
        >
          Naar inloggen
        </button>
      )}
    </div>
  )
}

export default function InvitePage() {
  return (
    <Suspense fallback={
      <div className="w-full rounded-lg border border-foundri-border bg-foundri-deep p-6 text-center">
        <Loader2 className="mx-auto h-5 w-5 text-foundri-yellow animate-spin" />
        <p className="mt-3 text-sm text-foundri-muted">Laden...</p>
      </div>
    }>
      <InviteContent />
    </Suspense>
  )
}
