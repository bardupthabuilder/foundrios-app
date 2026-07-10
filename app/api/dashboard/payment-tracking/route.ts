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
      .from('gt_payment_tracking_view')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('partner_id', { ascending: true })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Payment tracking API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment tracking data' },
      { status: 500 }
    )
  }
}
