import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const body = await request.json()
  const { tenantId } = body

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId verplicht' }, { status: 400 })
  }

  const { error } = await (supabase as any).rpc('switch_tenant', {
    target_tenant_id: tenantId,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 403 })
  }

  return NextResponse.json({ success: true })
}
