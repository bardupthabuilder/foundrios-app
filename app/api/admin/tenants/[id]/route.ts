import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { requireSuperadmin } from '@/lib/admin'
import { z } from 'zod'

const UpdateSchema = z.object({
  plan: z.enum(['free', 'pro', 'scale']).optional(),
  subscription_status: z.string().optional(),
  is_managed: z.boolean().optional(),
  managed_package: z.enum(['light', 'core', 'premium']).nullable().optional(),
  is_platform_case: z.boolean().optional(),
  internal_notes: z.string().nullable().optional(),
})

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  // Plan / subscription_status blijven via bestaande RPC (RLS-veilig, gevalideerd)
  if (parsed.data.plan || parsed.data.subscription_status) {
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).rpc('admin_update_tenant', {
      target_id: id,
      new_plan: parsed.data.plan ?? null,
      new_status: parsed.data.subscription_status ?? null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 403 })
  }

  // Overige admin-velden via service client (geen tenant kan deze raken)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createServiceClient() as any

  const { data: before } = await sb
    .from('tenants')
    .select('plan, is_managed, is_platform_case')
    .eq('id', id)
    .single()

  const adminFields: Record<string, unknown> = {}
  if (parsed.data.is_managed !== undefined) adminFields.is_managed = parsed.data.is_managed
  if (parsed.data.managed_package !== undefined) adminFields.managed_package = parsed.data.managed_package
  if (parsed.data.is_platform_case !== undefined) adminFields.is_platform_case = parsed.data.is_platform_case
  if (parsed.data.internal_notes !== undefined) adminFields.internal_notes = parsed.data.internal_notes

  if (Object.keys(adminFields).length > 0) {
    const { error } = await sb.from('tenants').update(adminFields).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Audit log voor kritieke wijzigingen
  const auditEntries: Array<{ tenant_id: string; actor_user_id: string; action: string; meta: Record<string, unknown> }> = []

  if (parsed.data.plan && before && parsed.data.plan !== before.plan) {
    auditEntries.push({
      tenant_id: id,
      actor_user_id: actor.userId,
      action: 'plan_changed',
      meta: { from: before.plan, to: parsed.data.plan },
    })
  }
  if (parsed.data.is_managed !== undefined && before && parsed.data.is_managed !== before.is_managed) {
    auditEntries.push({
      tenant_id: id,
      actor_user_id: actor.userId,
      action: parsed.data.is_managed ? 'managed_enabled' : 'managed_disabled',
      meta: { managed_package: parsed.data.managed_package ?? null },
    })
  }
  if (parsed.data.is_platform_case !== undefined && before && parsed.data.is_platform_case !== before.is_platform_case) {
    auditEntries.push({
      tenant_id: id,
      actor_user_id: actor.userId,
      action: parsed.data.is_platform_case ? 'platform_case_enabled' : 'platform_case_disabled',
      meta: {},
    })
  }

  if (auditEntries.length > 0) {
    await sb.from('tenant_audit_log').insert(auditEntries)
  }

  return NextResponse.json({ success: true })
}
