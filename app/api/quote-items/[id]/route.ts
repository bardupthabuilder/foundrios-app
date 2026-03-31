import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
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
  try {
    await requireTenant()
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = UpdateItemSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // Get current item to recalc total
  const { data: current } = await supabase.from('quote_items').select('*').eq('id', id).single()
  if (!current) return NextResponse.json({ error: 'Item niet gevonden' }, { status: 404 })

  const qty = parsed.data.quantity ?? current.quantity
  const price = parsed.data.unit_price_cents ?? current.unit_price_cents
  const total_cents = Math.round(Number(qty) * price)

  const { data, error } = await supabase
    .from('quote_items')
    .update({ ...parsed.data, total_cents } as any)
    .eq('id', id)
    .select()
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
  try {
    await requireTenant()
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  // Get quote_id before deleting
  const { data: item } = await supabase.from('quote_items').select('quote_id').eq('id', id).single()

  const { error } = await supabase.from('quote_items').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Recalc quote totals
  if (item?.quote_id) {
    const { data: items } = await supabase.from('quote_items').select('total_cents').eq('quote_id', item.quote_id)
    const totalExcl = (items ?? []).reduce((sum: number, i: any) => sum + (i.total_cents ?? 0), 0)
    const { data: quote } = await supabase.from('quotes').select('vat_pct').eq('id', item.quote_id).single()
    const totalIncl = Math.round(totalExcl * (1 + (quote?.vat_pct ?? 21) / 100))
    await supabase.from('quotes').update({ amount_excl_vat: totalExcl, amount_incl_vat: totalIncl } as any).eq('id', item.quote_id)
  }

  return NextResponse.json({ success: true })
}
