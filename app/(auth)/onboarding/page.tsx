'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, User, Check, ChevronRight, ChevronLeft } from 'lucide-react'

const NICHES = [
  { value: 'hoveniers', label: 'Hoveniers' },
  { value: 'dakdekkers', label: 'Dakdekkers' },
  { value: 'installateurs', label: 'Installateurs' },
  { value: 'badkamer-keuken', label: 'Badkamer & Keuken' },
  { value: 'bouw-verbouw', label: 'Bouw & Verbouw' },
  { value: 'schilders', label: 'Schilders' },
  { value: 'elektra', label: 'Elektra' },
  { value: 'schoonmaak', label: 'Schoonmaak' },
  { value: 'overig', label: 'Overig' },
]

type FormData = {
  companyName: string
  niche: string
  region: string
  ownerName: string
  ownerPhone: string
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>({
    companyName: '',
    niche: '',
    region: '',
    ownerName: '',
    ownerPhone: '',
  })

  function update(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  function canContinue(): boolean {
    if (step === 1) return !!form.companyName.trim() && !!form.niche && !!form.region.trim()
    if (step === 2) return !!form.ownerName.trim() && !!form.ownerPhone.trim()
    return true
  }

  async function handleNext() {
    if (step < 3) {
      setStep(step + 1)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        let message = `Fout ${res.status}`
        try {
          const data = await res.json()
          message = typeof data.error === 'string' ? data.error : 'Er ging iets mis'
        } catch {}
        setError(message)
        setLoading(false)
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Netwerkfout — probeer opnieuw.')
      setLoading(false)
    }
  }

  const inputClass = 'w-full rounded-md border-0 bg-foundri-card px-3 py-2.5 text-sm text-white placeholder:text-foundri-muted focus:ring-2 focus:ring-foundri-yellow/50 focus:outline-none'

  return (
    <div className="w-full rounded-lg border border-foundri-border bg-foundri-deep">
      {/* Progress */}
      <div className="flex gap-1.5 px-6 pt-6">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              s <= step ? 'bg-foundri-yellow' : 'bg-foundri-card'
            }`}
          />
        ))}
      </div>

      <div className="p-6">
        {/* Stap 1: Bedrijf */}
        {step === 1 && (
          <>
            <div className="mb-6">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-foundri-border bg-foundri-card">
                <Building2 className="h-5 w-5 text-foundri-yellow" />
              </div>
              <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-white">Jouw bedrijf</h1>
              <p className="mt-1 text-sm text-foundri-muted">Basisgegevens om je dashboard in te richten.</p>
            </div>
            <div className="space-y-4">
              {error && (
                <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>
              )}
              <div className="space-y-2">
                <label htmlFor="companyName" className="text-sm font-medium text-foundri-text">Bedrijfsnaam</label>
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
                <label className="text-sm font-medium text-foundri-text">Branche</label>
                <select
                  value={form.niche}
                  onChange={(e) => update('niche', e.target.value)}
                  className={`${inputClass} ${!form.niche ? 'text-foundri-muted' : ''}`}
                >
                  <option value="" disabled>Kies je branche</option>
                  {NICHES.map((n) => (
                    <option key={n.value} value={n.value}>{n.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="region" className="text-sm font-medium text-foundri-text">Werkgebied</label>
                <input
                  id="region"
                  placeholder="bijv. Regio Rotterdam, Noord-Holland"
                  value={form.region}
                  onChange={(e) => update('region', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </>
        )}

        {/* Stap 2: Eigenaar */}
        {step === 2 && (
          <>
            <div className="mb-6">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-foundri-border bg-foundri-card">
                <User className="h-5 w-5 text-foundri-yellow" />
              </div>
              <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-white">Over jou</h1>
              <p className="mt-1 text-sm text-foundri-muted">Zodat we je kunnen bereiken als het ertoe doet.</p>
            </div>
            <div className="space-y-4">
              {error && (
                <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>
              )}
              <div className="space-y-2">
                <label htmlFor="ownerName" className="text-sm font-medium text-foundri-text">Naam</label>
                <input
                  id="ownerName"
                  placeholder="Jan Jansen"
                  value={form.ownerName}
                  onChange={(e) => update('ownerName', e.target.value)}
                  autoFocus
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="ownerPhone" className="text-sm font-medium text-foundri-text">Telefoonnummer</label>
                <input
                  id="ownerPhone"
                  type="tel"
                  placeholder="06 12345678"
                  value={form.ownerPhone}
                  onChange={(e) => update('ownerPhone', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </>
        )}

        {/* Stap 3: Klaar */}
        {step === 3 && (
          <>
            <div className="mb-6">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-foundri-yellow/30 bg-foundri-yellow/10">
                <Check className="h-5 w-5 text-foundri-yellow" />
              </div>
              <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-white">Klaar om te starten</h1>
              <p className="mt-1 text-sm text-foundri-muted">
                Je dashboard wordt ingericht voor {form.companyName}.
              </p>
            </div>
            {error && (
              <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>
            )}
            <div className="space-y-3 rounded-lg bg-foundri-card p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-foundri-muted">Bedrijf</span>
                <span className="font-medium text-white">{form.companyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foundri-muted">Branche</span>
                <span className="font-medium text-white">
                  {NICHES.find((n) => n.value === form.niche)?.label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-foundri-muted">Werkgebied</span>
                <span className="font-medium text-white">{form.region}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foundri-muted">Eigenaar</span>
                <span className="font-medium text-white">{form.ownerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foundri-muted">Telefoon</span>
                <span className="font-medium text-white">{form.ownerPhone}</span>
              </div>
            </div>
            <p className="mt-4 text-xs text-foundri-muted">
              Je kunt later alles aanpassen en uitbreiden in Instellingen.
            </p>
          </>
        )}

        {/* Buttons */}
        <div className="mt-6 flex gap-2">
          {step > 1 && (
            <button
              type="button"
              className="flex flex-1 items-center justify-center gap-1 rounded-md border border-foundri-border bg-transparent px-4 py-2.5 text-sm font-medium text-foundri-text transition-colors hover:bg-foundri-card"
              onClick={() => setStep(step - 1)}
              disabled={loading}
            >
              <ChevronLeft className="h-4 w-4" />
              Terug
            </button>
          )}
          <button
            type="button"
            className="flex flex-1 items-center justify-center gap-1 rounded-md bg-gradient-to-br from-foundri-yellow to-foundri-yellow-dim px-4 py-2.5 text-sm font-semibold text-foundri-graphite transition-all hover:shadow-[0_0_20px_rgba(246,201,69,0.3)] disabled:opacity-50"
            onClick={handleNext}
            disabled={!canContinue() || loading}
          >
            {loading
              ? 'Account inrichten...'
              : step === 3
                ? 'Start mijn dashboard'
                : 'Volgende'}
            {!loading && step < 3 && <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
