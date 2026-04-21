'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function WorkforceLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Onjuist e-mailadres of wachtwoord.')
      setLoading(false)
      return
    }

    router.push('/workforce/dashboard')
    router.refresh()
  }

  return (
    <div className="rounded-lg border border-white/10 bg-neutral-900 p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Inloggen</h1>
        <p className="mt-1 text-sm text-neutral-400">Log in op je Workforce account</p>
      </div>
      <form onSubmit={handleLogin} className="space-y-4">
        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        )}
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-neutral-300">E-mailadres</label>
          <input
            id="email"
            type="email"
            placeholder="jij@bedrijf.nl"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full rounded-md border-0 bg-neutral-800 px-3 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-neutral-300">Wachtwoord</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full rounded-md border-0 bg-neutral-800 px-3 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? 'Inloggen...' : 'Inloggen'}
        </button>
        <p className="text-center text-sm text-neutral-400">
          Nog geen account?{' '}
          <Link href="/workforce/register" className="font-medium text-indigo-400 hover:underline underline-offset-4">
            Registreer hier
          </Link>
        </p>
      </form>
    </div>
  )
}
