import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { z } from 'zod'

const ApproveSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
  status: z.enum(['goedgekeurd', 'afgekeurd']),
})

export async function POST(request: NextRequest) {
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
  const parsed = ApproveSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const updateData: Record<string, unknown> = { status: parsed.data.status }
  if (parsed.data.status === 'goedgekeurd') {
    updateData.approved_by = userId
  }

  const { error } = await supabase
    .from('time_entries')
    .update(updateData as any)
    .in('id', parsed.data.ids)
    .eq('tenant_id', tenantId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ updated: parsed.data.ids.length })
}
