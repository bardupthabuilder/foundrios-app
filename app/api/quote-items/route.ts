import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { z } from 'zod'

const CreateItemSchema = z.object({
  quote_id: z.string().uuid(),
  description: z.string().min(1),
  quantity: z.number().positive().default(1),
  unit: z.string().default('stuk'),
  unit_price_cents: z.number().int().min(0),
  sort_order: z.number().int().default(0),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  try {
    await requireTenant()
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = CreateItemSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const total_cents = Math.round(parsed.data.quantity * parsed.data.unit_price_cents)

  const { data, error } = await supabase
    .from('quote_items')
    .insert({ ...parsed.data, total_cents } as any)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Recalc quote totals
  await recalcQuoteTotal(supabase, parsed.data.quote_id)

  return NextResponse.json(data, { status: 201 })
}

async function recalcQuoteTotal(supabase: any, quoteId: string) {
  const { data: items } = await supabase
    .from('quote_items')
    .select('total_cents')
    .eq('quote_id', quoteId)

  const totalExcl = (items ?? []).reduce((sum: number, i: any) => sum + (i.total_cents ?? 0), 0)

  const { data: quote } = await supabase.from('quotes').select('vat_pct').eq('id', quoteId).single()
  const vatPct = quote?.vat_pct ?? 21
  const totalIncl = Math.round(totalExcl * (1 + vatPct / 100))

  await supabase
    .from('quotes')
    .update({ amount_excl_vat: totalExcl, amount_incl_vat: totalIncl } as any)
    .eq('id', quoteId)
}
