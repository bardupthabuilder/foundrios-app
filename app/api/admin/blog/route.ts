import { NextRequest, NextResponse } from 'next/server'
import { requireSuperadmin } from '@/lib/admin'
import { createServiceClient } from '@/lib/supabase/server'
import { z } from 'zod'

const PostSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  excerpt: z.string().optional(),
  content: z.string().min(1),
  cover_image_url: z.string().url().optional().nullable(),
  category: z.string().default('algemeen'),
  tags: z.array(z.string()).default([]),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  author_name: z.string().default('FoundriOS'),
})

export async function GET() {
  try { await requireSuperadmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 403 }) }

  const service = createServiceClient()
  const { data } = await (service as any)
    .from('blog_posts')
    .select('*')
    .order('created_at', { ascending: false })

  return NextResponse.json({ posts: data ?? [] })
}

export async function POST(request: NextRequest) {
  try { await requireSuperadmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 403 }) }

  const body = await request.json()
  const parsed = PostSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const service = createServiceClient()
  const wordCount = parsed.data.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length
  const readingTime = Math.max(1, Math.round(wordCount / 200))

  const insertData: Record<string, unknown> = {
    ...parsed.data,
    word_count: wordCount,
    reading_time_min: readingTime,
    published_at: parsed.data.status === 'published' ? new Date().toISOString() : null,
  }

  const { data, error } = await (service as any)
    .from('blog_posts')
    .insert(insertData as any)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
