'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Check } from 'lucide-react'

const NICHES = [
  { value: 'hoveniers', label: 'Hoveniers' },
  { value: 'aannemers', label: 'Aannemers' },
  { value: 'dakdekkers', label: 'Dakdekkers' },
  { value: 'installateurs', label: 'Installateurs' },
  { value: 'badkamer-keuken', label: 'Badkamer & Keuken' },
  { value: 'bouw-verbouw', label: 'Bouw & Verbouw' },
  { value: 'schilders', label: 'Schilders' },
  { value: 'elektra', label: 'Elektra' },
  { value: 'overig', label: 'Overig' },
]

export default function WorkforceOnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    companyName: '',
    niche: '',
    region: '',
  })

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  const canSubmit = form.companyName.trim().length >= 2 && form.niche

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/workforce/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(typeof data.error === 'string' ? data.error : `Fout ${res.status}`)
        setLoading(false)
        return
      }

      router.push('/workforce/dashboard')
      router.refresh()
    } catch {
      setError('Netwerkfout — probeer opnieuw.')
      setLoading(false)
    }
  }

  const inputClass = 'w-full rounded-md border-0 bg-neutral-800 px-3 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none'

  return (
    <div className="rounded-lg border border-white/10 bg-neutral-900 p-6">
      <div className="mb-6">
        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-neutral-800">
          <Building2 className="h-5 w-5 text-indigo-400" />
        </div>
        <h1 className="text-xl font-bold text-white">Je bedrijf instellen</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Zodat je agents weten voor wie ze werken.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        )}
        <div className="space-y-2">
          <label htmlFor="companyName" className="text-sm font-medium text-neutral-300">Bedrijfsnaam</label>
          <input
            id="companyName"
            placeholder="Jansen Hoveniers"
            value={form.companyName}
            onChange={(e) => update('companyName', e.target.value)}
            autoFocus
            className={inputClass}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-300">Branche</label>
          <select
            value={form.niche}
            onChange={(e) => update('niche', e.target.value)}
            className={`${inputClass} ${!form.niche ? 'text-neutral-500' : ''}`}
          >
            <option value="" disabled>Kies je branche</option>
            {NICHES.map((n) => (
              <option key={n.value} value={n.value}>{n.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="region" className="text-sm font-medium text-neutral-300">Werkgebied</label>
          <input
            id="region"
            placeholder="bijv. Regio Rotterdam, Noord-Holland"
            value={form.region}
            onChange={(e) => update('region', e.target.value)}
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          disabled={!canSubmit || loading}
          className="w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            'Account inrichten...'
          ) : (
            <>
              <Check className="h-4 w-4" />
              Start mijn dashboard
            </>
          )}
        </button>
      </form>
    </div>
  )
}
