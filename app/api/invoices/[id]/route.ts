import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { z } from 'zod'

const UpdateInvoiceSchema = z.object({
  title: z.string().optional().nullable(),
  client_id: z.string().uuid().optional().nullable(),
  client_name: z.string().optional().nullable(),
  project_id: z.string().uuid().optional().nullable(),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional(),
  amount_excl_vat: z.number().int().min(0).optional(),
  vat_pct: z.number().optional(),
  issue_date: z.string().optional().nullable(),
  due_date: z.string().optional().nullable(),
  paid_at: z.string().optional().nullable(),
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
    .from('invoices')
    .select('*, clients(*), projects(*)')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Factuur niet gevonden' }, { status: 404 })
  }

  // Fetch invoice items
  const { data: items } = await supabase
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', id)
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
  const parsed = UpdateInvoiceSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const updateData: Record<string, unknown> = { ...parsed.data }

  if (parsed.data.status === 'paid' && !parsed.data.paid_at) {
    updateData.paid_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('invoices')
    .update(updateData as any)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select('*, clients(id, name, company_name), projects(id, name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
