import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'

// POST /api/content/[id]/distribute — distributies aanmaken voor geselecteerde platforms
export async function POST(
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
  const { platforms } = body as { platforms: string[] }

  if (!Array.isArray(platforms)) {
    return NextResponse.json({ error: 'platforms moet een array zijn' }, { status: 400 })
  }

  // Verify content item belongs to tenant
  const { data: contentItem } = await supabase
    .from('content_items')
    .select('id')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (!contentItem) {
    return NextResponse.json({ error: 'Content item niet gevonden' }, { status: 404 })
  }

  // Haal bestaande distributies op
  const { data: existingDistributions } = await supabase
    .from('content_distributions')
    .select('id, platform')
    .eq('content_item_id', id)
    .eq('tenant_id', tenantId)

  const existingPlatforms = (existingDistributions ?? []).map((d: any) => d.platform as string)

  // Verwijder distributies voor platforms die niet meer in de nieuwe lijst staan
  const toDelete = (existingDistributions ?? [])
    .filter((d: any) => !platforms.includes(d.platform))
    .map((d: any) => d.id)

  if (toDelete.length > 0) {
    await supabase
      .from('content_distributions')
      .delete()
      .in('id', toDelete)
  }

  // Voeg nieuwe distributies toe voor platforms die nog niet bestaan
  const toInsert = platforms
    .filter((platform) => !existingPlatforms.includes(platform))
    .map((platform) => ({
      content_item_id: id,
      tenant_id: tenantId,
      platform,
      status: 'gepland',
    }))

  if (toInsert.length > 0) {
    const { error: insertError } = await supabase
      .from('content_distributions')
      .insert(toInsert as any)

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }
  }

  // Haal bijgewerkte distributies op
  const { data: distributions, error } = await supabase
    .from('content_distributions')
    .select('*')
    .eq('content_item_id', id)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(distributions)
}
