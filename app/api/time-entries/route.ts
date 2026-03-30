import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { z } from 'zod'

const CreateTimeEntrySchema = z.object({
  employee_id: z.string().uuid(),
  project_id: z.string().uuid(),
  entry_date: z.string(),
  hours: z.number().min(0.5).max(24),
  start_time: z.string().optional().nullable(),
  end_time: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  is_billable: z.boolean().default(true),
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
  const weekStart = searchParams.get('week_start')
  const weekEnd = searchParams.get('week_end')
  const employeeId = searchParams.get('employee_id')
  const projectId = searchParams.get('project_id')

  let query = supabase
    .from('time_entries')
    .select('*, employees(id, name, color), projects(id, name)')
    .eq('tenant_id', tenantId)
    .order('entry_date', { ascending: false })

  if (weekStart && weekEnd) {
    query = query.gte('entry_date', weekStart).lte('entry_date', weekEnd)
  }
  if (employeeId) {
    query = query.eq('employee_id', employeeId)
  }
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
  const parsed = CreateTimeEntrySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { data, error } = await supabase
    .from('time_entries')
    .insert({ tenant_id: tenantId, ...parsed.data })
    .select('*, employees(id, name), projects(id, name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
