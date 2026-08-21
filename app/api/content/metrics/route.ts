import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { z } from 'zod'
import { CONTENT_PLATFORMS, CONTENT_PROFILE_TYPES } from '@/app/api/content/channels/route'

function isMonday(dateStr: string): boolean {
  const d = new Date(`${dateStr}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return false
  return d.getUTCDay() === 1
}

// GET /api/content/metrics?week_start_date=YYYY-MM-DD — invoer voor die week
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  let tenantId: string
  try {
    const t = await requireTenant()
    tenantId = t.tenantId
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const weekStartDate = searchParams.get('week_start_date')
  if (!weekStartDate || !isMonday(weekStartDate)) {
    return NextResponse.json({ error: 'week_start_date moet een maandag zijn (YYYY-MM-DD)' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('content_weekly_metrics')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('week_start_date', weekStartDate)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

const MetricsEntrySchema = z.object({
  platform: z.enum(CONTENT_PLATFORMS),
  profile_type: z.enum(CONTENT_PROFILE_TYPES),
  posts_published: z.number().int().min(0),
  reach: z.number().int().min(0),
  interactions: z.number().int().min(0),
  dms: z.number().int().min(0),
})

const SaveMetricsSchema = z.object({
  week_start_date: z.string(),
  entries: z.array(MetricsEntrySchema),
})

// POST /api/content/metrics — wekelijkse check-in opslaan (upsert per kanaal)
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  let tenantId: string
  try {
    const t = await requireTenant()
    tenantId = t.tenantId
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = SaveMetricsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  if (!isMonday(parsed.data.week_start_date)) {
    return NextResponse.json({ error: 'week_start_date moet een maandag zijn (YYYY-MM-DD)' }, { status: 400 })
  }

  const { week_start_date, entries } = parsed.data

  const { error } = await supabase
    .from('content_weekly_metrics')
    .upsert(
      entries.map((e) => ({
        tenant_id: tenantId,
        week_start_date,
        platform: e.platform,
        profile_type: e.profile_type,
        posts_published: e.posts_published,
        reach: e.reach,
        interactions: e.interactions,
        dms: e.dms,
        updated_at: new Date().toISOString(),
      })) as any,
      { onConflict: 'tenant_id,week_start_date,platform,profile_type' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data, error: fetchError } = await supabase
    .from('content_weekly_metrics')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('week_start_date', week_start_date)

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })

  return NextResponse.json(data)
}
