import { NextResponse } from 'next/server'
import { createWorkforceServiceClient } from '@/lib/workforce/supabase'
import { requireWorkforceTenant } from '@/lib/workforce/tenant'

// GET /workforce/api/leads
export async function GET(request: Request) {
  try {
    const { tenantId } = await requireWorkforceTenant()
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    const supabase = createWorkforceServiceClient()

    const { data: leads, error } = await supabase
      .from('fw_leads')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ leads, count: leads?.length || 0 })
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }
}
