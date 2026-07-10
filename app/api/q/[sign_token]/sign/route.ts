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

  let body: { name?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 })
  }

  const name = (body.name || '').trim()
  if (name.length < 2 || name.length > 120) {
    return NextResponse.json({ error: 'Naam is verplicht (min 2 tekens)' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svc = createServiceClient() as any

  const { data: quote } = await svc
    .from('quotes')
    .select('id, tenant_id, status, valid_until, signed_at')
    .eq('sign_token', sign_token)
    .maybeSingle()

  if (!quote) {
    return NextResponse.json({ error: 'Offerte niet gevonden' }, { status: 404 })
  }

  if (quote.signed_at) {
    return NextResponse.json({ error: 'Offerte is al ondertekend' }, { status: 409 })
  }

  if (quote.status === 'afgewezen') {
    return NextResponse.json({ error: 'Offerte is afgewezen' }, { status: 409 })
  }

  if (quote.valid_until && new Date(quote.valid_until) < new Date()) {
    return NextResponse.json({ error: 'Offerte is verlopen' }, { status: 410 })
  }

  const ip = getClientIp(request)
  const ua = request.headers.get('user-agent') || null
  const now = new Date().toISOString()

  const { error: updateError } = await svc
    .from('quotes')
    .update({
      status: 'akkoord',
      signed_at: now,
      signature_name: name,
      signature_ip: ip,
      accepted_at: now,
    })
    .eq('id', quote.id)

  if (updateError) {
    return NextResponse.json({ error: 'Kon offerte niet bijwerken' }, { status: 500 })
  }

  await svc.from('quote_events').insert({
    tenant_id: quote.tenant_id,
    quote_id: quote.id,
    event_type: 'signed',
    actor_name: name,
    ip,
    user_agent: ua,
  })

  return NextResponse.json({ ok: true, signed_at: now })
}
