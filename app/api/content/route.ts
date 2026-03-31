import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'

// GET /api/content — lijst van content items voor de huidige tenant
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
  const statusFilter = searchParams.get('status')
  const typeFilter = searchParams.get('type')
  const weekFilter = searchParams.get('week')
  const scheduledFrom = searchParams.get('scheduled_from')
  const scheduledTo = searchParams.get('scheduled_to')

  let query = supabase
    .from('content_items')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (statusFilter) {
    query = query.eq('status', statusFilter as any)
  }
  if (typeFilter) {
    query = query.eq('content_template', typeFilter as any)
  }
  if (weekFilter) {
    query = query.eq('week_number', weekFilter)
  }
  if (scheduledFrom) {
    query = query.gte('scheduled_date', scheduledFrom)
  }
  if (scheduledTo) {
    query = query.lte('scheduled_date', scheduledTo)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/content — nieuw content item aanmaken
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
  const { title, ...rest } = body

  if (!title) {
    return NextResponse.json({ error: 'title is verplicht' }, { status: 400 })
  }

  const {
    hook,
    body: bodyText,
    cta,
    status = 'ideeen',
    type,
    content_template,
    platforms,
    visual_type,
    visual_prompt,
    script,
    tags,
    scheduled_date,
    published_date,
    angle,
    primary_topic,
    funnel_stage,
    ai_generated,
    batch_id,
  } = rest

  const { data, error } = await supabase
    .from('content_items')
    .insert({
      tenant_id: tenantId,
      title,
      hook: hook ?? null,
      body: bodyText ?? null,
      cta: cta ?? null,
      status: status as any,
      type: type ?? null,
      content_template: content_template ?? null,
      platforms: platforms ?? null,
      visual_type: visual_type ?? null,
      visual_prompt: visual_prompt ?? null,
      script: script ?? null,
      tags: tags ?? null,
      scheduled_date: scheduled_date ?? null,
      published_date: published_date ?? null,
      angle: angle ?? null,
      primary_topic: primary_topic ?? null,
      funnel_stage: funnel_stage ?? null,
      ai_generated: ai_generated ?? false,
      batch_id: batch_id ?? null,
    } as any)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
