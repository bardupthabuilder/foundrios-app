import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  let tenantId: string
  try { const t = await requireTenant(); tenantId = t.tenantId } catch { return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 }) }

  // Project met budget
  const { data: project } = await supabase
    .from('projects')
    .select('id, name, budget_cents, hourly_rate_cents')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (!project) return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 })

  // Alle uren op dit project
  const { data: timeEntries } = await supabase
    .from('time_entries')
    .select('hours, employee_id, employees(name, hourly_cost_cents)')
    .eq('project_id', id)
    .eq('tenant_id', tenantId)

  // Alle materiaal op dit project
  const { data: materialEntries } = await supabase
    .from('material_entries')
    .select('total_cents, description, quantity, unit_price_cents')
    .eq('project_id', id)
    .eq('tenant_id', tenantId)

  // Werkbonnen
  const { data: workOrders } = await supabase
    .from('work_orders')
    .select('id, title, status, date')
    .eq('project_id', id)
    .eq('tenant_id', tenantId)
    .order('date', { ascending: false })

  // Werkbon uren + materiaal
  const woIds = (workOrders ?? []).map(wo => wo.id)
  let woHours: any[] = []
  let woMaterials: any[] = []
  if (woIds.length > 0) {
    const [h, m] = await Promise.all([
      supabase.from('work_order_hours').select('*').in('work_order_id', woIds),
      supabase.from('work_order_materials').select('*').in('work_order_id', woIds),
    ])
    woHours = h.data ?? []
    woMaterials = m.data ?? []
  }

  // Offertes
  const { data: quotes } = await supabase
    .from('quotes')
    .select('id, title, status, amount_excl_vat, amount_incl_vat')
    .eq('project_id', id)
    .eq('tenant_id', tenantId)

  // Facturen
  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, title, invoice_number, status, amount_excl_vat')
    .eq('project_id', id)
    .eq('tenant_id', tenantId)

  // Berekeningen
  const totalHours = (timeEntries ?? []).reduce((s, e) => s + Number(e.hours || 0), 0)
  const totalLaborCents = (timeEntries ?? []).reduce((s, e) => {
    const rate = (e.employees as any)?.hourly_cost_cents || project.hourly_rate_cents || 0
    return s + Math.round(Number(e.hours || 0) * rate)
  }, 0)
  const totalMaterialCents = (materialEntries ?? []).reduce((s, e) => s + (e.total_cents || 0), 0)
  const woHoursCents = woHours.reduce((s, h) => s + (h.total_cents || 0), 0)
  const woMaterialsCents = woMaterials.reduce((s, m) => s + (m.total_cents || 0), 0)

  const totalCostCents = totalLaborCents + totalMaterialCents + woHoursCents + woMaterialsCents
  const budgetCents = project.budget_cents || 0
  const remainingCents = budgetCents - totalCostCents

  const totalQuotedCents = (quotes ?? []).filter(q => q.status === 'akkoord').reduce((s, q) => s + (q.amount_excl_vat || 0), 0)
  const totalInvoicedCents = (invoices ?? []).reduce((s, i) => s + (i.amount_excl_vat || 0), 0)
  const totalPaidCents = (invoices ?? []).filter(i => i.status === 'paid').reduce((s, i) => s + (i.amount_excl_vat || 0), 0)

  return NextResponse.json({
    project: { id: project.id, name: project.name, budget_cents: budgetCents },
    summary: {
      total_hours: totalHours,
      total_labor_cents: totalLaborCents,
      total_material_cents: totalMaterialCents,
      wo_hours_cents: woHoursCents,
      wo_materials_cents: woMaterialsCents,
      total_cost_cents: totalCostCents,
      budget_cents: budgetCents,
      remaining_cents: remainingCents,
      margin_pct: budgetCents > 0 ? Math.round((remainingCents / budgetCents) * 100) : 0,
      total_quoted_cents: totalQuotedCents,
      total_invoiced_cents: totalInvoicedCents,
      total_paid_cents: totalPaidCents,
    },
    work_orders: workOrders ?? [],
    quotes: quotes ?? [],
    invoices: invoices ?? [],
  })
}
