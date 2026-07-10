import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { requireFeature } from '@/lib/middleware/requireFeature'
import { z } from 'zod'

const TYPES = ['offerte', 'werkbon', 'email', 'whatsapp', 'campagne', 'sop', 'content', 'reel'] as const

const TemplateSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(TYPES),
  category: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  content: z.object({
    body: z.string(),
    subject: z.string().optional(),
    variables: z.array(z.object({
      name: z.string(),
      label: z.string(),
      default: z.string().optional(),
    })).optional().default([]),
  }),
  status: z.enum(['draft', 'published']).default('published'),
})

// GET — lijst van templates voor deze tenant (incl. system templates)
export async function GET(request: NextRequest) {
  let tenantId: string
  try {
    const t = await requireTenant()
    tenantId = t.tenantId
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createClient()) as any
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')

  // RLS regelt zichtbaarheid: system templates (tenant_id NULL) + eigen tenant templates
  let query = supabase
    .from('templates')
    .select('id, name, type, category, content, description, is_default, status, tenant_id, updated_at')
    .eq('status', 'published')
    .order('is_default', { ascending: false })
    .order('name')

  if (type) query = query.eq('type', type)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Mark elk record met is_custom
  const enriched = (data ?? []).map((t: any) => ({
    ...t,
    is_custom: t.tenant_id === tenantId,
    is_system: t.tenant_id === null,
  }))

  return NextResponse.json({ templates: enriched })
}

// POST — maak custom template (Pro)
export async function POST(request: NextRequest) {
  const gate = await requireFeature('templates_custom')
  if (!gate.ok) return gate.response
  const tenantId = gate.tenantId

  const body = await request.json()
  const parsed = TemplateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createClient()) as any
  const { data, error } = await supabase
    .from('templates')
    .insert({ ...parsed.data, tenant_id: tenantId, is_default: false })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
