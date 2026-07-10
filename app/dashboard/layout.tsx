import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { FeedbackWidget } from '@/components/FeedbackWidget'
import { DemoBanner } from '@/components/DemoBanner'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Controleer of er een tenant is; zo niet, stuur naar onboarding.
  // Hoort de gebruiker bij meerdere bedrijven, dan telt de actieve (is_active).
  // `.single()` gaf daar een fout op, waarna iedereen met twee bedrijven voor
  // altijd op de onboarding bleef hangen.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tenantUser } = await (supabase as any)
    .from('tenant_users')
    .select('tenant_id, is_active')
    .eq('user_id', user.id)
    .order('is_active', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()

  if (!tenantUser) {
    redirect('/onboarding')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-foundri-graphite">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pt-14 pb-20 lg:pt-0 lg:pb-0">
        <DemoBanner />
        {children}
      </main>
      <FeedbackWidget />
    </div>
  )
}
