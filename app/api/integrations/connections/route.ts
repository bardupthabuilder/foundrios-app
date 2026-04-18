import { NextResponse } from 'next/server'
import { requireTenant } from '@/lib/tenant'
import { getNango } from '@/lib/nango'

export async function GET() {
  let tenantId: string
  try {
    const t = await requireTenant()
    tenantId = t.tenantId
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const nango = getNango()
  if (!nango) {
    return NextResponse.json({ connections: [], configured: false })
  }

  try {
    const result = await nango.listConnections({
      userId: tenantId,
    })

    const connections = (result?.connections ?? []).map((conn: Record<string, unknown>) => ({
      id: conn.id,
      connectionId: conn.connection_id,
      providerConfigKey: conn.provider_config_key,
      provider: conn.provider,
      createdAt: conn.created_at,
    }))

    return NextResponse.json({ connections, configured: true })
  } catch (err) {
    console.error('[Nango] List connections failed:', err)
    return NextResponse.json({ connections: [], configured: true, error: String(err) })
  }
}
