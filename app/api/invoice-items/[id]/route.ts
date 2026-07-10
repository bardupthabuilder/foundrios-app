import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { parentIdIfOwned } from '@/lib/ownership'
import { recalcInvoiceTotal } from '@/lib/invoice-totals'
import { z } from 'zod'

const UpdateItemSchema = z.object({
  description: z.string().min(1).optional(),
  quantity: z.number().positive().optional(),
  unit: z.string().optional(),
  unit_price_cents: z.number().int().min(0).optional(),
  sort_order: z.number().int().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  let tenantId: string
  try {
    tenantId = (await requireTenant()).tenantId
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = UpdateItemSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const invoiceId = await parentIdIfOwned(supabase, 'invoice_items', id, tenantId)
  if (!invoiceId) return NextResponse.json({ error: 'Regel niet gevonden' }, { status: 404 })

  const { data: current } = await supabase.from('invoice_items').select('*').eq('id', id).single()
  if (!current) return NextResponse.json({ error: 'Regel niet gevonden' }, { status: 404 })

  const qty = parsed.data.quantity ?? current.quantity
  const price = parsed.data.unit_price_cents ?? current.unit_price_cents
  const total_cents = Math.round(Number(qty) * price)

  const { data, error } = await supabase
    .from('invoice_items')
    .update({ ...parsed.data, total_cents } as never)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await recalcInvoiceTotal(supabase, invoiceId)

  return NextResponse.json(data)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  let tenantId: string
  try {
    tenantId = (await requireTenant()).tenantId
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const invoiceId = await parentIdIfOwned(supabase, 'invoice_items', id, tenantId)
  if (!invoiceId) return NextResponse.json({ error: 'Regel niet gevonden' }, { status: 404 })

  const { error } = await supabase.from('invoice_items').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await recalcInvoiceTotal(supabase, invoiceId)

  return NextResponse.json({ success: true })
}
