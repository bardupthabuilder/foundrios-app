import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { z } from 'zod'

export const CONTENT_PLATFORMS = ['facebook', 'instagram'] as const
export const CONTENT_PROFILE_TYPES = ['zakelijk', 'persoonlijk'] as const

export const ALL_CHANNELS = CONTENT_PLATFORMS.flatMap((platform) =>
  CONTENT_PROFILE_TYPES.map((profile_type) => ({ platform, profile_type }))
)

// GET /api/content/channels — de 4 Facebook/Instagram x Zakelijk/Persoonlijk kanalen
export async function GET() {
  const supabase = await createClient()
  let tenantId: string
  try {
    const t = await requireTenant()
    tenantId = t.tenantId
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const { data: existing, error } = await supabase
    .from('content_channels')
    .select('*')
    .eq('tenant_id', tenantId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Zelfherstellend: ontbrekende kanalen (bv. nieuwe tenant na migratie) worden aangemaakt.
  const existingKeys = new Set((existing ?? []).map((c) => `${c.platform}:${c.profile_type}`))
  const missing = ALL_CHANNELS.filter((c) => !existingKeys.has(`${c.platform}:${c.profile_type}`))

  let all = existing ?? []
  if (missing.length > 0) {
    const { data: inserted, error: insertError } = await supabase
      .from('content_channels')
      .insert(missing.map((c) => ({ tenant_id: tenantId, platform: c.platform, profile_type: c.profile_type, enabled: false })) as any)
      .select()

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })
    all = [...all, ...(inserted ?? [])]
  }

  all.sort((a, b) => a.platform.localeCompare(b.platform) || a.profile_type.localeCompare(b.profile_type))

  return NextResponse.json(all)
}

const UpdateChannelsSchema = z.object({
  channels: z.array(
    z.object({
      platform: z.enum(CONTENT_PLATFORMS),
      profile_type: z.enum(CONTENT_PROFILE_TYPES),
      enabled: z.boolean(),
    })
  ),
})

// PUT /api/content/channels — kanalen aan/uit zetten
export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  let tenantId: string
  try {
    const t = await requireTenant()
    tenantId = t.tenantId
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = UpdateChannelsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { error } = await supabase
    .from('content_channels')
    .upsert(
      parsed.data.channels.map((c) => ({
        tenant_id: tenantId,
        platform: c.platform,
        profile_type: c.profile_type,
        enabled: c.enabled,
        updated_at: new Date().toISOString(),
      })) as any,
      { onConflict: 'tenant_id,platform,profile_type' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data, error: fetchError } = await supabase
    .from('content_channels')
    .select('*')
    .eq('tenant_id', tenantId)

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })

  return NextResponse.json(data)
}
