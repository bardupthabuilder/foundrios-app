import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'

export type Alert = {
  type: 'lead' | 'invoice' | 'project' | 'hours'
  severity: 'warning' | 'urgent'
  title: string
  description: string
  link: string
}

export async function GET() {
  const supabase = await createClient()

  let tenantId: string
  try {
    const t = await requireTenant()
    tenantId = t.tenantId
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const alerts: Alert[] = []
  const now = new Date()

  // 1. Leads niet beantwoord na 1 uur
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString()
  const { data: staleLeads } = await supabase
    .from('leads')
    .select('id, name, created_at')
    .eq('tenant_id', tenantId)
    .eq('status', 'new')
    .lt('created_at', oneHourAgo)
    .limit(5)

  for (const lead of staleLeads ?? []) {
    const hours = Math.round((now.getTime() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60))
    alerts.push({
      type: 'lead',
      severity: hours >= 24 ? 'urgent' : 'warning',
      title: `${lead.name} wacht op reactie`,
      description: `${hours}u geen reactie — reactietijd is kritiek`,
      link: `/dashboard/leads/${lead.id}`,
    })
  }

  // 2. Facturen over vervaldatum
  const todayStr = now.toISOString().split('T')[0]
  const { data: overdueInvoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, title, due_date, amount_excl_vat, clients(company_name)')
    .eq('tenant_id', tenantId)
    .eq('status', 'sent')
    .lt('due_date', todayStr)
    .limit(5)

  for (const inv of overdueInvoices ?? []) {
    const days = Math.round((now.getTime() - new Date(inv.due_date!).getTime()) / (1000 * 60 * 60 * 24))
    const clientName = (inv.clients as any)?.company_name || ''
    const fmt = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(inv.amount_excl_vat / 100)
    alerts.push({
      type: 'invoice',
      severity: days >= 14 ? 'urgent' : 'warning',
      title: `${inv.invoice_number || 'Factuur'} is ${days} dagen verlopen`,
      description: `${fmt} van ${clientName} — stuur een herinnering`,
      link: `/dashboard/facturen/${inv.id}`,
    })
  }

  // 3. Offertes zonder opvolging (verstuurd > 3 dagen geleden, geen reactie)
  const threeDaysAgo = new Date(now.getTime() - 3 * 86400000).toISOString()
  const { data: staleQuotes } = await supabase
    .from('quotes')
    .select('id, title, quote_number, amount_excl_vat, sent_at, clients(company_name)')
    .eq('tenant_id', tenantId)
    .eq('status', 'verstuurd')
    .lt('sent_at', threeDaysAgo)
    .limit(5)

  for (const q of staleQuotes ?? []) {
    const days = Math.round((now.getTime() - new Date(q.sent_at!).getTime()) / (1000 * 60 * 60 * 24))
    const clientName = (q.clients as any)?.company_name || ''
    const fmt = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(q.amount_excl_vat / 100)
    alerts.push({
      type: 'invoice',
      severity: days >= 7 ? 'urgent' : 'warning',
      title: `Offerte ${q.quote_number || q.title} wacht ${days} dagen op reactie`,
      description: `${fmt} voor ${clientName} — tijd om op te volgen`,
      link: `/dashboard/offertes/${q.id}`,
    })
  }

  // 4. Onderhoudscontracten met verlopen bezoekdatum
  const { data: overdueVisits } = await supabase
    .from('maintenance_contracts' as any)
    .select('id, title, next_visit, clients(company_name)')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .lt('next_visit', todayStr)
    .limit(5)

  for (const _mc of (overdueVisits ?? []) as any[]) {
    const mc = _mc as { id: string; title: string; next_visit: string; clients: { company_name: string } | null }
    const days = Math.round((now.getTime() - new Date(mc.next_visit).getTime()) / (1000 * 60 * 60 * 24))
    const clientName = mc.clients?.company_name || ''
    alerts.push({
      type: 'project',
      severity: days >= 7 ? 'urgent' : 'warning',
      title: `Onderhoudsbezoek ${mc.title} is ${days} dagen verlopen`,
      description: `${clientName} — plan het bezoek in`,
      link: '/dashboard/onderhoud',
    })
  }

  // 5. Projecten over budget (uren × tarief > budget)
  const { data: activeProjects } = await supabase
    .from('projects')
    .select('id, name, budget, budget_cents, hourly_rate_cents, time_entries(hours)')
    .eq('tenant_id', tenantId)
    .in('status', ['actief', 'active'] as any)

  for (const proj of activeProjects ?? []) {
    const budgetCents = proj.budget_cents || (proj.budget ? proj.budget * 100 : 0)
    const rateCents = proj.hourly_rate_cents || 0
    if (!budgetCents || !rateCents) continue

    const totalHours = ((proj as any).time_entries as { hours: number }[] ?? []).reduce((sum: number, e: { hours: number }) => sum + (e.hours ?? 0), 0)
    const costCents = totalHours * rateCents
    const pct = Math.round((costCents / budgetCents) * 100)

    if (pct >= 90) {
      alerts.push({
        type: 'project',
        severity: pct >= 100 ? 'urgent' : 'warning',
        title: `${proj.name} is ${pct >= 100 ? 'over' : 'bijna over'} budget`,
        description: `${pct}% van budget verbruikt (${totalHours}u geregistreerd)`,
        link: `/dashboard/projecten/${proj.id}`,
      })
    }
  }

  // 4. Uren niet ingevuld (gisteren of eergisteren, geen entries)
  const yesterday = new Date(now.getTime() - 86400000)
  const dayOfWeek = yesterday.getDay()
  // Alleen checken op werkdagen (ma-vr)
  if (dayOfWeek >= 1 && dayOfWeek <= 5) {
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    const { data: plannedYesterday } = await supabase
      .from('planning_entries')
      .select('employee_id, employees(name)')
      .eq('tenant_id', tenantId)
      .eq('planned_date', yesterdayStr)

    for (const plan of plannedYesterday ?? []) {
      const { count } = await supabase
        .from('time_entries')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('employee_id', plan.employee_id)
        .eq('entry_date', yesterdayStr)

      if ((count ?? 0) === 0) {
        const empName = (plan.employees as any)?.name ?? 'Medewerker'
        alerts.push({
          type: 'hours',
          severity: 'warning',
          title: `${empName} heeft gisteren geen uren ingevuld`,
          description: `Was ingepland maar geen uren geregistreerd`,
          link: '/dashboard/uren',
        })
      }
    }
  }

  // 6. Leads stuck in pipeline stage > 3 days
  const threeDaysAgoISO = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
  const { data: stuckLeads } = await supabase
    .from('leads')
    .select('id, name, pipeline_stage, updated_at')
    .eq('tenant_id', tenantId)
    .in('pipeline_stage', ['gekwalificeerd', 'afspraak', 'offerte', 'opvolging'] as any)
    .lt('updated_at', threeDaysAgoISO)
    .limit(10)

  if (stuckLeads) {
    const stageLabels: Record<string, string> = {
      gekwalificeerd: 'Gekwalificeerd',
      afspraak: 'Afspraak',
      offerte: 'Offerte',
      opvolging: 'Opvolging',
    }
    for (const lead of stuckLeads) {
      alerts.push({
        type: 'lead',
        severity: 'warning',
        title: `${lead.name} — ${stageLabels[lead.pipeline_stage as string] || lead.pipeline_stage || 'Onbekend'}`,
        description: 'Staat al meer dan 3 dagen in dezelfde fase',
        link: `/dashboard/leads/${lead.id}`,
      })
    }
  }

  // 7. Projects delivered without review (> 7 days)
  const sevenDaysAgoISO = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: unreviewedProjects } = await supabase
    .from('projects')
    .select('id, name, delivered_at')
    .eq('tenant_id', tenantId)
    .eq('status', 'opgeleverd')
    .eq('review_received', false)
    .not('delivered_at', 'is', null)
    .lt('delivered_at', sevenDaysAgoISO)
    .limit(5)

  if (unreviewedProjects) {
    for (const project of unreviewedProjects) {
      alerts.push({
        type: 'project',
        severity: 'warning',
        title: `Review aanvragen: ${project.name}`,
        description: 'Project opgeleverd, nog geen review ontvangen',
        link: `/dashboard/projecten/${project.id}`,
      })
    }
  }

  // Sorteer: urgent eerst
  alerts.sort((a, b) => (a.severity === 'urgent' ? -1 : 1) - (b.severity === 'urgent' ? -1 : 1))

  return NextResponse.json(alerts)
}
