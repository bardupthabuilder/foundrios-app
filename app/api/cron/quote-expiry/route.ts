import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// GET /api/cron/quote-expiry — Vercel cron daily.
// Markeert offertes met status='verstuurd' en valid_until < now() als 'verlopen' + logt event.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svc = createServiceClient() as any
  const now = new Date().toISOString()

  const { data: logEntry } = await svc
    .from('cron_log')
    .insert({ job_name: 'quote_expiry', status: 'running' })
    .select('id')
    .single()

  try {
    const { data: expiring } = await svc
      .from('quotes')
      .select('id, tenant_id')
      .eq('status', 'verstuurd')
      .lt('valid_until', now)

    let count = 0
    if (expiring && expiring.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const q of expiring as any[]) {
        await svc.from('quotes').update({ status: 'verlopen' }).eq('id', q.id)
        await svc.from('quote_events').insert({
          tenant_id: q.tenant_id,
          quote_id: q.id,
          event_type: 'expired',
          metadata: { source: 'cron', expired_at: now },
        })
        count++
      }
    }

    if (logEntry?.id) {
      await svc
        .from('cron_log')
        .update({
          status: 'success',
          finished_at: new Date().toISOString(),
          details: { expired_count: count },
        })
        .eq('id', logEntry.id)
    }

    return NextResponse.json({ ok: true, expired: count })
  } catch (err) {
    if (logEntry?.id) {
      await svc
        .from('cron_log')
        .update({
          status: 'failed',
          finished_at: new Date().toISOString(),
          details: { error: String(err) },
        })
        .eq('id', logEntry.id)
    }
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 })
  }
}
