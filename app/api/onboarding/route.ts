import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { z } from 'zod'

const OnboardingSchema = z.object({
  companyName: z.string().min(2, 'Bedrijfsnaam is verplicht (min. 2 tekens)'),
  niche: z.string().min(1, 'Kies een branche'),
  region: z.string().min(1, 'Vul je werkgebied in'),
  ownerName: z.string().min(2, 'Vul je naam in'),
  ownerPhone: z.string().min(6, 'Vul je telefoonnummer in'),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = OnboardingSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { companyName, niche, region, ownerName, ownerPhone } = parsed.data

  // Controleer of de user al een tenant heeft
  const { data: existing } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Account al ingericht' }, { status: 409 })
  }

  // Service role client — RLS bypassen voor tenant aanmaken
  const serviceClient = createServiceClient()

  const slug = companyName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  const { data: tenant, error: tenantError } = await serviceClient
    .from('tenants')
    .insert({
      name: companyName,
      slug,
      niche,
      region,
      owner_name: ownerName,
      owner_phone: ownerPhone,
      onboarding_completed: true,
    })
    .select('id')
    .single()

  if (tenantError || !tenant) {
    return NextResponse.json(
      { error: `Kon bedrijf niet aanmaken: ${tenantError?.message}` },
      { status: 500 }
    )
  }

  const { error: linkError } = await serviceClient.from('tenant_users').insert({
    tenant_id: tenant.id,
    user_id: user.id,
    role: 'owner',
  })

  if (linkError) {
    return NextResponse.json(
      { error: `Kon gebruiker niet koppelen: ${linkError.message}` },
      { status: 500 }
    )
  }

  return NextResponse.json({ tenantId: tenant.id }, { status: 201 })
}
