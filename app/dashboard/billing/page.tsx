import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { CheckCircle2, Zap } from 'lucide-react'

const PLANS = [
  {
    key: 'free',
    name: 'Free',
    price: '€0',
    desc: 'Alles wat je nodig hebt om te starten.',
    sparks: null,
    features: ['Leads & klanten', 'Projecten & planning', 'Taken & notities', 'Offerte/factuur status', 'Basis dashboard'],
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '€98',
    desc: 'Voor vakbedrijven die omzetlekken willen dichten met AI en opvolging.',
    sparks: 1000,
    popular: true,
    features: ['Alles uit Free', 'AI-kwalificatie', 'Automatische opvolging', 'Offerte-opvolging & reviewverzoeken', 'Content Engine basic', '1.000 Sparks / maand'],
  },
  {
    key: 'scale',
    name: 'Scale',
    price: '€998',
    desc: 'Voor grotere vakbedrijven met teams, locaties en serieuze omzet.',
    sparks: 15000,
    features: ['Alles uit Pro', 'Meerdere locaties & teams', 'Advanced AI-workflows', 'Sales & retentie dashboards', '10 gebruikers inbegrepen', '15.000 Sparks / maand'],
  },
]

const SPARKS_BUNDLES = [
  { label: '1.000 extra Sparks', price: '€19' },
  { label: '5.000 extra Sparks', price: '€79' },
  { label: '10.000 extra Sparks', price: '€139' },
  { label: '25.000 extra Sparks', price: '€299' },
  { label: '50.000 extra Sparks', price: '€499' },
]

export default async function BillingPage() {
  const supabase = await createClient()
  const { tenantId } = await requireTenant()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single()

  const t = tenant as Record<string, unknown> | null
  const currentPlan = (t?.plan as string) || 'free'
  const isTrial = t?.subscription_status === 'trial'
  const trialEnd = t?.trial_ends_at
    ? format(new Date(t.trial_ends_at as string), 'd MMMM yyyy', { locale: nl })
    : null

  const activePlan = PLANS.find(p => p.key === currentPlan)
  const sparksIncluded = activePlan?.sparks ?? null

  return (
    <div className="p-4 pt-16 sm:p-6 lg:pt-6 mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-white">Abonnement</h1>
        <p className="mt-1 text-sm text-zinc-400">Beheer je plan en facturatie</p>
      </div>

      {isTrial && trialEnd && (
        <div className="rounded-lg border border-foundri-yellow/30 bg-foundri-yellow/5 px-4 py-3 text-sm text-foundri-yellow">
          Je trial loopt af op <strong>{trialEnd}</strong>. Kies een plan om door te gaan.
        </div>
      )}

      {/* Plan cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {PLANS.map((plan) => {
          const isActive = currentPlan === plan.key
          return (
            <div
              key={plan.key}
              className={`rounded-lg border p-5 transition-colors ${
                isActive
                  ? 'border-foundri-yellow bg-foundri-yellow/5'
                  : plan.popular
                  ? 'border-foundri-yellow/30 bg-foundri-deep'
                  : 'border-white/10 bg-foundri-deep'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-white">{plan.name}</h3>
                {isActive && <Badge className="bg-foundri-yellow text-foundri-graphite">Actief</Badge>}
                {plan.popular && !isActive && (
                  <span className="rounded-full bg-foundri-yellow/20 px-2 py-0.5 text-[10px] font-bold text-foundri-yellow">Populair</span>
                )}
              </div>
              <p className="text-2xl font-bold text-white">
                {plan.price}<span className="text-sm font-normal text-zinc-400">/maand</span>
              </p>
              <p className="mt-1 text-sm text-zinc-400">{plan.desc}</p>
              <ul className="mt-4 space-y-1.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-zinc-300">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-foundri-yellow" />
                    {f}
                  </li>
                ))}
              </ul>
              {!isActive && (
                <button
                  disabled
                  className="mt-4 w-full rounded-md border border-white/10 px-3 py-2 text-sm font-medium text-zinc-400 opacity-50"
                >
                  Binnenkort beschikbaar
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Sparks overzicht */}
      <div className="rounded-lg border border-white/10 bg-foundri-deep p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-foundri-yellow" />
          <h2 className="font-semibold text-white">Sparks</h2>
          <span className="text-xs text-zinc-500">— slimme acties die FoundriOS voor je uitvoert</span>
        </div>

        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-md bg-white/5 p-3">
            <p className="text-zinc-400 text-xs mb-1">Inbegrepen</p>
            <p className="font-semibold text-white">
              {sparksIncluded ? sparksIncluded.toLocaleString('nl-NL') : 'Geen'}
            </p>
          </div>
          <div className="rounded-md bg-white/5 p-3">
            <p className="text-zinc-400 text-xs mb-1">Gebruikt</p>
            <p className="font-semibold text-white">—</p>
          </div>
          <div className="rounded-md bg-white/5 p-3">
            <p className="text-zinc-400 text-xs mb-1">Resterend</p>
            <p className="font-semibold text-white">—</p>
          </div>
        </div>

        {currentPlan === 'free' && (
          <p className="text-xs text-zinc-500">Upgrade naar Pro voor 1.000 Sparks per maand.</p>
        )}

        {/* Extra Sparks bundles */}
        {currentPlan !== 'free' && (
          <div className="space-y-2 pt-2 border-t border-white/10">
            <p className="text-xs font-medium text-zinc-400">Extra Sparks nodig? Voeg ze toe wanneer je wilt.</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {SPARKS_BUNDLES.map((b) => (
                <button
                  key={b.label}
                  disabled
                  className="flex items-center justify-between rounded-md border border-white/10 px-3 py-2 text-xs text-zinc-300 opacity-60"
                >
                  <span>{b.label}</span>
                  <span className="text-foundri-yellow font-medium">{b.price}</span>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-zinc-600">Betaling binnenkort beschikbaar</p>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-zinc-500">
        Betaling via iDEAL, creditcard en SEPA-incasso · Maandelijks opzegbaar
      </p>
    </div>
  )
}
