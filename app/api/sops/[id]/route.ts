import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { requireFeature } from '@/lib/middleware/requireFeature'
import { z } from 'zod'

const SopUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  category: z.enum(['operations', 'field_work', 'sales', 'admin']).optional(),
  description: z.string().optional().nullable(),
  steps: z.array(z.object({
    title: z.string(),
    description: z.string().optional(),
    checklist: z.array(z.string()).optional(),
  })).optional(),
  status: z.enum(['active', 'draft', 'archived']).optional(),
})

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let tenantId: string
  try {
    const t = await requireTenant()
    tenantId = t.tenantId
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createClient()) as any
  const { data, error } = await supabase
    .from('sops')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (error || !data) return NextResponse.json({ error: 'SOP niet gevonden' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const gate = await requireFeature('sops_edit')
  if (!gate.ok) return gate.response
  const tenantId = gate.tenantId

  const body = await req.json()
  const parsed = SopUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createClient()) as any
  const { data: current } = await supabase.from('sops').select('version').eq('id', id).eq('tenant_id', tenantId).single()
  if (!current) return NextResponse.json({ error: 'SOP niet gevonden' }, { status: 404 })

  const { data, error } = await supabase
    .from('sops')
    .update({ ...parsed.data, version: (current.version || 1) + 1 })
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const gate = await requireFeature('sops_edit')
  if (!gate.ok) return gate.response
  const tenantId = gate.tenantId

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createClient()) as any
  // Soft delete via archived status
  const { error } = await supabase
    .from('sops')
    .update({ status: 'archived' })
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
