import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const service = createServiceClient() as any
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')

  let query = service
    .from('knowledge_articles')
    .select('id, slug, title, content, category, icon, sort_order')
    .eq('status', 'published')
    .order('sort_order', { ascending: true })

  if (category) query = query.eq('category', category)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ articles: data ?? [] })
}
