import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'

export async function POST(
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

  // Get the quote
  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .select('*, clients(id, name, company_name)')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (quoteError || !quote) {
    return NextResponse.json({ error: 'Offerte niet gevonden' }, { status: 404 })
  }

  if (quote.status !== 'akkoord') {
    return NextResponse.json({ error: 'Alleen geaccepteerde offertes kunnen omgezet worden' }, { status: 400 })
  }

  // Generate invoice number
  const { count } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
  const year = new Date().getFullYear()
  const invoiceNumber = `FAC-${year}-${String((count ?? 0) + 1).padStart(4, '0')}`

  const today = new Date()
  const dueDate = new Date(today)
  dueDate.setDate(dueDate.getDate() + 30)

  // Create invoice from quote
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      tenant_id: tenantId,
      company_id: tenantId,
      client_id: quote.client_id,
      client_name: (quote as any).clients?.company_name || (quote as any).clients?.name || null,
      project_id: quote.project_id,
      quote_id: quote.id,
      invoice_number: invoiceNumber,
      title: quote.title,
      status: 'draft',
      amount_excl_vat: quote.amount_excl_vat,
      vat_pct: quote.vat_pct,
      issue_date: today.toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      notes: quote.notes,
    } as any)
    .select()
    .single()

  if (invoiceError) {
    return NextResponse.json({ error: invoiceError.message }, { status: 500 })
  }

  // Copy quote items to invoice items
  const { data: quoteItems } = await supabase
    .from('quote_items')
    .select('*')
    .eq('quote_id', id)
    .order('sort_order')

  if (quoteItems && quoteItems.length > 0) {
    const invoiceItems = quoteItems.map((item: any) => ({
      invoice_id: invoice.id,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unit_price_cents: item.unit_price_cents,
      total_cents: item.total_cents,
      sort_order: item.sort_order,
    }))

    await supabase.from('invoice_items').insert(invoiceItems as any)
  }

  return NextResponse.json(invoice, { status: 201 })
}
