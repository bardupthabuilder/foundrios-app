'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Building2, User, Check } from 'lucide-react'

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

    // Stap 3 → submit
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

  return (
    <Card className="w-full">
      {/* Progress indicator */}
      <div className="flex gap-1.5 px-6 pt-6">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              s <= step ? 'bg-zinc-900' : 'bg-zinc-200'
            }`}
          />
        ))}
      </div>

      {/* Stap 1: Bedrijf */}
      {step === 1 && (
        <>
          <CardHeader>
            <div className="mb-1 flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100">
              <Building2 className="h-5 w-5 text-zinc-600" />
            </div>
            <CardTitle>Jouw bedrijf</CardTitle>
            <CardDescription>
              Basisgegevens om je dashboard in te richten.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="companyName">Bedrijfsnaam</Label>
              <Input
                id="companyName"
                placeholder="Jansen Hoveniers"
                value={form.companyName}
                onChange={(e) => update('companyName', e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Branche</Label>
              <Select value={form.niche} onValueChange={(v) => update('niche', v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Kies je branche" />
                </SelectTrigger>
                <SelectContent>
                  {NICHES.map((n) => (
                    <SelectItem key={n.value} value={n.value}>
                      {n.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="region">Werkgebied</Label>
              <Input
                id="region"
                placeholder="bijv. Regio Rotterdam, Noord-Holland"
                value={form.region}
                onChange={(e) => update('region', e.target.value)}
              />
            </div>
          </CardContent>
        </>
      )}

      {/* Stap 2: Eigenaar */}
      {step === 2 && (
        <>
          <CardHeader>
            <div className="mb-1 flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100">
              <User className="h-5 w-5 text-zinc-600" />
            </div>
            <CardTitle>Over jou</CardTitle>
            <CardDescription>
              Zodat we je kunnen bereiken als het ertoe doet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="ownerName">Naam</Label>
              <Input
                id="ownerName"
                placeholder="Jan Jansen"
                value={form.ownerName}
                onChange={(e) => update('ownerName', e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerPhone">Telefoonnummer</Label>
              <Input
                id="ownerPhone"
                type="tel"
                placeholder="06 12345678"
                value={form.ownerPhone}
                onChange={(e) => update('ownerPhone', e.target.value)}
              />
            </div>
          </CardContent>
        </>
      )}

      {/* Stap 3: Klaar */}
      {step === 3 && (
        <>
          <CardHeader>
            <div className="mb-1 flex h-9 w-9 items-center justify-center rounded-lg bg-green-100">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <CardTitle>Klaar om te starten</CardTitle>
            <CardDescription>
              Je dashboard wordt ingericht voor {form.companyName}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="space-y-3 rounded-lg bg-zinc-50 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Bedrijf</span>
                <span className="font-medium">{form.companyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Branche</span>
                <span className="font-medium">
                  {NICHES.find((n) => n.value === form.niche)?.label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Werkgebied</span>
                <span className="font-medium">{form.region}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Eigenaar</span>
                <span className="font-medium">{form.ownerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Telefoon</span>
                <span className="font-medium">{form.ownerPhone}</span>
              </div>
            </div>
            <p className="mt-4 text-xs text-zinc-400">
              Je kunt later alles aanpassen en uitbreiden in Instellingen.
            </p>
          </CardContent>
        </>
      )}

      <CardFooter className="flex gap-2">
        {step > 1 && (
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => setStep(step - 1)}
            disabled={loading}
          >
            Terug
          </Button>
        )}
        <Button
          type="button"
          className="flex-1"
          onClick={handleNext}
          disabled={!canContinue() || loading}
        >
          {loading
            ? 'Account inrichten...'
            : step === 3
              ? 'Start mijn dashboard'
              : 'Volgende'}
        </Button>
      </CardFooter>
    </Card>
  )
}
