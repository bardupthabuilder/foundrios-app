import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  let tenantId: string
  try { tenantId = (await requireTenant()).tenantId } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('project_tasks')
    .select('id, title, done, sort_order, created_at')
    .eq('project_id', id)
    .eq('tenant_id', tenantId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  let tenantId: string
  try { tenantId = (await requireTenant()).tenantId } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const { title } = await request.json()
  if (!title?.trim()) return NextResponse.json({ error: 'Titel verplicht' }, { status: 400 })

  const { data: maxRow } = await supabase
    .from('project_tasks')
    .select('sort_order')
    .eq('project_id', id)
    .eq('tenant_id', tenantId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const { data, error } = await supabase
    .from('project_tasks')
    .insert({ project_id: id, tenant_id: tenantId, title: title.trim(), sort_order: (maxRow?.sort_order ?? -1) + 1 })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const url = new URL(request.url)
  const taskId = url.searchParams.get('task_id')
  if (!taskId) return NextResponse.json({ error: 'task_id vereist' }, { status: 400 })

  const supabase = await createClient()
  let tenantId: string
  try { tenantId = (await requireTenant()).tenantId } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const body = await request.json()
  const updates: { done?: boolean; title?: string } = {}
  if (typeof body.done === 'boolean') updates.done = body.done
  if (typeof body.title === 'string') updates.title = body.title.trim()

  const { data, error } = await supabase
    .from('project_tasks')
    .update(updates)
    .eq('id', taskId)
    .eq('project_id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const url = new URL(request.url)
  const taskId = url.searchParams.get('task_id')
  if (!taskId) return NextResponse.json({ error: 'task_id vereist' }, { status: 400 })

  const supabase = await createClient()
  let tenantId: string
  try { tenantId = (await requireTenant()).tenantId } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const { error } = await supabase
    .from('project_tasks')
    .delete()
    .eq('id', taskId)
    .eq('project_id', id)
    .eq('tenant_id', tenantId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
