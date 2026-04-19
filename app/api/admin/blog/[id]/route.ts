import { NextRequest, NextResponse } from 'next/server'
import { requireSuperadmin } from '@/lib/admin'
import { createServiceClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await requireSuperadmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 403 }) }

  const { id } = await params
  const body = await request.json()
  const service = createServiceClient()

  // Recalculate word count if content changed
  const updates: Record<string, unknown> = { ...body }
  if (body.content) {
    updates.word_count = body.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length
    updates.reading_time_min = Math.max(1, Math.round((updates.word_count as number) / 200))
  }

  // Set published_at when publishing for the first time
  if (body.status === 'published' && !body.published_at) {
    updates.published_at = new Date().toISOString()
  }

  const { data, error } = await (service as any)
    .from('blog_posts')
    .update(updates as any)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await requireSuperadmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 403 }) }

  const { id } = await params
  const service = createServiceClient()

  await (service as any).from('blog_posts').delete().eq('id', id)
  return new Response(null, { status: 204 })
}
