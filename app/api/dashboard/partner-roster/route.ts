import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const tenantId = req.nextUrl.searchParams.get('tenant_id')

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenant_id required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('gt_partner_roster_view')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('name')

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Partner roster API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch partner roster' },
      { status: 500 }
    )
  }
}
