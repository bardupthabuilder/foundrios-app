import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { requireFeature } from '@/lib/middleware/requireFeature'
import { z } from 'zod'

const SopSchema = z.object({
  title: z.string().min(1).max(200),
  category: z.enum(['operations', 'field_work', 'sales', 'admin']).default('operations'),
  description: z.string().optional().nullable(),
  steps: z.array(z.object({
    title: z.string(),
    description: z.string().optional(),
    checklist: z.array(z.string()).optional(),
  })).default([]),
  status: z.enum(['active', 'draft', 'archived']).default('active'),
})

// GET — list all SOPs (alle tiers)
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
  const category = searchParams.get('category')

  let query = supabase
    .from('sops')
    .select('id, title, category, description, steps, version, status, source, updated_at')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .order('category', { ascending: true })
    .order('title', { ascending: true })

  if (category) query = query.eq('category', category)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST — create SOP (Pro tier)
export async function POST(request: NextRequest) {
  const gate = await requireFeature('sops_edit')
  if (!gate.ok) return gate.response
  const tenantId = gate.tenantId

  const body = await request.json()
  const parsed = SopSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createClient()) as any
  const { data, error } = await supabase
    .from('sops')
    .insert({ ...parsed.data, tenant_id: tenantId, source: 'tenant' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
