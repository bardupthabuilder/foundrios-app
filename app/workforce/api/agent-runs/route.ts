import { NextResponse } from 'next/server'
import { createWorkforceServiceClient } from '@/lib/workforce/supabase'
import { requireWorkforceTenant } from '@/lib/workforce/tenant'

// GET /workforce/api/agent-runs
export async function GET(request: Request) {
  try {
    const { tenantId } = await requireWorkforceTenant()
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const leadId = searchParams.get('lead_id')

    const supabase = createWorkforceServiceClient()

    let query = supabase
      .from('fw_agent_runs')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (leadId) {
      query = query.eq('lead_id', leadId)
    }

    const { data: runs, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ runs, count: runs?.length || 0 })
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }
}
