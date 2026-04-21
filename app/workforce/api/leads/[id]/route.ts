import { NextResponse } from 'next/server'
import { createWorkforceServiceClient } from '@/lib/workforce/supabase'
import { requireWorkforceTenant } from '@/lib/workforce/tenant'

// GET /workforce/api/leads/[id]
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireWorkforceTenant()
    const { id } = await params
    const supabase = createWorkforceServiceClient()

    const { data: lead, error } = await supabase
      .from('fw_leads')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (error || !lead) {
      return NextResponse.json({ error: 'Lead niet gevonden' }, { status: 404 })
    }

    // Haal agent runs op voor deze lead
    const { data: runs } = await supabase
      .from('fw_agent_runs')
      .select('*')
      .eq('lead_id', id)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: true })

    return NextResponse.json({ lead, runs: runs || [] })
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }
}
