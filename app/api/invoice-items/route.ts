import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { tenantOwnsParent } from '@/lib/ownership'
import { recalcInvoiceTotal } from '@/lib/invoice-totals'
import { z } from 'zod'

const CreateItemSchema = z.object({
  invoice_id: z.string().uuid(),
  description: z.string().min(1),
  quantity: z.number().positive().default(1),
  unit: z.string().default('stuk'),
  unit_price_cents: z.number().int().min(0),
  sort_order: z.number().int().default(0),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  let tenantId: string
  try {
    tenantId = (await requireTenant()).tenantId
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = CreateItemSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  if (!(await tenantOwnsParent(supabase, 'invoices', parsed.data.invoice_id, tenantId))) {
    return NextResponse.json({ error: 'Factuur niet gevonden' }, { status: 404 })
  }

  const total_cents = Math.round(parsed.data.quantity * parsed.data.unit_price_cents)

  const { data, error } = await supabase
    .from('invoice_items')
    .insert({ ...parsed.data, total_cents } as never)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await recalcInvoiceTotal(supabase, parsed.data.invoice_id)

  return NextResponse.json(data, { status: 201 })
}
