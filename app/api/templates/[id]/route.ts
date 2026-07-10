import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { requireFeature } from '@/lib/middleware/requireFeature'
import { z } from 'zod'

const UpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  category: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  content: z.object({
    body: z.string(),
    subject: z.string().optional(),
    variables: z.array(z.object({
      name: z.string(),
      label: z.string(),
      default: z.string().optional(),
    })).optional().default([]),
  }).optional(),
  status: z.enum(['draft', 'published']).optional(),
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
  // RLS staat system templates (tenant_id IS NULL) of eigen tenant toe
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 })

  return NextResponse.json({
    ...data,
    is_custom: data.tenant_id === tenantId,
    is_system: data.tenant_id === null,
  })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const gate = await requireFeature('templates_custom')
  if (!gate.ok) return gate.response
  const tenantId = gate.tenantId

  const body = await req.json()
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createClient()) as any
  // Alleen eigen templates aanpassen (RLS dwingt dit ook af)
  const { data, error } = await supabase
    .from('templates')
    .update(parsed.data)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'System templates kun je niet aanpassen' }, { status: 403 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const gate = await requireFeature('templates_custom')
  if (!gate.ok) return gate.response
  const tenantId = gate.tenantId

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createClient()) as any
  const { error } = await supabase
    .from('templates')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
