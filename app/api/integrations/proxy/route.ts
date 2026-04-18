import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/tenant'
import { getNango } from '@/lib/nango'

// Proxy requests to external APIs through Nango (handles auth/tokens)
export async function POST(request: NextRequest) {
  let tenantId: string
  try {
    const t = await requireTenant()
    tenantId = t.tenantId
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const nango = getNango()
  if (!nango) {
    return NextResponse.json({ error: 'Nango niet geconfigureerd' }, { status: 503 })
  }

  const body = await request.json()
  const { integrationId, endpoint, method = 'GET', data } = body

  if (!integrationId || !endpoint) {
    return NextResponse.json({ error: 'integrationId en endpoint verplicht' }, { status: 400 })
  }

  try {
    const response = await nango.proxy({
      method: method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
      endpoint,
      providerConfigKey: integrationId,
      connectionId: tenantId,
      data,
    })

    return NextResponse.json(response.data)
  } catch (err: unknown) {
    const error = err as { response?: { status?: number; data?: unknown } }
    console.error('[Nango] Proxy failed:', error?.response?.data || err)
    return NextResponse.json(
      { error: 'API request mislukt', details: error?.response?.data },
      { status: error?.response?.status || 500 }
    )
  }
}
