import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { z } from 'zod'

const UpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
  status: z.enum(['concept', 'actief', 'afgerond', 'gefactureerd']).optional(),
  date: z.string().optional(),
  signed_by: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  let tenantId: string
  try { const t = await requireTenant(); tenantId = t.tenantId } catch { return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 }) }

  const { data, error } = await supabase
    .from('work_orders')
    .select('*, clients(*), projects(*)')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Werkbon niet gevonden' }, { status: 404 })

  const [{ data: hours }, { data: materials }] = await Promise.all([
    supabase.from('work_order_hours').select('*').eq('work_order_id', id).order('sort_order'),
    supabase.from('work_order_materials').select('*').eq('work_order_id', id).order('sort_order'),
  ])

  return NextResponse.json({ ...data, hours: hours ?? [], materials: materials ?? [] })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  let tenantId: string
  try { const t = await requireTenant(); tenantId = t.tenantId } catch { return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 }) }

  const body = await request.json()
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const updateData: Record<string, unknown> = { ...parsed.data }
  if (parsed.data.status === 'afgerond' && parsed.data.signed_by) {
    updateData.signed_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('work_orders')
    .update(updateData as any)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select('*, clients(id, name, company_name), projects(id, name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  let tenantId: string
  try { const t = await requireTenant(); tenantId = t.tenantId } catch { return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 }) }

  const { error } = await supabase.from('work_orders').delete().eq('id', id).eq('tenant_id', tenantId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
