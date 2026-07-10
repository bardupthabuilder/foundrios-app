import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'

// GET — lijst playbooks (system-wide + eigen tenant), met optionele filters
// Query params:
//   ?category=outreach-hooks       — filter op categorie slug
//   ?tier_max=pro                  — alleen playbooks met min_tier <= tier_max
//   ?source=system|tenant          — filter op herkomst
export async function GET(request: NextRequest) {
  let tenantId: string
  try {
    const t = await requireTenant()
    tenantId = t.tenantId
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createClient()) as any
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const source = searchParams.get('source')

  let query = supabase
    .from('playbooks')
    .select('id, tenant_id, category_slug, subcategory, slug, title, purpose, min_tier, status, updated_at')
    .eq('status', 'active')
    .order('category_slug', { ascending: true })
    .order('title', { ascending: true })

  if (category) query = query.eq('category_slug', category)
  if (source === 'system') query = query.is('tenant_id', null)
  if (source === 'tenant') query = query.eq('tenant_id', tenantId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
