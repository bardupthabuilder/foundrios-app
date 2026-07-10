import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireSuperadmin } from '@/lib/admin'

// GET — alle system-wide playbooks (alleen voor superadmin)
export async function GET() {
  try {
    await requireSuperadmin()
  } catch {
    return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 403 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createServiceClient() as any

  const { data, error } = await sb
    .from('playbooks')
    .select('id, category_slug, subcategory, slug, title, purpose, min_tier, audience, status, updated_at')
    .is('tenant_id', null)
    .order('category_slug', { ascending: true })
    .order('title', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
