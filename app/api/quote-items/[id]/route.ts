import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { parentIdIfOwned } from '@/lib/ownership'
import { z } from 'zod'

const UpdateItemSchema = z.object({
  description: z.string().min(1).optional(),
  quantity: z.number().positive().optional(),
  unit: z.string().optional(),
  unit_price_cents: z.number().int().min(0).optional(),
  sort_order: z.number().int().optional(),
})

/** Telt de regels op en zet het nieuwe totaal (excl. + incl. btw) op de offerte. */
async function recalcQuoteTotal(supabase: any, quoteId: string) {
  const { data: items } = await supabase.from('quote_items').select('total_cents').eq('quote_id', quoteId)
  const totalExcl = (items ?? []).reduce((sum: number, i: any) => sum + (i.total_cents ?? 0), 0)
  const { data: quote } = await supabase.from('quotes').select('vat_pct').eq('id', quoteId).single()
  const totalIncl = Math.round(totalExcl * (1 + (quote?.vat_pct ?? 21) / 100))
  await supabase.from('quotes').update({ amount_excl_vat: totalExcl, amount_incl_vat: totalIncl } as any).eq('id', quoteId)
}

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
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const quoteId = await parentIdIfOwned(supabase, 'quote_items', id, tenantId)
  if (!quoteId) return NextResponse.json({ error: 'Item niet gevonden' }, { status: 404 })

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

  // Het regeltotaal veranderde, dus het offertetotaal ook.
  await recalcQuoteTotal(supabase, quoteId)

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
    tenantId = (await requireTenant()).tenantId
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const quoteId = await parentIdIfOwned(supabase, 'quote_items', id, tenantId)
  if (!quoteId) return NextResponse.json({ error: 'Item niet gevonden' }, { status: 404 })

  const { error } = await supabase.from('quote_items').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await recalcQuoteTotal(supabase, quoteId)

  return NextResponse.json({ success: true })
}
