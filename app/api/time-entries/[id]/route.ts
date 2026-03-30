import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { z } from 'zod'

const UpdateTimeEntrySchema = z.object({
  hours: z.number().min(0.5).max(24).optional(),
  description: z.string().optional().nullable(),
  is_billable: z.boolean().optional(),
  status: z.enum(['ingevoerd', 'goedgekeurd', 'afgekeurd']).optional(),
})

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  let tenantId: string, userId: string
  try {
    const t = await requireTenant()
    tenantId = t.tenantId
    userId = t.userId
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = UpdateTimeEntrySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const updateData: Record<string, unknown> = { ...parsed.data }
  if (parsed.data.status === 'goedgekeurd') {
    updateData.approved_by = userId
  }

  const { data, error } = await supabase
    .from('time_entries')
    .update(updateData as any)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single()

  if (error || !data) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    .from('time_entries')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
