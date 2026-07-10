import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { Check, X, Zap } from 'lucide-react'
import { type Tier } from '@/lib/tier-client'

type Plan = {
  id: Tier
  name: string
  price: string
  tagline: string
  cta: string
  label?: string
  highlight?: boolean
  features: { label: string; included: boolean }[]
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '€0',
    tagline: 'Beheer je aanvragen, klanten en projecten op één plek — gratis voor altijd.',
    cta: 'Start gratis',
    features: [
      { label: 'Lead Inbox basic', included: true },
      { label: 'Klanten basic', included: true },
      { label: 'Projecten basic', included: true },
      { label: 'Planning & taken', included: true },
      { label: 'Offerte/factuur status', included: true },
      { label: 'Basis dashboard', included: true },
      { label: 'AI-kwalificatie', included: false },
      { label: 'Automatische opvolging', included: false },
      { label: 'Content Engine', included: false },
      { label: 'Sparks', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '€98/mnd',
    tagline: 'Laat FoundriOS meewerken in je bedrijf met AI, slimme opvolging en betere omzetcontrole.',
    cta: 'Start Pro trial',
    label: 'Populair',
    highlight: true,
    features: [
      { label: 'Alles uit Free', included: true },
      { label: 'Onbeperkt leads & klanten', included: true },
      { label: 'AI-kwalificatie', included: true },
      { label: 'Automatische opvolging', included: true },
      { label: 'Offerte-opvolging & reviewverzoeken', included: true },
      { label: 'Content Engine basic', included: true },
      { label: 'Retentie-overzicht', included: true },
      { label: '2 gebruikers', included: true },
      { label: '1.000 Sparks / maand', included: true },
      { label: 'Meerdere locaties & teams', included: false },
    ],
  },
  {
    id: 'scale',
    name: 'Scale',
    price: '€998/mnd',
    tagline: 'Stuur je hele vakbedrijf op aanvragen, omzet, projecten, teams, locaties en retentie.',
    cta: 'Plan Scale demo',
    label: 'Voor groeiende bedrijven',
    features: [
      { label: 'Alles uit Pro', included: true },
      { label: 'Meerdere locaties & teams', included: true },
      { label: '10 gebruikers inbegrepen', included: true },
      { label: 'Geavanceerde rollen', included: true },
      { label: 'Advanced AI-workflows', included: true },
      { label: 'Sales & retentie dashboards', included: true },
      { label: 'Maandelijkse omzetlek-analyse', included: true },
      { label: 'Prioriteit support', included: true },
      { label: 'Onboarding/implementatie call', included: true },
      { label: '15.000 Sparks / maand', included: true },
    ],
  },
]

export default async function UpgradePage() {
  const { tenantId } = await requireTenant()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any
  const { data: tenant } = await supabase
    .from('tenants')
    .select('plan')
    .eq('id', tenantId)
    .single()

  const currentTier = (tenant?.plan || 'free') as Tier

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="text-center">
        <Zap className="mx-auto h-8 w-8 text-foundri-yellow" />
        <h1 className="mt-3 text-3xl font-bold text-white">Kies je plan</h1>
        <p className="mt-2 text-sm text-white/60">
          Je huidige plan: <span className="font-medium text-white">{currentTier === 'free' ? 'Free' : currentTier === 'pro' ? 'Pro' : 'Scale'}</span>
        </p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentTier
          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border p-6 ${
                plan.highlight
                  ? 'border-foundri-yellow bg-foundri-deep shadow-xl shadow-foundri-yellow/10'
                  : 'border-white/10 bg-foundri-deep'
              }`}
            >
              {plan.label && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${
                  plan.highlight
                    ? 'bg-foundri-yellow text-foundri-deep'
                    : 'border border-white/20 bg-foundri-deep text-white/50'
                }`}>
                  {plan.label}
                </div>
              )}
              <h2 className="text-lg font-semibold text-white">{plan.name}</h2>
              <p className="mt-1 text-2xl font-bold text-white">{plan.price}</p>
              <p className="mt-2 min-h-[48px] text-sm text-white/60">{plan.tagline}</p>

              <ul className="mt-5 space-y-2.5">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    {f.included ? (
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-foundri-yellow" />
                    ) : (
                      <X className="mt-0.5 h-4 w-4 flex-shrink-0 text-white/30" />
                    )}
                    <span className={f.included ? 'text-white/90' : 'text-white/40'}>{f.label}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                {isCurrent ? (
                  <div className="w-full rounded-md border border-white/20 px-4 py-2 text-center text-sm text-white/60">
                    Huidig plan
                  </div>
                ) : (
                  <a
                    href={`/dashboard/billing?plan=${plan.id}`}
                    className={`block w-full rounded-md px-4 py-2 text-center text-sm font-medium transition ${
                      plan.highlight
                        ? 'bg-foundri-yellow text-foundri-deep hover:brightness-110'
                        : 'border border-foundri-yellow/40 text-foundri-yellow hover:bg-foundri-yellow/10'
                    }`}
                  >
                    {plan.cta}
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <p className="mt-8 text-center text-xs text-white/40">
        Plan wisselen kan op elk moment. Bij downgrade behoud je je data — extra features worden read-only.
      </p>
    </div>
  )
}
