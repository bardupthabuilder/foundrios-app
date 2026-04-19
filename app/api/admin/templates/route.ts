import { NextRequest, NextResponse } from 'next/server'
import { requireSuperadmin } from '@/lib/admin'
import { createServiceClient } from '@/lib/supabase/server'
import { z } from 'zod'

const TemplateSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['offerte', 'werkbon', 'email', 'campagne', 'sop']),
  content: z.record(z.string(), z.unknown()).default({}),
  category: z.string().optional(),
  description: z.string().optional(),
  is_default: z.boolean().default(false),
  status: z.enum(['draft', 'published']).default('published'),
})

export async function GET() {
  try { await requireSuperadmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 403 }) }
  const service = createServiceClient() as any
  const { data } = await service.from('templates').select('*').order('type').order('name')
  return NextResponse.json({ templates: data ?? [] })
}

export async function POST(request: NextRequest) {
  try { await requireSuperadmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 403 }) }
  const body = await request.json()
  const parsed = TemplateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const service = createServiceClient() as any
  const { data, error } = await service.from('templates').insert(parsed.data).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
