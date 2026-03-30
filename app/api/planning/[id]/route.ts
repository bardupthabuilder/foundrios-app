import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { z } from 'zod'

const UpdatePlanningSchema = z.object({
  employee_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
  planned_date: z.string().optional(),
  start_time: z.string().optional().nullable(),
  end_time: z.string().optional().nullable(),
  planned_hours: z.number().min(0.5).max(24).optional(),
  notes: z.string().optional().nullable(),
})

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
  const parsed = UpdatePlanningSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { data, error } = await supabase
    .from('planning_entries')
    .update(parsed.data)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select('*, employees(id, name, color), projects(id, name, address, city)')
    .single()

  if (error || !data) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  let tenantId: string
  try {
    const t = await requireTenant()
    tenantId = t.tenantId
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const { error } = await supabase
    .from('planning_entries')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
