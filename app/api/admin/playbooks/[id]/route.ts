import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireSuperadmin } from '@/lib/admin'
import { z } from 'zod'

const UpdateSchema = z.object({
  audience: z.enum(['internal', 'tier', 'granted']).optional(),
  min_tier: z.enum(['free', 'pro', 'scale']).optional(),
  status: z.enum(['concept', 'active', 'proven', 'improve']).optional(),
  title: z.string().min(1).optional(),
  purpose: z.string().nullable().optional(),
})

// PATCH — superadmin update audience/tier/status/title/purpose
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperadmin()
  } catch {
    return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createServiceClient() as any
  const { data, error } = await sb
    .from('playbooks')
    .update(parsed.data)
    .eq('id', id)
    .is('tenant_id', null)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
