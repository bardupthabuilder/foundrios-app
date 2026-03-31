import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { z } from 'zod'

const UpdateQuoteSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
  client_id: z.string().uuid().optional().nullable(),
  project_id: z.string().uuid().optional().nullable(),
  status: z.enum(['concept', 'verstuurd', 'akkoord', 'afgewezen', 'verlopen']).optional(),
  amount_excl_vat: z.number().int().min(0).optional(),
  vat_pct: z.number().optional(),
  valid_until: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  let tenantId: string
  try {
    const t = await requireTenant()
    tenantId = t.tenantId
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('quotes')
    .select('*, clients(*), projects(*)')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Offerte niet gevonden' }, { status: 404 })
  }

  // Fetch quote items
  const { data: items } = await supabase
    .from('quote_items')
    .select('*')
    .eq('quote_id', id)
    .order('sort_order', { ascending: true })

  return NextResponse.json({ ...data, items: items ?? [] })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
  const parsed = UpdateQuoteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const updateData: Record<string, unknown> = { ...parsed.data }

  // Recalc incl_vat if amounts changed
  if (parsed.data.amount_excl_vat !== undefined || parsed.data.vat_pct !== undefined) {
    const { data: current } = await supabase.from('quotes').select('amount_excl_vat, vat_pct').eq('id', id).single()
    const excl = parsed.data.amount_excl_vat ?? current?.amount_excl_vat ?? 0
    const vat = parsed.data.vat_pct ?? current?.vat_pct ?? 21
    updateData.amount_incl_vat = Math.round(excl * (1 + vat / 100))
  }

  // Set timestamps based on status
  if (parsed.data.status === 'verstuurd') updateData.sent_at = new Date().toISOString()
  if (parsed.data.status === 'akkoord') updateData.accepted_at = new Date().toISOString()
  if (parsed.data.status === 'afgewezen') updateData.rejected_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('quotes')
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
  try {
    const t = await requireTenant()
    tenantId = t.tenantId
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const { error } = await supabase
    .from('quotes')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
