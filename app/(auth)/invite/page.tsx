'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UserPlus, Loader2, CheckCircle, XCircle } from 'lucide-react'

export default function InvitePage() {
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
        // Niet ingelogd — stuur naar registratie met token
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

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        {status === 'accepting' && (
          <>
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
            </div>
            <CardTitle>Uitnodiging accepteren...</CardTitle>
            <CardDescription>Je wordt gekoppeld aan het bedrijf.</CardDescription>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <CardTitle>Welkom!</CardTitle>
            <CardDescription>Je bent gekoppeld. Je wordt doorgestuurd naar het dashboard...</CardDescription>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <CardTitle>Uitnodiging mislukt</CardTitle>
            <CardDescription>{error}</CardDescription>
          </>
        )}
        {status === 'no-token' && (
          <>
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100">
              <UserPlus className="h-5 w-5 text-zinc-600" />
            </div>
            <CardTitle>Geen uitnodiging</CardTitle>
            <CardDescription>Er is geen geldige uitnodigingslink gevonden.</CardDescription>
          </>
        )}
      </CardHeader>
      {(status === 'error' || status === 'no-token') && (
        <CardContent className="flex justify-center">
          <Button variant="outline" onClick={() => router.push('/login')}>
            Naar inloggen
          </Button>
        </CardContent>
      )}
    </Card>
  )
}
