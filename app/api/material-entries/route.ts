import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { z } from 'zod'

const CreateMaterialSchema = z.object({
  project_id: z.string().uuid(),
  employee_id: z.string().uuid().optional().nullable(),
  entry_date: z.string(),
  description: z.string().min(1),
  quantity: z.number().min(0.01).default(1),
  unit: z.string().default('stuk'),
  unit_price_cents: z.number().int().optional().nullable(),
  notes: z.string().optional().nullable(),
})

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
  const projectId = searchParams.get('project_id')

  let query = supabase
    .from('material_entries')
    .select('*, projects(id, name), employees(id, name)')
    .eq('tenant_id', tenantId)
    .order('entry_date', { ascending: false })

  if (projectId) {
    query = query.eq('project_id', projectId)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

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
  const parsed = CreateMaterialSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  // Bereken totaal
  const total_cents = parsed.data.unit_price_cents
    ? Math.round(parsed.data.quantity * parsed.data.unit_price_cents)
    : null

  const { data, error } = await supabase
    .from('material_entries')
    .insert({ tenant_id: tenantId, ...parsed.data, total_cents })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
