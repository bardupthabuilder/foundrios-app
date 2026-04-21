import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createWorkforceServiceClient } from '@/lib/workforce/supabase'
import { createWorkforceTenant } from '@/lib/workforce/tenant'

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
  const { companyName, niche, region } = body

  if (!companyName || companyName.length < 2) {
    return NextResponse.json({ error: 'Bedrijfsnaam is verplicht (min. 2 tekens)' }, { status: 400 })
  }

  // Check of user al een Workforce tenant heeft
  const serviceClient = createWorkforceServiceClient()
  const { data: existing } = await serviceClient
    .from('fw_tenant_users')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Workforce account al ingericht' }, { status: 409 })
  }

  try {
    const tenantId = await createWorkforceTenant({
      userId: user.id,
      companyName,
      niche,
      region,
    })

    return NextResponse.json({ tenantId }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Onbekende fout'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
