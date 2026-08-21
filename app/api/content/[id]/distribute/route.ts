import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'

interface ChannelInput {
  platform: string
  profile_type?: string | null
}

function channelKey(platform: string, profileType: string | null | undefined) {
  return `${platform}:${profileType ?? ''}`
}

// POST /api/content/[id]/distribute — distributies aanmaken voor geselecteerde kanalen
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
  const { channels } = body as { channels: ChannelInput[] }

  if (!Array.isArray(channels)) {
    return NextResponse.json({ error: 'channels moet een array zijn' }, { status: 400 })
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
    .select('id, platform, profile_type')
    .eq('content_item_id', id)
    .eq('tenant_id', tenantId)

  const existingKeys = new Set((existingDistributions ?? []).map((d) => channelKey(d.platform, d.profile_type)))
  const newKeys = new Set(channels.map((c) => channelKey(c.platform, c.profile_type)))

  // Verwijder distributies voor kanalen die niet meer in de nieuwe lijst staan
  const toDelete = (existingDistributions ?? [])
    .filter((d) => !newKeys.has(channelKey(d.platform, d.profile_type)))
    .map((d) => d.id)

  if (toDelete.length > 0) {
    await supabase
      .from('content_distributions')
      .delete()
      .in('id', toDelete)
  }

  // Voeg nieuwe distributies toe voor kanalen die nog niet bestaan
  const toInsert = channels
    .filter((c) => !existingKeys.has(channelKey(c.platform, c.profile_type)))
    .map((c) => ({
      content_item_id: id,
      tenant_id: tenantId,
      platform: c.platform,
      profile_type: c.profile_type ?? null,
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
