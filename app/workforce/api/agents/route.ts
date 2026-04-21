import { NextResponse } from 'next/server'
import { createWorkforceServiceClient } from '@/lib/workforce/supabase'
import { requireWorkforceTenant } from '@/lib/workforce/tenant'

// Statische agent definities — alle 5 Workforce agents
const AGENT_DEFINITIONS = [
  {
    name: 'lead_intake',
    label: 'Lead Intake',
    description: 'Vangt elke aanvraag op uit elk kanaal en standaardiseert de data naar een gestructureerd format.',
    status: 'active' as const,
    model: 'claude-haiku-4-5-20251001',
  },
  {
    name: 'qualification',
    label: 'Qualification',
    description: 'Beoordeelt leads op regio, dienst, budget en urgentie. Kent een score toe: hot, warm, cold of reject.',
    status: 'active' as const,
    model: 'claude-haiku-4-5-20251001',
  },
  {
    name: 'conversation',
    label: 'Conversation',
    description: 'Stelt vervolgvragen, haalt ontbrekende informatie op en bouwt vertrouwen op — automatisch.',
    status: 'coming_soon' as const,
    model: 'claude-sonnet-4-6-20250514',
  },
  {
    name: 'booking',
    label: 'Booking',
    description: 'Plant afspraken in de agenda. Stuurt voorstel, bevestiging en reminders. De afspraak staat er gewoon.',
    status: 'coming_soon' as const,
    model: 'claude-haiku-4-5-20251001',
  },
  {
    name: 'reactivation',
    label: 'Reactivation',
    description: 'Activeert oude leads opnieuw zonder nieuwe ads. Extra afspraken uit de bestaande database.',
    status: 'coming_soon' as const,
    model: 'claude-haiku-4-5-20251001',
  },
]

// GET /workforce/api/agents
export async function GET() {
  try {
    const { tenantId } = await requireWorkforceTenant()
    const supabase = createWorkforceServiceClient()

    // Haal stats op per agent uit agent_runs
    const { data: runs } = await supabase
      .from('fw_agent_runs')
      .select('agent_name, agent_version, status, tokens_input, tokens_output, duration_ms, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    // Aggregeer per agent
    const statsMap: Record<string, {
      total_runs: number
      success: number
      errors: number
      total_tokens: number
      total_duration: number
      last_run: string | null
      version: string
    }> = {}

    for (const run of runs || []) {
      if (!statsMap[run.agent_name]) {
        statsMap[run.agent_name] = {
          total_runs: 0,
          success: 0,
          errors: 0,
          total_tokens: 0,
          total_duration: 0,
          last_run: null,
          version: run.agent_version,
        }
      }
      const s = statsMap[run.agent_name]
      s.total_runs++
      if (run.status === 'success') s.success++
      if (run.status === 'error') s.errors++
      s.total_tokens += (run.tokens_input || 0) + (run.tokens_output || 0)
      s.total_duration += run.duration_ms || 0
      if (!s.last_run) s.last_run = run.created_at
    }

    // Combineer definities met stats
    const agents = AGENT_DEFINITIONS.map((def) => {
      const stats = statsMap[def.name]
      return {
        ...def,
        stats: stats
          ? {
              total_runs: stats.total_runs,
              success_rate: stats.total_runs > 0 ? Math.round((stats.success / stats.total_runs) * 100) : 0,
              error_rate: stats.total_runs > 0 ? Math.round((stats.errors / stats.total_runs) * 100) : 0,
              avg_tokens: stats.total_runs > 0 ? Math.round(stats.total_tokens / stats.total_runs) : 0,
              avg_duration_ms: stats.total_runs > 0 ? Math.round(stats.total_duration / stats.total_runs) : 0,
              last_run: stats.last_run,
              version: stats.version,
            }
          : null,
      }
    })

    return NextResponse.json({ agents })
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }
}
