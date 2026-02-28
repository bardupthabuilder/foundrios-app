import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createTenant } from '@/lib/tenant'

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
  const companyName = body?.companyName?.trim()

  if (!companyName || companyName.length < 2) {
    return NextResponse.json({ error: 'Bedrijfsnaam is verplicht (min. 2 tekens)' }, { status: 400 })
  }

  // Controleer of de user al een tenant heeft
  const { data: existing } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Account al ingericht' }, { status: 409 })
  }

  try {
    const tenantId = await createTenant({ userId: user.id, companyName })
    return NextResponse.json({ tenantId }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Onbekende fout'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
