import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { seedDemoTenant } from '@/lib/demo-seed'

// POST /api/demo-seed — vult een leeg account met een realistisch hoveniersbedrijf.
export async function POST() {
  const supabase = await createClient()

  let tenantId: string
  try {
    tenantId = (await requireTenant()).tenantId
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const { count } = await supabase
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)

  if ((count ?? 0) > 0) {
    return NextResponse.json({ error: 'Er is al data in dit account' }, { status: 409 })
  }

  try {
    await seedDemoTenant(supabase, tenantId)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Demo data laden mislukt' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, message: 'Demo data geladen' })
}
