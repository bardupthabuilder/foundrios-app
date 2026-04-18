import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'

export async function GET() {
  let tenantId: string
  try {
    const tenant = await requireTenant()
    tenantId = tenant.tenantId
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const supabase = await createClient()

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString()

  // Parallel data fetching
  const [leadsResult, wonLeadsResult, prevLeadsResult, prevWonResult, quotesResult, invoicesResult, projectsResult, timeResult] = await Promise.all([
    // Leads last 30 days
    supabase.from('leads').select('id, source, ai_label, pipeline_stage, status, created_at')
      .eq('tenant_id', tenantId).gte('created_at', thirtyDaysAgo),
    // Won leads last 30 days
    supabase.from('leads').select('id, source')
      .eq('tenant_id', tenantId).eq('status', 'won').gte('created_at', thirtyDaysAgo),
    // Leads previous 30 days (for trend)
    supabase.from('leads').select('id, source, status')
      .eq('tenant_id', tenantId).gte('created_at', sixtyDaysAgo).lt('created_at', thirtyDaysAgo),
    // Won leads previous period
    supabase.from('leads').select('id')
      .eq('tenant_id', tenantId).eq('status', 'won').gte('created_at', sixtyDaysAgo).lt('created_at', thirtyDaysAgo),
    // Quotes
    supabase.from('quotes').select('id, status, amount_excl_vat, created_at')
      .eq('tenant_id', tenantId).gte('created_at', thirtyDaysAgo),
    // Paid invoices
    supabase.from('invoices').select('id, amount_excl_vat, paid_at')
      .eq('tenant_id', tenantId).eq('status', 'paid').gte('paid_at', thirtyDaysAgo),
    // Active projects
    supabase.from('projects').select('id, name, budget_cents, status, project_type')
      .eq('tenant_id', tenantId),
    // Time entries last 30 days
    supabase.from('time_entries').select('hours, entry_date, employee_id')
      .eq('tenant_id', tenantId).gte('entry_date', thirtyDaysAgo.split('T')[0]),
  ])

  const leads = leadsResult.data ?? []
  const wonLeads = wonLeadsResult.data ?? []
  const prevLeads = prevLeadsResult.data ?? []
  const prevWon = prevWonResult.data ?? []
  const quotes = quotesResult.data ?? []
  const invoices = invoicesResult.data ?? []
  const projects = projectsResult.data ?? []
  const timeEntries = timeResult.data ?? []

  // Compute insights

  // 1. Lead source performance
  const sourceStats: Record<string, { total: number; won: number }> = {}
  for (const lead of leads) {
    const src = lead.source || 'unknown'
    if (!sourceStats[src]) sourceStats[src] = { total: 0, won: 0 }
    sourceStats[src].total++
  }
  for (const lead of wonLeads) {
    const src = lead.source || 'unknown'
    if (sourceStats[src]) sourceStats[src].won++
  }
  const leadSources = Object.entries(sourceStats).map(([source, stats]) => ({
    source,
    total: stats.total,
    won: stats.won,
    conversion: stats.total > 0 ? Math.round((stats.won / stats.total) * 100) : 0,
  })).sort((a, b) => b.conversion - a.conversion)

  // 2. Conversion trend
  const currentConversion = leads.length > 0 ? Math.round((wonLeads.length / leads.length) * 100) : 0
  const prevConversion = prevLeads.length > 0 ? Math.round((prevWon.length / prevLeads.length) * 100) : 0
  const conversionTrend = currentConversion - prevConversion

  // 3. Pipeline distribution
  const pipelineStages: Record<string, number> = {}
  for (const lead of leads) {
    const stage = lead.pipeline_stage || 'nieuw'
    pipelineStages[stage] = (pipelineStages[stage] || 0) + 1
  }

  // 4. Revenue
  const revenue = invoices.reduce((sum, inv) => sum + (inv.amount_excl_vat || 0), 0)
  const avgDealValue = invoices.length > 0 ? Math.round(revenue / invoices.length) : 0

  // 5. Quote conversion
  const totalQuotes = quotes.length
  const acceptedQuotes = quotes.filter(q => q.status === 'akkoord').length
  const quoteConversion = totalQuotes > 0 ? Math.round((acceptedQuotes / totalQuotes) * 100) : 0

  // 6. Capacity (hours per week this month)
  const weekMap: Record<string, number> = {}
  for (const entry of timeEntries) {
    const weekNum = getWeekNumber(new Date(entry.entry_date))
    weekMap[weekNum] = (weekMap[weekNum] || 0) + Number(entry.hours)
  }
  const weeklyHours = Object.values(weekMap)
  const avgWeeklyHours = weeklyHours.length > 0 ? Math.round(weeklyHours.reduce((a, b) => a + b, 0) / weeklyHours.length) : 0

  // 7. AI Recommendations
  const recommendations: { title: string; description: string; priority: 'high' | 'medium' | 'low' }[] = []

  if (currentConversion < 30) {
    recommendations.push({ title: 'Conversie verbeteren', description: `Je conversie is ${currentConversion}%. Focus op snellere opvolging van offertes.`, priority: 'high' })
  }

  const bestSource = leadSources[0]
  if (bestSource && bestSource.conversion > 0) {
    recommendations.push({ title: `Meer inzetten op ${bestSource.source}`, description: `${bestSource.source} converteert het best (${bestSource.conversion}%). Overweeg meer budget hier.`, priority: 'medium' })
  }

  const staleQuotes = quotes.filter(q => q.status === 'verstuurd').length
  if (staleQuotes > 2) {
    recommendations.push({ title: `${staleQuotes} offertes wachten op reactie`, description: 'Volg openstaande offertes op — elke dag wachten verlaagt de kans op akkoord.', priority: 'high' })
  }

  if (conversionTrend < -10) {
    recommendations.push({ title: 'Conversie daalt', description: `${conversionTrend}% vs vorige maand. Check je leadkwaliteit en opvolging.`, priority: 'high' })
  } else if (conversionTrend > 10) {
    recommendations.push({ title: 'Conversie stijgt', description: `+${conversionTrend}% vs vorige maand. Wat je doet werkt — doorgaan.`, priority: 'low' })
  }

  return NextResponse.json({
    period: '30 dagen',
    leads: { total: leads.length, won: wonLeads.length, trend: leads.length - prevLeads.length },
    conversion: { current: currentConversion, previous: prevConversion, trend: conversionTrend },
    leadSources,
    pipelineStages,
    revenue: { total: revenue, avgDeal: avgDealValue },
    quotes: { total: totalQuotes, accepted: acceptedQuotes, conversion: quoteConversion },
    capacity: { avgWeeklyHours },
    recommendations,
  })
}

function getWeekNumber(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const week1 = new Date(d.getFullYear(), 0, 4)
  return `${d.getFullYear()}-W${Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7) + 1}`
}
