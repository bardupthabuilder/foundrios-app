'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)
  const [sentTo, setSentTo] = useState('')

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password.length < 8) {
      setError('Wachtwoord moet minimaal 8 tekens bevatten.')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data.session) {
      // Email autoconfirm aan — meteen door naar onboarding
      router.push('/onboarding')
    } else {
      // Email confirmatie vereist — toon instructie
      setSentTo(email)
      setEmailSent(true)
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="rounded-lg border border-foundri-border bg-foundri-deep p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-foundri-yellow/30 bg-foundri-yellow/10">
          <Mail className="h-6 w-6 text-foundri-yellow" />
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-white">Controleer je inbox</h1>
        <p className="mt-2 text-sm text-foundri-muted">
          We hebben een bevestigingslink gestuurd naar
        </p>
        <p className="mt-1 text-sm font-medium text-white">{sentTo}</p>
        <p className="mt-4 text-sm text-foundri-muted">
          Klik op de link in de mail om je account te activeren en door te gaan met het inrichten van je dashboard.
        </p>
        <p className="mt-6 text-xs text-foundri-muted">
          Geen mail ontvangen?{' '}
          <button
            onClick={() => setEmailSent(false)}
            className="font-medium text-foundri-yellow hover:underline underline-offset-4"
          >
            Probeer opnieuw
          </button>
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-foundri-border bg-foundri-deep p-6">
      <div className="mb-6">
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-white">Account aanmaken</h1>
        <p className="mt-1 text-sm text-foundri-muted">
          Start je gratis trial van 14 dagen — geen creditcard vereist
        </p>
      </div>
      <form onSubmit={handleRegister} className="space-y-4">
        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        )}
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-foundri-text">E-mailadres</label>
          <input
            id="email"
            type="email"
            placeholder="jij@bedrijf.nl"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full rounded-md border-0 bg-foundri-card px-3 py-2.5 text-sm text-white placeholder:text-foundri-muted focus:ring-2 focus:ring-foundri-yellow/50 focus:outline-none"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-foundri-text">Wachtwoord</label>
          <input
            id="password"
            type="password"
            placeholder="Minimaal 8 tekens"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            minLength={8}
            className="w-full rounded-md border-0 bg-foundri-card px-3 py-2.5 text-sm text-white placeholder:text-foundri-muted focus:ring-2 focus:ring-foundri-yellow/50 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-gradient-to-br from-foundri-yellow to-foundri-yellow-dim px-4 py-2.5 text-sm font-semibold text-foundri-graphite transition-all hover:shadow-[0_0_20px_rgba(246,201,69,0.3)] disabled:opacity-50"
        >
          {loading ? 'Account aanmaken...' : 'Account aanmaken'}
        </button>
        <p className="text-center text-sm text-foundri-muted">
          Al een account?{' '}
          <Link href="/login" className="font-medium text-foundri-yellow hover:underline underline-offset-4">
            Log hier in
          </Link>
        </p>
      </form>
    </div>
  )
}
