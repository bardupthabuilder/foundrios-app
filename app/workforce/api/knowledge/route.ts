import { NextResponse } from 'next/server'
import { createWorkforceServiceClient } from '@/lib/workforce/supabase'
import { requireWorkforceTenant } from '@/lib/workforce/tenant'

// GET /workforce/api/knowledge
export async function GET() {
  try {
    const { tenantId } = await requireWorkforceTenant()
    const supabase = createWorkforceServiceClient()

    const { data: items, error } = await supabase
      .from('fw_knowledge')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('category')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ items, count: items?.length || 0 })
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }
}

// POST /workforce/api/knowledge
export async function POST(request: Request) {
  try {
    const { tenantId } = await requireWorkforceTenant()
    const body = await request.json()
    const { category, title, content } = body

    if (!category || !title || !content) {
      return NextResponse.json({ error: 'category, title and content are required' }, { status: 400 })
    }

    const supabase = createWorkforceServiceClient()

    const { data, error } = await supabase
      .from('fw_knowledge')
      .insert({ tenant_id: tenantId, category, title, content })
      .select('id')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data.id })
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }
}

// DELETE /workforce/api/knowledge?id=uuid
export async function DELETE(request: Request) {
  try {
    const { tenantId } = await requireWorkforceTenant()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const supabase = createWorkforceServiceClient()

    // Verify item belongs to tenant
    const { error } = await supabase
      .from('fw_knowledge')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }
}
