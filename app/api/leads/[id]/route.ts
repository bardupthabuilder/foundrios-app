import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { z } from 'zod'

const UpdateLeadSchema = z.object({
  status: z.enum(['new', 'hot', 'warm', 'cold', 'won', 'lost']).optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
})

// GET /api/leads/[id] — lead detail + berichten + events
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  let tenantId: string
  try {
    const tenant = await requireTenant()
    tenantId = tenant.tenantId
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const { data: lead, error } = await supabase
    .from('leads')
    .select(`
      *,
      lead_messages(* ),
      lead_events(*)
    `)
    .eq('id', id)
    .eq('tenant_id', tenantId) // expliciete tenant check als eerste verdedigingslinie
    .single()

  if (error || !lead) {
    return NextResponse.json({ error: 'Lead niet gevonden' }, { status: 404 })
  }

  return NextResponse.json(lead)
}

// PATCH /api/leads/[id] — lead updaten
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  let tenantId: string
  let userId: string
  try {
    const tenant = await requireTenant()
    tenantId = tenant.tenantId
    userId = tenant.userId
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = UpdateLeadSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // Haal huidige lead op voor audit trail
  const { data: current } = await supabase
    .from('leads')
    .select('status')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (!current) {
    return NextResponse.json({ error: 'Lead niet gevonden' }, { status: 404 })
  }

  const { data: updated, error } = await supabase
    .from('leads')
    .update(parsed.data as any)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single()

  if (error || !updated) {
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }

  // Audit log als status is gewijzigd
  if (parsed.data.status && parsed.data.status !== current.status) {
    await supabase.from('lead_events').insert({
      lead_id: id,
      tenant_id: tenantId,
      user_id: userId,
      event_type: 'status_changed',
      payload: { from: current.status, to: parsed.data.status },
    })
  }

  return NextResponse.json(updated)
}

// DELETE /api/leads/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  let tenantId: string
  try {
    const tenant = await requireTenant()
    tenantId = tenant.tenantId
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
