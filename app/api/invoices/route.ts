import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { z } from 'zod'

const CreateInvoiceSchema = z.object({
  title: z.string().optional().nullable(),
  client_id: z.string().uuid().optional().nullable(),
  client_name: z.string().optional().nullable(),
  project_id: z.string().uuid().optional().nullable(),
  quote_id: z.string().uuid().optional().nullable(),
  amount_excl_vat: z.number().int().min(0),
  vat_pct: z.number().default(21),
  issue_date: z.string().optional().nullable(),
  due_date: z.string().optional().nullable(),
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
    .from('invoices')
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
  const parsed = CreateInvoiceSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // Generate invoice number
  const { count } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
  const year = new Date().getFullYear()
  const invoiceNumber = `FAC-${year}-${String((count ?? 0) + 1).padStart(4, '0')}`

  const { data, error } = await supabase
    .from('invoices')
    .insert({
      tenant_id: tenantId,
      invoice_number: invoiceNumber,
      status: 'draft' as any,
      ...parsed.data,
    } as any)
    .select('*, clients(id, name, company_name), projects(id, name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
