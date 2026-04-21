import { NextResponse } from 'next/server'
import { createWorkforceServiceClient } from '@/lib/workforce/supabase'
import { requireWorkforceTenant } from '@/lib/workforce/tenant'

// GET /workforce/api/stats
export async function GET() {
  try {
    const { tenantId } = await requireWorkforceTenant()
    const supabase = createWorkforceServiceClient()

    // Lead counts
    const { data: leads } = await supabase
      .from('fw_leads')
      .select('id, qualification, status, created_at')
      .eq('tenant_id', tenantId)

    const allLeads = leads || []
    const now = Date.now()
    const oneDayAgo = now - 86400000
    const sevenDaysAgo = now - 7 * 86400000

    const totalLeads = allLeads.length
    const hotLeads = allLeads.filter((l) => l.qualification === 'hot').length
    const warmLeads = allLeads.filter((l) => l.qualification === 'warm').length
    const coldLeads = allLeads.filter((l) => l.qualification === 'cold').length
    const newToday = allLeads.filter((l) => new Date(l.created_at).getTime() > oneDayAgo).length
    const newThisWeek = allLeads.filter((l) => new Date(l.created_at).getTime() > sevenDaysAgo).length

    // Agent run stats
    const { data: runs } = await supabase
      .from('fw_agent_runs')
      .select('agent_name, status, duration_ms, tokens_input, tokens_output, created_at')
      .eq('tenant_id', tenantId)

    const allRuns = runs || []
    const recentRuns = allRuns.filter((r) => new Date(r.created_at).getTime() > oneDayAgo)
    const activeAgents = new Set(recentRuns.map((r) => r.agent_name)).size

    // Gemiddelde intake responstijd
    const intakeRuns = allRuns.filter((r) => r.agent_name === 'lead_intake' && r.status === 'success' && r.duration_ms)
    const avgResponseTime = intakeRuns.length > 0
      ? Math.round(intakeRuns.reduce((sum, r) => sum + (r.duration_ms || 0), 0) / intakeRuns.length)
      : 0

    // Totale tokens
    const totalTokens = allRuns.reduce((sum, r) => sum + (r.tokens_input || 0) + (r.tokens_output || 0), 0)
    const totalRuns = allRuns.length
    const successRate = totalRuns > 0
      ? Math.round((allRuns.filter((r) => r.status === 'success').length / totalRuns) * 100)
      : 0

    return NextResponse.json({
      leads: {
        total: totalLeads,
        hot: hotLeads,
        warm: warmLeads,
        cold: coldLeads,
        new_today: newToday,
        new_this_week: newThisWeek,
      },
      agents: {
        active_24h: activeAgents,
        total_runs: totalRuns,
        success_rate: successRate,
        avg_response_ms: avgResponseTime,
        total_tokens: totalTokens,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }
}
