import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { z } from 'zod'

const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  client_id: z.string().uuid().optional().nullable(),
  description: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  status: z.enum(['gepland', 'actief', 'pauze', 'opgeleverd', 'gefactureerd', 'gearchiveerd']).optional(),
  project_type: z.enum(['vakwerk', 'onderhoud', 'advies', 'service']).optional(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  budget_cents: z.number().int().optional().nullable(),
  hourly_rate_cents: z.number().int().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  let tenantId: string
  try {
    const t = await requireTenant()
    tenantId = t.tenantId
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  // Project + klant + totalen
  const [projectRes, timeRes, materialRes, planningRes] = await Promise.all([
    supabase
      .from('projects')
      .select('*, clients(id, name, contact_name, phone, email, address, city)')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single(),
    supabase
      .from('time_entries')
      .select('*')
      .eq('project_id', id)
      .eq('tenant_id', tenantId)
      .order('entry_date', { ascending: false }),
    supabase
      .from('material_entries')
      .select('*')
      .eq('project_id', id)
      .eq('tenant_id', tenantId)
      .order('entry_date', { ascending: false }),
    supabase
      .from('planning_entries')
      .select('*, employees(id, name, color)')
      .eq('project_id', id)
      .eq('tenant_id', tenantId)
      .order('planned_date', { ascending: true }),
  ])

  if (projectRes.error || !projectRes.data) {
    return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 })
  }

  const timeEntries = timeRes.data ?? []
  const materialEntries = materialRes.data ?? []
  const totalHours = timeEntries.reduce((sum, e) => sum + (e.hours ?? 0), 0)
  const totalMaterialCents = materialEntries.reduce((sum, e) => sum + (e.total_cents ?? 0), 0)

  return NextResponse.json({
    ...projectRes.data,
    time_entries: timeEntries,
    material_entries: materialEntries,
    planning_entries: planningRes.data ?? [],
    totals: {
      hours: totalHours,
      material_cents: totalMaterialCents,
      labor_cents: totalHours * (projectRes.data.hourly_rate_cents ?? 0),
    },
  })
}

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
  const parsed = UpdateProjectSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { data, error } = await supabase
    .from('projects')
    .update(parsed.data as any)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select('*, clients(id, name, phone)')
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

  // Soft delete — archiveer
  const { error } = await supabase
    .from('projects')
    .update({ status: 'gearchiveerd' })
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
