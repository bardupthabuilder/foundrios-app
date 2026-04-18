import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/tenant'
import { getNango } from '@/lib/nango'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  let tenantId: string
  let userId: string
  try {
    const t = await requireTenant()
    tenantId = t.tenantId
    userId = t.userId
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const nango = getNango()
  if (!nango) {
    return NextResponse.json({ error: 'Nango niet geconfigureerd' }, { status: 503 })
  }

  const body = await request.json()
  const integrationId = body.integrationId

  if (!integrationId) {
    return NextResponse.json({ error: 'integrationId verplicht' }, { status: 400 })
  }

  // Get tenant info for tagging
  const supabase = await createClient()
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single()

  const tenantData = tenant as Record<string, unknown> | null

  try {
    const session = await nango.createConnectSession({
      end_user: {
        id: tenantId,
        email: (tenantData?.email as string) || undefined,
        display_name: (tenantData?.name as string) || undefined,
      },
      allowed_integrations: [integrationId],
    })

    return NextResponse.json({ sessionToken: session.data.token })
  } catch (err) {
    console.error('[Nango] Session creation failed:', err)
    return NextResponse.json({ error: 'Kon sessie niet aanmaken' }, { status: 500 })
  }
}
