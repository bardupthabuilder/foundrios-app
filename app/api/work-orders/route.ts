import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { z } from 'zod'

const CreateSchema = z.object({
  title: z.string().min(1).max(200),
  project_id: z.string().uuid(),
  client_id: z.string().uuid().optional().nullable(),
  description: z.string().optional().nullable(),
  date: z.string(),
  notes: z.string().optional().nullable(),
})

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  let tenantId: string
  try { const t = await requireTenant(); tenantId = t.tenantId } catch { return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 }) }

  const { searchParams } = new URL(request.url)
  const statusFilter = searchParams.get('status')
  const projectFilter = searchParams.get('project_id')

  let query = supabase
    .from('work_orders')
    .select('*, clients(id, name, company_name), projects(id, name)')
    .eq('tenant_id', tenantId)
    .order('date', { ascending: false })

  if (statusFilter) query = query.eq('status', statusFilter as any)
  if (projectFilter) query = query.eq('project_id', projectFilter)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  let tenantId: string
  try { const t = await requireTenant(); tenantId = t.tenantId } catch { return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 }) }

  const body = await request.json()
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { count } = await supabase.from('work_orders').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId)
  const woNumber = `WB-${String((count ?? 0) + 1).padStart(4, '0')}`

  const { data, error } = await supabase
    .from('work_orders')
    .insert({ tenant_id: tenantId, work_order_number: woNumber, status: 'concept', ...parsed.data } as any)
    .select('*, clients(id, name, company_name), projects(id, name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
