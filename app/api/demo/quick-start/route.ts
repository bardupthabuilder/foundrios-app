import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServiceClient } from '@/lib/supabase/server'
import { seedDemoTenant } from '@/lib/demo-seed'

export async function POST() {
  const service = createServiceClient()

  const uid = crypto.randomUUID().replace(/-/g, '').slice(0, 8)
  const email = `demo-${uid}@demo.foundrios.app`
  const password = `Demo${uid.toUpperCase()}!`

  // 1. Gebruiker aanmaken (email auto-bevestigd, geen verificatie nodig)
  const { data: authData, error: authError } = await (service as any).auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError || !authData?.user) {
    return NextResponse.json({ error: authError?.message ?? 'Gebruiker aanmaken mislukt' }, { status: 500 })
  }

  const userId: string = authData.user.id

  // 2. Tenant aanmaken
  const { data: tenant, error: tenantError } = await service
    .from('tenants')
    .insert({
      name: 'Jansen Hoveniers',
      slug: `jansen-hoveniers-${uid}`,
      niche: 'hoveniers',
      region: 'Regio Amsterdam',
      owner_name: 'Jan Jansen',
      owner_phone: '0612345678',
      onboarding_completed: true,
    } as any)
    .select('id')
    .single()

  if (tenantError || !tenant) {
    return NextResponse.json({ error: 'Tenant aanmaken mislukt' }, { status: 500 })
  }

  const tenantId: string = tenant.id

  // 3. Gebruiker koppelen aan tenant (demo_mode_active = true voor de banner)
  await service.from('tenant_users').insert({
    tenant_id: tenantId,
    user_id: userId,
    role: 'owner',
    demo_mode_active: true,
  } as any)

  // 4. Demo data seeden — een leeg demo-account is erger dan geen demo-account.
  try {
    await seedDemoTenant(service, tenantId)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Demo data laden mislukt' },
      { status: 500 }
    )
  }

  // 5. Sessietokens ophalen via gewone sign-in (anon key)
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: sessionData, error: signInError } = await anonClient.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError || !sessionData?.session) {
    return NextResponse.json({ error: 'Inloggen mislukt na aanmaken' }, { status: 500 })
  }

  return NextResponse.json({
    access_token: sessionData.session.access_token,
    refresh_token: sessionData.session.refresh_token,
  })
}
