import { NextResponse } from 'next/server'
import { requireSuperadmin } from '@/lib/admin'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    await requireSuperadmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = createServiceClient() as any

  const { data: logs, error } = await service
    .from('cron_log')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ logs: logs ?? [] })
}
