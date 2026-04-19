import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { z } from 'zod'

const FeedbackSchema = z.object({
  type: z.enum(['bug', 'verbetering', 'feature', 'vraag']).default('verbetering'),
  page: z.string().optional(),
  message: z.string().min(1, 'Bericht is verplicht'),
})

export async function POST(request: NextRequest) {
  let tenantId: string, userId: string
  try { const t = await requireTenant(); tenantId = t.tenantId; userId = t.userId }
  catch { return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 }) }

  const body = await request.json()
  const parsed = FeedbackSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const supabase = await createClient()
  const { data, error } = await (supabase as any)
    .from('feedback')
    .insert({ ...parsed.data, tenant_id: tenantId, user_id: userId })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
