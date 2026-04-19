import { NextRequest, NextResponse } from 'next/server'
import { requireSuperadmin } from '@/lib/admin'
import { createServiceClient } from '@/lib/supabase/server'
import { z } from 'zod'

const ArticleSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  content: z.string().min(1),
  category: z.string().default('starten'),
  icon: z.string().optional(),
  sort_order: z.number().int().default(0),
  status: z.enum(['draft', 'published']).default('draft'),
})

export async function GET() {
  try { await requireSuperadmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 403 }) }
  const service = createServiceClient() as any
  const { data } = await service.from('knowledge_articles').select('*').order('category').order('sort_order')
  return NextResponse.json({ articles: data ?? [] })
}

export async function POST(request: NextRequest) {
  try { await requireSuperadmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 403 }) }
  const body = await request.json()
  const parsed = ArticleSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const service = createServiceClient() as any
  const { data, error } = await service.from('knowledge_articles').insert(parsed.data).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
