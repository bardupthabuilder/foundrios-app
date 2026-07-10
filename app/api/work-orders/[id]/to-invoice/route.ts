import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { enforceLimit } from '@/lib/limits'

/**
 * POST /api/work-orders/[id]/to-invoice
 *
 * Zet een afgeronde werkbon om in een factuur — de laatste meter van aanvraag
 * naar geld. Uren en materialen worden overgenomen als échte factuurregels.
 *
 * De oude knop in de UI maakte een factuur met één totaalbedrag en nul regels,
 * waardoor de factuur-PDF een lege tabel toonde en de klant niet kon zien
 * waarvoor hij betaalde.
 */
export async function POST(
  _request: NextRequest,
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

  const limitResponse = await enforceLimit(tenantId, 'invoices')
  if (limitResponse) return limitResponse

  const { data: wo, error: woError } = await supabase
    .from('work_orders')
    .select('*, clients(id, name, company_name)')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (woError || !wo) {
    return NextResponse.json({ error: 'Werkbon niet gevonden' }, { status: 404 })
  }

  if (wo.status === 'gefactureerd') {
    return NextResponse.json({ error: 'Deze werkbon is al gefactureerd' }, { status: 400 })
  }

  const [{ data: hours }, { data: materials }] = await Promise.all([
    supabase.from('work_order_hours').select('*').eq('work_order_id', id).order('sort_order'),
    supabase.from('work_order_materials').select('*').eq('work_order_id', id).order('sort_order'),
  ])

  const hourRows = hours ?? []
  const materialRows = materials ?? []

  if (hourRows.length === 0 && materialRows.length === 0) {
    return NextResponse.json(
      { error: 'Voeg eerst uren of materiaal toe aan de werkbon' },
      { status: 400 }
    )
  }

  const amountExclVat =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    hourRows.reduce((s: number, h: any) => s + (h.total_cents ?? 0), 0) +
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    materialRows.reduce((s: number, m: any) => s + (m.total_cents ?? 0), 0)

  const vatPct = 21
  const { count } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)

  const today = new Date()
  const dueDate = new Date(today)
  dueDate.setDate(dueDate.getDate() + 30)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = (wo as any).clients

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      tenant_id: tenantId,
      client_id: wo.client_id,
      client_name: client?.company_name || client?.name || null,
      project_id: wo.project_id,
      invoice_number: `FAC-${today.getFullYear()}-${String((count ?? 0) + 1).padStart(4, '0')}`,
      title: wo.title,
      status: 'draft',
      amount_excl_vat: amountExclVat,
      amount_incl_vat: Math.round(amountExclVat * (1 + vatPct / 100)),
      vat_pct: vatPct,
      issue_date: today.toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      notes: wo.notes,
    } as never)
    .select()
    .single()

  if (invoiceError || !invoice) {
    return NextResponse.json({ error: invoiceError?.message ?? 'Factuur maken mislukt' }, { status: 500 })
  }

  // Uren en materialen worden aparte regels, in die volgorde.
  const items = [
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...hourRows.map((h: any, i: number) => ({
      invoice_id: invoice.id,
      description: [h.description, h.employee_name].filter(Boolean).join(' — ') || 'Arbeid',
      quantity: h.hours,
      unit: 'uur',
      unit_price_cents: h.hourly_rate_cents,
      total_cents: h.total_cents,
      sort_order: i + 1,
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...materialRows.map((m: any, i: number) => ({
      invoice_id: invoice.id,
      description: m.description,
      quantity: m.quantity,
      unit: m.unit ?? 'stuk',
      unit_price_cents: m.unit_price_cents,
      total_cents: m.total_cents,
      sort_order: hourRows.length + i + 1,
    })),
  ]

  const { error: itemsError } = await supabase.from('invoice_items').insert(items as never)
  if (itemsError) {
    // De factuur bestaat al. Hem stilzwijgend zonder regels laten staan is precies
    // het probleem dat we oplossen, dus ruimen we hem op.
    await supabase.from('invoices').delete().eq('id', invoice.id).eq('tenant_id', tenantId)
    return NextResponse.json({ error: `Factuurregels maken mislukt: ${itemsError.message}` }, { status: 500 })
  }

  await supabase
    .from('work_orders')
    .update({ status: 'gefactureerd' } as never)
    .eq('id', id)
    .eq('tenant_id', tenantId)

  return NextResponse.json(invoice, { status: 201 })
}
