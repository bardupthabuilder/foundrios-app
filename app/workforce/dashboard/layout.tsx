import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createWorkforceServiceClient } from '@/lib/workforce/supabase'
import { WorkforceSidebar } from '@/components/workforce/Sidebar'

export default async function WorkforceDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/workforce/login')
  }

  // Check of er een Workforce tenant is
  const serviceClient = createWorkforceServiceClient()
  const { data: tenantUser } = await serviceClient
    .from('fw_tenant_users')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single()

  if (!tenantUser) {
    redirect('/workforce/onboarding')
  }

  // Haal tenant naam op
  const { data: tenant } = await serviceClient
    .from('fw_tenants')
    .select('name')
    .eq('id', tenantUser.tenant_id)
    .single()

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0a] text-white">
      <WorkforceSidebar tenantName={tenant?.name} />
      <main className="flex-1 overflow-y-auto pt-14 lg:pt-0 p-6">{children}</main>
    </div>
  )
}
