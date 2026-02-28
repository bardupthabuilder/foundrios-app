import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format, addDays } from 'date-fns'
import { nl } from 'date-fns/locale'

export default async function BillingPage() {
  const supabase = await createClient()
  const { tenantId } = await requireTenant()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single()

  const isTrial = tenant?.subscription_status === 'trial'
  const trialEnd = tenant?.trial_ends_at
    ? format(new Date(tenant.trial_ends_at), 'd MMMM yyyy', { locale: nl })
    : null

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-zinc-900">Abonnement</h1>

      {/* Huidig abonnement */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Huidig plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-zinc-900">FoundriOS Starter</p>
              <p className="text-sm text-zinc-500">€297 per maand · Alle modules</p>
            </div>
            <Badge variant={isTrial ? 'outline' : 'default'}>
              {isTrial ? 'Trial' : 'Actief'}
            </Badge>
          </div>

          {isTrial && trialEnd && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
              Je trial loopt af op <strong>{trialEnd}</strong>. Activeer je abonnement om
              door te gaan zonder onderbreking.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Abonnement activeren */}
      {isTrial && (
        <Card>
          <CardHeader>
            <CardTitle>Abonnement activeren</CardTitle>
            <CardDescription>
              Activeer je betaalabonnement om je account actief te houden na de trial.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Starter — Maandelijks</p>
                  <p className="text-sm text-zinc-500">
                    Alle modules · Maandelijks opzegbaar · Inclusief BTW
                  </p>
                </div>
                <p className="text-2xl font-bold">€297<span className="text-sm font-normal text-zinc-500">/mnd</span></p>
              </div>
            </div>
            <Button className="w-full" disabled>
              Betaling instellen via Mollie (binnenkort)
            </Button>
            <p className="mt-2 text-center text-xs text-zinc-400">
              iDEAL, creditcard en SEPA-incasso beschikbaar
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
