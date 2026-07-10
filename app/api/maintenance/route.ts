import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { z } from 'zod'

const FREQUENCIES = ['monthly', 'quarterly', 'biannual', 'annual'] as const

/** Maandelijkse waarde van een contract, ongeacht de bezoekfrequentie. */
const MONTHS_PER_VISIT: Record<(typeof FREQUENCIES)[number], number> = {
  monthly: 1,
  quarterly: 3,
  biannual: 6,
  annual: 12,
}

const CreateContractSchema = z.object({
  title: z.string().min(1).max(200),
  client_id: z.string().uuid().optional().nullable(),
  project_id: z.string().uuid().optional().nullable(),
  frequency: z.enum(FREQUENCIES),
  price_cents: z.number().int().min(0),
  mrr_cents: z.number().int().min(0).optional().nullable(),
  description: z.string().optional().nullable(),
  next_visit: z.string().optional().nullable(),
  contract_start: z.string().optional().nullable(),
  contract_end: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export async function GET() {
  const supabase = await createClient()
  let tenantId: string
  try { tenantId = (await requireTenant()).tenantId } catch { return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 }) }

  const { data, error } = await supabase
    .from('maintenance_contracts' as any)
    .select('*, clients(id, company_name, phone, city)')
    .eq('tenant_id', tenantId)
    .order('next_visit', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  let tenantId: string
  try { tenantId = (await requireTenant()).tenantId } catch { return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 }) }

  const body = await request.json()
  const parsed = CreateContractSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  // Niet meegegeven? Leid de maandwaarde af uit prijs en frequentie.
  const mrr_cents =
    parsed.data.mrr_cents ??
    Math.round(parsed.data.price_cents / MONTHS_PER_VISIT[parsed.data.frequency])

  // tenant_id ná de payload zetten: anders kan een meegestuurde tenant_id hem overschrijven.
  const { data, error } = await supabase
    .from('maintenance_contracts' as any)
    .insert({ ...parsed.data, mrr_cents, tenant_id: tenantId, status: 'active' } as any)
    .select('*, clients(id, company_name, phone, city)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
