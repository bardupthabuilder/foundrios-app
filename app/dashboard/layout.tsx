import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { FeedbackWidget } from '@/components/FeedbackWidget'

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

  // Controleer of er een tenant is; zo niet, stuur naar onboarding
  const { data: tenantUser } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single()

  if (!tenantUser) {
    redirect('/onboarding')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-foundri-graphite">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pt-14 lg:pt-0">{children}</main>
      <FeedbackWidget />
    </div>
  )
}
