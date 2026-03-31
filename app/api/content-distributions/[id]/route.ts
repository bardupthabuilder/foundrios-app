import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'

// PATCH /api/content-distributions/[id] — distributie entry updaten
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  let tenantId: string
  try {
    const t = await requireTenant()
    tenantId = t.tenantId
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const body = await request.json()
  const { status, published_at, post_url } = body as {
    status?: 'gepland' | 'gepubliceerd' | 'mislukt'
    published_at?: string
    post_url?: string
  }

  // Verify distribution belongs to tenant
  const { data: existing } = await supabase
    .from('content_distributions')
    .select('id')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (!existing) {
    return NextResponse.json({ error: 'Distributie niet gevonden' }, { status: 404 })
  }

  // Bepaal published_at: als status gepubliceerd en geen published_at opgegeven, gebruik now()
  const resolvedPublishedAt =
    status === 'gepubliceerd' && !published_at
      ? new Date().toISOString()
      : published_at ?? null

  const updatePayload: Record<string, unknown> = {}
  if (status !== undefined) updatePayload.status = status
  if (resolvedPublishedAt !== null) updatePayload.published_at = resolvedPublishedAt
  if (post_url !== undefined) updatePayload.post_url = post_url

  const { data, error } = await supabase
    .from('content_distributions')
    .update(updatePayload as any)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
