import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireSuperadmin } from '@/lib/admin'
import { z } from 'zod'

// GET — alle granted-audience playbooks + welke deze tenant heeft
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperadmin()
  } catch {
    return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 403 })
  }

  const { id: tenantId } = await params

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createServiceClient() as any

  // Alle granted-audience playbooks
  const { data: playbooks, error: pbErr } = await sb
    .from('playbooks')
    .select('id, category_slug, slug, title, audience, min_tier')
    .is('tenant_id', null)
    .eq('audience', 'granted')
    .order('category_slug')
    .order('title')

  if (pbErr) return NextResponse.json({ error: pbErr.message }, { status: 500 })

  // Welke heeft deze tenant
  const { data: grants, error: grErr } = await sb
    .from('tenant_playbook_grants')
    .select('playbook_id')
    .eq('tenant_id', tenantId)

  if (grErr) return NextResponse.json({ error: grErr.message }, { status: 500 })

  const grantedIds = new Set<string>((grants ?? []).map((g: { playbook_id: string }) => g.playbook_id))

  return NextResponse.json({
    playbooks: (playbooks ?? []).map((p: { id: string; [k: string]: unknown }) => ({
      ...p,
      granted: grantedIds.has(p.id),
    })),
  })
}

const PutSchema = z.object({
  playbook_ids: z.array(z.string().uuid()),
})

// PUT — vervang de volledige lijst van granted playbooks voor deze tenant
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let actorUserId: string
  try {
    const { userId } = await requireSuperadmin()
    actorUserId = userId
  } catch {
    return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 403 })
  }

  const { id: tenantId } = await params
  const body = await request.json()
  const parsed = PutSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createServiceClient() as any

  // Strategie: delete alle bestaande grants voor deze tenant, insert nieuwe set
  const { error: delErr } = await sb
    .from('tenant_playbook_grants')
    .delete()
    .eq('tenant_id', tenantId)
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })

  if (parsed.data.playbook_ids.length === 0) {
    return NextResponse.json({ success: true, count: 0 })
  }

  const rows = parsed.data.playbook_ids.map(pid => ({
    tenant_id: tenantId,
    playbook_id: pid,
    granted_by_user_id: actorUserId,
  }))

  const { error: insErr } = await sb.from('tenant_playbook_grants').insert(rows)
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })

  // Audit log
  await sb.from('tenant_audit_log').insert({
    tenant_id: tenantId,
    actor_user_id: actorUserId,
    action: 'playbook_grants_updated',
    meta: { count: rows.length, playbook_ids: parsed.data.playbook_ids },
  })

  return NextResponse.json({ success: true, count: rows.length })
}
