import { NextResponse } from 'next/server'
import { createWorkforceServiceClient } from '@/lib/workforce/supabase'
import { requireWorkforceTenant } from '@/lib/workforce/tenant'

// GET /api/workforce/agents?tier=basis&status=active
export async function GET(request: Request) {
  try {
    const { tenantId } = await requireWorkforceTenant()
    const supabase = createWorkforceServiceClient()
    const url = new URL(request.url)
    const tier = url.searchParams.get('tier')
    const status = url.searchParams.get('status')

    // Haal catalogus op (optioneel gefilterd)
    let catalogQuery = supabase.from('fw_agents_catalog').select('*')
    if (tier) catalogQuery = catalogQuery.eq('tier', tier)
    if (status) catalogQuery = catalogQuery.eq('status', status)

    const { data: catalogData, error: catalogError } = await catalogQuery

    if (catalogError) throw catalogError
    if (!catalogData) return NextResponse.json({ agents: [] })

    // Haal activatie-status per tenant op
    const { data: tenantAgents } = await supabase
      .from('fw_tenant_agents')
      .select('agent_id, active, activated_at')
      .eq('tenant_id', tenantId)

    const activeAgentIds = new Set(
      (tenantAgents || []).filter((ta) => ta.active).map((ta) => ta.agent_id)
    )

    // Haal stats op per agent
    const { data: runs } = await supabase
      .from('fw_agent_runs')
      .select('agent_id, status, tokens_input, tokens_output, duration_ms, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    const statsMap: Record<string, any> = {}
    for (const run of runs || []) {
      if (!statsMap[run.agent_id]) {
        statsMap[run.agent_id] = {
          total_runs: 0,
          success: 0,
          errors: 0,
          total_tokens: 0,
          total_duration: 0,
          last_run: null,
        }
      }
      const s = statsMap[run.agent_id]
      s.total_runs++
      if (run.status === 'success') s.success++
      if (run.status === 'error') s.errors++
      s.total_tokens += (run.tokens_input || 0) + (run.tokens_output || 0)
      s.total_duration += run.duration_ms || 0
      if (!s.last_run) s.last_run = run.created_at
    }

    // Kombineer catalogus + aktivering + stats
    const agents = catalogData.map((agent) => ({
      ...agent,
      active: activeAgentIds.has(agent.id),
      stats: statsMap[agent.id]
        ? {
            total_runs: statsMap[agent.id].total_runs,
            success_rate: statsMap[agent.id].total_runs > 0
              ? Math.round((statsMap[agent.id].success / statsMap[agent.id].total_runs) * 100)
              : 0,
            error_rate: statsMap[agent.id].total_runs > 0
              ? Math.round((statsMap[agent.id].errors / statsMap[agent.id].total_runs) * 100)
              : 0,
            avg_tokens: statsMap[agent.id].total_runs > 0
              ? Math.round(statsMap[agent.id].total_tokens / statsMap[agent.id].total_runs)
              : 0,
            avg_duration_ms: statsMap[agent.id].total_runs > 0
              ? Math.round(statsMap[agent.id].total_duration / statsMap[agent.id].total_runs)
              : 0,
            last_run: statsMap[agent.id].last_run,
          }
        : null,
    }))

    return NextResponse.json({ agents })
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }
}

// POST /api/workforce/agents/activate
export async function POST(request: Request) {
  try {
    const { tenantId } = await requireWorkforceTenant()
    const supabase = createWorkforceServiceClient()
    const { agentId, active = true } = await request.json()

    if (!agentId) {
      return NextResponse.json({ error: 'agentId required' }, { status: 400 })
    }

    // Valideer dat agent bestaat in catalogus
    const { data: agent } = await supabase
      .from('fw_agents_catalog')
      .select('id')
      .eq('id', agentId)
      .single()

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // Upsert tenant activation
    const { data, error } = await supabase
      .from('fw_tenant_agents')
      .upsert(
        {
          tenant_id: tenantId,
          agent_id: agentId,
          active,
          activated_at: active ? new Date().toISOString() : null,
        },
        { onConflict: 'tenant_id,agent_id' }
      )
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, activation: data }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to activate agent' },
      { status: 500 }
    )
  }
}

// PATCH /api/workforce/agents/{agentId}/config
export async function PATCH(request: Request) {
  try {
    const { tenantId } = await requireWorkforceTenant()
    const supabase = createWorkforceServiceClient()
    const { agentId, niche_override, services_override, tone_override, metadata = {} } = await request.json()

    if (!agentId) {
      return NextResponse.json({ error: 'agentId required' }, { status: 400 })
    }

    // Valideer tone_override enum
    const validTones = ['formal', 'casual', 'direct', 'friendly']
    if (tone_override && !validTones.includes(tone_override)) {
      return NextResponse.json(
        { error: `tone_override must be one of: ${validTones.join(', ')}` },
        { status: 400 }
      )
    }

    // Valideer dat agent bestaat in catalogus
    const { data: agent } = await supabase
      .from('fw_agents_catalog')
      .select('id')
      .eq('id', agentId)
      .single()

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // Upsert agent configuration
    const { data, error } = await supabase
      .from('fw_agent_config')
      .upsert(
        {
          tenant_id: tenantId,
          agent_id: agentId,
          niche_override,
          services_override,
          tone_override,
          metadata,
        },
        { onConflict: 'tenant_id,agent_id' }
      )
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, config: data }, { status: 200 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update agent config' },
      { status: 500 }
    )
  }
}
