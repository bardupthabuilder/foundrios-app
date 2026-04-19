import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { CheckCircle2 } from 'lucide-react'

const PLANS = [
  {
    key: 'free',
    name: 'Free',
    price: '€0',
    desc: 'Alles wat je nodig hebt om te starten.',
    features: ['Leads & klanten', 'Projecten & planning', 'Uren & werkbonnen', 'Offertes & facturen'],
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '€98',
    desc: 'Automatiseer en bespaar tijd.',
    features: ['Alles uit Free', 'Automatische opvolging', 'Lead scoring & pipeline', 'Onderhoudscontracten', 'Templates & exports'],
    popular: true,
  },
  {
    key: 'scale',
    name: 'Scale',
    price: '€280',
    desc: 'AI intelligence en volledige leverage.',
    features: ['Alles uit Pro', 'AI lead verwerking', 'Inzichten & voorspellingen', 'AI content assistent', 'Meerdere gebruikers'],
  },
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

  return (
    <div className="p-4 pt-16 sm:p-6 lg:pt-6 mx-auto max-w-4xl space-y-6">
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

      <p className="text-center text-xs text-zinc-500">
        Betaling via iDEAL, creditcard en SEPA-incasso · Maandelijks opzegbaar
      </p>
    </div>
  )
}
