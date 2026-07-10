'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Briefcase, Check } from 'lucide-react'

type Pkg = 'light' | 'core' | 'premium' | 'unsure'

const PACKAGES: Array<{ id: Pkg; label: string; price: string; duration: string; for: string }> = [
  { id: 'light', label: 'Managed Light', price: '€980/mnd', duration: 'min. 3 mnd', for: 'Kleinere vakbedrijven of eerste implementatie' },
  { id: 'core', label: 'Managed Core', price: '€2.497/mnd', duration: 'min. 6 mnd', for: 'Serieuze hoveniersbedrijven met capaciteit' },
  { id: 'premium', label: 'Managed Premium', price: '€4.997/mnd', duration: 'min. 12 mnd', for: 'Hogere volumes, regionale dominantie, alleen geselecteerd' },
  { id: 'unsure', label: 'Weet ik nog niet', price: '—', duration: '—', for: 'We bespreken het in een adviesgesprek' },
]

export default function ManagedRequestPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    bedrijfsnaam: '',
    vakgebied: 'hoveniersbedrijf',
    regio: '',
    website: '',
    omzet_maand_eur: '',
    gemiddelde_projectwaarde_eur: '',
    aantal_medewerkers: '',
    capaciteit_extra_werk: '',
    huidige_leadbronnen: [] as string[],
    grootste_probleem: '',
    gewenste_groei: '',
    budget_bereidheid: '',
    preferred_package: 'unsure' as Pkg,
  })

  function update<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  function toggleBron(b: string) {
    setForm(prev => ({
      ...prev,
      huidige_leadbronnen: prev.huidige_leadbronnen.includes(b)
        ? prev.huidige_leadbronnen.filter(x => x !== b)
        : [...prev.huidige_leadbronnen, b],
    }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!form.bedrijfsnaam.trim()) {
      setError('Vul je bedrijfsnaam in')
      return
    }
    setSubmitting(true)
    try {
      const r = await fetch('/api/managed-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          omzet_maand_eur: form.omzet_maand_eur ? parseInt(form.omzet_maand_eur, 10) : null,
          gemiddelde_projectwaarde_eur: form.gemiddelde_projectwaarde_eur ? parseInt(form.gemiddelde_projectwaarde_eur, 10) : null,
          aantal_medewerkers: form.aantal_medewerkers ? parseInt(form.aantal_medewerkers, 10) : null,
        }),
      })
      if (!r.ok) {
        const data = await r.json().catch(() => ({}))
        throw new Error(data.error?.formErrors?.join(', ') || data.error || 'Verzenden mislukt')
      }
      router.push('/dashboard/managed/status')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verzenden mislukt')
    } finally {
      setSubmitting(false)
    }
  }

  const BRONNEN = [
    'Mond-tot-mond',
    'Google',
    'Website',
    'Meta Ads',
    'Google Ads',
    'Werkbordjes',
    'Bestaande klanten',
    'Anders',
  ]

  return (
    <div className="p-4 lg:p-6 pt-16 lg:pt-6 max-w-3xl">
      <Link
        href="/dashboard"
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-zinc-400 transition hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Terug
      </Link>

      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Briefcase className="h-6 w-6 text-foundri-yellow" />
          <h1 className="text-2xl font-bold text-white">Laat het voor je doen</h1>
        </div>
        <p className="mt-1 text-sm text-zinc-400">
          Geen tijd om dit zelf op te zetten? Groeneveld Media voert het hele systeem voor je uit — advertenties, opvolging, content. Vul dit formulier in en we plannen een adviesgesprek.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-6">
        <Section title="Pakket">
          <div className="grid gap-2 sm:grid-cols-2">
            {PACKAGES.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => update('preferred_package', p.id)}
                className={`rounded-lg border p-3 text-left transition ${
                  form.preferred_package === p.id
                    ? 'border-foundri-yellow bg-foundri-yellow/5'
                    : 'border-white/10 bg-foundri-deep hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">{p.label}</span>
                  {form.preferred_package === p.id && <Check className="h-4 w-4 text-foundri-yellow" />}
                </div>
                <div className="mt-1 text-xs text-zinc-400">{p.price} · {p.duration}</div>
                <div className="mt-1 text-xs text-zinc-500">{p.for}</div>
              </button>
            ))}
          </div>
        </Section>

        <Section title="Bedrijfsinfo">
          <Field label="Bedrijfsnaam" required>
            <input
              type="text"
              value={form.bedrijfsnaam}
              onChange={e => update('bedrijfsnaam', e.target.value)}
              className={inputClass}
              required
            />
          </Field>
          <Field label="Vakgebied">
            <input
              type="text"
              value={form.vakgebied}
              onChange={e => update('vakgebied', e.target.value)}
              className={inputClass}
              placeholder="bv. hoveniersbedrijf"
            />
          </Field>
          <Field label="Regio">
            <input
              type="text"
              value={form.regio}
              onChange={e => update('regio', e.target.value)}
              className={inputClass}
              placeholder="bv. Noord-Brabant"
            />
          </Field>
          <Field label="Website">
            <input
              type="url"
              value={form.website}
              onChange={e => update('website', e.target.value)}
              className={inputClass}
              placeholder="https://..."
            />
          </Field>
        </Section>

        <Section title="Cijfers">
          <Field label="Huidige omzet per maand (€)">
            <input
              type="number"
              min={0}
              value={form.omzet_maand_eur}
              onChange={e => update('omzet_maand_eur', e.target.value)}
              className={inputClass}
              placeholder="50000"
            />
          </Field>
          <Field label="Gemiddelde projectwaarde (€)">
            <input
              type="number"
              min={0}
              value={form.gemiddelde_projectwaarde_eur}
              onChange={e => update('gemiddelde_projectwaarde_eur', e.target.value)}
              className={inputClass}
              placeholder="10000"
            />
          </Field>
          <Field label="Aantal medewerkers">
            <input
              type="number"
              min={0}
              value={form.aantal_medewerkers}
              onChange={e => update('aantal_medewerkers', e.target.value)}
              className={inputClass}
              placeholder="4"
            />
          </Field>
          <Field label="Capaciteit voor extra werk">
            <input
              type="text"
              value={form.capaciteit_extra_werk}
              onChange={e => update('capaciteit_extra_werk', e.target.value)}
              className={inputClass}
              placeholder="bv. 2-3 projecten per maand extra"
            />
          </Field>
        </Section>

        <Section title="Huidige situatie">
          <Field label="Huidige leadbronnen">
            <div className="flex flex-wrap gap-1.5">
              {BRONNEN.map(b => (
                <button
                  type="button"
                  key={b}
                  onClick={() => toggleBron(b)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    form.huidige_leadbronnen.includes(b)
                      ? 'bg-foundri-yellow text-foundri-deep'
                      : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Grootste probleem">
            <textarea
              value={form.grootste_probleem}
              onChange={e => update('grootste_probleem', e.target.value)}
              rows={3}
              className={inputClass}
              placeholder="Wat loopt nu vast?"
            />
          </Field>
          <Field label="Gewenste groei">
            <textarea
              value={form.gewenste_groei}
              onChange={e => update('gewenste_groei', e.target.value)}
              rows={3}
              className={inputClass}
              placeholder="Waar wil je over 12 maanden staan?"
            />
          </Field>
          <Field label="Budget bereidheid">
            <input
              type="text"
              value={form.budget_bereidheid}
              onChange={e => update('budget_bereidheid', e.target.value)}
              className={inputClass}
              placeholder="bv. €2.500/maand"
            />
          </Field>
        </Section>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/5"
          >
            Annuleren
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-lg bg-foundri-yellow px-4 py-2 text-sm font-semibold text-foundri-deep transition hover:brightness-110 disabled:opacity-50"
          >
            {submitting ? 'Versturen...' : 'Aanvraag versturen'}
          </button>
        </div>
      </form>
    </div>
  )
}

const inputClass =
  'w-full rounded-lg border border-white/10 bg-foundri-deep px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-foundri-yellow/40 focus:outline-none'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-3 rounded-xl border border-white/5 bg-foundri-surface p-4">
      <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">{title}</legend>
      {children}
    </fieldset>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-zinc-400">
        {label}
        {required && <span className="ml-0.5 text-red-400">*</span>}
      </span>
      {children}
    </label>
  )
}
