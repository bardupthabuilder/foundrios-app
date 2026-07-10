import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return req.headers.get('x-real-ip') || 'unknown'
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sign_token: string }> }
) {
  const { sign_token } = await params
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svc = createServiceClient() as any

  const { data: quote } = await svc
    .from('quotes')
    .select('id, tenant_id, status')
    .eq('sign_token', sign_token)
    .maybeSingle()

  if (!quote) return NextResponse.json({ ok: false }, { status: 404 })

  const ip = getClientIp(request)
  const ua = request.headers.get('user-agent') || null

  // Eenvoudige dedup: niet logger als laatste 'viewed' event van dit IP < 1 uur geleden
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { data: recent } = await svc
    .from('quote_events')
    .select('id')
    .eq('quote_id', quote.id)
    .eq('event_type', 'viewed')
    .eq('ip', ip)
    .gte('created_at', oneHourAgo)
    .limit(1)
    .maybeSingle()

  if (recent) return NextResponse.json({ ok: true, deduped: true })

  await svc.from('quote_events').insert({
    tenant_id: quote.tenant_id,
    quote_id: quote.id,
    event_type: 'viewed',
    ip,
    user_agent: ua,
  })

  return NextResponse.json({ ok: true })
}
