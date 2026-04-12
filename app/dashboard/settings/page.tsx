import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CompanyProfileForm } from './CompanyProfileForm'
import { UsersSection } from './UsersSection'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { tenantId } = await requireTenant()

  const [tenantResult, integrationsResult] = await Promise.all([
    supabase.from('tenants').select('*').eq('id', tenantId).single(),
    supabase.from('integrations').select('*').eq('tenant_id', tenantId),
  ])

  const tenant = tenantResult.data
  const integrations = integrationsResult.data ?? []

  const allIntegrationTypes = [
    { type: 'whatsapp', label: 'WhatsApp Business', icon: '💬', description: 'Berichten direct in je Lead Inbox' },
    { type: 'meta_lead_ads', label: 'Meta Lead Ads', icon: '📘', description: 'Facebook & Instagram leadformulieren' },
    { type: 'google_calendar', label: 'Google Calendar', icon: '📅', description: 'Synchroniseer afspraken (binnenkort)' },
  ]

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900">Instellingen</h1>

      {/* Account status */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500">Bedrijfsnaam</span>
            <span className="font-medium">{tenant?.name}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500">Account status</span>
            <Badge variant={tenant?.subscription_status === 'active' ? 'default' : 'outline'}>
              {tenant?.subscription_status === 'trial' ? 'Trial' :
               tenant?.subscription_status === 'active' ? 'Actief' :
               tenant?.subscription_status === 'past_due' ? 'Betaling vereist' : 'Geannuleerd'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Gebruikers */}
      <UsersSection />

      {/* Bedrijfsprofiel */}
      <CompanyProfileForm tenant={tenant} />

      {/* Integraties */}
      <Card>
        <CardHeader>
          <CardTitle>Integraties</CardTitle>
          <CardDescription>
            Koppel je leadkanalen om automatisch leads te importeren.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {allIntegrationTypes.map((integration) => {
            const active = integrations.find(
              (i) => i.type === integration.type && i.is_active
            )

            return (
              <div
                key={integration.type}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{integration.icon}</span>
                  <div>
                    <p className="font-medium text-sm text-zinc-900">{integration.label}</p>
                    <p className="text-xs text-zinc-500">{integration.description}</p>
                  </div>
                </div>
                <Badge variant={active ? 'default' : 'outline'} className={active ? 'bg-green-600' : ''}>
                  {active ? 'Gekoppeld' : 'Niet gekoppeld'}
                </Badge>
              </div>
            )
          })}

          <p className="text-xs text-zinc-400 mt-2">
            Neem contact op via support om een integratie in te stellen.
            Zelfinrichting volgt in een volgende update.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
