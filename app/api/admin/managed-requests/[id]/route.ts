import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireSuperadmin } from '@/lib/admin'
import { z } from 'zod'

const UpdateSchema = z.object({
  status: z.enum(['new', 'reviewing', 'qualified', 'rejected', 'scheduled', 'won', 'lost']).optional(),
  internal_notes: z.string().optional().nullable(),
  assigned_to: z.string().uuid().optional().nullable(),
})

// PATCH — superadmin update status / notes / assignment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let actor: { userId: string }
  try {
    actor = await requireSuperadmin()
  } catch {
    return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createServiceClient() as any

  // Haal oude state op voor audit log
  const { data: before } = await sb
    .from('managed_requests')
    .select('tenant_id, status')
    .eq('id', id)
    .single()

  if (!before) {
    return NextResponse.json({ error: 'Aanvraag niet gevonden' }, { status: 404 })
  }

  const { data, error } = await sb
    .from('managed_requests')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Audit log bij status change
  if (parsed.data.status && parsed.data.status !== before.status) {
    await sb.from('tenant_audit_log').insert({
      tenant_id: before.tenant_id,
      actor_user_id: actor.userId,
      action: 'managed_request_status_changed',
      meta: { request_id: id, from: before.status, to: parsed.data.status },
    })
  }

  return NextResponse.json(data)
}
