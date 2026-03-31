import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { z } from 'zod'

const CreateQuoteSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional().nullable(),
  client_id: z.string().uuid().optional().nullable(),
  project_id: z.string().uuid().optional().nullable(),
  amount_excl_vat: z.number().int().min(0).default(0),
  vat_pct: z.number().default(21),
  valid_until: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  let tenantId: string
  try {
    const t = await requireTenant()
    tenantId = t.tenantId
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const statusFilter = searchParams.get('status')

  let query = supabase
    .from('quotes')
    .select('*, clients(id, name, company_name), projects(id, name)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (statusFilter) {
    query = query.eq('status', statusFilter as any)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  let tenantId: string
  try {
    const t = await requireTenant()
    tenantId = t.tenantId
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = CreateQuoteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { amount_excl_vat, vat_pct } = parsed.data
  const amount_incl_vat = Math.round(amount_excl_vat * (1 + vat_pct / 100))

  // Generate quote number
  const { count } = await supabase
    .from('quotes')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
  const quoteNumber = `OFF-${String((count ?? 0) + 1).padStart(4, '0')}`

  const { data, error } = await supabase
    .from('quotes')
    .insert({
      tenant_id: tenantId,
      quote_number: quoteNumber,
      status: 'concept',
      amount_incl_vat,
      ...parsed.data,
    } as any)
    .select('*, clients(id, name, company_name), projects(id, name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
