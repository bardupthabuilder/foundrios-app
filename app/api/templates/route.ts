import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const service = createServiceClient() as any
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')

  let query = service
    .from('templates')
    .select('id, name, type, content, description, is_default')
    .eq('status', 'published')
    .order('name')

  if (type) query = query.eq('type', type)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ templates: data ?? [] })
}
