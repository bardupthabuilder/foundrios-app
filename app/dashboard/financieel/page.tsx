import { requireTenant } from '@/lib/tenant'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { TrendingUp, TrendingDown, DollarSign, Receipt, FileText, ArrowRight, AlertTriangle, BarChart3, Download } from 'lucide-react'

const fmtEur = (cents: number) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100)

const fmtPct = (value: number) =>
  `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`

export default async function FinancieelPage() {
  const { tenantId } = await requireTenant()
  const supabase = await createClient()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString()

  // Parallel queries
  const [invoicesResult, lastMonthInvoicesResult, quotesResult, projectsResult, timeResult, materialResult] = await Promise.all([
    supabase.from('invoices').select('id, amount_excl_vat, status, due_date, paid_at, created_at').eq('tenant_id', tenantId),
    supabase.from('invoices').select('amount_excl_vat, status, paid_at').eq('tenant_id', tenantId).eq('status', 'paid').gte('paid_at', startOfLastMonth).lt('paid_at', startOfMonth),
    supabase.from('quotes').select('amount_excl_vat, status').eq('tenant_id', tenantId).in('status', ['concept', 'verstuurd']),
    supabase.from('projects').select('id, name, budget_cents, hourly_rate_cents, status, client_id').eq('tenant_id', tenantId).eq('status', 'actief'),
    supabase.from('time_entries').select('project_id, hours, employee_id').eq('tenant_id', tenantId),
    supabase.from('material_entries').select('project_id, total_cents').eq('tenant_id', tenantId),
  ])

  const invoices = invoicesResult.data ?? []
  const lastMonthInvoices = lastMonthInvoicesResult.data ?? []
  const quotes = quotesResult.data ?? []
  const projects = projectsResult.data ?? []
  const timeEntries = timeResult.data ?? []
  const materialEntries = materialResult.data ?? []

  // --- KPI Calculations ---

  // Omzet deze maand (paid invoices this month)
  const paidThisMonth = invoices.filter(
    (inv) => inv.status === 'paid' && inv.paid_at && inv.paid_at >= startOfMonth
  )
  const omzetDezeMaand = paidThisMonth.reduce((sum, inv) => sum + (inv.amount_excl_vat ?? 0), 0)

  // Omzet vorige maand
  const omzetVorigeMaand = lastMonthInvoices.reduce((sum, inv) => sum + (inv.amount_excl_vat ?? 0), 0)

  // Trend
  const trend = omzetVorigeMaand > 0
    ? ((omzetDezeMaand - omzetVorigeMaand) / omzetVorigeMaand) * 100
    : omzetDezeMaand > 0 ? 100 : 0

  // Openstaand (sent + draft invoices)
  const openstaand = invoices
    .filter((inv) => inv.status === 'sent' || inv.status === 'draft')
    .reduce((sum, inv) => sum + (inv.amount_excl_vat ?? 0), 0)

  // Verlopen (sent invoices past due_date)
  const nowISO = now.toISOString().slice(0, 10)
  const verlopen = invoices
    .filter((inv) => inv.status === 'sent' && inv.due_date && inv.due_date < nowISO)
    .reduce((sum, inv) => sum + (inv.amount_excl_vat ?? 0), 0)

  // Pipeline (quotes concept + verstuurd)
  const pipeline = quotes.reduce((sum, q) => sum + (q.amount_excl_vat ?? 0), 0)

  // Gemiddelde dealwaarde
  const allPaid = invoices.filter((inv) => inv.status === 'paid')
  const gemDealwaarde = allPaid.length > 0
    ? allPaid.reduce((sum, inv) => sum + (inv.amount_excl_vat ?? 0), 0) / allPaid.length
    : 0

  // Counts
  const betaaldeFacturenCount = paidThisMonth.length
  const openstaandeOffertesCount = quotes.length

  // --- Projectmarge ---
  const projectMarges = projects.map((project) => {
    const projectTime = timeEntries.filter((te) => te.project_id === project.id)
    const projectMaterials = materialEntries.filter((me) => me.project_id === project.id)

    const laborCost = projectTime.reduce((sum, te) => {
      const hours = te.hours ?? 0
      const rate = project.hourly_rate_cents ?? 0
      return sum + Math.round(hours * rate)
    }, 0)

    const materialCost = projectMaterials.reduce((sum, me) => sum + (me.total_cents ?? 0), 0)
    const totalCost = laborCost + materialCost
    const budget = project.budget_cents ?? 0
    const budgetRemaining = budget - totalCost
    const marginPct = budget > 0 ? ((budget - totalCost) / budget) * 100 : 0

    return {
      id: project.id,
      name: project.name,
      budget,
      totalCost,
      laborCost,
      materialCost,
      budgetRemaining,
      marginPct,
    }
  })

  // --- KPI Cards Data ---
  const kpiCards = [
    {
      label: 'Omzet deze maand',
      value: fmtEur(omzetDezeMaand),
      sub: trend !== 0 ? fmtPct(trend) + ' vs vorige maand' : 'Geen vergelijking',
      trend: trend >= 0 ? 'up' : 'down',
      icon: DollarSign,
      highlight: true,
    },
    {
      label: 'Vorige maand',
      value: fmtEur(omzetVorigeMaand),
      sub: `${lastMonthInvoices.length} facturen`,
      trend: 'neutral' as const,
      icon: BarChart3,
    },
    {
      label: 'Pipeline',
      value: fmtEur(pipeline),
      sub: `${openstaandeOffertesCount} openstaande offertes`,
      trend: 'neutral' as const,
      icon: FileText,
    },
    {
      label: 'Openstaand',
      value: fmtEur(openstaand),
      sub: 'Verzonden + concept',
      trend: 'neutral' as const,
      icon: Receipt,
    },
    {
      label: 'Verlopen',
      value: fmtEur(verlopen),
      sub: verlopen > 0 ? 'Actie vereist' : 'Geen verlopen facturen',
      trend: verlopen > 0 ? 'warning' : 'neutral',
      icon: AlertTriangle,
    },
    {
      label: 'Gem. dealwaarde',
      value: fmtEur(gemDealwaarde),
      sub: `${allPaid.length} betaalde facturen totaal`,
      trend: 'neutral' as const,
      icon: TrendingUp,
    },
    {
      label: 'Betaald deze maand',
      value: String(betaaldeFacturenCount),
      sub: 'Facturen',
      trend: 'neutral' as const,
      icon: Receipt,
    },
    {
      label: 'Openstaande offertes',
      value: String(openstaandeOffertesCount),
      sub: 'Concept + verstuurd',
      trend: 'neutral' as const,
      icon: FileText,
    },
  ]

  return (
    <div className="p-4 lg:p-6 pt-16 lg:pt-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Financieel overzicht</h1>
          <p className="mt-0.5 text-sm text-zinc-400">
            Omzet, marges en openstaande posten in een oogopslag
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/offertes"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-white/5 transition-colors"
          >
            <FileText className="h-4 w-4" />
            Offertes
          </Link>
          <Link
            href="/dashboard/facturen"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-white/5 transition-colors"
          >
            <Receipt className="h-4 w-4" />
            Facturen
          </Link>
          <a
            href="/api/export?type=invoices&format=csv"
            download
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#1A1F29] px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-[#282A2E] transition-colors"
          >
            <Download className="h-4 w-4" />
            Export
          </a>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-8">
        {kpiCards.map((card) => {
          const Icon = card.icon
          const isWarning = card.trend === 'warning'
          const isUp = card.trend === 'up'
          const isDown = card.trend === 'down'
          return (
            <div
              key={card.label}
              className={`rounded-xl border p-4 transition-colors ${
                card.highlight
                  ? 'border-foundri-yellow/20 bg-foundri-yellow/5'
                  : isWarning
                    ? 'border-red-500/20 bg-red-500/5'
                    : 'border-white/5 bg-[#1A1F29]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-zinc-400">{card.label}</span>
                <Icon className={`h-4 w-4 ${
                  card.highlight ? 'text-foundri-yellow' : isWarning ? 'text-red-400' : 'text-zinc-500'
                }`} />
              </div>
              <p className={`text-xl font-bold ${
                isWarning ? 'text-red-400' : 'text-white'
              }`}>
                {card.value}
              </p>
              <div className="mt-1 flex items-center gap-1">
                {isUp && <TrendingUp className="h-3 w-3 text-green-400" />}
                {isDown && <TrendingDown className="h-3 w-3 text-red-400" />}
                <span className={`text-xs ${
                  isUp ? 'text-green-400' : isDown ? 'text-red-400' : isWarning ? 'text-red-400' : 'text-zinc-500'
                }`}>
                  {card.sub}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Projectmarge overzicht */}
      <div className="rounded-xl border border-white/5 bg-[#1A1F29] overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-white">Projectmarge overzicht</h2>
            <p className="text-xs text-zinc-400 mt-0.5">{projects.length} actieve projecten</p>
          </div>
          <Link
            href="/dashboard/projecten"
            className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Alle projecten
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {projectMarges.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-zinc-400">
            Geen actieve projecten met budgetgegevens
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left text-xs font-medium text-zinc-400">
                  <th className="px-5 py-3">Project</th>
                  <th className="px-5 py-3 text-right">Budget</th>
                  <th className="px-5 py-3 text-right">Kosten</th>
                  <th className="px-5 py-3 text-right">Marge</th>
                  <th className="px-5 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {projectMarges.map((pm) => {
                  const isOverBudget = pm.budgetRemaining < 0
                  const isLowMargin = pm.marginPct < 15 && pm.marginPct >= 0
                  return (
                    <tr
                      key={pm.id}
                      className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-5 py-3">
                        <Link
                          href={`/dashboard/projecten/${pm.id}`}
                          className="font-medium text-white hover:text-foundri-yellow transition-colors"
                        >
                          {pm.name ?? 'Naamloos project'}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-right text-zinc-300">
                        {pm.budget > 0 ? fmtEur(pm.budget) : '—'}
                      </td>
                      <td className="px-5 py-3 text-right text-zinc-300">
                        {fmtEur(pm.totalCost)}
                      </td>
                      <td className={`px-5 py-3 text-right font-medium ${
                        isOverBudget ? 'text-red-400' : isLowMargin ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {pm.budget > 0 ? `${pm.marginPct.toFixed(0)}%` : '—'}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {isOverBudget ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400">
                            <AlertTriangle className="h-3 w-3" />
                            Over budget
                          </span>
                        ) : isLowMargin ? (
                          <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-400">
                            Lage marge
                          </span>
                        ) : (
                          <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400">
                            Gezond
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
