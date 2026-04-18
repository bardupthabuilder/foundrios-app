import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { z } from 'zod'

const UpdateRuleSchema = z.object({
  name: z.string().min(1).optional(),
  trigger_type: z
    .enum([
      'lead_new',
      'lead_stale',
      'quote_stale',
      'invoice_overdue',
      'project_delivered',
      'maintenance_due',
    ])
    .optional(),
  action_type: z.enum(['notification', 'email', 'status_change', 'task_create']).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  delay_hours: z.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
})

// PATCH /api/automations/[id] — update rule
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  let tenantId: string
  try {
    const t = await requireTenant()
    tenantId = t.tenantId
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = UpdateRuleSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('automation_rules' as any)
    .update(parsed.data as any)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Regel niet gevonden' }, { status: error ? 500 : 404 })
  }

  return NextResponse.json(data)
}

// DELETE /api/automations/[id] — delete rule
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  let tenantId: string
  try {
    const t = await requireTenant()
    tenantId = t.tenantId
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const { error } = await supabase
    .from('automation_rules' as any)
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
