import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { z } from 'zod'

const RuleSchema = z.object({
  name: z.string().min(1),
  trigger_type: z.enum([
    'lead_new',
    'lead_stale',
    'quote_stale',
    'invoice_overdue',
    'project_delivered',
    'maintenance_due',
  ]),
  action_type: z.enum(['notification', 'email', 'status_change', 'task_create']),
  config: z.record(z.string(), z.unknown()).default({}),
  delay_hours: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
})

// GET /api/automations — list all rules for tenant
export async function GET() {
  const supabase = await createClient()

  let tenantId: string
  try {
    const t = await requireTenant()
    tenantId = t.tenantId
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('automation_rules' as any)
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}

// POST /api/automations — create new rule
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  let tenantId: string
  try {
    const t = await requireTenant()
    tenantId = t.tenantId
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = RuleSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('automation_rules' as any)
    .insert({ ...parsed.data, tenant_id: tenantId })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
