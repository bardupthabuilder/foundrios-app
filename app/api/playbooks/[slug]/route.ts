import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'

// GET — detail playbook. RLS bepaalt zichtbaarheid (audience: internal/tier/granted).
// Als de user geen toegang heeft via RLS, krijgt hij gewoon 404 — geen "locked preview".
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  let tenantId: string
  try {
    const t = await requireTenant()
    tenantId = t.tenantId
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const { slug } = await params

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createClient()) as any

  // Eerst eigen-tenant variant zoeken; val terug op system-wide
  const { data: own } = await supabase
    .from('playbooks')
    .select('*')
    .eq('slug', slug)
    .eq('tenant_id', tenantId)
    .maybeSingle()

  let playbook = own
  if (!playbook) {
    const { data: system } = await supabase
      .from('playbooks')
      .select('*')
      .eq('slug', slug)
      .is('tenant_id', null)
      .maybeSingle()
    playbook = system
  }

  if (!playbook) {
    return NextResponse.json({ error: 'Playbook niet gevonden' }, { status: 404 })
  }

  return NextResponse.json(playbook)
}
