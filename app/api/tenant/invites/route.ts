import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { z } from 'zod'

const InviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'viewer']).default('viewer'),
})

// GET /api/tenant/invites — lijst van uitnodigingen + actieve users
export async function GET() {
  const supabase = await createClient()
  let tenantId: string
  try { tenantId = (await requireTenant()).tenantId } catch { return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 }) }

  const [invitesResult, usersResult] = await Promise.all([
    supabase
      .from('tenant_invites' as any)
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false }),
    supabase
      .from('tenant_users')
      .select('id, user_id, role, created_at')
      .eq('tenant_id', tenantId),
  ])

  // Haal user e-mails op via auth admin (service client niet beschikbaar hier)
  // We slaan de e-mails op bij de invite accept flow
  return NextResponse.json({
    invites: invitesResult.data ?? [],
    users: usersResult.data ?? [],
  })
}

// POST /api/tenant/invites — nieuwe uitnodiging
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  let tenantId: string
  let userId: string
  try {
    const t = await requireTenant()
    tenantId = t.tenantId
    userId = t.userId
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  // Check of user owner/admin is
  const { data: callerRole } = await supabase
    .from('tenant_users')
    .select('role')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .single()

  if (!callerRole || (callerRole.role !== 'owner' && callerRole.role !== 'admin')) {
    return NextResponse.json({ error: 'Alleen eigenaar of admin kan uitnodigen' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = InviteSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  // Check of user al gekoppeld is
  const { data: existingUsers } = await supabase
    .from('tenant_users')
    .select('user_id')
    .eq('tenant_id', tenantId)

  // Check of invite al bestaat
  const { data: existingInvite } = await (supabase as any)
    .from('tenant_invites')
    .select('id, status')
    .eq('tenant_id', tenantId)
    .eq('email', parsed.data.email)
    .single()

  if (existingInvite?.status === 'accepted') {
    return NextResponse.json({ error: 'Deze gebruiker is al gekoppeld' }, { status: 409 })
  }

  // Upsert invite (als er al een pending is, ververs die)
  if (existingInvite) {
    const { data, error } = await (supabase as any)
      .from('tenant_invites')
      .update({
        role: parsed.data.role,
        status: 'pending',
        token: undefined, // DB genereert nieuwe token via default
        expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      })
      .eq('id', existingInvite.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  const { data, error } = await (supabase as any)
    .from('tenant_invites')
    .insert({
      tenant_id: tenantId,
      email: parsed.data.email,
      role: parsed.data.role,
      invited_by: userId,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
