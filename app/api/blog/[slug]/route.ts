import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const service = createServiceClient()

  const { data: post, error } = await (service as any)
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error || !post) {
    return NextResponse.json({ error: 'Artikel niet gevonden' }, { status: 404 })
  }

  return NextResponse.json(post)
}
