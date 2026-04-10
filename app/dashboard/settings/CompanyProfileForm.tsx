'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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

type Tenant = Record<string, unknown>

export function CompanyProfileForm({ tenant }: { tenant: Tenant | null }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: (tenant?.name as string) || '',
    niche: (tenant?.niche as string) || '',
    region: (tenant?.region as string) || '',
    owner_name: (tenant?.owner_name as string) || '',
    owner_phone: (tenant?.owner_phone as string) || '',
    description: (tenant?.description as string) || '',
    services: ((tenant?.services as string[]) || []).join(', '),
    avg_project_value: (tenant?.avg_project_value as string) || '',
    team_size: (tenant?.team_size as number)?.toString() || '',
    website: (tenant?.website as string) || '',
    email: (tenant?.email as string) || '',
    social_linkedin: (tenant?.social_linkedin as string) || '',
    social_instagram: (tenant?.social_instagram as string) || '',
    social_facebook: (tenant?.social_facebook as string) || '',
    social_google_business: (tenant?.social_google_business as string) || '',
    social_tiktok: (tenant?.social_tiktok as string) || '',
    premium_tagline: (tenant?.premium_tagline as string) || '',
    premium_guarantees: ((tenant?.premium_guarantees as string[]) || []).join('\n'),
    premium_usp: ((tenant?.premium_usp as string[]) || []).join('\n'),
    google_review_count: (tenant?.google_review_count as number)?.toString() || '',
    google_review_score: (tenant?.google_review_score as number)?.toString() || '',
  })

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setSaved(false)
    setError(null)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSaved(false)

    const payload: Record<string, unknown> = {
      ...form,
      services: form.services
        ? form.services.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      team_size: form.team_size ? parseInt(form.team_size) : null,
      premium_guarantees: form.premium_guarantees
        ? form.premium_guarantees.split('\n').map((s) => s.trim()).filter(Boolean)
        : [],
      premium_usp: form.premium_usp
        ? form.premium_usp.split('\n').map((s) => s.trim()).filter(Boolean)
        : [],
      google_review_count: form.google_review_count ? parseInt(form.google_review_count) : null,
      google_review_score: form.google_review_score ? parseFloat(form.google_review_score) : null,
    }

    try {
      const res = await fetch('/api/tenant', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error || `Fout ${res.status}`)
        setSaving(false)
        return
      }

      setSaved(true)
      router.refresh()
    } catch {
      setError('Netwerkfout — probeer opnieuw.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Bedrijfsgegevens */}
      <Card>
        <CardHeader>
          <CardTitle>Bedrijfsprofiel</CardTitle>
          <CardDescription>
            Hoe meer je invult, hoe beter het systeem voor je werkt.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Bedrijfsnaam</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Branche</Label>
              <Select value={form.niche} onValueChange={(v) => update('niche', v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Kies branche" />
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
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="region">Werkgebied</Label>
              <Input
                id="region"
                placeholder="bijv. Regio Rotterdam"
                value={form.region}
                onChange={(e) => update('region', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team_size">Teamgrootte</Label>
              <Input
                id="team_size"
                type="number"
                placeholder="bijv. 5"
                value={form.team_size}
                onChange={(e) => update('team_size', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Omschrijving</Label>
            <Textarea
              id="description"
              placeholder="Kort over je bedrijf — wat doen jullie en voor wie?"
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="services">Diensten</Label>
              <Input
                id="services"
                placeholder="tuinaanleg, onderhoud, bestrating"
                value={form.services}
                onChange={(e) => update('services', e.target.value)}
              />
              <p className="text-xs text-zinc-400">Kommagescheiden</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="avg_project_value">Gem. projectwaarde</Label>
              <Input
                id="avg_project_value"
                placeholder="bijv. 5.000 - 15.000"
                value={form.avg_project_value}
                onChange={(e) => update('avg_project_value', e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="owner_name">Naam eigenaar</Label>
              <Input
                id="owner_name"
                value={form.owner_name}
                onChange={(e) => update('owner_name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner_phone">Telefoon eigenaar</Label>
              <Input
                id="owner_phone"
                type="tel"
                value={form.owner_phone}
                onChange={(e) => update('owner_phone', e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                placeholder="https://jouwbedrijf.nl"
                value={form.website}
                onChange={(e) => update('website', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Bedrijfs e-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="info@jouwbedrijf.nl"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Socials */}
      <Card>
        <CardHeader>
          <CardTitle>Social media</CardTitle>
          <CardDescription>
            Verbind je socials — het systeem gebruikt dit voor content en zichtbaarheid.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="social_linkedin">LinkedIn</Label>
              <Input
                id="social_linkedin"
                placeholder="https://linkedin.com/company/..."
                value={form.social_linkedin}
                onChange={(e) => update('social_linkedin', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="social_instagram">Instagram</Label>
              <Input
                id="social_instagram"
                placeholder="https://instagram.com/..."
                value={form.social_instagram}
                onChange={(e) => update('social_instagram', e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="social_facebook">Facebook</Label>
              <Input
                id="social_facebook"
                placeholder="https://facebook.com/..."
                value={form.social_facebook}
                onChange={(e) => update('social_facebook', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="social_google_business">Google Business</Label>
              <Input
                id="social_google_business"
                placeholder="https://g.page/..."
                value={form.social_google_business}
                onChange={(e) => update('social_google_business', e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="social_tiktok">TikTok</Label>
              <Input
                id="social_tiktok"
                placeholder="https://tiktok.com/@..."
                value={form.social_tiktok}
                onChange={(e) => update('social_tiktok', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Premium Pricing */}
      <Card>
        <CardHeader>
          <CardTitle>Premium positionering</CardTitle>
          <CardDescription>
            Deze gegevens verschijnen automatisch op je offertes — zo verantwoord je een premium prijs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="premium_tagline">Tagline</Label>
            <Input
              id="premium_tagline"
              placeholder="bijv. Kwaliteit die je ziet — en voelt"
              value={form.premium_tagline}
              onChange={(e) => update('premium_tagline', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="premium_usp">Waarom wij (USP's)</Label>
            <Textarea
              id="premium_usp"
              placeholder={"15+ jaar ervaring\nAlleen A-kwaliteit materiaal\nPersoonlijk contact met de eigenaar\nVaste ploeg — geen wisselende gezichten"}
              value={form.premium_usp}
              onChange={(e) => update('premium_usp', e.target.value)}
              rows={4}
            />
            <p className="text-xs text-zinc-400">Eén per regel — verschijnt op je offerte PDF</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="premium_guarantees">Garanties</Label>
            <Textarea
              id="premium_guarantees"
              placeholder={"5 jaar garantie op al ons werk\nGeen meerwerk zonder overleg\nOplevering op de afgesproken datum"}
              value={form.premium_guarantees}
              onChange={(e) => update('premium_guarantees', e.target.value)}
              rows={3}
            />
            <p className="text-xs text-zinc-400">Eén per regel</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="google_review_score">Google review score</Label>
              <Input
                id="google_review_score"
                type="number"
                step="0.1"
                min="1"
                max="5"
                placeholder="4.8"
                value={form.google_review_score}
                onChange={(e) => update('google_review_score', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="google_review_count">Aantal reviews</Label>
              <Input
                id="google_review_count"
                type="number"
                placeholder="47"
                value={form.google_review_count}
                onChange={(e) => update('google_review_count', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          <div>
            {saved && (
              <span className="text-sm text-green-600">Opgeslagen</span>
            )}
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Opslaan...' : 'Opslaan'}
          </Button>
        </CardFooter>
      </Card>
    </>
  )
}
