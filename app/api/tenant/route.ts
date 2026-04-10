import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'

// GET /api/tenant — haal bedrijfsprofiel op
export async function GET() {
  const supabase = await createClient()

  let tenantId: string
  try {
    const t = await requireTenant()
    tenantId = t.tenantId
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// PATCH /api/tenant — update bedrijfsprofiel
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()

  let tenantId: string
  try {
    const t = await requireTenant()
    tenantId = t.tenantId
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const body = await request.json()

  // Alleen toegestane velden doorlaten
  const allowed = [
    'name', 'niche', 'region', 'owner_name', 'owner_phone',
    'description', 'services', 'avg_project_value', 'team_size',
    'website', 'email', 'logo_url',
    'social_linkedin', 'social_instagram', 'social_facebook',
    'social_google_business', 'social_tiktok',
    'premium_tagline', 'premium_guarantees', 'premium_usp',
    'google_review_count', 'google_review_score',
  ]

  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) {
      updates[key] = body[key]
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Geen velden om bij te werken' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('tenants')
    .update(updates)
    .eq('id', tenantId)
    .select()
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
