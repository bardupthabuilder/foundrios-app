import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { z } from 'zod'

const CreatePlanningSchema = z.object({
  employee_id: z.string().uuid(),
  project_id: z.string().uuid(),
  planned_date: z.string(),
  start_time: z.string().optional().nullable(),
  end_time: z.string().optional().nullable(),
  planned_hours: z.number().min(0.5).max(24).default(8),
  notes: z.string().optional().nullable(),
})

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  let tenantId: string, userId: string
  try {
    const t = await requireTenant()
    tenantId = t.tenantId
    userId = t.userId
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const start = searchParams.get('start')
  const end = searchParams.get('end')

  if (!start || !end) {
    return NextResponse.json({ error: 'start en end parameters verplicht' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('planning_entries')
    .select('*, employees(id, name, color, role), projects(id, name, address, city)')
    .eq('tenant_id', tenantId)
    .gte('planned_date', start)
    .lte('planned_date', end)
    .order('planned_date', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  let tenantId: string, userId: string
  try {
    const t = await requireTenant()
    tenantId = t.tenantId
    userId = t.userId
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = CreatePlanningSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { data, error } = await supabase
    .from('planning_entries')
    .insert({ tenant_id: tenantId, created_by: userId, ...parsed.data })
    .select('*, employees(id, name, color), projects(id, name, address, city)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
