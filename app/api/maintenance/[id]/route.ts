import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { z } from 'zod'

// Alleen deze velden mogen bijgewerkt worden. Een ongefilterde body zou
// tenant_id kunnen meesturen en het contract naar een andere tenant verplaatsen.
const UpdateContractSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().nullable().optional(),
  frequency: z.enum(['monthly', 'quarterly', 'biannual', 'annual']).optional(),
  price_cents: z.number().int().min(0).optional(),
  mrr_cents: z.number().int().min(0).nullable().optional(),
  status: z.enum(['active', 'paused', 'stopped']).optional(),
  next_visit: z.string().nullable().optional(),
  last_visit: z.string().nullable().optional(),
  contract_start: z.string().nullable().optional(),
  contract_end: z.string().nullable().optional(),
  visit_count: z.number().int().min(0).optional(),
  notes: z.string().nullable().optional(),
})

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  let tenantId: string
  try { tenantId = (await requireTenant()).tenantId } catch { return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 }) }

  const body = await request.json()
  const parsed = UpdateContractSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { data, error } = await supabase
    .from('maintenance_contracts' as any)
    .update(parsed.data as any)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  let tenantId: string
  try { tenantId = (await requireTenant()).tenantId } catch { return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 }) }

  await supabase.from('maintenance_contracts' as any).delete().eq('id', id).eq('tenant_id', tenantId)
  return new NextResponse(null, { status: 204 })
}
